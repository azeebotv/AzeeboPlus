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
//   node scripts/drift-live-db.mjs                # all services + apps
//   node scripts/drift-live-db.mjs wallet-service # one service
//   node scripts/drift-live-db.mjs --strict       # exit 1 on ANY drift
//   node scripts/drift-live-db.mjs --repair [svc] # apply the ADDITIVE drift
//                                                 # statements live (psql,
//                                                 # single transaction, refuses
//                                                 # destructive/review ones)
//   node scripts/drift-live-db.mjs --update-baseline  # accept the CURRENT
//                                                 # drift as known (writes
//                                                 # scripts/drift-live-baseline.json
//                                                 # — review the git diff!)
//   node scripts/drift-live-db.mjs --seed --strict  # CI-style: provision from
//                                                    # migrations, then diff —
//                                                    # exit 1 on ANY drift
//   node scripts/drift-live-db.mjs --seed --advisory  # CI advisory: provision,
//                                                      # then diff; report only,
//                                                      # never fails the build
//   LIVE_DB_URL_BASE=postgres://user:pass@host:5432 node scripts/…  # creds
//
// Known drift (scripts/drift-live-baseline.json): some local databases
// deliberately hold more than one Prisma schema's tables (azeebo_creator is
// shared by apps/creator AND services/universes/creator-service) or legacy
// live-only tables (azeebo_content.users and friends, preserved for their
// data). Those exact statements are baselined so they stop masking the thing
// this sweep exists to catch — NEW drift, from anywhere, still fails.
// ============================================================================

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SERVICES_DIR = path.join(ROOT, 'services');
const APPS_DIR = path.join(ROOT, 'apps');
const OUT_DIR = path.join(ROOT, '.drift-live-out');
const BASELINE_PATH = path.join(ROOT, 'scripts', 'drift-live-baseline.json');
const KNOWN_DRIFT_COMMENT =
  'Known/accepted live-DB vs schema.prisma drift, written by `node scripts/drift-live-db.mjs --update-baseline`. ' +
  'Each entry lists normalized SQL statements that exist in the live database but not in the Prisma schema: ' +
  'co-tenant tables (azeebo_creator is shared by apps/creator and services/universes/creator-service, so each ' +
  'schema sees the other\u2019s objects as drift) and legacy live-only tables preserved for their data ' +
  '(azeebo_content.users & friends). Anything NOT listed here fails the sweep — do not baseline new drift ' +
  'without understanding why the database and the schema disagree.';
const args = process.argv.slice(2);
const strict = args.includes('--strict');
const seedMode = args.includes('--seed');
const advisory = args.includes('--advisory');
const repairMode = args.includes('--repair');
const updateBaseline = args.includes('--update-baseline');
const filter = args.filter((a) => !a.startsWith('--'));
const DEV_PASSWORD = process.env.LIVE_DB_PASSWORD ?? 'azeebo_dev_2024';
// Base for the convention per-service databases (azeebo_<service>). CI
// overrides this with the service-container credentials (see workflows);
// local runs keep the historical dev default.
const LIVE_DB_URL_BASE =
  process.env.LIVE_DB_URL_BASE ?? `postgresql://azeebo:${DEV_PASSWORD}@localhost:5432`;
