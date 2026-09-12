#!/usr/bin/env node
// ============================================================================
// check-live-schema-lock.mjs — schema-lock REPORT against live service DBs
//
// The PR gate (check-deployed-schema.mjs) proves `prisma migrate deploy`
// reproduces schema.prisma in a throwaway DB. This script asks the harder
// nightly question: does each service's REAL database still satisfy the
// schema lock right now? It runs against every live service database,
// environment by environment, and REPORTS — it never fails a PR and never
// writes to the database (SELECTs + read-only `prisma migrate diff` only).
//
// Per service, two read-only probes:
//
//   1. LEDGER — read `_prisma_migrations` and compare against the migration
//      folder, with the same strictness as the deploy gate:
//        • unfinished migrations (finished_at IS NULL) → deploy crashed or
//          is running right now → BLOCKED-LEDGER (diff skipped as meaningless)
//        • rolled-back ledger rows whose statements are still in the folder
//          (the fossil-row pattern) → LEDGER-MISMATCH
//        • folder migrations missing from the ledger, or ledger rows not in
//          the folder → LEDGER-MISMATCH
//
//   2. DIFF — `prisma migrate diff --from-url <live> --to-schema-datamodel
//      schema.prisma --script`. Any statement is real drift, classified with
//      the same regexes as scripts/drift-live-db.mjs:
//        DRIFT-DESTRUCTIVE / DRIFT-REVIEW / DRIFT-ADDITIVE-ONLY
//
// This is the nightly complement of both CI gates: they hold on paper
// (migration folder ↔ schema), this one reports whether the world still
// matches the paper (hand-run ALTERs, db push, drift from resolved
// migrations — exactly the reality-service/search-service fossil pattern).
//
// Exit codes: 0 = report produced (advisory, always)
//             1 = only with --strict: any LEDGER-MISMATCH, DRIFT-DESTRUCTIVE,
//                 DRIFT-REVIEW, BLOCKED-LEDGER, UNREACHABLE or ERROR present
//
// Usage:
//   node scripts/check-live-schema-lock.mjs                        # local dev DBs
//   node scripts/check-live-schema-lock.mjs --env staging          # label + artifact dir
//   node scripts/check-live-schema-lock.mjs wallet-service         # one service
//   node scripts/check-live-schema-lock.mjs --strict               # exit 1 on real drift
//   node scripts/check-live-schema-lock.mjs --json                 # machine report (human log → stderr)
//
// Env:
//   LIVE_DB_URL_BASE        base URL, e.g. postgresql://user:pass@host:5432
//                           (default: local dev azeebo:azeebo_dev_2024@localhost:5432)
//   LIVE_DB_NAME_OVERRIDES  optional JSON { "<service>": "<dbname>" } for
//                           environments whose naming departs from the
//                           azeebo_<service> convention
// ============================================================================

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SERVICES_DIR = path.join(ROOT, 'services');
const OUT_DIR = path.join(ROOT, '.check-live-schema-lock-out');

const args = process.argv.slice(2);
const strict = args.includes('--strict');
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

// ----------------------------------------------------------------------------
// Discovery + plumbing (conventions shared with check-deployed-schema.mjs)
// ----------------------------------------------------------------------------
function discoverServices() {
  const services = [];
  if (!fs.existsSync(SERVICES_DIR)) return services;
  for (const domain of fs.readdirSync(SERVICES_DIR, { withFileTypes: true })) {
    if (!domain.isDirectory()) continue;
    const domainDir = path.join(SERVICES_DIR, domain.name);
    for (const name of fs.readdirSync(domainDir, { withFileTypes: true })) {
      if (!name.isDirectory()) continue;
      const dir = path.join(domainDir, name.name);
      if (fs.existsSync(path.join(dir, 'prisma', 'schema.prisma'))) {
        services.push(path.relative(ROOT, dir));
      }
    }
  }
  return services.sort();
}

