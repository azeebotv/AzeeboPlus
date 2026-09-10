#!/usr/bin/env node
// ============================================================================
// check-deployed-schema.mjs — `prisma migrate deploy` + literal drift gate
//
// The CI gate in check-prisma-migrations.mjs replays migrations with
// `prisma migrate diff --from-migrations` — a SHAPE check of the migration
// folder. It cannot see drift introduced at the ledger level:
//
//   • a failed migration RESOLVED with `migrate resolve --applied` whose SQL
//     never actually ran (the deployed DB then misses those statements), or
//     marked `rolled-back` while its statements remain in the folder;
//   • migration files edited after they were applied to some environment.
//
// This gate runs the OTHER direction — it does exactly what a fresh deploy
// does, then diffs the deployed database against schema.prisma:
//
//   1. `prisma migrate deploy` into a throwaway database
//   2. `prisma migrate diff --from-url <deployed> --to-schema-datamodel schema`
//
// ANY diff statement = DRIFTED (exit 1). There is no classification and no
// advisory mode: a clean migration chain deploys into the exact schema shape,
// so the diff must be empty. This is the literal "schema lock".
//
// Exit codes: 0 = all services deploy cleanly and diff empty
//             1 = DRIFTED (deployed DB ≠ schema), BROKEN (deploy failed),
//                 or ERROR (diff could not run)
//
// Usage:
//   node scripts/check-deployed-schema.mjs                    # all services
//   node scripts/check-deployed-schema.mjs user-service       # one service
//   SHADOW_DB_URL=postgres://... node scripts/...             # override host
//
// Requires a reachable PostgreSQL server; creates and drops one throwaway
// database per service.
// ============================================================================

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SERVICES_DIR = path.join(ROOT, 'services');
const OUT_DIR = path.join(ROOT, '.check-prisma-deploy-diff-out');

const SHADOW_DB_URL = process.env.SHADOW_DB_URL
  ?? 'postgresql://azeebo:azeebo_dev_2024@localhost:5432/postgres';

const args = process.argv.slice(2);
const positional = args.filter((a) => !a.startsWith('--'));

// ---------------------------------------------------------------------------
// Discovery + prisma plumbing (identical conventions to check-prisma-migrations)
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

function runPrisma(serviceDir, args_, extraEnv = {}) {
  const bin = path.join(serviceDir, 'node_modules', '.bin', 'prisma');
  const exec = (cmd, argv) =>
    execFileSync(cmd, argv, {
      cwd: serviceDir,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, ...extraEnv },
    });
  return fs.existsSync(bin) ? exec(bin, args_) : exec('npx', ['--yes', 'prisma', ...args_]);
}

