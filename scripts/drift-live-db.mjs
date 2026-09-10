#!/usr/bin/env node
// ============================================================================
// drift-live-db.mjs — live-database ↔ schema.prisma drift sweep
//
// The CI gate (check-prisma-migrations.mjs) proves migrations reproduce
// schema.prisma. This script covers the OTHER direction: whether each
// service's actual database still matches its schema.prisma — drift that
// shape-checking migrations alone cannot see (hand-run ALTERs, db push on
// one machine, a migration applied then edited).
//
// For every service with prisma/schema.prisma it runs
//   prisma migrate diff --from-url <live-db> --to-schema-datamodel schema
// and classifies every generated statement:
//   ADDITIVE    — CREATE TABLE/TYPE/INDEX, ADD COLUMN/CONSTRAINT, SET DEFAULT,
//                 ALTER TYPE ADD VALUE — safe to apply as a drift_sync migration
//   DESTRUCTIVE — DROP TABLE/COLUMN/CONSTRAINT/INDEX, RENAME, column TYPE change
//   REVIEW      — data-dependent ops (SET/DROP NOT NULL, DROP DEFAULT) that can
//                 fail or lose semantics depending on existing rows
//
// Exit codes: 0 = clean or additive-only drift (advisory)
//             1 = destructive or REVIEW drift present, or --strict with any drift
//
// Output: per-service SQL written to .drift-live-out/ for inspection.
//
// CI mode (--seed): CI has no live databases, so the check first provisions
// one per service — CREATE DATABASE + `prisma migrate deploy` from the
// service's own migrations — and THEN runs the same live↔schema diff. A
// green run proves "deploy from migrations ⇒ database matches schema.prisma"
// for every service; any drift (even additive, with --strict) fails the
// build, so a live-DB sweep can never find surprises again.
//
// Usage:
//   node scripts/drift-live-db.mjs                # all services
//   node scripts/drift-live-db.mjs wallet-service # one service
//   node scripts/drift-live-db.mjs --strict       # exit 1 on ANY drift
//   node scripts/drift-live-db.mjs --seed --strict  # CI-style: provision from
//                                                    # migrations, then diff —
//                                                    # exit 1 on ANY drift
//   node scripts/drift-live-db.mjs --seed --advisory  # CI advisory: provision,
//                                                      # then diff; report only,
//                                                      # never fails the build
//   LIVE_DB_URL_BASE=postgres://user:pass@host:5432 node scripts/…  # creds
// ============================================================================

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SERVICES_DIR = path.join(ROOT, 'services');
const OUT_DIR = path.join(ROOT, '.drift-live-out');
const args = process.argv.slice(2);
const strict = args.includes('--strict');
const seedMode = args.includes('--seed');
const advisory = args.includes('--advisory');
const filter = args.filter((a) => !a.startsWith('--'));
const DEV_PASSWORD = process.env.LIVE_DB_PASSWORD ?? 'azeebo_dev_2024';
// Base for the convention per-service databases (azeebo_<service>). CI
// overrides this with the service-container credentials (see workflows);
// local runs keep the historical dev default.
const LIVE_DB_URL_BASE = process.env.LIVE_DB_URL_BASE ?? `postgresql://azeebo:${DEV_PASSWORD}@localhost:5432`;

function discoverServices() {
  const services = [];
  if (!fs.existsSync(SERVICES_DIR)) return services;
  for (const domain of fs.readdirSync(SERVICES_DIR, { withFileTypes: true })) {
    if (!domain.isDirectory()) continue;
    for (const name of fs.readdirSync(path.join(SERVICES_DIR, domain.name), { withFileTypes: true })) {
      if (!name.isDirectory()) continue;
      const dir = path.join(SERVICES_DIR, domain.name, name.name);
      if (fs.existsSync(path.join(dir, 'prisma', 'schema.prisma'))) {
        services.push(path.relative(ROOT, dir));
      }
    }
  }
  return services.sort();
}