function discoverServices() {
  const services = [];
  const addIfSchema = (dir) => {
    if (fs.existsSync(path.join(dir, 'prisma', 'schema.prisma')))
      services.push(path.relative(ROOT, dir));
  };
  // services/<domain>/<name>
  if (fs.existsSync(SERVICES_DIR)) {
    for (const domain of fs.readdirSync(SERVICES_DIR, { withFileTypes: true })) {
      if (!domain.isDirectory()) continue;
      for (const name of fs.readdirSync(path.join(SERVICES_DIR, domain.name), {
        withFileTypes: true,
      })) {
        if (!name.isDirectory()) continue;
        addIfSchema(path.join(SERVICES_DIR, domain.name, name.name));
      }
    }
  }
  // apps/<name> — the portal backends (apps/creator, apps/admin) own their own
  // Prisma schemas and were historically NOT swept at all.
  if (fs.existsSync(APPS_DIR)) {
    for (const entry of fs.readdirSync(APPS_DIR, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      addIfSchema(path.join(APPS_DIR, entry.name));
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
    const line = fs
      .readFileSync(envFile, 'utf8')
      .split('\n')
      .find((l) => l.startsWith('DATABASE_URL='));
    if (line)
      url = line
        .slice('DATABASE_URL='.length)
        .trim()
        .replace(/^["']|["']$/g, '');
  } catch {
    /* no .env */
  }
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

/** Baseline comparison key: whitespace-insensitive, comment-free statement text. */
const normalizeStmt = (s) => s.replace(/\s+/g, ' ').trim();

function loadBaseline() {
  try {
    const parsed = JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf8'));
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {}; // no baseline file yet — everything counts as new drift
  }
}
const BASELINE = loadBaseline();

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
  return execFileSync(
    fs.existsSync(rootBin) ? rootBin : 'npx',
    fs.existsSync(rootBin) ? args_ : ['--yes', 'prisma', ...args_],
    {
      cwd: serviceDir,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, ...env },
      timeout: 60_000,
    }
  );
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
  const result = {
    service: rel,
    status: 'CLEAN',
    url,
    additive: 0,
    destructive: 0,
    review: 0,
    known: 0,
    sql: '',
  };

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
  if (repairMode) {
    const repair = repairService(dir, rel);
    if (repair.error) {
      result.status = 'ERROR';
      result.sql = repair.error;
      return result;
    }
  }
  let sql;
  try {
    sql = runPrisma(dir, [
      'migrate',
      'diff',
      '--from-url',
      url,
      '--to-schema-datamodel',
      'prisma/schema.prisma',
      '--script',
    ]);
  } catch (err) {
    result.status = 'ERROR';
    result.sql = String(err.stderr || err.message || err);
    return result;
  }
  const stmts = splitStatements(sql);
  if (!stmts.length) return result;

  result.sql = sql;
  const accepted = new Set((BASELINE[rel] ?? []).map(normalizeStmt));
  for (const s of stmts) {
    if (accepted.has(normalizeStmt(s))) {
      result.known += 1;
      continue;
    } // baselined known drift
    const kind = classify(s);
    if (kind === 'additive') result.additive++;
    else if (kind === 'destructive') result.destructive++;
    else result.review++;
  }
  if (result.known === stmts.length) result.status = 'KNOWN';
  else
    result.status = result.destructive ? 'DESTRUCTIVE' : result.review ? 'REVIEW' : 'ADDITIVE-ONLY';
  return result;
}

/**
 * --repair: apply ONLY the additive drift statements for one service's live
 * database, in a single transaction with ON_ERROR_STOP, then report what was
 * refused. This is the durable replacement for hand-run /tmp SQL.
 *
 * Co-tenant aware: azeebo_creator is shared by apps/creator and
 * services/universes/creator-service, so some "additive" statements target
 * objects the OTHER schema already created (same constraint name, different
 * definition). Those are skipped as already-satisfied instead of aborting
 * the whole transaction; whatever still differs lands in the baseline.
 */
function repairService(dir, rel) {
  const url = resolveDbUrl(dir);
  let sql;
  try {
    sql = runPrisma(dir, [
      'migrate',
      'diff',
      '--from-url',
      url,
      '--to-schema-datamodel',
      'prisma/schema.prisma',
      '--script',
    ]);
  } catch (err) {
    return { error: String(err.stderr || err.message || err) };
  }
  const stmts = splitStatements(sql);
  const accepted = new Set((BASELINE[rel] ?? []).map(normalizeStmt));
  const applicable = [];
  const refused = [];
  let satisfied = 0;
  let salvaged = 0;
  for (const s of stmts) {
    if (accepted.has(normalizeStmt(s))) continue; // already known/accepted
    const kind = classify(s);
    if (kind === 'additive') {
      applicable.push(s);
      continue;
    }
    // Mixed ALTER TABLE: prisma emits `DROP COLUMN a, ADD COLUMN b` as one
    // statement. Take the additive clauses (they are safe and independent),
    // keep the destructive ones refused for human review.
    const clauses = extractAdditiveClauses(s);
    if (clauses) {
      applicable.push(clauses);
      salvaged += 1;
      refused.push(s);
      continue;
    }
    refused.push(s);
  }
  if (salvaged)
    console.log(`   repair: salvaged ADD COLUMN clause(s) from ${salvaged} mixed statement(s)`);
  if (refused.length) {
    console.log(
      `   repair: REFUSING ${refused.length} non-additive statement(s) (human review required):`
    );
    for (const s of refused) console.log(`     ! ${normalizeStmt(s).slice(0, 140)}`);
  }
  if (!applicable.length) {
    console.log(`   repair: nothing additive to apply`);
    return {};
  }
  const psqlUrl = url.split('?')[0]; // libpq rejects Prisma-only query params
  let existing;
  try {
    existing = existingDbObjects(psqlUrl);
  } catch (err) {
    return { error: `repair precheck failed: ${String(err.stderr || err.message).slice(0, 400)}` };
  }
  const toApply = [];
  for (const s of applicable) {
    const stripped = stripSatisfied(s, existing);
    if (!stripped.sql) {
      satisfied += 1;
      console.log(
        `   repair: already satisfied (co-tenant/re-run) — ${stripped.skipped.join(', ')}`
      );
      continue;
    }
    if (stripped.skipped.length) {
      satisfied += 1;
      console.log(
        `   repair: ${stripped.skipped.length} clause(s) already present, applying the rest — ${stripped.skipped.join(', ')}`
      );
    }
    const stmt = stripped.sql;
    const missing = prerequisiteObjects(stmt).filter((o) => !existing.has(o));
    if (missing.length) {
      satisfied += 1;
      console.log(
        `   repair: prerequisite absent (needs the refused destructive step) — ${missing.join(', ')}`
      );
      continue;
    }
    toApply.push(stmt);
    // Optimistic: later statements in the same batch may depend on objects
    // this one creates (ADD COLUMN → CREATE INDEX → ADD CONSTRAINT order).
    for (const o of objectsReferenced(stmt) ?? []) existing.add(o);
  }
  if (!toApply.length) {
    console.log(`   repair: all ${satisfied} additive statement(s) already satisfied`);
    return {};
  }
  try {
    execFileSync('psql', [psqlUrl, '-v', 'ON_ERROR_STOP=1', '-1', '-f', '-'], {
      input: `${toApply.join(';\n')};\n`,
      encoding: 'utf8',
      stdio: ['pipe', 'ignore', 'pipe'],
    });
  } catch (err) {
    return {
      error: `repair apply failed (transaction rolled back): ${String(err.stderr || err.message).slice(0, 800)}`,
    };
  }
  console.log(
    `   repair: applied ${toApply.length} additive statement(s) in one transaction${satisfied ? ` (${satisfied} skipped as already present)` : ''}`
  );
  return {};
}

/** Live-database object inventory used by --repair's already-satisfied check. */
function existingDbObjects(psqlUrl) {
  const sql =
    `SELECT 'constraint:'||conname FROM pg_constraint ` +
    `UNION ALL SELECT 'index:'||indexname FROM pg_indexes WHERE schemaname='public' ` +
    `UNION ALL SELECT 'table:'||table_name FROM information_schema.tables WHERE table_schema='public' ` +
    `UNION ALL SELECT 'column:'||table_name||'.'||column_name FROM information_schema.columns WHERE table_schema='public'`;
  const out = execFileSync('psql', [psqlUrl, '-tA', '-c', sql], { encoding: 'utf8' });
  return new Set(
    out
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
  );
}

/** Objects an additive statement would create, or null if unprecheckable. */
function objectsReferenced(stmt) {
  const objs = [];
  const tables = [...stmt.matchAll(/ALTER TABLE "([^"]+)"/g)].map((m) => m[1]);
  for (const m of stmt.matchAll(/ADD CONSTRAINT "([^"]+)"/g)) objs.push(`constraint:${m[1]}`);
  for (const m of stmt.matchAll(/CREATE (?:UNIQUE )?INDEX "([^"]+)"/g)) objs.push(`index:${m[1]}`);
  for (const m of stmt.matchAll(/CREATE TABLE "([^"]+)"/g)) objs.push(`table:${m[1]}`);
  if (/ADD COLUMN/.test(stmt)) {
    if (tables.length !== 1) return null; // multi-clause: can't pre-check reliably
    for (const m of stmt.matchAll(/ADD COLUMN "([^"]+)"/g))
      objs.push(`column:${tables[0]}.${m[1]}`);
  }
  return objs;
}

/**
 * Split `ALTER TABLE "t" <clauses>` into just its ADD COLUMN clauses when the
 * statement mixes them with DROP/ALTER clauses. Returns null when there is
 * nothing to salvage (pure-destructive, pure-additive, or non-ALTER form).
 */
function extractAdditiveClauses(stmt) {
  const m = stmt.match(/^ALTER TABLE "([^"]+)"\s+([\s\S]+)$/i);
  if (!m) return null;
  const clauses = splitTopLevel(m[2]);
  const adds = clauses.filter((c) => /^ADD COLUMN\b/i.test(c));
  if (!adds.length || adds.length === clauses.length) return null;
  return `ALTER TABLE "${m[1]}" ${adds.join(', ')};`;
}

/** Split on top-level commas — depth- and quote-aware (defaults can nest). */
function splitTopLevel(body) {
  const out = [];
  let depth = 0,
    inStr = false,
    cur = '';
  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (inStr) {
      cur += ch;
      if (ch === "'") {
        if (body[i + 1] === "'") {
          cur += body[++i];
        } else {
          inStr = false;
        }
      }
      continue;
    }
    if (ch === "'") {
      inStr = true;
      cur += ch;
      continue;
    }
    if (ch === '(') depth += 1;
    else if (ch === ')') depth -= 1;
    else if (ch === ',' && depth === 0) {
      out.push(cur.trim());
      cur = '';
      continue;
    }
    cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out.filter(Boolean);
}

/**
 * Drop clauses whose object already exists in the live database, so a
 * partially-applied statement still advances instead of aborting the batch.
 * Returns { sql, skipped } — sql=null means nothing left to do.
 */
function stripSatisfied(stmt, existing) {
  const objs = objectsReferenced(stmt);
  const m = stmt.match(/^ALTER TABLE "([^"]+)"\s+([\s\S]+?)\s*;?\s*$/i);
  if (objs !== null && m && /ADD COLUMN/i.test(stmt)) {
    const clauses = splitTopLevel(m[2].replace(/;\s*$/, ''));
    const keep = [];
    const skipped = [];
    for (const c of clauses) {
      const col = c.match(/^ADD COLUMN "([^"]+)"/i);
      const key = col ? `column:${m[1]}.${col[1]}` : null;
      if (key && existing.has(key)) skipped.push(key);
      else keep.push(c);
    }
    if (!keep.length) return { sql: null, skipped };
    return { sql: skipped.length ? `ALTER TABLE "${m[1]}" ${keep.join(', ')};` : stmt, skipped };
  }
  if (objs === null) return { sql: stmt, skipped: [] };
  const hit = objs.filter((o) => existing.has(o));
  return hit.length ? { sql: null, skipped: hit } : { sql: stmt, skipped: [] };
}

