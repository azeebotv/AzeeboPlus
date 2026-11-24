/**
 * Unit tests for the two Prisma drift gates:
 *
 *   • scripts/lib/prisma-migrations-core.mjs (check-prisma-migrations.mjs)
 *     — replays prisma/migrations into a shadow DB, diffs against schema
 *   • scripts/lib/prisma-deployed-schema-core.mjs (check-deployed-schema.mjs)
 *     — `migrate deploy` into a throwaway DB, diffs against schema
 *
 * Following the prisma-find-first.test.mjs pattern: each test builds a
 * minimal fixture tree (temp dir, via makeRoot) shaped like the real repo
 * (services/<domain>/<name>/prisma/...) and runs the real gate functions.
 *
 * Three layers:
 *   1. Pure classification helpers (drift verdicts, BROKEN classification,
 *      stderr summarizing, DATABASE_URL resolution) — always run.
 *   2. Orchestration over fixture trees with the prisma/psql calls faked
 *      (injectable runPrismaFn / checkServiceFn / database helpers) —
 *      always run, no database needed.
 *   3. True end-to-end cases against a real PostgreSQL (shadow replay and
 *      migrate deploy into throwaway DBs) — skipped when no server answers,
 *      so the suite stays green in CI jobs that run `node --test
 *      scripts/__tests__/*.test.mjs` without Postgres (pr-checks.yml), while
 *      running fully on machines/dev containers that have one.
 *
 * Run: `node --test scripts/__tests__/prisma-drift-gates.test.mjs`
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  discoverServices,
  driftVerdict,
  nonDiffLines,
  summarize,
  classifyBroken,
  checkService,
  runMigrationsGate,
  writeBaselineMigration,
} from '../lib/prisma-migrations-core.mjs';
import {
  runDeployedSchemaGate,
  resolveDiffEnv,
} from '../lib/prisma-deployed-schema-core.mjs';
import { makeRoot } from './fixtures.mjs';

const REPO_BIN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../node_modules/.bin');

// Local dev Postgres for the integration layer (same convention the gate
// CLIs default to). Probe once; DB-coupled tests skip when it's unreachable.
const SHADOW_URL = process.env.SHADOW_DB_URL
  ?? 'postgresql://azeebo:azeebo_dev_2024@localhost:5432/postgres';
const hasPostgres = (() => {
  // Two tries: local dev Postgres can be briefly slow to accept connections.
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      execFileSync('psql', [SHADOW_URL, '-tAc', 'SELECT 1'], {
        encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 20_000,
      });
      return true;
    } catch { /* retry, then skip DB-coupled tests */ }
  }
  return false;
})();

// ── Fixture vocabulary ──────────────────────────────────────────────────────

const SCHEMA = `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id    String @id @default(uuid())
  email String @unique
  name  String
}
`;

const MIG_CLEAN = [
  '-- CreateEnum (unused in schema, tolerated: prisma diffs are directional)',
  'CREATE TABLE "User" (',
  '    "id" TEXT NOT NULL,',
  '    "email" TEXT NOT NULL,',
  '    "name" TEXT NOT NULL,',
  '    CONSTRAINT "User_pkey" PRIMARY KEY ("id")',
  ');',
  '',
  '-- name-only note line (comments must never count as diff statements)',
  'CREATE UNIQUE INDEX "User_email_key" ON "User"("email");',
].join('\n');

const MIG_DRIFT = MIG_CLEAN.replace('    "name" TEXT NOT NULL,\n', ''); // missing column → schema ≠ replay
const MIG_BROKEN = `${MIG_CLEAN}\n\n-- intentional dangling reference so replay fails from empty\nCREATE INDEX "User_email_idx" ON "Nope"("email");\n`;

/** Migration-gate fixture: schema + a migrations folder (with lock file) for the given SQL. */
function migRoot(sql) {
  return makeRoot({
    'services/core/demo/prisma/schema.prisma': SCHEMA,
    'services/core/demo/prisma/migrations/migration_lock.toml': 'provider = "postgresql"\n',
    'services/core/demo/prisma/migrations/20260101000000_init/migration.sql': sql,
  });
}

