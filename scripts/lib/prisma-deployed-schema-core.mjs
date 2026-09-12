/**
 * prisma-deployed-schema-core.mjs — testable core of the deploy-then-diff gate.
 *
 * Extracted from check-deployed-schema.mjs so unit tests can drive the real
 * logic against fixture trees, following the prisma-find-first-core.mjs
 * pattern. The CLI is a thin wrapper that only supplies defaults from
 * process.env / argv.
 *
 * Per service the gate does exactly what a fresh environment does:
 *   1. `prisma migrate deploy` into a throwaway database
 *   2. `prisma migrate diff --from-url <deployed> --to-schema-datamodel schema`
 * Any diff statement = DRIFTED. This is the literal "schema lock".
 *
 * Pure helpers (driftVerdict, nonDiffLines, summarize) are exported so the
 * classification logic can be unit-tested without a database. checkDeployed
 * and runDeployedSchemaGate shell out to psql + prisma and need a reachable
 * PostgreSQL server — tests should skip those cases when no server answers,
 * or inject the `database` helpers for offline runs.
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

// ---------------------------------------------------------------------------
// Discovery + prisma plumbing (identical conventions to prisma-migrations-core)
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
    return psql(adminUrl, `SELECT 1 FROM pg_database WHERE datname = '${dbName}'`).trim() === '1';
  } catch {
    return false;
  }
}

export function dropDatabase(adminUrl, dbName) {
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

/** CLEAN when the deployed↔schema diff is empty, DRIFTED with a count + SQL otherwise. */
export function driftVerdict(sqlText) {
  const meaningful = nonDiffLines(sqlText);
  if (meaningful > 0) {
    return { status: 'DRIFTED', detail: `${meaningful} diff statement(s): deployed (migrate deploy) ≠ schema.prisma`, sql: sqlText };
  }
  return { status: 'CLEAN', detail: '', sql: '' };
}

export function summarize(text) {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const idx = lines.findIndex((l) => /error|P10\d\d|P30\d\d|does not exist|failed/i.test(l));
  if (idx === -1) return lines.slice(0, 3).join(' · ').slice(0, 240);
  return lines.slice(idx, idx + 6).join(' · ').slice(0, 400);
}

export function dirHasEnv(dir) {
  return fs.existsSync(path.join(dir, '.env'));
}

/** DATABASE_URL resolution: shell env wins, then the service .env, else inject a throwaway URL. */
export function resolveDiffEnv(dir, fallbackUrl) {
  if (process.env.DATABASE_URL) return {};
  return dirHasEnv(dir) ? {} : { DATABASE_URL: fallbackUrl };
}

