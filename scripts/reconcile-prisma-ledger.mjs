#!/usr/bin/env node
// ============================================================================
// reconcile-prisma-ledger.mjs — clear failed-deploy tombstones SAFELY
//
// The nightly schema-lock report (check-live-schema-lock.mjs) surfaces
// BLOCKED-LEDGER services: `_prisma_migrations` rows from crashed deploys —
// unfinished (finished_at IS NULL), applied_steps_count = 0, logs matching
// "A migration failed to apply…". These tombstones block ALL further
// `migrate deploy` runs until resolved.
//
// Empirically verified against prisma 6.19.3 (see RUNBOOK):
//
//   1. `migrate resolve --rolled-back <name>` marks the tombstone
//      rolled_back_at = now() — Prisma's sanctioned unblock.
//   2. `migrate deploy` then re-applies the migration — BUT it INSERTS A NEW
//      LEDGER ROW rather than reusing the tombstone. The resolved tombstone
//      stays behind forever as an unfinished fossil row, which keeps any
//      ledger-consistency check reporting BLOCKED-LEDGER.
//   3. Therefore step 3 deletes the resolved fossil — ONLY after a fresh
//      applied row for the same migration exists, and ONLY matching the
//      exact fossil shape (finished_at IS NULL AND applied_steps_count = 0
//      AND rolled_back_at IS NOT NULL). What remains is the canonical
//      single applied row.
//
// If `migrate deploy` fails after resolves (e.g. the migration is still
// broken), the script UNDOES its own resolves — restoring the exact tombstone
// shape found (rolled_back_at back to NULL) — so the database is left exactly
// as found, tombstone included. Never worse than before.
//
// Modes:
//   dry-run (default)  plan only — zero writes, zero prisma mutations
//   --apply            backup ledger → resolve → deploy → clean fossil → verify
//
// Safety properties:
//   • Refuses services whose unfinished rows do NOT look like crashed-deploy
//     tombstones (a non-failed unfinished row means a deploy may be RUNNING).
//   • Refuses when the tombstoned migration is missing from the folder
//     (nothing to re-apply — human decision required).
//   • Dumps the full ledger to a timestamped CSV artifact before any write.
//   • DATABASE_URL passed to prisma is ALWAYS the URL this script computed
//     from LIVE_DB_URL_BASE (+ naming convention / overrides) — a service
//     .env or a stray shell DATABASE_URL can never redirect a write.
//
// Usage:
//   node scripts/reconcile-prisma-ledger.mjs                     # plan (dry-run), all services
//   node scripts/reconcile-prisma-ledger.mjs user-service        # plan one service
//   node scripts/reconcile-prisma-ledger.mjs --apply user-service
//   node scripts/reconcile-prisma-ledger.mjs --env staging --apply
//   node scripts/reconcile-prisma-ledger.mjs --json              # machine report (log → stderr)
//
// Env: LIVE_DB_URL_BASE, LIVE_DB_NAME_OVERRIDES — same conventions as
// check-live-schema-lock.mjs (defaults to the local dev Postgres).
// ============================================================================

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, '.reconcile-prisma-ledger-out');

const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const jsonOut = args.includes('--json');
const envIdx = args.indexOf('--env');
const ENV = envIdx !== -1 ? String(args[envIdx + 1] || 'local') : 'local';
const filter = args.filter((a, i) => !a.startsWith('--') && (envIdx === -1 || (i !== envIdx && i !== envIdx + 1)));

const log = jsonOut ? (...m) => console.error(...m) : (...m) => console.log(...m);

const LIVE_DB_URL_BASE = process.env.LIVE_DB_URL_BASE
  ?? 'postgresql://azeebo:azeebo_dev_2024@localhost:5432';
const NAME_OVERRIDES = (() => {
  try { return JSON.parse(process.env.LIVE_DB_NAME_OVERRIDES ?? '{}'); } catch { return {}; }
})();

// Server-level probes need an explicit connect database (same convention as
// check-live-schema-lock.mjs).
const ADMIN_URL = (() => {
  const u = new URL(LIVE_DB_URL_BASE);
  if (!u.pathname || u.pathname === '/') u.pathname = '/postgres';
  return u.toString();
})();