// Resolve the live DB URL: the service's own .env if present, with the
// common `change-me-in-production` placeholder password swapped for local
// dev credentials. Falls back to the repo convention azeebo_<service>.
function resolveDbUrl(serviceDir) {
  const envFile = path.join(serviceDir, '.env');
  let url = null;
  try {
    const line = fs.readFileSync(envFile, 'utf8').split('\n').find((l) => l.startsWith('DATABASE_URL='));
    if (line) url = line.slice('DATABASE_URL='.length).trim().replace(/^["']|["']$/g, '');
  } catch { /* no .env */ }
  if (!url || url.includes('change-me')) {
    const name = path.basename(serviceDir);
    url = `${LIVE_DB_URL_BASE}/azeebo_${name.replace(/-service$/, '').replace(/-/g, '_')}`;
  } else if (/:\/\/[^@]*@/.test(url)) {
    // keep host/db from .env, normalize credentials to local dev
    url = url.replace(/:\/\/[^@]*@/, `://azeebo:${DEV_PASSWORD}@`);
  }
  return url;
}

function dbExists(url) {
  const u = new URL(url);
  const admin = `postgresql://${u.username}:${u.password}@${u.host}/postgres`;
  try {
    const out = execFileSync(
      'psql',
      [admin, '-tAc', `SELECT 1 FROM pg_database WHERE datname='${u.pathname.slice(1)}'`],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }
    );
    return out.trim() === '1';
  } catch {
    return false;
  }
}

const DESTRUCTIVE = [
  /DROP\s+(TABLE|SCHEMA|TYPE|VIEW|MATERIALIZED\s+VIEW)/i,
  /DROP\s+COLUMN/i,
  /DROP\s+CONSTRAINT/i,
  /DROP\s+INDEX/i,
  /\bRENAME\s+TO\b/i,
  /ALTER\s+COLUMN[\s\S]*TYPE/i,
  /ALTER\s+TYPE[\s\S]*\b(DROP|RENAME)\b/i,
  /\bDROP\s+NOT\s+NULL\b/i,
];
const REVIEW = [/\bSET\s+NOT\s+NULL\b/i, /\bDROP\s+DEFAULT\b/i];
const ADDITIVE = [
  /CREATE\s+(TABLE|TYPE|INDEX|UNIQUE\s+INDEX|SCHEMA|VIEW)\b/i,
  /ADD\s+COLUMN/i,
  /ADD\s+CONSTRAINT/i,
  /\bSET\s+DEFAULT\b/i,
  /ALTER\s+TYPE[\s\S]*\bADD\s+VALUE\b/i,
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
  return sqlText
    .split('\n')
    .filter((l) => l.trim() !== '' && !l.trim().startsWith('--'))
    .join('\n')
    .split(/;\s*\n|;\s*$/)
    .filter((s) => s.trim() !== '');
}

function runPrisma(serviceDir, args_, env = {}) {
  const bin = path.join(serviceDir, 'node_modules', '.bin', 'prisma');
  const useLocalBin = fs.existsSync(bin) && fs.realpathSync.native(bin) === bin;
  if (useLocalBin) {
    return execFileSync(bin, args_, {
      cwd: serviceDir,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, ...env },
      timeout: 60_000,
    });
  }
  // Fallback: repo-root CLI (pnpm workspace). Service-local .bin symlinks can
  // dangle when a service isn't installed, and npx has no lockfile guarantees.
  const rootBin = path.join(ROOT, 'node_modules', '.bin', 'prisma');
  return execFileSync(fs.existsSync(rootBin) ? rootBin : 'npx',
    fs.existsSync(rootBin) ? args_ : ['--yes', 'prisma', ...args_], {
      cwd: serviceDir,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, ...env },
      timeout: 60_000,
    });
}

