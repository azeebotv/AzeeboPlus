#!/usr/bin/env node
// ============================================================================
// check-prisma-migrations.mjs — migrations ↔ schema.prisma drift gate
//
// For every service with prisma/schema.prisma, replays the service's
// prisma/migrations folder into a throwaway shadow database (exactly what
// `prisma migrate deploy` does on a fresh environment) and diffs the result
// against prisma/schema.prisma.
//
// Fails when:
//   DRIFTED   — replayed migrations produce a schema different from
//               schema.prisma (missing/hand-edited migrations)
//   BROKEN    — migrations cannot replay from empty (failed statement,
//               destructive op with no guard, dependency-order bug)
//   BASELINE  — `--update-baseline` was passed; writes the missing drift
//               migration and exits 0 (explicit, opt-in escape hatch)
//
// Exit codes: 0 = clean (or baseline updated), 1 = drift/broken found.
//
// Usage:
//   node scripts/check-prisma-migrations.mjs                     # check all
//   node scripts/check-prisma-migrations.mjs core/user-service   # check one
//   node scripts/check-prisma-migrations.mjs --update-baseline   # escape hatch
//   SHADOW_DB_URL=postgres://... node scripts/...                # override DB
//
// Requires a reachable PostgreSQL server (no database pre-created; the script
// creates and drops one throwaway database per service).
// ============================================================================

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SERVICES_DIR = path.join(ROOT, 'services');

const SHADOW_DB_URL = process.env.SHADOW_DB_URL
  ?? 'postgresql://azeebo:azeebo_dev_2024@localhost:5432/postgres';

const args = process.argv.slice(2);
const updateBaseline = args.includes('--update-baseline');
const positional = args.filter((a) => !a.startsWith('--'));

// ---------------------------------------------------------------------------
// Discovery: services are services/<domain>/<name> with prisma/schema.prisma
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Prisma plumbing — CLI resolved from the service's own node_modules so every
// service is checked with the prisma version it actually ships with.
// ---------------------------------------------------------------------------
function runPrisma(serviceDir, args_, extraEnv = {}) {
  const bin = path.join(serviceDir, 'node_modules', '.bin', 'prisma');
  if (fs.existsSync(bin)) {
    return execFileSync(bin, args_, {
      cwd: serviceDir,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, ...extraEnv },
    });
  }
  // Fallback: resolve through npx (slower path, dev machines without install)
  return execFileSync('npx', ['--yes', 'prisma', ...args_], {
    cwd: serviceDir,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, ...extraEnv },
  });
}