/** Deploy-gate fixture: migration-gate fixture plus optional service .env. */
function deployedRoot(sql, { withEnv = true } = {}) {
  const files = {
    'services/core/demo/prisma/schema.prisma': SCHEMA,
    'services/core/demo/prisma/migrations/migration_lock.toml': 'provider = "postgresql"\n',
    'services/core/demo/prisma/migrations/20260101000000_init/migration.sql': sql,
  };
  if (withEnv) {
    files['services/core/demo/.env'] = 'DATABASE_URL=postgresql://placeholder:change-me@localhost:5432/demo?schema=public\n';
  }
  return makeRoot(files);
}

/** Service source-tree fixture with several services for discovery/filter tests. */
function multiRoot() {
  return makeRoot({
    'services/core/alpha/prisma/schema.prisma': SCHEMA,
    'services/beta/prisma/schema.prisma': SCHEMA, // missing domain level → NOT discovered
    'services/core/gamma/src/index.ts': 'not a prisma service', // no schema → NOT discovered
  });
}

const quiet = () => undefined;

// ── Part 1: pure helpers ────────────────────────────────────────────────────

test('nonDiffLines counts statements and ignores comments/blank lines', () => {
  const sql = [
    '-- CreateTable',
    'CREATE TABLE "User" ("id" TEXT NOT NULL);',
    '',
    '-- a note',
    'CREATE INDEX "x" ON "User"("email");',
    '   ',
  ].join('\n');
  assert.equal(nonDiffLines(sql), 2);
  assert.equal(nonDiffLines('-- only comments\n\n'), 0);
});

test('driftVerdict: empty diff → CLEAN', () => {
  const v = driftVerdict('-- This is an empty diff.\n');
  assert.equal(v.status, 'CLEAN');
  assert.equal(v.detail, '');
  assert.equal(v.sql, '');
});

test('driftVerdict: any statement → DRIFTED with count and SQL preserved', () => {
  const sql = 'ALTER TABLE "User" DROP COLUMN "name";\nCREATE TABLE "Ghost" ("id" TEXT NOT NULL);\n';
  const v = driftVerdict(sql);
  assert.equal(v.status, 'DRIFTED');
  assert.match(v.detail, /2 diff statement\(s\)/);
  assert.equal(v.sql, sql);
});

test('driftVerdict: comment-only diff stays CLEAN (deploy gate semantics)', () => {
  assert.equal(driftVerdict('-- comment\n\n-- another\n').status, 'CLEAN');
});

test('classifyBroken: recognizes prisma replay-failure classes', () => {
  assert.ok(classifyBroken('Error: P3006\nmigrate failed'));
  assert.ok(classifyBroken('P3018: A migration failed to apply'));
  assert.ok(classifyBroken('relation "Nope" does not exist'));
  assert.ok(classifyBroken('migration 20260101_init failed to apply cleanly'));
  assert.equal(classifyBroken('All migrations have been successfully applied.'), false);
  assert.equal(classifyBroken(''), false);
});

test('summarize: captures the error line plus following context', () => {
  const stderr = ['verbose line', 'Error: P3006', '  CREATE INDEX ...', '  db error: relation does not exist', 'tail'].join('\n');
  const out = summarize(stderr);
  assert.match(out, /P3006/);
  assert.match(out, /does not exist/);
});

test('summarize: falls back to the first lines when no error marker', () => {
  const out = summarize('a\nb\nc\nd');
  assert.match(out, /^a · b · c$/);
});

test('summarize: truncates to 400 chars', () => {
  assert.ok(summarize(`x\n${'y'.repeat(500)}`).length <= 400);
});