// ----------------------------------------------------------------------------
// Plumbing (conventions shared with check-live-schema-lock.mjs)
// ----------------------------------------------------------------------------
function discoverServices() {
  const services = [];
  const servicesDir = path.join(ROOT, 'services');
  if (!fs.existsSync(servicesDir)) return services;
  for (const domain of fs.readdirSync(servicesDir, { withFileTypes: true })) {
    if (!domain.isDirectory()) continue;
    for (const name of fs.readdirSync(path.join(servicesDir, domain.name), { withFileTypes: true })) {
      if (!name.isDirectory()) continue;
      const dir = path.join(servicesDir, domain.name, name.name);
      if (fs.existsSync(path.join(dir, 'prisma', 'schema.prisma'))) {
        services.push(path.relative(ROOT, dir));
      }
    }
  }
  return services.sort();
}

function liveUrlFor(rel) {
  const fallback = `azeebo_${path.basename(rel).replace(/-service$/, '').replace(/-/g, '_')}`;
  const dbName = NAME_OVERRIDES[rel] ?? NAME_OVERRIDES[path.basename(rel)] ?? fallback;
  const u = new URL(LIVE_DB_URL_BASE);
  u.pathname = `/${dbName}`;
  return { url: u.toString(), dbName };
}

function psql(url, sql, timeoutMs = 30_000) {
  return execFileSync('psql', [url, '-v', 'ON_ERROR_STOP=1', '-tAc', sql], {
    encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: timeoutMs,
  });
}

function runPrisma(serviceDir, argv, timeoutMs = 300_000) {
  const targetUrl = process.env.__RECONCILE_TARGET_URL__;
  if (!targetUrl) throw new Error('internal error: reconcile target URL not set for this service');
  const localBin = path.join(serviceDir, 'node_modules', '.bin', 'prisma');
  const rootBin = path.join(ROOT, 'node_modules', '.bin', 'prisma');
  const useBin = fs.existsSync(localBin) ? localBin : (fs.existsSync(rootBin) ? rootBin : null);
  return execFileSync(useBin ?? 'npx', useBin ? argv : ['--yes', 'prisma', ...argv], {
    cwd: serviceDir,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    // The target URL is ALWAYS the one this script computed — a service .env
    // or a stray shell DATABASE_URL can never redirect a write.
    env: { ...process.env, DATABASE_URL: targetUrl },
    timeout: timeoutMs,
  });
}

function summarizeErr(err) {
  return String(err.stderr || err.stdout || err.message || err).split('\n').filter(Boolean).slice(0, 4).join(' · ').slice(0, 300);
}

function folderMigrations(dir) {
  const migDir = path.join(dir, 'prisma', 'migrations');
  try {
    return fs.readdirSync(migDir, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name).sort();
  } catch { return []; }
}

function safeName(rel) { return rel.replaceAll('/', '__'); }

// ----------------------------------------------------------------------------
// Ledger reading + tombstone classification (pure, unit-tested)
// ----------------------------------------------------------------------------

// Rows: migration_name|rolled|steps|unfinished|logs — same encoding as the
// schema-lock report, with an explicit table-existence probe so a query
// error can never masquerade as "no ledger".
function readLedger(url) {
  let present;
  try {
    present = psql(url, `SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_name='_prisma_migrations'`).trim() !== '0';
  } catch (err) {
    return { present: false, rows: [], error: summarizeErr(err) };
  }
  if (!present) return { present: false, rows: [] };
  try {
    const SQL = `SELECT migration_name||'|'||(rolled_back_at IS NOT NULL)::text||'|'||COALESCE(applied_steps_count::text,'0')||'|'||(finished_at IS NULL)::text||'|'||COALESCE(logs,'') FROM _prisma_migrations ORDER BY migration_name`;
    const rows = psql(url, SQL).split('\n').filter(Boolean).map((l) => {
      const [name, rolled, steps, unfinished, ...rest] = l.split('|');
      return { name, rolledBack: rolled === 'true', steps: Number(steps), unfinished: unfinished === 'true', logs: rest.join('|') };
    });
    return { present: true, rows };
  } catch (err) {
    return { present: true, rows: [], error: summarizeErr(err) };
  }
}