/**
 * Columns an additive statement needs to already exist — e.g. an FK on
 * payout_requests("creatorId") or an index over it. Those columns only exist
 * once a REFUSED destructive statement creates them (co-tenant schemas), so
 * applying the FK/index alone would blow up mid-transaction. Skipping keeps
 * the repair transaction safe; the leftover difference is baselined instead.
 */ function prerequisiteObjects(stmt) {
  const reqs = [];
  const table = stmt.match(/ALTER TABLE "([^"]+)"/)?.[1];
  const strip = (s) => s.trim().replace(/^"|"$/g, '');
  if (table) {
    for (const m of stmt.matchAll(/FOREIGN KEY \(([^)]+)\)/g)) {
      for (const col of m[1].split(',')) reqs.push(`column:${table}.${strip(col)}`);
    }
  }
  for (const m of stmt.matchAll(/ON "([^"]+)"\s*\(([^)]+)\)/g)) {
    for (const col of m[2].split(',')) {
      const c = strip(col);
      if (c) reqs.push(`column:${m[1]}.${c}`);
    }
  }
  for (const m of stmt.matchAll(/REFERENCES "([^"]+)"\s*\(([^)]+)\)/g)) {
    for (const col of m[2].split(',')) reqs.push(`column:${m[1]}.${strip(col)}`);
  }
  return [...new Set(reqs)];
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
console.log(
  seedMode
    ? `Provisioning ${targets.length} database(s) from migrations, then diffing live ↔ schema.prisma\n`
    : `Diffing ${targets.length} live database(s) against schema.prisma\n`
);