function psql(url, sql) {
  return execFileSync('psql', [url, '-tAc', sql], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

function dbExists(adminUrl, dbName) {
  try {
    return psql(adminUrl, `SELECT 1 FROM pg_database WHERE datname = '${dbName}'`).trim() === '1';
  } catch {
    return false;
  }
}

function dropDatabase(adminUrl, dbName) {
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

function summarize(text) {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const idx = lines.findIndex((l) => /error|P10\d\d|P30\d\d|does not exist|failed/i.test(l));
  if (idx === -1) return lines.slice(0, 3).join(' · ').slice(0, 240);
  return lines.slice(idx, idx + 6).join(' · ').slice(0, 400);
}

// ---------------------------------------------------------------------------
// Per-service check: deploy → diff
// ---------------------------------------------------------------------------
function checkService(rel, runId, index) {
  const dir = path.join(ROOT, rel);
  const result = { service: rel, status: 'CLEAN', detail: '', sql: '', deployLog: '' };
  const dbName = `deploy_drift_gate_${runId}_${index}`;
  const adminUrl = SHADOW_DB_URL;
  const deployUrl = shadowUrlFor(dbName);
  let created = false;

  try {
    if (dbExists(adminUrl, dbName)) dropDatabase(adminUrl, dbName);
    createDatabase(adminUrl, dbName);
    created = true;

    // 1. Deploy exactly like a fresh environment would.
    let deployOut;
    try {
      deployOut = runPrisma(dir, ['migrate', 'deploy'], { DATABASE_URL: deployUrl });
    } catch (err) {
      const stderr = String(err.stderr || err.message || '');
      result.status = 'BROKEN';
      result.detail = `migrate deploy failed — ${summarize(stderr)}`;
      result.deployLog = stderr;
      return result;
    }
    result.deployLog = deployOut;

    // 2. Diff the deployed database against schema.prisma — must be EMPTY.
    const diffArgs = [
      'migrate', 'diff',
      '--from-url', deployUrl,
      '--to-schema-datamodel', 'prisma/schema.prisma',
      '--script',
    ];
    // Services without .env (e.g. content-service) need a syntactically valid
    // DATABASE_URL for schema validation; the diff itself uses --from-url.
    const env = process.env.DATABASE_URL || (fs.existsSync(path.join(dir, '.env')) ? {} : { DATABASE_URL: deployUrl });

    let sql;
    try {
      sql = runPrisma(dir, diffArgs, env);
    } catch (err) {
      result.status = 'ERROR';
      result.detail = `migrate diff failed — ${summarize(String(err.stderr || err.message || ''))}`;
      return result;
    }

    const meaningful = nonDiffLines(sql);
    if (meaningful > 0) {
      result.status = 'DRIFTED';
      result.detail = `${meaningful} diff statement(s): deployed (migrate deploy) ≠ schema.prisma`;
      result.sql = sql;
    }
    return result;
  } catch (err) {
    result.status = 'ERROR';
    result.detail = summarize(String(err.stderr || err.message || err));
    return result;
  } finally {
    if (created) dropDatabase(adminUrl, dbName);
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
const runId = `${process.pid}`;
const all = discoverServices();
const targets = positional.length
  ? all.filter((s) => positional.some((f) => s === f || s.endsWith(f)))
  : all;
if (positional.length && targets.length === 0) {
  console.error(`No matching services for: ${positional.join(', ')}`);
  console.error(`Known services:\n  ${all.join('\n  ')}`);
  process.exit(1);
}

console.log(`Deploy-then-diff for ${targets.length} service(s) against shadow host: ${new URL(SHADOW_DB_URL).host}\n`);

const results = [];
let index = 0;
for (const rel of targets) {
  process.stdout.write(`  ${rel.padEnd(48)} `);
  const r = checkService(rel, runId, index++);
  results.push(r);
  const icon = { CLEAN: '✅', DRIFTED: '🔴', BROKEN: '💥', ERROR: '💥' }[r.status];
  console.log(`${icon} ${r.status}${r.detail ? ` — ${r.detail}` : ''}`);
  if (r.sql || r.status === 'BROKEN') {
    fs.mkdirSync(OUT_DIR, { recursive: true });
    if (r.sql) fs.writeFileSync(path.join(OUT_DIR, `${rel.replaceAll('/', '__')}.sql`), r.sql);
    if (r.deployLog && r.status === 'BROKEN') fs.writeFileSync(path.join(OUT_DIR, `${rel.replaceAll('/', '__')}.deploy.log`), r.deployLog);
  }
}

const drifted = results.filter((r) => r.status === 'DRIFTED');
const broken = results.filter((r) => r.status === 'BROKEN');
const errored = results.filter((r) => r.status === 'ERROR');

console.log(`\nSummary: ${results.length} checked · ${results.length - drifted.length - broken.length - errored.length} clean · ${drifted.length} drifted · ${broken.length} broken · ${errored.length} error`);

if (drifted.length || broken.length || errored.length) {
  for (const r of drifted) console.log(`  - DRIFTED ${r.service}: ${r.detail}`);
  for (const r of broken) console.log(`  - BROKEN  ${r.service}: ${r.detail}`);
  for (const r of errored) console.log(`  - ERROR   ${r.service}: ${r.detail}`);
  console.log('\nSchema lock violated: `prisma migrate deploy` does not reproduce schema.prisma.');
  console.log('Fix: author the missing migration (never `migrate resolve` an unapplied one). Diff artifacts in .check-prisma-deploy-diff-out/');
  process.exit(1);
}
console.log('✅ Every service deploys into exactly schema.prisma — schema lock holds');