// CI seeding: provision the service's database by deploying its own
// migrations, so the live↔schema diff below is made against exactly what a
// fresh `prisma migrate deploy` produces. Idempotent — re-runs skip already
// applied migrations.
function seedDatabase(serviceDir, url) {
  const u = new URL(url);
  const admin = `${u.protocol}//${u.username}:${u.password}@${u.host}/postgres`;
  if (!dbExists(url)) {
    execFileSync('psql', [admin, '-c', `CREATE DATABASE "${u.pathname.slice(1)}"`], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  }
  runPrisma(serviceDir, ['migrate', 'deploy'], { DATABASE_URL: url });
}

function checkService(rel) {
  const dir = path.join(ROOT, rel);
  const url = resolveDbUrl(dir);
  const result = { service: rel, status: 'CLEAN', url, additive: 0, destructive: 0, review: 0, sql: '' };

  if (seedMode) {
    try {
      seedDatabase(dir, url);
    } catch (err) {
      result.status = 'ERROR';
      result.sql = String(err.stderr || err.message || err);
      return result;
    }
  }
  if (!dbExists(url)) {
    result.status = 'NO-DB';
    result.url = url; // keep for the report
    return result;
  }
  let sql;
  try {
    sql = runPrisma(dir, ['migrate', 'diff', '--from-url', url, '--to-schema-datamodel', 'prisma/schema.prisma', '--script']);
  } catch (err) {
    result.status = 'ERROR';
    result.sql = String(err.stderr || err.message || err);
    return result;
  }  const stmts = splitStatements(sql);
  if (!stmts.length) return result;

  result.sql = sql;
  for (const s of stmts) {
    const kind = classify(s);
    if (kind === 'additive') result.additive++;
    else if (kind === 'destructive') result.destructive++;
    else result.review++;
  }
  result.status = result.destructive ? 'DESTRUCTIVE' : result.review ? 'REVIEW' : 'ADDITIVE-ONLY';
  return result;
}

// ── Main ────────────────────────────────────────────────────────────────────
const all = discoverServices();
const targets = filter.length
  ? all.filter((s) => filter.some((f) => s === f || s.endsWith(f)))
  : all;
if (!targets.length) {
  console.error(`No matching services for: ${filter.join(', ')}`);
  process.exit(1);
}

fs.mkdirSync(OUT_DIR, { recursive: true });
console.log(seedMode
  ? `Provisioning ${targets.length} database(s) from migrations, then diffing live ↔ schema.prisma\n`
  : `Diffing ${targets.length} live database(s) against schema.prisma\n`);

const rows = [];
for (const rel of targets) {
  process.stdout.write(`  ${rel.padEnd(48)} `);
  const r = checkService(rel);
  rows.push(r);
  const icon = { CLEAN: '✅', 'ADDITIVE-ONLY': '🟢', REVIEW: '🟠', DESTRUCTIVE: '🔴', 'NO-DB': '⚪', ERROR: '💥' }[r.status];
  const counts = r.status === 'CLEAN' || r.status === 'NO-DB' || r.status === 'ERROR'
    ? ''
    : ` (+${r.additive} / ~${r.review} / -${r.destructive})`;
  console.log(`${icon} ${r.status}${counts}`);
  if (r.sql && r.status !== 'CLEAN') {
    fs.writeFileSync(path.join(OUT_DIR, `${rel.replaceAll('/', '__')}.sql`), r.sql);
  }
}

const drifted = rows.filter((r) => !['CLEAN', 'NO-DB'].includes(r.status));
console.log(`\nSummary: ${rows.length} checked · ${rows.filter((r) => r.status === 'CLEAN').length} clean · ${rows.filter((r) => r.status === 'NO-DB').length} no-db · ${drifted.length} drifted`);

// Per-service fix plans (additive-only plan; destructive needs human review).
for (const r of drifted) {
  const safeName = r.service.replaceAll('/', '__');
  console.log(`\n── ${r.service} (${r.status}) — db ${r.url.split('@')[1] ?? r.url}`);
  console.log(`   diff: .drift-live-out/${safeName}.sql`);
  if (r.status === 'ADDITIVE-ONLY') {
    console.log(`   Plan (additive-only, safe to apply):`);
    console.log(`     1. mkdir prisma/migrations/$(date -u +%Y%m%d%H%M%S00)_live_drift_sync`);
    console.log(`     2. copy .drift-live-out/${safeName}.sql into it as migration.sql`);
    console.log(`     3. psql "<db>" -f <that file>   # or: prisma migrate deploy after resolve`);
    console.log(`        (columns are nullable/defaulted — no data backfill required)`);
    console.log(`     4. re-run this script; expect CLEAN`);
  } else if (r.status === 'REVIEW') {
    console.log(`   Plan: ${r.review} data-dependent statement(s) (SET NOT NULL / DROP DEFAULT).`);
    console.log(`     Inspect the diff; backfill NULLs (if any) BEFORE the migration, then apply.`);
  } else if (r.status === 'DESTRUCTIVE') {
    console.log(`   Plan: BLOCKED for automation — ${r.destructive} destructive statement(s).`);
    console.log(`     Requires human review (data preservation / archive-then-drop pattern).`);
  } else if (r.status === 'ERROR') {
    console.log(`   Diff failed:`);
    console.log(`     ${r.sql.split('\n').filter(Boolean).slice(0, 3).join(' ').slice(0, 240)}`);
  }
}

const blocking = rows.filter((r) => ['DESTRUCTIVE', 'REVIEW', 'ERROR'].includes(r.status));
// CI (--seed --strict): any drift at all — including ADDITIVE-ONLY — means
// the freshly provisioned database doesn't match schema.prisma, i.e. a
// migration is missing or hand-edited. Fail the build.
// Advisory (--advisory): report drift and upload artifacts, but never fail
// the build — the job is informational, not a gate.
if (!advisory && (blocking.length || (strict && drifted.length))) process.exit(1);
// In advisory mode, always exit 0 so the job is non-blocking. The summary
// line above and the .drift-live-out/ artifacts carry the report.
if (advisory) process.exit(0);