function runPrisma(serviceDir, argv, extraEnv = {}) {
  const bin = path.join(serviceDir, 'node_modules', '.bin', 'prisma');
  const rootBin = path.join(ROOT, 'node_modules', '.bin', 'prisma');
  const useBin = fs.existsSync(bin) ? bin : (fs.existsSync(rootBin) ? rootBin : null);
  return execFileSync(useBin ?? 'npx', useBin ? argv : ['--yes', 'prisma', ...argv], {
    cwd: serviceDir,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, ...extraEnv },
    timeout: 120_000,
  });
}

function psql(url, sql) {
  return execFileSync('psql', [url, '-tAc', sql], {
    encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 30_000,
  });
}

// Server-level probes need an explicit connect database — LIVE_DB_URL_BASE
// conventionally has none, and psql would otherwise fall back to the OS user.
const ADMIN_URL = (() => {
  const u = new URL(LIVE_DB_URL_BASE);
  if (!u.pathname || u.pathname === '/') u.pathname = '/postgres';
  return u.toString();
})();

// Live DB name: repo convention azeebo_<service> (same as drift-live-db.mjs),
// overridable per environment via LIVE_DB_NAME_OVERRIDES. The base URL is
// authoritative — service .env files are NEVER read here (they carry dev
// placeholders; the environment's credentials come from LIVE_DB_URL_BASE).
function liveUrlFor(rel) {
  const fallback = `azeebo_${path.basename(rel).replace(/-service$/, '').replace(/-/g, '_')}`;
  const dbName = NAME_OVERRIDES[rel] ?? NAME_OVERRIDES[path.basename(rel)] ?? fallback;
  const u = new URL(LIVE_DB_URL_BASE);
  u.pathname = `/${dbName}`;
  return { url: u.toString(), dbName };
}

function folderMigrations(dir) {
  const migDir = path.join(dir, 'prisma', 'migrations');
  try {
    return fs.readdirSync(migDir, { withFileTypes: true })
      .filter((e) => e.isDirectory()).map((e) => e.name).sort();
  } catch { return []; }
}

// Ledger rows: migration_name|rolledBack|applied_steps_count|unfinished.
// The rolled-back flag is `rolled_back_at IS NOT NULL` (Prisma has no boolean
// column), and table existence is probed explicitly so a query error can
// never be mistaken for "no ledger".
function readLedger(url) {
  let present;
  try {
    present = psql(url, `SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_name='_prisma_migrations'`).trim() !== '0';
  } catch (err) {
    const msg = String(err.stderr || err.message || err);
    return {
      present: false, rows: [],
      connectionError: /connect|ECONNREFUSED|timeout|could not translate|no route/i.test(msg) ? msg.slice(0, 200) : null,
      raw: msg.slice(0, 400),
    };
  }
  if (!present) return { present: false, rows: [] };
  try {
    const SQL = `SELECT migration_name||'|'||(rolled_back_at IS NOT NULL)::text||'|'||COALESCE(applied_steps_count::text,'0')||'|'||(finished_at IS NULL)::text||'|'||COALESCE(logs,'') FROM _prisma_migrations ORDER BY migration_name`;
    return { present: true, rows: psql(url, SQL).split('\n').filter(Boolean).map((l) => {
      const [migration_name, rolled, steps, unfinished, logs] = l.split('|');
      return { name: migration_name, rolledBack: rolled === 'true', steps: Number(steps), unfinished: unfinished === 'true', failed: /failed to apply/i.test(logs ?? '') };
    }) };
  } catch (err) {
    return { present: true, rows: [], raw: String(err.stderr || err.message || err).slice(0, 400) };
  }
}

