/**
 * prisma-migrations-core.mjs — testable core of the migrations ↔ schema gate.
 *
 * Extracted from check-prisma-migrations.mjs so unit tests can drive the real
 * logic against fixture trees (services/<domain>/<name> with prisma/schema.prisma),
 * following the prisma-find-first-core.mjs pattern. The CLI in
 * check-prisma-migrations.mjs is a thin wrapper that only supplies defaults
 * from process.env / argv.
 *
 * Pure helpers (driftVerdict, nonDiffLines, summarize, classifyBroken) are
 * exported so the classification logic can be unit-tested without a database.
 * The full checkService path shells out to psql + prisma and needs a reachable
 * PostgreSQL server — tests should skip those cases when no server answers.
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

// ---------------------------------------------------------------------------
// Discovery: services are services/<domain>/<name> with prisma/schema.prisma
// ---------------------------------------------------------------------------
export function discoverServices(root, servicesDir = path.join(root, 'services')) {
  const services = [];
  if (!fs.existsSync(servicesDir)) return services;
  for (const domain of fs.readdirSync(servicesDir, { withFileTypes: true })) {
    if (!domain.isDirectory()) continue;
    const domainDir = path.join(servicesDir, domain.name);
    for (const name of fs.readdirSync(domainDir, { withFileTypes: true })) {
      if (!name.isDirectory()) continue;
      const dir = path.join(domainDir, name.name);
      if (fs.existsSync(path.join(dir, 'prisma', 'schema.prisma'))) {
        services.push(path.relative(root, dir));
      }
    }
  }
  return services.sort();
}

// ---------------------------------------------------------------------------
// Prisma plumbing — CLI resolved from the service's own node_modules so every
// service is checked with the prisma version it actually ships with.
// ---------------------------------------------------------------------------
export function runPrisma(root, serviceDir, args_, extraEnv = {}, prismaBinaryDir = null) {
  const candidates = prismaBinaryDir
    ? [path.join(prismaBinaryDir, 'prisma'), path.join(root, 'node_modules', '.bin', 'prisma')]
    : [path.join(serviceDir, 'node_modules', '.bin', 'prisma'), path.join(root, 'node_modules', '.bin', 'prisma')];
  const bin = candidates.find((c) => fs.existsSync(c));
  if (bin) {
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

export function psql(url, sql) {
  return execFileSync('psql', [url, '-tAc', sql], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

export function dbExists(adminUrl, dbName) {
  try {
    const out = psql(adminUrl, `SELECT 1 FROM pg_database WHERE datname = '${dbName}'`);
    return out.trim() === '1';
  } catch {
    return false;
  }
}

export function dropDatabase(adminUrl, dbName) {
  // terminate connections first so DROP doesn't fail on shadow leftovers
  try {
    psql(adminUrl, `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${dbName}' AND pid <> pg_backend_pid()`);
  } catch { /* best effort */ }
  try {
    execFileSync('psql', [adminUrl, '-c', `DROP DATABASE IF EXISTS "${dbName}"`], { stdio: 'ignore' });
  } catch { /* best effort */ }
}

export function createDatabase(adminUrl, dbName) {
  execFileSync('psql', [adminUrl, '-c', `CREATE DATABASE "${dbName}"`], { stdio: ['ignore', 'pipe', 'pipe'] });
}

export function shadowUrlFor(shadowDbUrl, dbName) {
  const u = new URL(shadowDbUrl);
  u.pathname = `/${dbName}`;
  return u.toString();
}

// ---------------------------------------------------------------------------
// Diff verdict — the heart of the gate, kept pure for direct unit testing
// ---------------------------------------------------------------------------
export function nonDiffLines(sqlText) {
  return sqlText.split('\n').filter((l) => l.trim() !== '' && !l.trim().startsWith('--')).length;
}

/** CLEAN when the replay↔schema diff is empty, DRIFTED with a count + SQL otherwise. */
export function driftVerdict(sqlText) {
  const meaningful = nonDiffLines(sqlText);
  if (meaningful > 0) {
    return { status: 'DRIFTED', detail: `${meaningful} diff statement(s) between replayed migrations and schema.prisma`, sql: sqlText };
  }
  return { status: 'CLEAN', detail: '', sql: '' };
}