const FAILED_LOGS_RE = /failed to apply/i;

/**
 * Classify unfinished ledger rows into three shapes:
 *   tombstones     — crashed-deploy artifacts: NOT rolled back, 0 steps
 *                    applied, failure logs present. Reconcile via
 *                    resolve → deploy → delete-fossil.
 *   resolvedFossils — rows already marked rolled back by a previous
 *                    `migrate resolve --rolled-back` (prisma 6.19.3 leaves
 *                    them behind forever, finished_at stays NULL). They do
 *                    NOT block deploy — the migration just needs re-applying
 *                    (if never applied) and the stale row deleting.
 *   running        — everything else unfinished: a deploy may be executing
 *                    right now. Absolute refusal.
 */
export function classifyTombstones(rows) {
  const unfinished = rows.filter((r) => r.unfinished);
  return {
    tombstones: unfinished.filter((r) => !r.rolledBack && r.steps === 0 && FAILED_LOGS_RE.test(r.logs)),
    resolvedFossils: unfinished.filter((r) => r.rolledBack && r.steps === 0),
    running: unfinished.filter((r) => !(r.steps === 0 && (r.rolledBack || FAILED_LOGS_RE.test(r.logs)))),
  };
}

/**
 * Build the reconciliation plan for one service. Pure — unit-tested.
 * Returns { status, tombstones, actions[], refusal } where actions are
 * { kind: 'resolve'|'deploy'|'delete-fossil', name?, why } in execution order:
 * all resolves → one deploy (only if anything needs re-applying) → deletes.
 */
export function buildPlan({ ledgerRows, folder }) {
  const { tombstones, resolvedFossils, running } = classifyTombstones(ledgerRows);
  if (running.length > 0) {
    return {
      status: 'REFUSED',
      tombstones: [],
      actions: [],
      refusal: `${running.length} unfinished migration(s) that are neither failed-deploy tombstones nor resolved rows (${running.map((r) => r.name).join(', ')}) — a deploy may be running right now; never reconcile under an active deploy`,
    };
  }
  if (tombstones.length === 0 && resolvedFossils.length === 0) {
    return { status: 'NOTHING-TO-DO', tombstones: [], actions: [], refusal: null };
  }
  const missing = tombstones.filter((t) => !folder.includes(t.name));
  if (missing.length > 0) {
    return {
      status: 'REFUSED',
      tombstones,
      actions: [],
      refusal: `tombstoned migration(s) not in the migration folder: ${missing.map((m) => m.name).join(', ')} — nothing to re-apply; restore the folder entry or decide manually`,
    };
  }

  const actions = [];
  for (const t of tombstones) {
    actions.push({ kind: 'resolve', name: t.name, why: 'mark the crashed-deploy tombstone rolled back (sanctioned unblock)' });
  }
  // A resolved fossil is already unblocked: re-apply only if no applied row
  // exists yet; if one does (the double-insert state a previous resolve+
  // redeploy leaves), the stale row is delete-only cleanup.
  for (const f of resolvedFossils) {
    if (hasAppliedRow(ledgerRows, f.name)) continue; // delete-only, below
    if (!folder.includes(f.name)) {
      return {
        status: 'REFUSED',
        tombstones: resolvedFossils,
        actions: [],
        refusal: `resolved migration never re-applied and not in the folder: ${f.name} — restore the folder entry or decide manually`,
      };
    }
  }
  const reapplyTargets = [
    ...tombstones.map((t) => t.name),
    ...resolvedFossils.filter((f) => !hasAppliedRow(ledgerRows, f.name)).map((f) => f.name),
  ];
  if (reapplyTargets.length > 0) {
    actions.push({ kind: 'deploy', why: `re-apply what never ran (${reapplyTargets.join(', ')})` });
  }
  for (const t of tombstones) {
    actions.push({ kind: 'delete-fossil', name: t.name, why: 'remove the resolved-but-unfinished row deploy leaves behind (prisma 6.19.3 inserts a new row instead of reusing it)' });
  }
  for (const f of resolvedFossils) {
    actions.push({ kind: 'delete-fossil', name: f.name, why: hasAppliedRow(ledgerRows, f.name)
      ? 'stale resolved row for an already re-applied migration'
      : 'remove the resolved-but-unfinished row after re-apply' });
  }
  return { status: 'PLANNED', tombstones: [...tombstones, ...resolvedFossils], actions, refusal: null };
}