// Drift classification — same regexes as scripts/drift-live-db.mjs.
const DESTRUCTIVE = [
  /DROP\s+(TABLE|SCHEMA|TYPE|VIEW|MATERIALIZED\s+VIEW)/i, /DROP\s+COLUMN/i,
  /DROP\s+CONSTRAINT/i, /DROP\s+INDEX/i, /\bRENAME\s+TO\b/i,
  /ALTER\s+COLUMN[\s\S]*TYPE/i, /ALTER\s+TYPE[\s\S]*\b(DROP|RENAME)\b/i, /\bDROP\s+NOT\s+NULL\b/i,
];
const REVIEW = [/\bSET\s+NOT\s+NULL\b/i, /\bDROP\s+DEFAULT\b/i];
const ADDITIVE = [
  /CREATE\s+(TABLE|TYPE|INDEX|UNIQUE\s+INDEX|SCHEMA|VIEW)\b/i, /ADD\s+COLUMN/i,
  /ADD\s+CONSTRAINT/i, /\bSET\s+DEFAULT\b/i, /ALTER\s+TYPE[\s\S]*\bADD\s+VALUE\b/i,
];
function classify(stmt) {
  const s = stmt.trim();
  if (!s) return null;
  if (DESTRUCTIVE.some((re) => re.test(s))) return 'destructive';
  if (REVIEW.some((re) => re.test(s))) return 'review';
  if (ADDITIVE.some((re) => re.test(s))) return 'additive';
  return 'review'; // unknown → human eyes
}
function splitStatements(sqlText) {
  return sqlText.split('\n').filter((l) => l.trim() !== '' && !l.trim().startsWith('--')).join('\n')
    .split(/;\s*\n|;\s*$/).filter((s) => s.trim() !== '');
}
function summarizeErr(err) {
  return String(err.stderr || err.message || err).split('\n').filter(Boolean).slice(0, 3).join(' · ').slice(0, 300);
}

