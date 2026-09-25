#!/usr/bin/env node
// ============================================================================
// archive-cleanup.mjs — retention cleanup for the `archive` schema
//
// Destructive migrations archive dropped tables into the dedicated `archive`
// schema (see docs/DEPRECATION_POLICY.md — "Data Retention — Archived
// Tables"). Archive tables carry their cutover date as a `_YYYYMMDD` name
// suffix when known (e.g. archive.users_20260908); tables without a parseable
// suffix use the directory-creation date recorded in the local state file.
//
// Policy (defaults; override with flags):
//   RETENTION_DAYS  — tables older than this AND signed off are dropped (default 90)
//   DRY-RUN         — default. Nothing is dropped without --apply.
//
// What it does with --apply:
//   For every archive table past its retention window whose sign-off entry
//   exists in scripts/archive-cleanup.state.json (approvedBy set):
//     1. print final row count (audit note)
//     2. BEGIN; LOCK TABLE ... ACCESS EXCLUSIVE; DROP TABLE; COMMIT
//   When the archive schema becomes empty AND --drop-schema is passed, the
//   schema itself is dropped (fresh replays recreate it).
//
// Without --apply it prints exactly what WOULD happen (plan mode) and exits 0
// as long as every expired table either has sign-off or you pass
// --require-signoff=false (deliberate opt-out for dev databases).
//
// Scheduling: run nightly in dev/staging (cron) or before DB maintenance
// windows; production drops must always be run manually after sign-off.
//
// Usage:
//   node scripts/archive-cleanup.mjs                       # plan (all local azeebo_* DBs)
//   node scripts/archive-cleanup.mjs --db azeebo_user      # single database
//   node scripts/archive-cleanup.mjs --apply               # execute signed-off drops
//   RETENTION_DAYS=30 node scripts/archive-cleanup.mjs     # shorter window
// ============================================================================

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// State/sign-off file lives next to the script by default; STATE_FILE_DIR
// lets the containerized nightly job persist it on a mounted volume.
const STATE_FILE = path.join(
  process.env.STATE_FILE_DIR ?? path.join(ROOT, 'scripts'),
  'archive-cleanup.state.json'
);
// DB endpoint defaults to local dev Postgres; the containerized job points
// LIVE_DB_HOST at the staging postgres container (DNS name on a shared network).
const DB_HOST = process.env.LIVE_DB_HOST ?? 'localhost';
const DB_PORT = process.env.LIVE_DB_PORT ?? '5432';
const DEV_PASSWORD = process.env.LIVE_DB_PASSWORD ?? 'azeebo_dev_2024';
const dbUrl = (db) => `postgresql://azeebo:${DEV_PASSWORD}@${DB_HOST}:${DB_PORT}/${db}`;

const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const DROP_SCHEMA = args.includes('--drop-schema');
const REQUIRE_SIGNOFF = !args.includes('--require-signoff=false');
const dbFilterIdx = args.indexOf('--db');
const DB_FILTER = dbFilterIdx >= 0 ? args[dbFilterIdx + 1] : null;
const RETENTION_DAYS = parseInt(process.env.RETENTION_DAYS ?? '90', 10);

// ---------------------------------------------------------------------------
// State file — sign-off log. Created on first run; editors append entries like:
// {
//   "azeebo_user.archive.users_legacy_auth_20260908": {
//     "approvedBy": "ops-oncall",
//     "approvedAt": "2026-12-01",
//     "ticket": "OPS-1234"
//   }
// }
// ---------------------------------------------------------------------------
function loadState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  } catch {
    return {};
  }
}

function logAudit(entry) {
  const state = loadState();
  state[entry.table] = { ...state[entry.table], ...entry.record, droppedAt: entry.record.droppedAt ?? new Date().toISOString().slice(0, 10) };
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2) + '\n');
}

// ---------------------------------------------------------------------------
// DB plumbing (psql)
// ---------------------------------------------------------------------------
function psql(url, sql, { quiet = false } = {}) {
  return execFileSync('psql', [url, '-tAc', sql], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', quiet ? 'ignore' : 'pipe'],
  }).trim();
}

function discoverArchiveDbs() {
  const admin = dbUrl('postgres');
  try {
    const out = psql(admin, "SELECT datname FROM pg_database WHERE datname LIKE 'azeebo_%' AND datname NOT LIKE 'azeebo_test%' ORDER BY 1");
    return out ? out.split('\n').filter(Boolean) : [];
  } catch {
    return [];
  }
}

function archiveTables(db) {
  const url = dbUrl(db);
  const out = psql(
    url,
    `SELECT c.relname, pg_get_expr(c.relpartbound, c.oid) IS NULL, c.reltuples::bigint
       FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'archive' AND c.relkind = 'r'
      ORDER BY c.relname`
  );
  return out
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [name, , estRows] = line.split('|');
      return { name, estRows: parseInt(estRows, 10) || 0 };
    });
}

function parseCutoverDate(name, schemaCreationFallback) {
  const m = name.match(/_(\d{8})$/);
  if (m) {
    const iso = `${m[1].slice(0, 4)}-${m[1].slice(4, 6)}-${m[1].slice(6, 8)}`;
    return new Date(iso);
  }
  return schemaCreationFallback;
}

