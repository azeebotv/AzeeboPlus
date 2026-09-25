#!/usr/bin/env node
/**
 * C-4 serial test sweep — one-line reproducible run: `pnpm test:sweep`.
 *
 * Mirrors the CI/local C-4 methodology exactly:
 *   1. `pnpm run prisma:generate` first — a fresh `pnpm install` wipes the
 *      gitignored generated Prisma clients (which used to break the
 *      payment/wallet e2e + integration suites at module load), so clients
 *      must be regenerated before anything touches `@prisma/client`.
 *   2. Every workspace's suite runs serially: `pnpm exec jest --runInBand
 *      --forceExit`. Jest is invoked DIRECTLY (not `pnpm -r test -- ...`):
 *      pnpm 10 leaks a literal `--` into the script argv, so jest treats the
 *      flags as filename patterns and runs nothing.
 *   3. apps/web uses vitest, which rejects `--runInBand` — it gets plain
 *      `pnpm exec vitest run` (detected from its `test` script).
 *   4. Aggregates per-workspace pass/fail plus suite/test totals and exits
 *      non-zero if any workspace (or prisma:generate) fails.
 *
 * Full per-workspace output goes to a log file (default
 * /tmp/codebuff-test-sweep.log; override with LOG=<path>).
 *
 * Options:
 *   --fail-fast          abort after the first failing workspace; the remaining
 *                        workspaces are reported as skipped (CI wants speed,
 *                        local wants the full report)
 *   --json               print the summary as a single JSON object on stdout;
 *                        human-readable output moves to stderr so stdout can
 *                        be piped straight into jq
 *   --json-out=<path>    also write the summary JSON to <path>; stdout stays
 *                        human-readable
 *   --help               show usage and exit
 *
 * Summary JSON shape:
 *   { ok, failFast, aborted, prismaGenerate: { ok },
 *     workspaces: { total, passed, failed, skipped },
 *     totals: { suites, suitesSkipped, tests, skipped, failed },
 *     failedWorkspaces: string[], logFile,
 *     results: [{ name, status: "pass"|"fail"|"skip",
 *                 suites, suitesSkipped, tests, skipped, failed,
 *                 exitCode, elapsedMs }] }
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const LOG_FILE = process.env.LOG || '/tmp/codebuff-test-sweep.log';
const PER_WORKSPACE_TIMEOUT_MS = 600_000;

// ---- CLI options ----
const argv = process.argv.slice(2);
const FAIL_FAST = argv.includes('--fail-fast');
const JSON_MODE = argv.includes('--json');
const JSON_OUT_ARG = argv.find((a) => a.startsWith('--json-out='));
const JSON_OUT = JSON_OUT_ARG ? JSON_OUT_ARG.slice('--json-out='.length) : null;

if (argv.includes('--help')) {
  console.log(`Usage: node scripts/test-sweep.mjs [options]

Runs the C-4 serial test sweep: prisma:generate first, then every workspace's
jest (--runInBand --forceExit) / vitest suite serially.

Options:
  --fail-fast          abort after the first failing workspace (others reported as skipped)
  --json               print summary JSON to stdout (human output moves to stderr)
  --json-out=<path>    also write summary JSON to <path> (stdout stays human)
  --help               show this help and exit

Env:
  LOG=<path>           full per-workspace output log (default /tmp/codebuff-test-sweep.log)`);
  process.exit(0);
}

// Human-readable output: stdout normally, stderr in --json mode so stdout is pure JSON.
const say = (s = '') => (JSON_MODE ? process.stderr : process.stdout).write(s + '\n');

/** Emit the summary object per --json / --json-out. */
function writeJsonSummary(summary) {
  const json = JSON.stringify(summary, null, 2) + '\n';
  if (JSON_MODE) process.stdout.write(json);
  if (JSON_OUT) writeFileSync(JSON_OUT, json);
}

function run(cmd, { cwd = ROOT, timeout = PER_WORKSPACE_TIMEOUT_MS } = {}) {
  return spawnSync(cmd, { cwd, shell: true, encoding: 'utf8', timeout });
}

/** Direct subdirectories of `base` (sorted). */
function subdirs(base) {
  if (!existsSync(base)) return [];
  return readdirSync(base, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => path.join(base, e.name))
    .sort();
}

/** Workspace dirs under `base` (sorted), each with a package.json. */
function dirsWithPackage(base) {
  return subdirs(base).filter((d) => existsSync(path.join(d, 'package.json')));
}

// ---- Workspace discovery (same globs as pnpm-workspace.yaml) ----
// services/*/* is two levels deep and the middle level (core, engagement, ...)
// is a bare grouping dir without a package.json, so list it separately.
const workspaces = [];
for (const dir of dirsWithPackage(path.join(ROOT, 'apps'))) workspaces.push(dir);
for (const dir of dirsWithPackage(path.join(ROOT, 'packages'))) workspaces.push(dir);
for (const area of subdirs(path.join(ROOT, 'services'))) {
  for (const dir of dirsWithPackage(area)) workspaces.push(dir);
}

const num = (line, re) => {
  const m = line.match(re);
  return m ? Number(m[1]) : 0;
};