// ----------------------------------------------------------------------------
// Per-service check (read-only)
// ----------------------------------------------------------------------------
function checkService(rel) {
  const dir = path.join(ROOT, rel);
  const { url, dbName } = liveUrlFor(rel);
  const result = {
    service: rel, status: 'CLEAN', database: dbName, sql: '',
    ledger: { present: false, deployed: 0, rolledBack: 0, unfinished: 0, missingInLedger: [], extraInLedger: [] },
    diff: { statements: 0, additive: 0, review: 0, destructive: 0 },
    detail: '',
  };

  // 0. Reachability
  let reachable;
  try { reachable = psql(ADMIN_URL, 'SELECT 1').trim() === '1'; }
  catch { reachable = false; }
  if (!reachable) {
    result.status = 'UNREACHABLE';
    result.detail = `DB host ${new URL(LIVE_DB_URL_BASE).host} unreachable — environment not verified`;
    return result;
  }

  // 1. Ledger probes
  let dbExists = false;
  try { dbExists = psql(ADMIN_URL, `SELECT 1 FROM pg_database WHERE datname='${dbName}'`).trim() === '1'; }
  catch (err) { result.status = 'UNREACHABLE'; result.detail = summarizeErr(err); return result; }
  if (!dbExists) {
    result.status = 'NO-DB';
    result.detail = `no database ${dbName} on this environment (service not deployed here?)`;
    return result;
  }

  const ledger = readLedger(url);
  if (ledger.connectionError) {
    result.status = 'UNREACHABLE';
    result.detail = ledger.connectionError;
    return result;
  }
  if (ledger.raw) {
    result.status = 'ERROR';
    result.detail = `ledger query failed — ${ledger.raw}`;
    return result;
  }
  result.ledger.present = ledger.present;
  if (ledger.present) {
    result.ledger.rolledBack = ledger.rows.filter((r) => r.rolledBack).length;
    result.ledger.unfinished = ledger.rows.filter((r) => r.unfinished).length;
    if (result.ledger.unfinished > 0) {
      result.status = 'BLOCKED-LEDGER';
      const failedRows = ledger.rows.filter((r) => r.unfinished && r.failed);
      const running = result.ledger.unfinished - failedRows.length;
      const parts = [];
      if (failedRows.length) parts.push(`${failedRows.length} failed-deploy tombstone(s) (${failedRows.slice(0, 2).map((r) => r.name).join(', ')}${failedRows.length > 2 ? '…' : ''})`);
      if (running) parts.push(`${running} unfinished migration(s) — deploy crashed or running`);
      result.detail = `${parts.join(' · ')}; diff skipped (deploy is not reproducible)`;
      return result;
    }
    const deployedNames = ledger.rows.filter((r) => !r.rolledBack).map((r) => r.name);
    result.ledger.deployed = deployedNames.length;
    const folder = folderMigrations(dir);
    result.ledger.missingInLedger = folder.filter((n) => !deployedNames.includes(n));
    result.ledger.extraInLedger = deployedNames.filter((n) => !folder.includes(n));
    if (result.ledger.rolledBack > 0 || result.ledger.missingInLedger.length || result.ledger.extraInLedger.length) {
      result.status = 'LEDGER-MISMATCH';
      const parts = [];
      if (result.ledger.rolledBack) parts.push(`${result.ledger.rolledBack} rolled-back ledger row(s)`);
      if (result.ledger.missingInLedger.length) parts.push(`in folder but not applied: ${result.ledger.missingInLedger.slice(0, 3).join(', ')}${result.ledger.missingInLedger.length > 3 ? '…' : ''}`);
      if (result.ledger.extraInLedger.length) parts.push(`applied but not in folder: ${result.ledger.extraInLedger.slice(0, 3).join(', ')}${result.ledger.extraInLedger.length > 3 ? '…' : ''}`);
      result.detail = parts.join(' · ');
      // fall through: diff still runs for extra signal
    }
  } else if (result.status === 'CLEAN') {
    // No ledger table: only acceptable for a genuinely empty DB; any real
    // tables without a ledger is exactly the resolved-migration fossil shape.
    try {
      const tables = psql(url, `SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'`).trim();
      if (Number(tables) > 0) {
        result.status = 'LEDGER-MISMATCH';
        result.detail = `${tables} table(s) present but no _prisma_migrations ledger`;
      }
    } catch (err) { result.status = 'UNREACHABLE'; result.detail = summarizeErr(err); return result; }
  }

  // 2. Live ↔ schema diff (read-only)
  const diffArgs = ['migrate', 'diff', '--from-url', url, '--to-schema-datamodel', 'prisma/schema.prisma', '--script'];
  const env = process.env.DATABASE_URL || (fs.existsSync(path.join(dir, '.env')) ? {} : { DATABASE_URL: url });
  let sql;
  try { sql = runPrisma(dir, diffArgs, env); }
  catch (err) { result.status = 'ERROR'; result.detail = `migrate diff failed — ${summarizeErr(err)}`; return result; }

  const stmts = splitStatements(sql);
  result.sql = stmts.length ? sql : '';
  result.diff.statements = stmts.length;
  for (const s of stmts) {
    const kind = classify(s);
    if (kind === 'additive') result.diff.additive++;
    else if (kind === 'destructive') result.diff.destructive++;
    else result.diff.review++;
  }
  if (stmts.length > 0 && result.status === 'CLEAN') {
    result.status = result.diff.destructive ? 'DRIFT-DESTRUCTIVE'
      : result.diff.review ? 'DRIFT-REVIEW' : 'DRIFT-ADDITIVE-ONLY';
    result.detail = `${stmts.length} drift statement(s) (+${result.diff.additive} / ~${result.diff.review} / -${result.diff.destructive}) — live DB ≠ schema.prisma`;
  } else if (stmts.length > 0) {
    result.detail = `${result.detail} · diff: ${stmts.length} statement(s) (+${result.diff.additive} / ~${result.diff.review} / -${result.diff.destructive})`;
  }
  if (stmts.length > 0) {
    const safeName = rel.replaceAll('/', '__');
    result.detail = `${result.detail} · diff artifact: .check-live-schema-lock-out/${ENV}/${safeName}.sql`;
  }
  return result;
}

// ----------------------------------------------------------------------------
// Main
// ----------------------------------------------------------------------------
const all = discoverServices();
const targets = filter.length
  ? all.filter((s) => filter.some((f) => s === f || s.endsWith(f)))
  : all;