function daysBetween(a, b) {
  return Math.floor((b - a) / 86_400_000);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
const state = loadState();
const dbs = DB_FILTER ? [DB_FILTER] : discoverArchiveDbs();
if (!dbs.length) {
  console.error('No azeebo_* databases found (is PostgreSQL reachable?)');
  process.exit(1);
}

console.log(
  `Archive retention cleanup — retention ${RETENTION_DAYS}d, mode: ${APPLY ? 'APPLY' : 'PLAN (dry-run)'}\n` +
    `Sign-off file: ${path.relative(ROOT, STATE_FILE)} (entries: ${Object.keys(state).length})\n`
);

const today = new Date();
let expired = 0;
let dropped = 0;
let blockedNoSignoff = 0;
const plan = [];

for (const db of dbs) {
  const url = dbUrl(db);
  let tables;
  try {
    tables = archiveTables(db);
  } catch {
    continue; // DB not reachable
  }
  if (!tables.length) continue;

  for (const t of tables) {
    // Exact archive age: query the schema/table creation timestamp recorded by
    // our migrations is not available in pg, so use the date suffix, else the
    // row in the state file, else treat as NOT expired (safe default).
    const key = `${db}.archive.${t.name}`;
    const stateEntry = state[key];
    let cutover = parseCutoverDate(t.name, null);
    if (!cutover && stateEntry?.archivedAt) cutover = new Date(stateEntry.archivedAt);
    if (!cutover) {
      plan.push({ db, table: t.name, key, action: 'KEEP', reason: 'no cutover date known (no _YYYYMMDD suffix, no archivedAt in state file)' });
      continue;
    }
    const age = daysBetween(cutover, today);
    if (age < RETENTION_DAYS) {
      plan.push({ db, table: t.name, key, action: 'KEEP', reason: `age ${age}d < ${RETENTION_DAYS}d retention` });
      continue;
    }
    expired += 1;
    const hasSignoff = stateEntry?.approvedBy;
    if (!hasSignoff && REQUIRE_SIGNOFF) {
      blockedNoSignoff += 1;
      plan.push({ db, table: t.name, key, action: 'HOLD', reason: `expired (${age}d) but no sign-off in ${path.basename(STATE_FILE)}` });
      continue;
    }
    plan.push({ db, table: t.name, key, action: 'DROP', reason: `age ${age}d >= ${RETENTION_DAYS}d${hasSignoff ? `, approved by ${stateEntry.approvedBy}` : ' (sign-off requirement disabled)'}` });
  }
}

// Print plan
const byDb = plan.reduce((acc, p) => {
  (acc[p.db] ??= []).push(p);
  return acc;
}, {});
for (const [db, entries] of Object.entries(byDb)) {
  console.log(`── ${db}`);
  for (const p of entries) {
    const icon = { DROP: APPLY ? '🗑️ ' : '→', KEEP: '·', HOLD: '⏸ ' }[p.action];
    console.log(`   ${icon} ${p.action.padEnd(5)} archive.${p.table} — ${p.reason}`);
  }
}

const dropCount = plan.filter((p) => p.action === 'DROP').length;
console.log(
  `\nSummary: ${plan.length} archive table(s) · ${dropCount} eligible for drop · ${blockedNoSignoff} held for sign-off · retention ${RETENTION_DAYS}d`
);

if (!APPLY) {
  console.log('\nDry run — nothing was dropped. Re-run with --apply to execute the DROP plan.');
  if (blockedNoSignoff > 0 && REQUIRE_SIGNOFF) {
    console.log(`To authorize a HOLD table, append to ${path.relative(ROOT, STATE_FILE)}:`);
    console.log('  { "<db>.archive.<table>": { "approvedBy": "<name>", "approvedAt": "<date>", "ticket": "<ref>" } }');
  }
  process.exit(0);
}

// Execute drops
for (const p of plan.filter((x) => x.action === 'DROP')) {
  const url = dbUrl(p.db);
  const rows = psql(url, `SELECT count(*) FROM archive."${p.table}"`);
  console.log(`\n🗑  ${p.key} — ${rows} row(s)`);
  psql(url, `BEGIN; LOCK TABLE archive."${p.table}" IN ACCESS EXCLUSIVE MODE; DROP TABLE archive."${p.table}"; COMMIT;`);
  logAudit({ table: p.key, record: { approvedBy: state[p.key]?.approvedBy ?? 'signoff-override (--require-signoff=false)', rowsBeforeDrop: rows } });
  dropped += 1;
}  // Optional schema drop when everything is gone
  if (DROP_SCHEMA && dropped > 0) {
    for (const db of Object.keys(byDb)) {
      const url = dbUrl(db);
    const remaining = psql(url, "SELECT count(*) FROM pg_tables WHERE schemaname = 'archive'");
    if (remaining === '0') {
      psql(url, 'DROP SCHEMA IF EXISTS archive;');
      console.log(`   dropped empty archive schema in ${db}`);
    }
  }
}

console.log(`\nDone: ${dropped} table(s) dropped. Audit log updated in ${path.relative(ROOT, STATE_FILE)}.`);