/** The ONLY delete this script will ever run — exact fossil shape, per name. */
export function buildDeleteFossilSql(name) {
  return `DELETE FROM _prisma_migrations WHERE migration_name = '${name.replaceAll("'", "''")}' AND finished_at IS NULL AND applied_steps_count = 0 AND rolled_back_at IS NOT NULL`;
}

/**
 * The ONLY undo: restore a row this run resolved back to its tombstone shape.
 * The failed-apply-logs condition guarantees this can never touch a
 * pre-existing resolved fossil (those lack failure logs) — it can only
 * revert a crashed-deploy tombstone that THIS run's resolve marked.
 */
export function buildUndoResolveSql(name) {
  return `UPDATE _prisma_migrations SET rolled_back_at = NULL WHERE migration_name = '${name.replaceAll("'", "''")}' AND finished_at IS NULL AND applied_steps_count = 0 AND rolled_back_at IS NOT NULL AND logs LIKE '%failed to apply%'`;
}

/** True if a fresh, fully-applied row exists for the migration. */
export function hasAppliedRow(rows, name) {
  return rows.some((r) => r.name === name && !r.unfinished && !r.rolledBack && r.steps > 0);
}

/**
 * Post-apply verification. Pure — unit-tested. Returns a list of problems;
 * empty means the ledger now matches the folder canonically.
 *
 * `ignoreExtras` lists migrations that were applied-but-not-in-folder BEFORE
 * reconciliation ran (pre-existing history, e.g. a resolved drift-sync row) —
 * they are not this script's doing and must not fail verification.
 */
export function evaluateFinalLedger(rows, folder, ignoreExtras = []) {
  const problems = [];
  for (const r of rows.filter((r) => r.unfinished)) {
    problems.push(`unfinished row remains: ${r.name}`);
  }
  const applied = rows.filter((r) => !r.rolledBack).map((r) => r.name);
  for (const f of folder) {
    if (!applied.includes(f)) problems.push(`folder migration still not applied: ${f}`);
  }
  for (const name of new Set(applied)) {
    if (applied.filter((n) => n === name).length > 1) problems.push(`duplicate applied rows for ${name}`);
  }
  for (const n of applied) {
    if (!folder.includes(n) && !ignoreExtras.includes(n)) problems.push(`applied row not in folder: ${n}`);
  }
  return problems;
}