if (!targets.length) {
  console.error(`No matching services for: ${filter.join(', ')}`);
  console.error(`Known services:\n  ${all.join('\n  ')}`);
  process.exit(1);
}

const envDir = path.join(OUT_DIR, ENV);
fs.mkdirSync(envDir, { recursive: true });

log(`Schema-lock report — env: ${ENV} — ${targets.length} service(s) — host: ${new URL(LIVE_DB_URL_BASE).host}`);
log(`READ-ONLY: this report never writes to the live databases.\n`);

const results = [];
for (const rel of targets) {
  process.stdout.write(jsonOut ? '' : `  ${rel.padEnd(48)} `);
  const r = checkService(rel);
  results.push(r);
  const icon = {
    CLEAN: '✅', 'DRIFT-ADDITIVE-ONLY': '🟢', 'DRIFT-REVIEW': '🟠', 'DRIFT-DESTRUCTIVE': '🔴',
    'LEDGER-MISMATCH': '🔴', 'BLOCKED-LEDGER': '🔴', 'NO-DB': '⚪', UNREACHABLE: '💥', ERROR: '💥',
  }[r.status];
  log(`${icon} ${r.status}${r.detail ? ` — ${r.detail}` : ''}`);
  if (r.sql) fs.writeFileSync(path.join(envDir, `${safeName(r.service)}.sql`), r.sql);
}

function safeName(rel) { return rel.replaceAll('/', '__'); }

const counts = {};
for (const r of results) counts[r.status] = (counts[r.status] ?? 0) + 1;
const blocking = results.filter((r) => ['LEDGER-MISMATCH', 'BLOCKED-LEDGER', 'DRIFT-DESTRUCTIVE', 'DRIFT-REVIEW', 'ERROR', 'UNREACHABLE'].includes(r.status));

log(`\nSummary (env: ${ENV}): ${results.length} checked · ${counts.CLEAN ?? 0} clean · ${counts['NO-DB'] ?? 0} no-db · ${counts['DRIFT-ADDITIVE-ONLY'] ?? 0} additive-only · ${counts['DRIFT-REVIEW'] ?? 0} review · ${counts['DRIFT-DESTRUCTIVE'] ?? 0} destructive · ${counts['LEDGER-MISMATCH'] ?? 0} ledger-mismatch · ${counts['BLOCKED-LEDGER'] ?? 0} blocked-ledger · ${counts.ERROR ?? 0} error · ${counts.UNREACHABLE ?? 0} unreachable`);

for (const r of blocking) {
  console.error(`  - ${r.status} ${r.service}: ${r.detail}`);
}
if (blocking.length) {
  console.error(`\nLive databases do not satisfy the schema lock. Diffs: .check-live-schema-lock-out/${ENV}/`);
  console.error('Fix: author + apply a proper migration (never hand-ALTER production; never `migrate resolve` an unapplied one).');
}

// Machine-readable report for the nightly workflow.
const report = {
  env: ENV,
  generatedAt: new Date().toISOString(),
  host: new URL(LIVE_DB_URL_BASE).host,
  summary: {
    total: results.length,
    clean: counts.CLEAN ?? 0,
    noDb: counts['NO-DB'] ?? 0,
    additiveOnly: counts['DRIFT-ADDITIVE-ONLY'] ?? 0,
    review: counts['DRIFT-REVIEW'] ?? 0,
    destructive: counts['DRIFT-DESTRUCTIVE'] ?? 0,
    ledgerMismatch: counts['LEDGER-MISMATCH'] ?? 0,
    blockedLedger: counts['BLOCKED-LEDGER'] ?? 0,
    error: counts.ERROR ?? 0,
    unreachable: counts.UNREACHABLE ?? 0,
  },
  services: results,
};
fs.writeFileSync(path.join(envDir, `report-${ENV}.json`), `${JSON.stringify(report, null, 2)}\n`);

if (jsonOut) console.log(JSON.stringify(report, null, 2));
if (strict && blocking.length) process.exit(1);
process.exit(0);