/** Parse jest ("Test Suites:"/"Tests:") and vitest ("Test Files"/"Tests") summaries. */
function parseOutput(out) {
  let suites = 0;
  let suitesSkipped = 0;
  let tests = 0;
  let skipped = 0;
  let failed = 0;
  const suiteMatches = [...out.matchAll(/Test Suites:\s+([^\n]+)/g)];
  if (suiteMatches.length) {
    const line = suiteMatches[suiteMatches.length - 1][1];
    suites = num(line, /(\d+) passed/);
    suitesSkipped = num(line, /(\d+) skipped/);
  } else {
    const vf = [...out.matchAll(/Test Files\s+(\d+) passed/g)];
    if (vf.length) suites = Number(vf[vf.length - 1][1]);
  }
  const testMatches = [...out.matchAll(/Tests:\s+([^\n]+)/g)];
  if (testMatches.length) {
    const line = testMatches[testMatches.length - 1][1];
    tests = num(line, /(\d+) passed/);
    skipped = num(line, /(\d+) skipped/);
    failed = num(line, /(\d+) failed/);
  } else {
    const vt = [...out.matchAll(/^\s*Tests\s+(\d+) passed/gm)];
    if (vt.length) tests = Number(vt[vt.length - 1][1]);
  }
  return { suites, suitesSkipped, tests, skipped, failed };
}

// ---- 1. Regenerate Prisma clients ----
say('==> prisma:generate (regenerates clients wiped by fresh installs)');
const gen = run('pnpm run prisma:generate');
if (gen.status !== 0) {
  process.stderr.write(gen.stdout + gen.stderr);
  say('prisma:generate FAILED — aborting sweep');
  writeJsonSummary({
    ok: false,
    failFast: FAIL_FAST,
    aborted: true,
    prismaGenerate: { ok: false },
    error: 'prisma:generate failed',
    logFile: LOG_FILE,
  });
  process.exit(1);
}

// ---- 2. Serial per-workspace sweep ----
say(`==> Sweeping ${workspaces.length} workspaces serially...`);
const logLines = [];
const totals = { suites: 0, suitesSkipped: 0, tests: 0, skipped: 0, failed: 0 };
const failedWorkspaces = [];
const results = [];
let aborted = false;

for (let i = 0; i < workspaces.length; i++) {
  const dir = workspaces[i];
  const rel = path.relative(ROOT, dir);

  if (aborted) {
    results.push({
      name: rel,
      status: 'skip',
      suites: 0,
      suitesSkipped: 0,
      tests: 0,
      skipped: 0,
      failed: 0,
      exitCode: null,
      elapsedMs: 0,
    });
    say(`SKIP [${i + 1}/${workspaces.length}] ${rel}  (not run — fail-fast)`);
    continue;
  }

  const pkg = JSON.parse(readFileSync(path.join(dir, 'package.json'), 'utf8'));
  const testScript = (pkg.scripts && pkg.scripts.test) || '';
  const cmd = /vitest/.test(testScript)
    ? 'pnpm exec vitest run'
    : 'pnpm exec jest --runInBand --forceExit';

  const t0 = Date.now();
  const res = run(cmd, { cwd: dir });
  const elapsedMs = Date.now() - t0;
  const out = res.stdout + res.stderr;
  logLines.push(`=== RUN ${rel} ===\n${out}EXITCODE:${res.status ?? 'TIMEOUT'}`);

  const parsed = parseOutput(out);
  totals.suites += parsed.suites;
  totals.suitesSkipped += parsed.suitesSkipped;
  totals.tests += parsed.tests;
  totals.skipped += parsed.skipped;
  totals.failed += parsed.failed;

  const ok = res.status === 0;
  if (!ok) failedWorkspaces.push(rel);
  if (FAIL_FAST && !ok) aborted = true;

  results.push({
    name: rel,
    status: ok ? 'pass' : 'fail',
    suites: parsed.suites,
    suitesSkipped: parsed.suitesSkipped,
    tests: parsed.tests,
    skipped: parsed.skipped,
    failed: parsed.failed,
    exitCode: res.status,
    elapsedMs,
  });

  const flag = ok ? 'PASS' : 'FAIL';
  say(
    `${flag} [${i + 1}/${workspaces.length}] ${rel}  ` +
      `(${parsed.suites + parsed.suitesSkipped} suites, ${parsed.tests} tests)`
  );
}

writeFileSync(LOG_FILE, logLines.join('\n') + '\n');

const passedCount = results.filter((r) => r.status === 'pass').length;
const failedCount = results.filter((r) => r.status === 'fail').length;
const skippedCount = results.filter((r) => r.status === 'skip').length;

// ---- 3. Summary ----
say('\n==== SWEEP RESULT ====');
say(
  `workspaces: ${workspaces.length}  failed: ${failedWorkspaces.length}  ` +
    `(log: ${LOG_FILE})`
);
say(
  `suites/files: ${totals.suites + totals.suitesSkipped} ` +
    `(${totals.suites} passed + ${totals.suitesSkipped} skipped)`
);
say(
  `tests: ${totals.tests} passed, ${totals.skipped} skipped, ${totals.failed} failed`
);
if (aborted) {
  say(`ABORTED after first failure (--fail-fast) — ${skippedCount} workspace(s) not run`);
}
if (failedWorkspaces.length) {
  say('failed workspaces:');
  for (const w of failedWorkspaces) say(`  - ${w}`);
}

const summary = {
  ok: failedWorkspaces.length === 0,
  failFast: FAIL_FAST,
  aborted,
  prismaGenerate: { ok: true },
  workspaces: {
    total: workspaces.length,
    passed: passedCount,
    failed: failedCount,
    skipped: skippedCount,
  },
  totals,
  failedWorkspaces,
  results,
  logFile: LOG_FILE,
};
writeJsonSummary(summary);

if (failedWorkspaces.length) process.exit(1);
say('ALL WORKSPACES PASSED');