// ---------------------------------------------------------------------------
// Per-service check: deploy → diff
// ---------------------------------------------------------------------------
export function checkDeployed(root, rel, runId, index, opts = {}) {
  const {
    shadowDbUrl,
    prismaBinaryDir = null,
    database = { dbExists, dropDatabase, createDatabase },
    runPrismaFn = runPrisma,
  } = opts;
  const dir = path.join(root, rel);
  const result = { service: rel, status: 'CLEAN', detail: '', sql: '', deployLog: '' };
  const dbName = `deploy_drift_gate_${runId}_${index}`;
  const adminUrl = shadowDbUrl;
  const deployUrl = shadowUrlFor(shadowDbUrl, dbName);
  let created = false;

  try {
    if (database.dbExists(adminUrl, dbName)) database.dropDatabase(adminUrl, dbName);
    database.createDatabase(adminUrl, dbName);
    created = true;

    // 1. Deploy exactly like a fresh environment would.
    let deployOut;
    try {
      deployOut = runPrismaFn(root, dir, ['migrate', 'deploy'], { DATABASE_URL: deployUrl }, prismaBinaryDir);
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

    let sql;
    try {
      sql = runPrismaFn(root, dir, diffArgs, resolveDiffEnv(dir, deployUrl), prismaBinaryDir);
    } catch (err) {
      result.status = 'ERROR';
      result.detail = `migrate diff failed — ${summarize(String(err.stderr || err.message || ''))}`;
      return result;
    }

    const verdict = driftVerdict(sql);
    result.status = verdict.status;
    result.detail = verdict.detail;
    result.sql = verdict.sql;
    return result;
  } catch (err) {
    result.status = 'ERROR';
    result.detail = summarize(String(err.stderr || err.message || err));
    return result;
  } finally {
    if (created) database.dropDatabase(adminUrl, dbName);
  }
}

// ---------------------------------------------------------------------------
// Full gate over a (filtered) set of services. Returns structured results;
// the CLI renders + maps them to an exit code.
// ---------------------------------------------------------------------------
export function runDeployedSchemaGate(root, {
  filter = [],
  shadowDbUrl,
  prismaBinaryDir = null,
  servicesDir = null,
  log = console.log,
  database = { dbExists, dropDatabase, createDatabase },
  checkServiceFn = checkDeployed,
} = {}) {
  const all = discoverServices(root, servicesDir ?? path.join(root, 'services'));
  const targets = filter.length
    ? all.filter((s) => filter.some((f) => s === f || s.endsWith(f)))
    : all;
  if (filter.length && targets.length === 0) {
    return { status: 'NO-MATCH', all, targets: [] };
  }

  const runId = `${process.pid}`;
  log(`Deploy-then-diff for ${targets.length} service(s) against shadow host: ${new URL(shadowDbUrl).host}\n`);

  const results = [];
  let index = 0;
  for (const rel of targets) {
    process.stdout.write(`  ${rel.padEnd(48)} `);
    const r = checkServiceFn(root, rel, runId, index++, { shadowDbUrl, prismaBinaryDir, database });
    results.push(r);
    const icon = { CLEAN: '✅', DRIFTED: '🔴', BROKEN: '💥', ERROR: '💥' }[r.status];
    log(`${icon} ${r.status}${r.detail ? ` — ${r.detail}` : ''}`);
    if (r.sql || r.status === 'BROKEN') {
      fs.mkdirSync(path.join(root, '.check-prisma-deploy-diff-out'), { recursive: true });
      const safe = rel.replaceAll('/', '__');
      if (r.sql) fs.writeFileSync(path.join(root, '.check-prisma-deploy-diff-out', `${safe}.sql`), r.sql);
      if (r.deployLog && r.status === 'BROKEN') fs.writeFileSync(path.join(root, '.check-prisma-deploy-diff-out', `${safe}.deploy.log`), r.deployLog);
    }
  }

  const drifted = results.filter((r) => r.status === 'DRIFTED');
  const broken = results.filter((r) => r.status === 'BROKEN');
  const errored = results.filter((r) => r.status === 'ERROR');

  log(`\nSummary: ${results.length} checked · ${results.length - drifted.length - broken.length - errored.length} clean · ${drifted.length} drifted · ${broken.length} broken · ${errored.length} error`);

  if (drifted.length || broken.length || errored.length) {
    for (const r of drifted) log(`  - DRIFTED ${r.service}: ${r.detail}`);
    for (const r of broken) log(`  - BROKEN  ${r.service}: ${r.detail}`);
    for (const r of errored) log(`  - ERROR   ${r.service}: ${r.detail}`);
    log('\nSchema lock violated: `prisma migrate deploy` does not reproduce schema.prisma.');
    log('Fix: author the missing migration (never `migrate resolve` an unapplied one). Diff artifacts in .check-prisma-deploy-diff-out/');
    return { status: 'DONE', all, targets, results, drifted, broken, errored, exitCode: 1 };
  }
  log('✅ Every service deploys into exactly schema.prisma — schema lock holds');
  return { status: 'DONE', all, targets, results, drifted, broken, errored, exitCode: 0 };
}

/**
 * Machine-readable gate report for tooling (PR comment bot, summaries).
 * Written by the gate CLI after every run into the gate's artifact dir;
 * NO-MATCH outcomes produce no report.
 */
export function writeReport(outcome, root, reportPath = '.check-prisma-deploy-diff-out/report.json') {
  if (outcome.status === 'NO-MATCH') return null;
  const payload = {
    gate: 'deployed-schema-lock',
    generatedAt: new Date().toISOString(),
    total: outcome.results.length,
    clean: outcome.results.filter((r) => r.status === 'CLEAN').length,
    drifted: outcome.drifted.length,
    broken: outcome.broken.length,
    errored: outcome.errored.length,
    services: outcome.results.map((r) => ({
      service: r.service,
      status: r.status,
      detail: r.detail,
    })),
  };
  fs.mkdirSync(path.dirname(path.join(root, reportPath)), { recursive: true });
  fs.writeFileSync(path.join(root, reportPath), `${JSON.stringify(payload, null, 2)}\n`);
  return payload;
}