export function summarize(text) {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const idx = lines.findIndex((l) => /error|P10\d\d|P30\d\d/i.test(l));
  if (idx === -1) return lines.slice(0, 3).join(' · ').slice(0, 240);
  // capture the error plus the few lines that follow (prisma puts the SQL
  // statement and db error right after the code)
  return lines.slice(idx, idx + 6).join(' · ').slice(0, 400);
}

/** BROKEN when prisma's stderr names a migration-replay failure class. */
export function classifyBroken(stderr) {
  return /P3006|P3018|P3005|P3009|migration.*failed|does not exist/i.test(stderr);
}

export function dirHasEnv(dir) {
  return fs.existsSync(path.join(dir, '.env'));
}

// ---------------------------------------------------------------------------
// Per-service check
// ---------------------------------------------------------------------------
export function checkService(root, rel, runId, opts = {}) {
  const {
    shadowDbUrl,
    prismaBinaryDir = null,
    database = { dbExists, dropDatabase, createDatabase },
    runPrismaFn = runPrisma,
  } = opts;
  const dir = path.join(root, rel);
  const result = { service: rel, status: 'CLEAN', detail: '', sql: '' };
  const shadowDb = `prisma_drift_shadow_${runId}`;
  const adminUrl = shadowDbUrl;
  let created = false;

  try {
    // Fresh shadow DB per service: replay must work from EMPTY, like a
    // brand-new environment getting `prisma migrate deploy`.
    if (database.dbExists(adminUrl, shadowDb)) database.dropDatabase(adminUrl, shadowDb);
    database.createDatabase(adminUrl, shadowDb);
    created = true;

    const diffArgs = [
      'migrate', 'diff',
      '--from-migrations', 'prisma/migrations',
      '--shadow-database-url', shadowUrlFor(shadowDbUrl, shadowDb),
      '--to-schema-datamodel', 'prisma/schema.prisma',
      '--script',
    ];
    // DATABASE_URL may be unset (content-service has no .env); the diff reads
    // the schema for validation, so provide a throwaway valid URL if missing.
    const env = process.env.DATABASE_URL || (dirHasEnv(dir) ? {} : { DATABASE_URL: shadowUrlFor(shadowDbUrl, shadowDb) });

    let sql;
    try {
      sql = runPrismaFn(root, dir, diffArgs, env, prismaBinaryDir);
    } catch (err) {
      const stderr = String(err.stderr || err.message || '');
      if (classifyBroken(stderr)) {
        result.status = 'BROKEN';
        result.detail = summarize(stderr);
        return result;
      }
      throw err;
    }

    const verdict = driftVerdict(sql);
    result.status = verdict.status;
    result.detail = verdict.detail;
    result.sql = verdict.sql;
    return result;
  } catch (err) {
    result.status = 'BROKEN';
    result.detail = summarize(String(err.stderr || err.message || err));
    return result;
  } finally {
    if (created) database.dropDatabase(adminUrl, shadowDb);
  }
}

// ---------------------------------------------------------------------------
// Baseline escape hatch: append a drift_sync migration capturing the current
// diff, exactly like the manual sweep that locked the repo in the first place.
// ---------------------------------------------------------------------------
export function writeBaselineMigration(root, rel, sql) {
  const dir = path.join(root, rel);
  const stamp = new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '');
  const name = `${stamp}0000_drift_sync`;
  const migDir = path.join(dir, 'prisma', 'migrations', name);
  fs.mkdirSync(migDir, { recursive: true });
  fs.writeFileSync(path.join(migDir, 'migration.sql'), sql);
  return path.join(rel, 'prisma', 'migrations', name);
}