test('resolveDiffEnv: shell DATABASE_URL wins; .env present → inherit prisma env; else inject URL', () => {
  const saved = process.env.DATABASE_URL;
  try {
    const rootA = deployedRoot(MIG_CLEAN); // has .env
    const rootB = deployedRoot(MIG_CLEAN, { withEnv: false });

    process.env.DATABASE_URL = 'postgresql://shell:wins@localhost:5432/shell';
    assert.deepEqual(resolveDiffEnv(path.join(rootA, 'services/core/demo'), 'postgresql://x'), {});
    assert.deepEqual(resolveDiffEnv(path.join(rootB, 'services/core/demo'), 'postgresql://x'), {});

    delete process.env.DATABASE_URL;
    // .env exists (even with a change-me placeholder) → prisma reads it itself
    assert.deepEqual(resolveDiffEnv(path.join(rootA, 'services/core/demo'), 'postgresql://x'), {});
    // no .env → the gate injects the throwaway URL so schema validation passes
    assert.deepEqual(resolveDiffEnv(path.join(rootB, 'services/core/demo'), 'postgresql://shadow'), { DATABASE_URL: 'postgresql://shadow' });
  } finally {
    if (saved === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = saved;
  }
});

test('discoverServices: only services/<domain>/<name> with prisma/schema.prisma', () => {
  const root = multiRoot();
  assert.deepEqual(discoverServices(root), ['services/core/alpha']);
});

test('writeBaselineMigration: appends a timestamped drift_sync migration', () => {
  const root = migRoot(MIG_CLEAN);
  const written = writeBaselineMigration(root, 'services/core/demo', 'ALTER TABLE "User" ADD COLUMN "name" TEXT;');
  // Stamp format inherited from the original script: YYYYMMDDHHMMSS + 0000.
  assert.match(written, /services\/core\/demo\/prisma\/migrations\/\d{18}_drift_sync$/);
  const onDisk = readFileSync(path.join(root, written, 'migration.sql'), 'utf8');
  assert.match(onDisk, /ADD COLUMN "name"/);
});

// ── Part 2: orchestration over fixture trees (prisma/psql faked) ────────────

test('migrations gate: CLEAN fixture exits 0 (fake diff returns empty)', (t) => {
  const root = migRoot(MIG_CLEAN);
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const outcome = runMigrationsGate(root, {
    shadowDbUrl: SHADOW_URL,
    log: quiet,
    database: { dbExists: () => false, dropDatabase: () => {}, createDatabase: () => {} },
    checkServiceFn: (root_, rel) => ({ service: rel, status: 'CLEAN', detail: '', sql: '' }),
  });
  assert.equal(outcome.exitCode, 0);
  assert.equal(outcome.results[0].status, 'CLEAN');
});

test('migrations gate: DRIFTED fixture fails with artifact + exit 1', (t) => {
  const root = migRoot(MIG_DRIFT);
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const outcome = runMigrationsGate(root, {
    shadowDbUrl: SHADOW_URL,
    log: quiet,
    database: { dbExists: () => false, dropDatabase: () => {}, createDatabase: () => {} },
    checkServiceFn: (root_, rel) => ({
      service: rel, status: 'DRIFTED',
      detail: '1 diff statement(s) between replayed migrations and schema.prisma',
      sql: 'ALTER TABLE "User" DROP COLUMN "name";',
    }),
  });
  assert.equal(outcome.exitCode, 1);
  assert.equal(outcome.drifted.length, 1);
  const artifact = path.join(root, '.check-prisma-drift-out', 'services__core__demo.sql');
  assert.ok(existsSync(artifact), 'drift SQL artifact must be written');
  assert.match(readFileSync(artifact, 'utf8'), /DROP COLUMN "name"/);
});

test('migrations gate: BROKEN fixture fails even with --update-baseline', (t) => {
  const root = migRoot(MIG_BROKEN);
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const outcome = runMigrationsGate(root, {
    shadowDbUrl: SHADOW_URL,
    updateBaseline: true,
    log: quiet,
    database: { dbExists: () => false, dropDatabase: () => {}, createDatabase: () => {} },
    checkServiceFn: (root_, rel) => ({ service: rel, status: 'BROKEN', detail: 'P3006 boom', sql: '' }),
  });
  assert.equal(outcome.exitCode, 1); // broken sets are never auto-baselined
});

test('migrations gate: --update-baseline writes drift_sync for DRIFTED and exits 0', (t) => {
  const root = migRoot(MIG_DRIFT);
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const outcome = runMigrationsGate(root, {
    shadowDbUrl: SHADOW_URL,
    updateBaseline: true,
    log: quiet,
    database: { dbExists: () => false, dropDatabase: () => {}, createDatabase: () => {} },
    checkServiceFn: (root_, rel) => ({
      service: rel, status: 'DRIFTED',
      detail: 'drift', sql: 'ALTER TABLE "User" ADD COLUMN "name" TEXT;',
    }),
  });
  assert.equal(outcome.exitCode, 0);
  const migDir = path.join(root, 'services/core/demo/prisma/migrations');
  const written = readdirSync(migDir);
  assert.ok(written.some((n) => n.endsWith('_drift_sync')), `expected drift_sync in ${written}`);
});

test('migrations gate: unmatched filter → NO-MATCH with the discovered list', (t) => {
  const root = migRoot(MIG_CLEAN);
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const outcome = runMigrationsGate(root, {
    filter: ['nope-service'],
    shadowDbUrl: SHADOW_URL,
    log: quiet,
  });
  assert.equal(outcome.status, 'NO-MATCH');
  assert.deepEqual(outcome.all, ['services/core/demo']);
});

test('migrations gate: filter matches full path or suffix', (t) => {
  const root = multiRoot();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const a = runMigrationsGate(root, { filter: ['services/core/alpha'], shadowDbUrl: SHADOW_URL, log: quiet, checkServiceFn: (r, rel) => ({ service: rel, status: 'CLEAN', detail: '', sql: '' }) });
  assert.equal(a.targets.length, 1);
  const b = runMigrationsGate(root, { filter: ['alpha'], shadowDbUrl: SHADOW_URL, log: quiet, checkServiceFn: (r, rel) => ({ service: rel, status: 'CLEAN', detail: '', sql: '' }) });
  assert.equal(b.targets.length, 1);
});

test('checkService: drop-before-create on reused shadow name; fake diff classified', (t) => {
  const root = migRoot(MIG_CLEAN);
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const calls = { created: 0, dropped: 0, argv: [] };
  const r = checkService(root, 'services/core/demo', 'run42', {
    shadowDbUrl: SHADOW_URL,
    runPrismaFn: (root_, dir, args) => { calls.argv.push(args[0]); return '-- empty diff.\n'; },
    database: {
      dbExists: () => true, // shadow name already taken → must be dropped first
      dropDatabase: () => { calls.dropped++; },
      createDatabase: () => { calls.created++; },
    },
  });
  assert.equal(r.status, 'CLEAN');
  assert.equal(calls.created, 1);
  assert.equal(calls.dropped, 2); // drop of the pre-existing shadow + finally-cleanup drop
  assert.deepEqual(calls.argv, ['migrate']); // the replay diff was invoked
});

test('deployed gate: CLEAN fixture exits 0 with deploy → diff argv order', (t) => {
  const root = deployedRoot(MIG_CLEAN);
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const seen = [];
  const outcome = runDeployedSchemaGate(root, {
    shadowDbUrl: SHADOW_URL,
    log: quiet,
    database: { dbExists: () => false, dropDatabase: () => {}, createDatabase: () => {} },
    checkServiceFn: (root_, rel, runId, index, opts) => {
      seen.push({ rel, index, runId });
      return { service: rel, status: 'CLEAN', detail: '', sql: '', deployLog: 'ok' };
    },
  });
  assert.equal(outcome.exitCode, 0);
  assert.deepEqual(seen.map((s) => s.index), [0]);
});

test('deployed gate: DRIFTED fails with artifacts; BROKEN writes deploy.log; ERROR counts', (t) => {
  const lockToml = 'provider = "postgresql"\n';
  const root = makeRoot({
    'services/core/one/prisma/schema.prisma': SCHEMA,
    'services/core/one/prisma/migrations/migration_lock.toml': lockToml,
    'services/core/one/prisma/migrations/20260101000000_init/migration.sql': MIG_CLEAN,
    'services/core/one/.env': 'DATABASE_URL=postgresql://placeholder:change-me@localhost:5432/one\n',
    'services/core/two/prisma/schema.prisma': SCHEMA,
    'services/core/two/prisma/migrations/migration_lock.toml': lockToml,
    'services/core/two/prisma/migrations/20260101000000_init/migration.sql': MIG_BROKEN,
    'services/core/two/.env': 'DATABASE_URL=postgresql://placeholder:change-me@localhost:5432/two\n',
    'services/core/three/prisma/schema.prisma': SCHEMA,
    'services/core/three/prisma/migrations/migration_lock.toml': lockToml,
    'services/core/three/prisma/migrations/20260101000000_init/migration.sql': MIG_CLEAN,
    'services/core/three/.env': 'DATABASE_URL=postgresql://placeholder:change-me@localhost:5432/three\n',
  });
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const outcome = runDeployedSchemaGate(root, {
    shadowDbUrl: SHADOW_URL,
    log: quiet,
    database: { dbExists: () => false, dropDatabase: () => {}, createDatabase: () => {} },
    checkServiceFn: (root_, rel) => {
      if (rel.endsWith('one')) return { service: rel, status: 'DRIFTED', detail: '1 diff statement(s)', sql: 'CREATE TABLE "Ghost" ("id" TEXT NOT NULL);', deployLog: '' };
      if (rel.endsWith('two')) return { service: rel, status: 'BROKEN', detail: 'migrate deploy failed — P3006', sql: '', deployLog: 'Error: P3006' };
      return { service: rel, status: 'ERROR', detail: 'migrate diff failed — bad schema', sql: '', deployLog: '' };
    },
  });
  assert.equal(outcome.exitCode, 1);
  const out = path.join(root, '.check-prisma-deploy-diff-out');
  assert.match(readFileSync(path.join(out, 'services__core__one.sql'), 'utf8'), /CREATE TABLE "Ghost"/);
  assert.match(readFileSync(path.join(out, 'services__core__two.deploy.log'), 'utf8'), /P3006/);
  assert.equal(outcome.errored.length, 1);
});

test('deployed gate: unmatched filter → NO-MATCH', (t) => {
  const root = deployedRoot(MIG_CLEAN);
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const outcome = runDeployedSchemaGate(root, { filter: ['ghost'], shadowDbUrl: SHADOW_URL, log: quiet });
  assert.equal(outcome.status, 'NO-MATCH');
});

// ── Part 3: end-to-end against real PostgreSQL (skips without a server) ─────

test('migrations gate e2e: clean fixture replays into exactly schema.prisma', (t) => {
  if (!hasPostgres) { t.skip('no PostgreSQL reachable'); return; }
  const root = migRoot(MIG_CLEAN);
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const outcome = runMigrationsGate(root, {
    shadowDbUrl: SHADOW_URL,
    prismaBinaryDir: REPO_BIN,
    log: quiet,
  });
  assert.equal(outcome.exitCode, 0, JSON.stringify(outcome.results, null, 2));
  assert.equal(outcome.results[0].status, 'CLEAN');
});

test('migrations gate e2e: drift fixture is flagged DRIFTED', (t) => {
  if (!hasPostgres) { t.skip('no PostgreSQL reachable'); return; }
  const root = migRoot(MIG_DRIFT);
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const outcome = runMigrationsGate(root, {
    shadowDbUrl: SHADOW_URL,
    prismaBinaryDir: REPO_BIN,
    log: quiet,
  });
  assert.equal(outcome.exitCode, 1);
  assert.equal(outcome.results[0].status, 'DRIFTED');
  assert.match(outcome.results[0].detail, /diff statement\(s\)/);
  // diff direction is replay → schema: the migration missing the column shows
  // up as an ADD COLUMN for it
  assert.match(outcome.results[0].sql, /ADD COLUMN\s+"name"/);
});

test('migrations gate e2e: broken fixture is flagged BROKEN (not DRIFTED)', (t) => {
  if (!hasPostgres) { t.skip('no PostgreSQL reachable'); return; }
  const root = migRoot(MIG_BROKEN);
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const outcome = runMigrationsGate(root, {
    shadowDbUrl: SHADOW_URL,
    prismaBinaryDir: REPO_BIN,
    log: quiet,
  });
  assert.equal(outcome.exitCode, 1);
  assert.equal(outcome.results[0].status, 'BROKEN');
  assert.match(outcome.results[0].detail, /does not exist|failed|P3/i);
});

test('deployed gate e2e: clean fixture deploys and diffs empty', (t) => {
  if (!hasPostgres) { t.skip('no PostgreSQL reachable'); return; }
  const root = deployedRoot(MIG_CLEAN);
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const outcome = runDeployedSchemaGate(root, {
    shadowDbUrl: SHADOW_URL,
    prismaBinaryDir: REPO_BIN,
    log: quiet,
  });
  assert.equal(outcome.exitCode, 0, JSON.stringify(outcome.results, null, 2));
  assert.equal(outcome.results[0].status, 'CLEAN');
});