const rows = [];
for (const rel of targets) {
  process.stdout.write(`  ${rel.padEnd(48)} `);
  const r = checkService(rel);
  rows.push(r);
  const icon = {
    CLEAN: '✅',
    KNOWN: '🟦',
    'ADDITIVE-ONLY': '🟢',
    REVIEW: '🟠',
    DESTRUCTIVE: '🔴',
    'NO-DB': '⚪',
    ERROR: '💥',
  }[r.status];
  const counts =
    r.status === 'CLEAN' || r.status === 'NO-DB' || r.status === 'ERROR'
      ? ''
      : r.status === 'KNOWN'
        ? ` (baselined ${r.known})`
        : ` (+${r.additive} / ~${r.review} / -${r.destructive}${r.known ? ` · ${r.known} baselined` : ''})`;
  console.log(`${icon} ${r.status}${counts}`);
  if (r.sql && r.status !== 'CLEAN') {
    fs.writeFileSync(path.join(OUT_DIR, `${rel.replaceAll('/', '__')}.sql`), r.sql);
  }
}

if (updateBaseline) {
  const next = { $comment: KNOWN_DRIFT_COMMENT };
  for (const r of rows.filter((x) => x.sql)) {
    next[r.service] = splitStatements(r.sql).map(normalizeStmt);
  }
  fs.writeFileSync(BASELINE_PATH, `${JSON.stringify(next, null, 2)}\n`);
  const n = Object.keys(next).length - 1;
  console.log(
    `\nBaseline updated: ${BASELINE_PATH} (${n} service(s) with accepted drift — review the git diff before committing)`
  );
  process.exit(0);
}

const drifted = rows.filter((r) => !['CLEAN', 'KNOWN', 'NO-DB'].includes(r.status));
const baselined = rows.filter((r) => r.status === 'KNOWN').length;
console.log(
  `\nSummary: ${rows.length} checked · ${rows.filter((r) => r.status === 'CLEAN').length} clean · ${baselined} baselined-known · ${rows.filter((r) => r.status === 'NO-DB').length} no-db · ${drifted.length} drifted${drifted.length ? '' : ' — no unexplained drift'}`
);

// Per-service fix plans (additive-only plan; destructive needs human review).
for (const r of drifted) {
  const safeName = r.service.replaceAll('/', '__');
  console.log(`\n── ${r.service} (${r.status}) — db ${r.url.split('@')[1] ?? r.url}`);
  console.log(`   diff: .drift-live-out/${safeName}.sql`);
  if (r.status === 'ADDITIVE-ONLY' || (repairMode && r.status !== 'ERROR')) {
    console.log(`   Plan (additive-only, safe to apply):`);
    console.log(`     node scripts/drift-live-db.mjs --repair ${r.service}`);
    console.log(`     (or hand-roll the 4-step migration below)`);
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