// ---------------------------------------------------------------------------
// Full gate over a (filtered) set of services. Returns structured results;
// the CLI renders + maps them to an exit code.
// ---------------------------------------------------------------------------
export function runMigrationsGate(root, {
  filter = [],
  updateBaseline = false,
  shadowDbUrl,
  prismaBinaryDir = null,
  servicesDir = null,
  log = console.log,
  database = { dbExists, dropDatabase, createDatabase },
  checkServiceFn = checkService,
} = {}) {
  const all = discoverServices(root, servicesDir ?? path.join(root, 'services'));
  const targets = filter.length ? all.filter((s) => filter.some((f) => s === f || s.endsWith(f))) : all;
  if (filter.length && targets.length === 0) {
    return { status: 'NO-MATCH', all, targets: [] };
  }

  const runId = `${process.pid}`;
  log(`Checking ${targets.length} service(s) against shadow DB host: ${new URL(shadowDbUrl).host}\n`);

  const results = [];
  for (const rel of targets) {
    process.stdout.write(`  ${rel.padEnd(48)} `);
    const r = checkServiceFn(root, rel, runId, { shadowDbUrl, prismaBinaryDir, database });
    results.push(r);
    const icon = { CLEAN: '✅', DRIFTED: '🔴', BROKEN: '💥' }[r.status];
    log(`${icon} ${r.status}${r.detail ? ` — ${r.detail}` : ''}`);
    if (r.sql) {
      const artifact = path.join(root, '.check-prisma-drift-out');
      fs.mkdirSync(artifact, { recursive: true });
      fs.writeFileSync(path.join(artifact, `${rel.replaceAll('/', '__')}.sql`), r.sql);
    }
  }

  const drifted = results.filter((r) => r.status === 'DRIFTED');
  const broken = results.filter((r) => r.status === 'BROKEN');

  if (updateBaseline && (drifted.length || broken.length)) {
    log('\n--update-baseline: writing drift_sync migrations…');
    for (const r of drifted) {
      const written = writeBaselineMigration(root, r.service, r.sql);
      log(`  ✍️  ${written}`);
    }
    for (const r of broken) {
      log(`  ⚠️  ${r.service}: BROKEN migrations cannot be baselined automatically — fix by hand`);
    }
    log(broken.length ? `\n❌ ${broken.length} broken migration set(s) still need manual fixes` : '\n✅ Baseline written; re-run the check to confirm CLEAN');
    return { status: 'DONE', all, targets, results, drifted, broken, exitCode: broken.length ? 1 : 0 };
  }

  log(`\nSummary: ${results.length} checked · ${results.length - drifted.length - broken.length} clean · ${drifted.length} drifted · ${broken.length} broken`);
  if (drifted.length || broken.length) {
    log('\nDrifted services (schema.prisma does not match migrations):');
    for (const r of drifted) log(`  - ${r.service}: ${r.detail}`);
    log('\nBroken services (migrations cannot replay from empty):');
    for (const r of broken) log(`  - ${r.service}: ${r.detail}`);
    log('\nFix: author the missing migration (or re-run `node scripts/check-prisma-migrations.mjs --update-baseline` to auto-generate drift_sync migrations for DRIFTED services).');
    return { status: 'DONE', all, targets, results, drifted, broken, exitCode: 1 };
  }
  log('✅ All migrations replay cleanly and match schema.prisma');
  return { status: 'DONE', all, targets, results, drifted, broken, exitCode: 0 };
}

/**
 * Machine-readable gate report for tooling (PR comment bot, summaries).
 * Written by the gate CLI after every run into the gate's artifact dir;
 * NO-MATCH outcomes produce no report.
 */
export function writeReport(outcome, root, reportPath = '.check-prisma-drift-out/report.json') {
  if (outcome.status === 'NO-MATCH') return null;
  const payload = {
    gate: 'prisma-migrations',
    generatedAt: new Date().toISOString(),
    total: outcome.results.length,
    clean: outcome.results.filter((r) => r.status === 'CLEAN').length,
    drifted: outcome.drifted.length,
    broken: outcome.broken.length,
    services: outcome.results.map((r) => ({
      service: r.service,
      status: r.status,
      detail: r.detail,
      ...(r.sql ? { diffStatements: nonDiffLines(r.sql) } : {}),
    })),
  };
  fs.mkdirSync(path.dirname(path.join(root, reportPath)), { recursive: true });
  fs.writeFileSync(path.join(root, reportPath), `${JSON.stringify(payload, null, 2)}\n`);
  return payload;
}
