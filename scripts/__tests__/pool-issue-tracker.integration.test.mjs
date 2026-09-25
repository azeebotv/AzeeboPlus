/**
 * Integration test for scripts/pool-issue-tracker.mjs — the pool-health
 * tracker runs as a REAL subprocess against the local job_runs ledger
 * (LIVE_DB_URL_BASE, like the gates) and the shared fake GitHub API server,
 * covering the full issue lifecycle:
 *
 *   create on first sustained violation → no-op on an unchanged night →
 *   update when the violation set changes → close when both gates pass →
 *   reopen when a violation returns
 *
 * plus identity (App token on every call, skip-loudly without one) and
 * degradation (ledger unavailable → skip, not fail).
 *
 * Run: node --test scripts/__tests__/pool-issue-tracker.integration.test.mjs
 * (skips the ledger-driven legs when no local Postgres answers)
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { startFakeGitHub } from './helpers/fake-github-server.mjs';
import { POOL_ISSUE_MARKER, POOL_ISSUE_TITLE, POOL_ISSUE_LABEL } from '../lib/drift-issue.mjs';

const SCRIPT = fileURLToPath(new URL('../pool-issue-tracker.mjs', import.meta.url));

const BASE_URL = process.env.LIVE_DB_URL_BASE ?? 'postgresql://azeebo:azeebo_dev_2024@127.0.0.1:5432';
let ledgerUp = false;
try {
  execFileSync('psql', [BASE_URL + '/azeebo_admin', '-tAc', 'SELECT 1'], { encoding: 'utf8', timeout: 5000, env: { ...process.env, PGPASSWORD: 'azeebo_dev_2024' } });
  ledgerUp = true;
} catch {
  ledgerUp = false;
}

// ── Ledger seeding helpers ──────────────────────────────────────────────────

const psqlEnv = { ...process.env, PGPASSWORD: 'azeebo_dev_2024' };

function seedBypass(rows) {
  // rows: [{ minutesAgo, workspace }] — hourly ok rows with bypass detail
  const values = rows
    .map((r, i) => {
      const detail = `pgbouncer 62/200 clients; 1 repo process(es) bypassing pgbouncer: ${r.workspace}(node 42${i}, 2 conns)`;
      return `SELECT 'pooltrk-' || ${i}, 'pool-audit', 'ok', '${detail.replace(/'/g, "''")}', now() - interval '${r.minutesAgo} minutes'`;
    })
    .join(' UNION ALL ');
  execFileSync(
    'psql',
    [BASE_URL + '/azeebo_admin', '-v', 'ON_ERROR_STOP=1', '-q', '-c',
      `INSERT INTO "job_runs" (id, job, status, detail, "ranAt") ${values};`],
    { encoding: 'utf8', timeout: 10000, env: psqlEnv }
  );
}

function cleanLedger() {
  execFileSync(
    'psql',
    [BASE_URL + '/azeebo_admin', '-v', 'ON_ERROR_STOP=1', '-q', '-c',
      `DELETE FROM "job_runs" WHERE id LIKE 'pooltrk-%';`],
    { encoding: 'utf8', timeout: 10000, env: psqlEnv }
  );
}

// ── Driver ──────────────────────────────────────────────────────────────────

function runTracker({ env, args = [] }) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [SCRIPT, ...args], {
      env: { PATH: process.env.PATH ?? '', ...env },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => (stdout += d));
    child.stderr.on('data', (d) => (stderr += d));
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new Error(`tracker run timed out\nstdout: ${stdout}\nstderr: ${stderr}`));
    }, 20000);
    child.on('error', (e) => {
      clearTimeout(timer);
      reject(e);
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({ code, stdout, stderr });
    });
  });
}

function trackerEnv({ base, token = 'ghs_driftbot_app_token', extra = {} }) {
  return {
    PATH: process.env.PATH ?? '',
    GITHUB_REPOSITORY: 'acme/repo',
    GITHUB_API_BASE_URL: base,
    LIVE_DB_URL_BASE: BASE_URL,
    ...(token != null ? { GITHUB_TOKEN: token } : {}),
    // The REAL ledger carries real foreign-dialer context (another project
    // on this host dials Postgres directly and persists for days). With the
    // foreign kind tracking-eligible, the default 24h threshold would let
    // that real traffic keep the tracker open through the close-legs and
    // inject non-deterministic rows. Neutralize it here; the dedicated
    // foreign-kind test re-enables it deliberately.
    POOL_FOREIGN_MIN_SPAN_H: '9999',
    ...extra,
  };
}

const BYPASS_WS = 'apps/pooltrk-fake';
const HOURLY_BYPASS = Array.from({ length: 26 }, (_, i) => ({ minutesAgo: (25 - i) * 60, workspace: BYPASS_WS }));

// ── The lifecycle ───────────────────────────────────────────────────────────

test('pool tracker lifecycle: create → none → update → close → reopen', { skip: !ledgerUp && 'local ledger unreachable' }, async (t) => {
  seedBypass(HOURLY_BYPASS);
  t.after(() => cleanLedger());

  let api = await startFakeGitHub({ issues: [] });
  t.after(() => api.close());

  // Night 1: sustained bypass appears → CREATE.
  const first = await runTracker({ env: trackerEnv({ base: api.base }) });
  assert.equal(first.code, 0, `first run\n${first.stdout}\n${first.stderr}`);
  assert.equal(api.state.issues.length, 1, 'exactly one tracker created');
  const created = api.state.issues[0];
  assert.equal(created.title, POOL_ISSUE_TITLE);
  assert.ok(created.body.includes(POOL_ISSUE_MARKER), 'body carries the pool marker');
  assert.deepEqual(created.labels, [POOL_ISSUE_LABEL]);
  assert.match(created.body, /sustained pgbouncer bypass: apps\/pooltrk-fake/);
  const createReq = api.requests.find((r) => r.method === 'POST' && r.url.endsWith('/repos/acme/repo/issues'));
  assert.equal(createReq.auth, 'Bearer ghs_driftbot_app_token', 'created under the App identity');

  // Night 2: same violation → NONE (no duplicate, no edit).
  const second = await runTracker({ env: trackerEnv({ base: api.base }) });
  assert.equal(second.code, 0);
  assert.match(second.stdout, /decision = NONE|issue already up to date|already up to date/);
  assert.equal(api.state.issues.length, 1, 'no duplicate issue');
  assert.equal(
    api.requests.filter((r) => r.method === 'PATCH' && /\/issues\/\d+$/.test(r.url)).length,
    0,
    'no noisy edit on an unchanged night'
  );

  // Night 3: violation set grows (a second workspace joins) → UPDATE in place.
  cleanLedger();
  seedBypass([...HOURLY_BYPASS.map((r) => ({ ...r, workspace: BYPASS_WS })), ...HOURLY_BYPASS.map((r) => ({ ...r, workspace: 'apps/pooltrk-second' }))]);
  const third = await runTracker({ env: trackerEnv({ base: api.base }) });
  assert.equal(third.code, 0, `third run\n${third.stdout}\n${third.stderr}`);
  assert.match(third.stdout, /pool-issue-tracker: update \(|updated pool tracking issue/);
  assert.equal(api.state.issues.length, 1, 'update must not duplicate the tracker');
  assert.ok(api.state.issues[0].body.includes('apps/pooltrk-second'));

  // Night 4: ledger clean → CLOSE.
  cleanLedger();
  const fourth = await runTracker({ env: trackerEnv({ base: api.base }) });
  assert.equal(fourth.code, 0, `fourth run\n${fourth.stdout}\n${fourth.stderr}`);
  assert.match(fourth.stdout, /decision = CLOSE|closed pool tracking issue/);
  assert.equal(api.state.issues[0].state, 'closed');
  assert.match(api.state.issues[0].body, /### ✅ Pooler is healthy/);

  // Night 5: bypass returns → REOPEN with the resolved body replaced.
  seedBypass(HOURLY_BYPASS);
  const fifth = await runTracker({ env: trackerEnv({ base: api.base }) });
  assert.equal(fifth.code, 0, `fifth run\n${fifth.stdout}\n${fifth.stderr}`);
  assert.match(fifth.stdout, /decision = UPDATE|reopened/);
  assert.equal(api.state.issues[0].state, 'open');
  assert.match(api.state.issues[0].body, /sustained pgbouncer bypass/);
});

test('pool tracker: saturation joins the same issue when it trips', { skip: !ledgerUp && 'local ledger unreachable' }, async (t) => {
  // Bypass sustained + synthetic saturation errors → both kinds in one issue.
  // Seeding must be deterministic against the REAL hourly watchdog passes
  // interleaving into the window and chopping the synthetic streak — so the
  // error burst is placed immediately AFTER the NEWEST real pass (queried,
  // not assumed: real passes have landed at :23/:36, not just :21), at
  // 30-second intervals (2m span) so the burst completes long before the
  // next real pass can land (the test finishes in well under a minute).
  // 5 consecutive errors with POOL_GATE_MIN_SPAN_H=0.02 and a 1h window.
  seedBypass(HOURLY_BYPASS);
  t.after(() => cleanLedger());
  const newestReal = execFileSync(
    'psql',
    [BASE_URL + '/azeebo_admin', '-tAc', `SELECT COALESCE(max("ranAt"), now()) FROM "job_runs" WHERE job='pool-audit' AND id NOT LIKE 'pooltrk-%'`],
    { encoding: 'utf8', timeout: 10000, env: psqlEnv },
  ).trim();
  const burstStart = new Date(Date.parse(newestReal) + 30_000);
  const satValues = Array.from({ length: 5 }, (_, g) => {
    const at = new Date(burstStart.getTime() + g * 30_000).toISOString();
    return `SELECT 'pooltrk-sat-' || ${g}, 'pool-audit', 'error', 'saturation critical: 196/200 clients; no pooler bypasses', '${at}'::timestamptz`;
  }).join(' UNION ALL ');
  execFileSync(
    'psql',
    [BASE_URL + '/azeebo_admin', '-v', 'ON_ERROR_STOP=1', '-q', '-c',
      `INSERT INTO "job_runs" (id, job, status, detail, "ranAt") ${satValues};`],
    { encoding: 'utf8', timeout: 10000, env: psqlEnv }
  );
  t.after(() => execFileSync('psql', [BASE_URL + '/azeebo_admin', '-q', '-c', `DELETE FROM "job_runs" WHERE id LIKE 'pooltrk-sat-%';`], { encoding: 'utf8', timeout: 10000, env: psqlEnv }));

  const api = await startFakeGitHub({ issues: [] });
  t.after(() => api.close());

  const run = await runTracker({
    env: trackerEnv({ base: api.base, extra: { POOL_GATE_HOURS: '1', POOL_GATE_MIN_SPAN_H: '0.02' } }),
  });
  assert.equal(run.code, 0, `run\n${run.stdout}\n${run.stderr}`);
  assert.equal(api.state.issues.length, 1);
  const body = api.state.issues[0].body;
  assert.match(body, /\| saturation \| pgbouncer \|/);
  assert.match(body, /\| bypass \| apps\/pooltrk-fake \|/);
  const rows = body.split('\n').filter((l) => l.startsWith('| saturation') || l.startsWith('| bypass'));
  assert.ok(rows[0].startsWith('| saturation'), 'saturation listed first (more urgent)');
});

test('pool tracker: identity + degradation paths', async (t) => {
  const api = await startFakeGitHub({ issues: [] });
  t.after(() => api.close());

  // No token → skip-loudly before any API call (same contract as the drift bot).
  const noToken = await runTracker({ env: trackerEnv({ base: api.base, token: null }) });
  assert.equal(noToken.code, 0);
  assert.match(noToken.stdout, /no GITHUB_TOKEN/);
  assert.equal(api.requests.length, 0, 'no API calls without identity');

  // Unreachable ledger → skip, not fail (gates own the blocking signal).
  const deadLedger = await runTracker({
    env: trackerEnv({ base: api.base, extra: { LIVE_DB_URL_BASE: 'postgresql://azeebo:wrong@127.0.0.1:59999' } }),
  });
  assert.equal(deadLedger.code, 0, `ledger outage must not fail the step\n${deadLedger.stderr}`);
  assert.match(deadLedger.stdout + deadLedger.stderr, /nothing to sync|ledger unavailable|no LIVE_DB_URL_BASE/);
  assert.equal(api.state.issues.length, 0);

  // No repo (local preview) → prints decision + body, exits 0, no API calls.
  const local = await runTracker({ env: { PATH: process.env.PATH ?? '', LIVE_DB_URL_BASE: BASE_URL } });
  if (ledgerUp) {
    assert.equal(local.code, 0);
    assert.match(local.stdout, /──────────── issue body ────────────/);
  } else {
    assert.equal(local.code, 0);
  }
});

test('pool tracker: sustained foreign dialer gets its own row', { skip: !ledgerUp && 'local ledger unreachable' }, async (t) => {
  // Seed synthetic foreign-dialer context rows (the YCN-fleet shape: hourly
  // passes carrying a foreign segment for another project's cwd). Bypass and
  // saturation thresholds pinned high so ONLY the foreign kind can trip —
  // the assertion targets the foreign row specifically, whatever real
  // foreign workspaces the live ledger also contributes.
  const FW_WS = '/foreign/pooltrk-proj';
  const values = Array.from({ length: 26 }, (_, i) => {
    const detail = `pgbouncer 62/200 clients; foreign direct clients (context, not violations): ${FW_WS}(python 777, 2 conns); no pooler bypasses`;
    return `SELECT 'pooltrk-fw-' || ${i}, 'pool-audit', 'ok', '${detail.replace(/'/g, "''")}', now() - interval '${(25 - i) * 60} minutes'`;
  }).join(' UNION ALL ');
  execFileSync(
    'psql',
    [BASE_URL + '/azeebo_admin', '-v', 'ON_ERROR_STOP=1', '-q', '-c',
      `INSERT INTO "job_runs" (id, job, status, detail, "ranAt") ${values};`],
    { encoding: 'utf8', timeout: 10000, env: psqlEnv }
  );
  t.after(() => execFileSync('psql', [BASE_URL + '/azeebo_admin', '-q', '-c', `DELETE FROM "job_runs" WHERE id LIKE 'pooltrk-fw-%';`], { encoding: 'utf8', timeout: 10000, env: psqlEnv }));

  const api = await startFakeGitHub({ issues: [] });
  t.after(() => api.close());

  const run = await runTracker({
    env: trackerEnv({ base: api.base, extra: { POOL_FOREIGN_MIN_SPAN_H: '2', POOL_BYPASS_MIN_SPAN_H: '9999' } }),
  });
  assert.equal(run.code, 0, `run\n${run.stdout}\n${run.stderr}`);
  const bodies = api.state.issues.map((i) => i.body);
  assert.ok(bodies.length >= 1, 'tracker exists (created or updated)');
  assert.ok(
    bodies.some((b) => b.includes(`| foreign | ${FW_WS} |`)),
    `foreign row present\n${bodies.join('\n---\n')}`,
  );
  assert.match(bodies.find((b) => b.includes(`| foreign | ${FW_WS} |`)), /sustained foreign direct-Postgres dialer/);
});

test('pool tracker: --dry-run makes no writes', { skip: !ledgerUp && 'local ledger unreachable' }, async (t) => {
  seedBypass(HOURLY_BYPASS);
  t.after(() => cleanLedger());
  const api = await startFakeGitHub({ issues: [] });
  t.after(() => api.close());

  const run = await runTracker({ env: trackerEnv({ base: api.base }), args: ['--dry-run'] });
  assert.equal(run.code, 0);
  assert.match(run.stdout, /decision = (CREATE|NONE|UPDATE|CLOSE)/);
  assert.equal(api.state.issues.length, 0, 'dry run must not create');
});