function psql(url, sql) {
  return execFileSync('psql', [url, '-tAc', sql], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

function dbExists(adminUrl, dbName) {
  try {
    const out = psql(adminUrl, `SELECT 1 FROM pg_database WHERE datname = '${dbName}'`);
    return out.trim() === '1';
  } catch {
    return false;
  }
}

function dropDatabase(adminUrl, dbName) {
  // terminate connections first so DROP doesn't fail on shadow leftovers
  try {
    psql(adminUrl, `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${dbName}' AND pid <> pg_backend_pid()`);
  } catch { /* best effort */ }
  try {
    execFileSync('psql', [adminUrl, '-c', `DROP DATABASE IF EXISTS "${dbName}"`], { stdio: 'ignore' });
  } catch { /* best effort */ }
}

function createDatabase(adminUrl, dbName) {
  execFileSync('psql', [adminUrl, '-c', `CREATE DATABASE "${dbName}"`], { stdio: ['ignore', 'pipe', 'pipe'] });
}

function shadowUrlFor(dbName) {
  const u = new URL(SHADOW_DB_URL);
  u.pathname = `/${dbName}`;
  return u.toString();
}

function nonDiffLines(sqlText) {
  return sqlText.split('\n').filter((l) => l.trim() !== '' && !l.trim().startsWith('--')).length;
}

// ---------------------------------------------------------------------------
// Per-service check
// ---------------------------------------------------------------------------
function checkService(rel, runId) {
  const dir = path.join(ROOT, rel);
  const result = { service: rel, status: 'CLEAN', detail: '', sql: '' };
  const shadowDb = `prisma_drift_shadow_${runId}`;
  const adminUrl = SHADOW_DB_URL;
  let created = false;

  try {
    // Fresh shadow DB per service: replay must work from EMPTY, like a
    // brand-new environment getting `prisma migrate deploy`.
    if (dbExists(adminUrl, shadowDb)) dropDatabase(adminUrl, shadowDb);
    createDatabase(adminUrl, shadowDb);
    created = true;

    const diffArgs = [
      'migrate', 'diff',
      '--from-migrations', 'prisma/migrations',
      '--shadow-database-url', shadowUrlFor(shadowDb),
      '--to-schema-datamodel', 'prisma/schema.prisma',
      '--script',
    ];
    // DATABASE_URL may be unset (content-service has no .env); the diff reads
    // the schema for validation, so provide a throwaway valid URL if missing.
    const env = process.env.DATABASE_URL || (dirHasEnv(dir) ? {} : { DATABASE_URL: shadowUrlFor(shadowDb) });

    let sql;
    try {
      sql = runPrisma(dir, diffArgs, env);
    } catch (err) {
      const stderr = String(err.stderr || err.message || '');
      if (/P3006|P3018|P3005|P3009|migration.*failed|does not exist/i.test(stderr)) {
        result.status = 'BROKEN';
        result.detail = summarize(stderr);
        return result;
      }
      throw err;
    }

    const meaningful = nonDiffLines(sql);
    if (meaningful > 0) {
      result.status = 'DRIFTED';
      result.detail = `${meaningful} diff statement(s) between replayed migrations and schema.prisma`;
      result.sql = sql;
      return result;
    }
    return result;
  } catch (err) {
    result.status = 'BROKEN';
    result.detail = summarize(String(err.stderr || err.message || err));
    return result;
  } finally {
    if (created) dropDatabase(adminUrl, shadowDb);
  }
}

function dirHasEnv(dir) {
  return fs.existsSync(path.join(dir, '.env'));
}

function summarize(text) {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const idx = lines.findIndex((l) => /error|P10\d\d|P30\d\d/i.test(l));
  if (idx === -1) return lines.slice(0, 3).join(' · ').slice(0, 240);
  // capture the error plus the few lines that follow (prisma puts the SQL
  // statement and db error right after the code)
  return lines.slice(idx, idx + 6).join(' · ').slice(0, 400);
}

// ---------------------------------------------------------------------------
// Baseline escape hatch: append a drift_sync migration capturing the current
// diff, exactly like the manual sweep that locked the repo in the first place.
// ---------------------------------------------------------------------------
function writeBaselineMigration(rel, sql) {
  const dir = path.join(ROOT, rel);
  const stamp = new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '');
  const name = `${stamp}0000_drift_sync`;
  const migDir = path.join(dir, 'prisma', 'migrations', name);
  fs.mkdirSync(migDir, { recursive: true });
  fs.writeFileSync(path.join(migDir, 'migration.sql'), sql);
  return path.join(rel, 'prisma', 'migrations', name);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
const runId = `${process.pid}`;
const all = discoverServices();
const filter = positional.length ? positional : [];
const targets = filter.length ? all.filter((s) => filter.some((f) => s === f || s.endsWith(f))) : all;
if (filter.length && targets.length === 0) {
  console.error(`No matching services for: ${filter.join(', ')}`);
  console.error(`Known services:\n  ${all.join('\n  ')}`);
  process.exit(1);
}

console.log(`Checking ${targets.length} service(s) against shadow DB host: ${new URL(SHADOW_DB_URL).host}\n`);

const results = [];
for (const rel of targets) {
  process.stdout.write(`  ${rel.padEnd(48)} `);
  const r = checkService(rel, runId);
  results.push(r);
  const icon = { CLEAN: '✅', DRIFTED: '🔴', BROKEN: '💥' }[r.status];
  console.log(`${icon} ${r.status}${r.detail ? ` — ${r.detail}` : ''}`);
  if (r.sql) {
    const artifact = path.join(ROOT, '.check-prisma-drift-out');
    fs.mkdirSync(artifact, { recursive: true });
    fs.writeFileSync(path.join(artifact, `${rel.replaceAll('/', '__')}.sql`), r.sql);
  }
}

const drifted = results.filter((r) => r.status === 'DRIFTED');
const broken = results.filter((r) => r.status === 'BROKEN');

if (updateBaseline && (drifted.length || broken.length)) {
  console.log('\n--update-baseline: writing drift_sync migrations…');
  for (const r of drifted) {
    const written = writeBaselineMigration(r.service, r.sql);
    console.log(`  ✍️  ${written}`);
  }
  for (const r of broken) {
    console.log(`  ⚠️  ${r.service}: BROKEN migrations cannot be baselined automatically — fix by hand`);
  }
  const remaining = broken.length;
  console.log(remaining ? `\n❌ ${remaining} broken migration set(s) still need manual fixes` : '\n✅ Baseline written; re-run the check to confirm CLEAN');
  process.exit(remaining ? 1 : 0);
}

console.log(`\nSummary: ${results.length} checked · ${results.length - drifted.length - broken.length} clean · ${drifted.length} drifted · ${broken.length} broken`);
if (drifted.length || broken.length) {
  console.log('\nDrifted services (schema.prisma does not match migrations):');
  for (const r of drifted) console.log(`  - ${r.service}: ${r.detail}`);
  console.log('\nBroken services (migrations cannot replay from empty):');
  for (const r of broken) console.log(`  - ${r.service}: ${r.detail}`);
  console.log('\nFix: author the missing migration (or re-run `node scripts/check-prisma-migrations.mjs --update-baseline` to auto-generate drift_sync migrations for DRIFTED services).');
  process.exit(1);
}
console.log('✅ All migrations replay cleanly and match schema.prisma');