// ----------------------------------------------------------------------------
// Per-service reconciliation
// ----------------------------------------------------------------------------
function reconcileService(rel, runTs) {
  const dir = path.join(ROOT, rel);
  const { url, dbName } = liveUrlFor(rel);
  const result = { service: rel, status: 'SKIPPED', database: dbName, detail: '', actions: [] };

  // 0. Server + DB reachability (read-only probes)
  try { psql(ADMIN_URL, 'SELECT 1'); } catch (err) {
    result.status = 'UNREACHABLE'; result.detail = summarizeErr(err); return result;
  }
  let dbExists = false;
  try { dbExists = psql(ADMIN_URL, `SELECT 1 FROM pg_database WHERE datname='${dbName}'`).trim() === '1'; } catch (err) {
    result.status = 'UNREACHABLE'; result.detail = summarizeErr(err); return result;
  }
  if (!dbExists) { result.status = 'NO-DB'; result.detail = `no database ${dbName}`; return result; }

  // 1. Read ledger + build plan (pure)
  process.env.__RECONCILE_TARGET_URL__ = url;
  const ledger = readLedger(url);
  if (ledger.error) { result.status = 'ERROR'; result.detail = `ledger read failed — ${ledger.error}`; return result; }
  if (!ledger.present) { result.status = 'NOTHING-TO-DO'; result.detail = 'no _prisma_migrations table'; return result; }
  const folder = folderMigrations(dir);
  // Applied-but-not-in-folder rows that pre-date this run are not ours to fix;
  // final verification must not blame reconciliation for them.
  const preExistingExtras = ledger.rows.filter((r) => !r.rolledBack && !folder.includes(r.name)).map((r) => r.name);
  const plan = buildPlan({ ledgerRows: ledger.rows, folder });
  result.plan = plan;
  if (plan.status !== 'PLANNED') {
    result.status = plan.status;
    result.detail = plan.refusal ?? 'no failed-deploy tombstones';
    return result;
  }

  log(`  ${rel}`);
  for (const t of plan.tombstones) {
    log(`    ${t.rolledBack ? 'resolved fossil' : 'tombstone'}: ${t.name} (steps=0)`);
  }

  if (!APPLY) {
    result.status = 'PLANNED';
    for (const a of plan.actions) result.actions.push(a.kind + (a.name ? ` ${a.name}` : ''));
    log(`    [dry-run] would: ${result.actions.join('  →  ')}`);
    return result;
  }

  // 2. APPLY — backup first
  const artifactDir = path.join(OUT_DIR, ENV);
  fs.mkdirSync(artifactDir, { recursive: true });
  const backupPath = path.join(artifactDir, `${safeName(rel)}-ledger-backup-${runTs}.csv`);
  try {
    execFileSync('psql', [url, '-v', 'ON_ERROR_STOP=1', '-c',
      `\\copy (SELECT migration_name, applied_steps_count, started_at, finished_at, rolled_back_at, logs FROM _prisma_migrations ORDER BY migration_name) TO '${backupPath}' WITH CSV HEADER`],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 30_000 });
    log(`    ledger backup: ${path.relative(ROOT, backupPath)}`);
  } catch (err) {
    result.status = 'ERROR'; result.detail = `ledger backup failed — refusing to proceed — ${summarizeErr(err)}`;
    return result;
  }

  const resolvedNow = [];
  try {
    // 3. resolve --rolled-back each tombstone (sanctioned unblock)
    for (const t of plan.tombstones) {
      runPrisma(dir, ['migrate', 'resolve', '--rolled-back', t.name]);
      resolvedNow.push(t.name);
      log(`    resolved (rolled back): ${t.name}`);
    }

    // 4. deploy — re-applies the resolved migrations
    const deployOut = runPrisma(dir, ['migrate', 'deploy']);
    log(`    deploy: ${(deployOut.split('\n').filter((l) => /applied|Successfully/i.test(l)).slice(-1)[0] ?? 'done').trim()}`);
  } catch (err) {
    // 5. UNDO our own resolves — restore the exact tombstone shape found
    // (rolled_back_at back to NULL); never worse than before.
    let undone = 0;
    for (const name of resolvedNow) {
      try {
        psql(url, buildUndoResolveSql(name));
        undone++;
      } catch { /* best-effort — surfaced below */ }
    }
    result.status = 'FAILED';
    result.detail = `migrate failed after ${resolvedNow.length} resolve(s) — ${summarizeErr(err)}`
      + (undone === resolvedNow.length ? ' · resolves reverted (database as found)' : ` · UNDO INCOMPLETE (${resolvedNow.length - undone} rows still resolved)`);
    return result;
  }

  // 6. Delete the resolved fossil rows (deploy inserted fresh applied rows).
  const afterDeploy = readLedger(url);
  if (afterDeploy.error) { result.status = 'ERROR'; result.detail = `post-deploy ledger read failed — ${afterDeploy.error}`; return result; }
  const deletable = plan.tombstones
    .filter((t) => hasAppliedRow(afterDeploy.rows, t.name))
    .map((t) => t.name);
  for (const name of deletable) {
    try {
      const deleted = psql(url, `${buildDeleteFossilSql(name)} RETURNING migration_name`).trim() !== '';
      if (!deleted) result.detail = `${result.detail}fossil row for ${name} did not match the delete predicate · `;
    } catch (err) {
      result.status = 'PARTIAL';
      result.detail = `fossil cleanup failed for ${name} — ${summarizeErr(err)}`;
    }
  }
  for (const t of plan.tombstones) {
    if (!deletable.includes(t.name) && !result.detail.includes(t.name)) {
      result.status = 'PARTIAL';
      result.detail = `no applied row appeared for ${t.name} after deploy — fossil left in place · ${result.detail}`;
    }
  }

  // 7. Verify: canonical ledger.
  const finalLedger = readLedger(url);
  if (finalLedger.error) { result.status = 'ERROR'; result.detail = `final ledger read failed — ${finalLedger.error}`; return result; }
  const problems = evaluateFinalLedger(finalLedger.rows, folder, preExistingExtras);
  if (problems.length > 0 && result.status !== 'PARTIAL') result.status = 'PARTIAL';
  result.detail += problems.length
    ? ` · verification problems: ${problems.slice(0, 4).join('; ')}`
    : (result.detail ? ' · verified clean' : 'verified clean: ledger matches folder, no unfinished rows');
  if (result.status !== 'PARTIAL') result.status = 'RECONCILED';
  return result;
}

