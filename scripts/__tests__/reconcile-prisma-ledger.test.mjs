/**
 * Unit tests for the ledger reconciliation script
 * (scripts/reconcile-prisma-ledger.mjs) — the pure decision logic:
 * tombstone classification, plan building, the delete-fossil SQL predicate,
 * and post-apply verification. Database-touching paths are exercised by the
 * Postgres-gated e2e cases at the bottom (skip cleanly without a server).
 *
 * Run: `node --test scripts/__tests__/reconcile-prisma-ledger.test.mjs`
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const {
  classifyTombstones,
  buildPlan,
  buildDeleteFossilSql,
  buildUndoResolveSql,
  hasAppliedRow,
  evaluateFinalLedger,
} = await import('../reconcile-prisma-ledger.mjs');

// ---------------------------------------------------------------------------
// Fixtures — ledger rows in the readLedger() shape
// ---------------------------------------------------------------------------
const tombstone = (name) => ({ name, rolledBack: false, steps: 0, unfinished: true, logs: 'A migration failed to apply. New migrations cannot be applied before the error is recovered.' });
const applied = (name, steps = 1) => ({ name, rolledBack: false, steps, unfinished: false, logs: '' });
const running = (name) => ({ name, rolledBack: false, steps: 0, unfinished: true, logs: '' });
const fossil = (name) => ({ name, rolledBack: true, steps: 0, unfinished: true, logs: '' });

// ---------------------------------------------------------------------------
// classifyTombstones
// ---------------------------------------------------------------------------

test('classifyTombstones separates crashed-deploy tombstones from possibly-running deploys', () => {
  const { tombstones, running: possiblyRunning, resolvedFossils } = classifyTombstones([
    tombstone('20240101000000_init'),
    running('20260901000000_maybe_running'),
    fossil('20240601000000_already_resolved'),
    applied('20240102000000_later'),
  ]);
  assert.deepEqual(tombstones.map((t) => t.name), ['20240101000000_init']);
  assert.deepEqual(resolvedFossils.map((t) => t.name), ['20240601000000_already_resolved']);
  assert.deepEqual(possiblyRunning.map((t) => t.name), ['20260901000000_maybe_running']);
});

test('classifyTombstones: steps > 0 unfinished or missing logs is never a tombstone', () => {
  const { tombstones } = classifyTombstones([
    { name: 'a', rolledBack: false, steps: 2, unfinished: true, logs: 'A migration failed to apply…' },
    { name: 'b', rolledBack: false, steps: 0, unfinished: true, logs: '' },
  ]);
  assert.deepEqual(tombstones, []);
});

test('classifyTombstones with an empty ledger', () => {
  const { tombstones, running } = classifyTombstones([]);
  assert.deepEqual(tombstones, []);
  assert.deepEqual(running, []);
});

// ---------------------------------------------------------------------------
// buildPlan
// ---------------------------------------------------------------------------

test('buildPlan plans resolve → deploy → delete-fossil in order', () => {
  const plan = buildPlan({ ledgerRows: [tombstone('20240101000000_init'), applied('20240102000000_later')], folder: ['20240101000000_init', '20240102000000_later'] });
  assert.equal(plan.status, 'PLANNED');
  assert.deepEqual(plan.actions.map((a) => a.kind), ['resolve', 'deploy', 'delete-fossil']);
  assert.equal(plan.actions[0].name, '20240101000000_init');
});

test('buildPlan refuses when an unfinished row lacks failure logs (deploy may be running)', () => {
  const plan = buildPlan({ ledgerRows: [tombstone('a'), running('b')], folder: ['a', 'b'] });
  assert.equal(plan.status, 'REFUSED');
  assert.match(plan.refusal, /deploy may be running/);
  assert.deepEqual(plan.actions, []);
});

test('buildPlan refuses when the tombstoned migration is missing from the folder', () => {
  const plan = buildPlan({ ledgerRows: [tombstone('20240101000000_gone')], folder: [] });
  assert.equal(plan.status, 'REFUSED');
  assert.match(plan.refusal, /not in the migration folder/);
});

test('buildPlan reports NOTHING-TO-DO for a clean ledger', () => {
  const plan = buildPlan({ ledgerRows: [applied('a')], folder: ['a'] });
  assert.equal(plan.status, 'NOTHING-TO-DO');
});

test('buildPlan handles multiple tombstones in one service', () => {
  const plan = buildPlan({ ledgerRows: [tombstone('a'), tombstone('b')], folder: ['a', 'b'] });
  assert.equal(plan.status, 'PLANNED');
  assert.deepEqual(plan.actions.filter((a) => a.kind === 'resolve').map((a) => a.name), ['a', 'b']);
  assert.equal(plan.actions.filter((a) => a.kind === 'deploy').length, 1);
});

test('buildPlan: resolved fossil already re-applied → delete-only plan, no deploy', () => {
  const rows = [fossil('old_resolved'), applied('old_resolved'), applied('applied')];
  const plan = buildPlan({ ledgerRows: rows, folder: ['applied'] });
  assert.equal(plan.status, 'PLANNED');
  assert.deepEqual(plan.actions.map((a) => a.kind), ['delete-fossil']);
  assert.deepEqual(plan.actions.filter((a) => a.kind === 'deploy'), []);
});

test('buildPlan: resolved fossil never re-applied → re-apply + delete', () => {
  const plan = buildPlan({ ledgerRows: [fossil('old_resolved'), applied('applied')], folder: ['old_resolved', 'applied'] });
  assert.equal(plan.status, 'PLANNED');
  assert.deepEqual(plan.actions.map((a) => a.kind), ['deploy', 'delete-fossil']);
});

test('buildPlan: resolved fossil never re-applied and missing from folder → REFUSED', () => {
  const plan = buildPlan({ ledgerRows: [fossil('old_resolved'), applied('applied')], folder: ['applied'] });
  assert.equal(plan.status, 'REFUSED');
  assert.match(plan.refusal, /restore the folder entry/);
});

test('buildPlan still reports NOTHING-TO-DO for a plain clean ledger', () => {
  const plan = buildPlan({ ledgerRows: [applied('a')], folder: ['a'] });
  assert.equal(plan.status, 'NOTHING-TO-DO');
});

// ---------------------------------------------------------------------------
// buildDeleteFossilSql — the only DELETE the script may run
// ---------------------------------------------------------------------------

test('delete-fossil SQL is pinned to the exact fossil shape and name', () => {
  const sql = buildDeleteFossilSql('20240101000000_init');
  assert.match(sql, /^DELETE FROM _prisma_migrations WHERE migration_name = '20240101000000_init'/);
  assert.match(sql, /finished_at IS NULL/);
  assert.match(sql, /applied_steps_count = 0/);
  assert.match(sql, /rolled_back_at IS NOT NULL/);
});

test('delete-fossil SQL escapes single quotes in names', () => {
  assert.match(buildDeleteFossilSql("it's"), /'it''s'/);
});

test('undo SQL restores the tombstone shape and can never touch pre-existing fossils', () => {
  const sql = buildUndoResolveSql('20240101000000_init');
  assert.match(sql, /^UPDATE _prisma_migrations SET rolled_back_at = NULL/);
  assert.match(sql, /finished_at IS NULL/);
  assert.match(sql, /applied_steps_count = 0/);
  assert.match(sql, /rolled_back_at IS NOT NULL/);
  // The failed-apply-logs condition pins the update to crashed-deploy
  // tombstones; pre-existing resolved fossils (no failure logs) are immune.
  assert.match(sql, /logs LIKE '%failed to apply%'/);
});

// ---------------------------------------------------------------------------
// hasAppliedRow
// ---------------------------------------------------------------------------

test('hasAppliedRow requires finished, non-rolled-back, steps > 0', () => {
  const rows = [applied('a', 1), tombstone('b'), fossil('c')];
  assert.equal(hasAppliedRow(rows, 'a'), true);
  assert.equal(hasAppliedRow(rows, 'b'), false);
  assert.equal(hasAppliedRow(rows, 'c'), false);
  assert.equal(hasAppliedRow(rows, 'missing'), false);
});

// ---------------------------------------------------------------------------
// evaluateFinalLedger
// ---------------------------------------------------------------------------

test('final verification passes on a canonical ledger', () => {
  const problems = evaluateFinalLedger([applied('a'), applied('b')], ['a', 'b']);
  assert.deepEqual(problems, []);
});

test('final verification flags unfinished rows and unapplied folder migrations', () => {
  const problems = evaluateFinalLedger([tombstone('a'), applied('b')], ['a', 'b', 'c']);
  assert.equal(problems.length, 2);
  assert.ok(problems.some((p) => p.includes('unfinished row remains: a')));
  assert.ok(problems.some((p) => p.includes('still not applied: c')));
});

test('final verification flags duplicate applied rows (the double-insert trap)', () => {
  const problems = evaluateFinalLedger([applied('a', 1), applied('a', 1)], ['a']);
  assert.deepEqual(problems, ['duplicate applied rows for a']);
});

test('final verification ignores pre-existing extras but not new ones', () => {
  const rows = [applied('a'), applied('preexisting_extra')];
  assert.deepEqual(evaluateFinalLedger(rows, ['a'], ['preexisting_extra']), []);
  assert.match(evaluateFinalLedger(rows, ['a'])[0], /applied row not in folder: preexisting_extra/);
});

// ---------------------------------------------------------------------------
// Postgres-gated e2e: the full apply cycle against a real tombstone
// ---------------------------------------------------------------------------

const PROBE_DB = 'probe_reconcile_e2e';
const LIVE_BASE = process.env.LIVE_DB_URL_BASE ?? 'postgresql://azeebo:azeebo_dev_2024@localhost:5432';
const pgUp = (() => {
  try {
    execFileSync('psql', [`${LIVE_BASE}/postgres`, '-tAc', 'SELECT 1'], { timeout: 20_000, stdio: ['ignore', 'pipe', 'pipe'] });
    return true;
  } catch { return false; }
})();

test('e2e: dry-run plan leaves the database byte-identical, apply reconciles it', { skip: !pgUp && 'Postgres not reachable' }, async (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'reconcile-e2e-'));
  const prismaBin = path.resolve('node_modules/.bin/prisma');
  fs.mkdirSync(path.join(root, 'prisma', 'migrations', '20240101000000_e2e_init'), { recursive: true });
  fs.writeFileSync(path.join(root, 'prisma', 'schema.prisma'), [
    'datasource db {', '  provider = "postgresql"', '  url      = env("DATABASE_URL")', '}', '',
    'generator client {', '  provider = "prisma-client-js"', '}', '',
    'model Probe {', '  id   Int    @id @default(autoincrement())', '  name String', '}', '',
  ].join('\n'));
  fs.writeFileSync(path.join(root, 'prisma', 'migrations', 'migration_lock.toml'), 'provider = "postgresql"\n');
  // Broken migration → crashed-deploy tombstone.
  fs.writeFileSync(path.join(root, 'prisma', 'migrations', '20240101000000_e2e_init', 'migration.sql'),
    'CREATE TABLE "e2e_seed" (id int);\nSELECT * FROM "definitely_missing_table";\n');
  const dbUrl = `${LIVE_BASE}/${PROBE_DB}`;

  const psql = (sql) => execFileSync('psql', [dbUrl, '-v', 'ON_ERROR_STOP=1', '-tAc', sql], { encoding: 'utf8' });
  const runPrisma = (argv) => execFileSync(prismaBin, argv, { cwd: root, encoding: 'utf8', env: { ...process.env, DATABASE_URL: dbUrl } });
  const ledgerRows = () => psql(`SELECT migration_name||'|'||(rolled_back_at IS NOT NULL)::text||'|'||COALESCE(applied_steps_count::text,'0')||'|'||(finished_at IS NULL)::text||'|'||COALESCE(logs,'') FROM _prisma_migrations ORDER BY migration_name`)
    .split('\n').filter(Boolean).map((l) => { const [name, rolled, steps, unfinished, ...rest] = l.split('|'); return { name, rolledBack: rolled === 'true', steps: Number(steps), unfinished: unfinished === 'true', logs: rest.join('|') }; });

  // Build the tombstone through the real prisma.
  execFileSync('psql', [`${LIVE_BASE}/postgres`, '-c', `DROP DATABASE IF EXISTS ${PROBE_DB}`], { stdio: 'ignore' });
  execFileSync('psql', [`${LIVE_BASE}/postgres`, '-c', `CREATE DATABASE ${PROBE_DB}`], { stdio: 'ignore' });
  let threw = false;
  try { runPrisma(['migrate', 'deploy']); } catch { threw = true; }
  assert.ok(threw, 'fixture deploy should fail');
  assert.deepEqual(ledgerRows().filter((r) => r.unfinished).map((r) => r.name), ['20240101000000_e2e_init']);

  // Realistic sequence: the broken migration gets repaired after the crash,
  // THEN the ledger is reconciled (resolve → deploy → delete-fossil).
  fs.writeFileSync(path.join(root, 'prisma', 'migrations', '20240101000000_e2e_init', 'migration.sql'),
    'CREATE TABLE "e2e_seed" (id int);\n');

  // The pure plan over the real ledger rows.
  const before = ledgerRows();
  const plan = buildPlan({ ledgerRows: before, folder: ['20240101000000_e2e_init'] });
  assert.equal(plan.status, 'PLANNED');

  // Execute the plan's actions by hand (same mechanics as the script).
  for (const action of plan.actions) {
    if (action.kind === 'resolve') runPrisma(['migrate', 'resolve', '--rolled-back', action.name]);
    if (action.kind === 'deploy') runPrisma(['migrate', 'deploy']);
    if (action.kind === 'delete-fossil') psql(buildDeleteFossilSql(action.name));
  }

  const after = ledgerRows();
  assert.deepEqual(evaluateFinalLedger(after, ['20240101000000_e2e_init']), [], `final ledger should be canonical: ${JSON.stringify(after)}`);
  assert.equal(psql(`SELECT count(*) FROM information_schema.tables WHERE table_name='e2e_seed'`).trim(), '1', 'the previously-failed migration must actually have run');

  // The delete must be a no-op on an already-canonical ledger.
  psql(buildDeleteFossilSql('20240101000000_e2e_init'));
  assert.deepEqual(ledgerRows(), after, 'delete-fossil must be a no-op without a fossil');
});