// ----------------------------------------------------------------------------
// Main
// ----------------------------------------------------------------------------
function main() {
  const all = discoverServices();
  const targets = filter.length ? all.filter((s) => filter.some((f) => s === f || s.endsWith(f))) : all;
  if (!targets.length) {
    console.error(`No matching services for: ${filter.join(', ')}`);
    console.error(`Known services:\n  ${all.join('\n  ')}`);
    process.exit(1);
  }

  process.env.__RECONCILE_TARGET_URL__ = ''; // per-service; set inside the loop
  const runTs = new Date().toISOString().replaceAll(/[:.]/g, '-');

  log(`Prisma ledger reconciliation — env: ${ENV} — ${targets.length} service(s) — mode: ${APPLY ? 'APPLY' : 'DRY-RUN (plan only)'}`);
  if (!APPLY) log('No writes will happen. Re-run with --apply to execute the plan.\n');

  const results = [];
  for (const rel of targets) {
    const r = reconcileService(rel, runTs);
    results.push(r);
    const icon = { RECONCILED: '✅', PLANNED: '📝', 'NOTHING-TO-DO': '✅', REFUSED: '🚫', PARTIAL: '🟠', FAILED: '🔴', ERROR: '💥', 'NO-DB': '⚪', UNREACHABLE: '💥', SKIPPED: '⚪' }[r.status] ?? '·';
    log(`${icon} ${r.status.padEnd(14)} ${rel}${r.detail ? ` — ${r.detail}` : ''}`);
    process.env.__RECONCILE_TARGET_URL__ = '';
  }

  const counts = {};
  for (const r of results) counts[r.status] = (counts[r.status] ?? 0) + 1;
  log(`\nSummary: ${results.length} checked · ${counts.RECONCILED ?? 0} reconciled · ${counts.PLANNED ?? 0} planned · ${counts['NOTHING-TO-DO'] ?? 0} nothing-to-do · ${counts.REFUSED ?? 0} refused · ${counts.FAILED ?? 0} failed · ${counts.PARTIAL ?? 0} partial · ${counts.ERROR ?? 0} error · ${counts['NO-DB'] ?? 0} no-db · ${counts.UNREACHABLE ?? 0} unreachable`);

  if (APPLY && (counts.FAILED || counts.PARTIAL || counts.ERROR)) {
    console.error('\nSome services did not reconcile cleanly — inspect the artifacts in .reconcile-prisma-ledger-out/ and re-run the plan for them.');
  }
  if (!APPLY && counts.PLANNED) {
    console.error(`\n${counts.PLANNED} service(s) have failed-deploy tombstones. Execute with: node scripts/reconcile-prisma-ledger.mjs --apply${ENV !== 'local' ? ` --env ${ENV}` : ''}${filter.length ? ` ${filter.join(' ')}` : ''}`);
  }

  const report = {
    env: ENV, mode: APPLY ? 'apply' : 'dry-run', generatedAt: new Date().toISOString(),
    summary: counts, services: results,
  };
  const outDir = path.join(OUT_DIR, ENV);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, `reconcile-${runTs}.json`), `${JSON.stringify(report, null, 2)}\n`);
  if (jsonOut) console.log(JSON.stringify(report, null, 2));

  // Advisory script: exit 0 unless something failed mid-apply.
  if (APPLY && (counts.FAILED || counts.ERROR)) process.exit(1);
  process.exit(0);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main();
}
