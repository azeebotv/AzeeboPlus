/**
 * Integration test for scripts/sweep-drift-tracker.mjs — the weekly
 * staleness sweep runs as a REAL subprocess against the shared fake GitHub
 * API server (tracker search + PATCH) and a fake `psql` shim on PATH
 * (scripts/__tests__/helpers/psql-shim.sh) that simulates database
 * existence, per-database probe failures, and a dead host. Every probe is
 * logged by the shim, so tests assert exactly which databases were checked.
 *
 * Covered: remove+note (decommissioned service leaves the tracker), keep
 * (all databases still exist → zero edits), close-when-emptied,
 * dead-host abort (unverifiable host never sweeps), no-open-tracker no-op,
 * dry-run, and the skip-loudly identity gate.
 *
 * Run: `node --test scripts/__tests__/sweep-drift-tracker.integration.test.mjs`
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { startFakeGitHub } from './helpers/fake-github-server.mjs';
import { ISSUE_MARKER } from '../lib/drift-issue.mjs';

const SCRIPT = fileURLToPath(new URL('../sweep-drift-tracker.mjs', import.meta.url));
// The shim is an executable literally named `psql` so PATH lookup finds it
// (psql-shim.sh would be ignored by execFileSync('psql', …)).
const PSQL_SHIM_DIR = fileURLToPath(new URL('./helpers/psql-shim', import.meta.url));

// ── Fixtures ────────────────────────────────────────────────────────────────

const blocking = (service, status = 'BLOCKED-LEDGER', detail = '1 tombstone') => ({ service, status, detail });

function trackerIssue(number, services) {
  const rows = services.map((s) => `| ${s.service} | ${s.status} | ${s.detail} |`).join('\n');
  return {
    number,
    title: 'Schema lock violated in production — nightly report',
    body: `${ISSUE_MARKER}\n### 🚨 ${services.length} service(s) violate the schema lock in production\n\n_Live databases, reported nightly._\n\n| Service | Status | Detail |\n|---|---|---|\n${rows}`,
  };
}

// ── Driver ──────────────────────────────────────────────────────────────────

function makeProbeState({ existing = [], fails = [], failAll = false } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sweep-probe-'));
  const writeNames = (file, names) => {
    if (names.length > 0) fs.writeFileSync(path.join(dir, file), names.join('\n') + '\n');
  };
  writeNames('existing', existing);
  writeNames('fails', fails);
  const log = path.join(dir, 'probes.log');
  return {
    dir,
    log,
    cleanup: () => fs.rmSync(dir, { recursive: true, force: true }),
    env: {
      ...(existing.length > 0 ? { SWEEP_TEST_EXISTING: path.join(dir, 'existing') } : {}),
      ...(fails.length > 0 ? { SWEEP_TEST_FAILS: path.join(dir, 'fails') } : {}),
      ...(failAll ? { SWEEP_TEST_FAIL_ALL: '1' } : {}),
      SWEEP_TEST_LOG: log,
    },
  };
}

function runSweep({ env, args = [] }) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [SCRIPT, ...args], {
      env: { PATH: `${PSQL_SHIM_DIR}:${process.env.PATH ?? ''}`, ...env },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => (stdout += d));
    child.stderr.on('data', (d) => (stderr += d));
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new Error(`sweep run timed out\nstdout: ${stdout}\nstderr: ${stderr}`));
    }, 15000);
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

function sweepEnv({ base, token = 'ghs_driftbot_app_token', probe, extra = {} }) {
  return {
    PATH: `${PSQL_SHIM_DIR}:${process.env.PATH ?? ''}`,
    GITHUB_REPOSITORY: 'acme/repo',
    GITHUB_API_BASE_URL: base,
    // The shim ignores the URL; the sweep's URL parsing must still accept it.
    LIVE_DB_URL_BASE: 'postgresql://probe:probe@dbhost.internal:5432',
    ...(token != null ? { GITHUB_TOKEN: token } : {}),
    ...(probe ? probe.env : {}),
    ...extra,
  };
}

const patchCalls = (api) => api.requests.filter((r) => r.method === 'PATCH' && /\/issues\/\d+$/.test(r.url));
const probedNames = (probe) => (fs.existsSync(probe.log) ? fs.readFileSync(probe.log, 'utf8').split('\n').filter(Boolean) : []);

// ── The sweep ───────────────────────────────────────────────────────────────

test('sweep: decommissioned service is removed with a durable note; survivors untouched', async (t) => {
  const api = await startFakeGitHub({
    issues: [
      trackerIssue(12, [
        blocking('services/core/wallet-service'),
        blocking('services/core/dead-service', 'ERROR', 'ledger query failed'),
        blocking('services/core/media-service', 'DRIFT-REVIEW', 'SET NOT NULL'),
      ]),
    ],
  });
  t.after(() => api.close());
  const probe = makeProbeState({ existing: ['azeebo_wallet', 'azeebo_media'] });
  t.after(() => probe.cleanup());

  const res = await runSweep({ env: sweepEnv({ base: api.base, probe }) });
  assert.equal(res.code, 0, `sweep run\nstdout: ${res.stdout}\nstderr: ${res.stderr}`);

  // Every listed service was probed — by the repo's naming convention.
  assert.deepEqual(probedNames(probe).sort(), ['azeebo_dead', 'azeebo_media', 'azeebo_wallet']);

  // Exactly one edit, on the right issue, with no state change (stays open).
  const patches = patchCalls(api);
  assert.equal(patches.length, 1);
  assert.equal(patches[0].url.endsWith('/issues/12'), true);
  const body = JSON.parse(patches[0].body);
  assert.equal(body.state, undefined, 'surviving rows keep the tracker open');

  assert.match(body.body, /services\/core\/wallet-service \| BLOCKED-LEDGER/);
  assert.match(body.body, /services\/core\/media-service \| DRIFT-REVIEW/);
  assert.ok(!body.body.includes('| services/core/dead-service |'), 'the table row is gone…');
  assert.match(body.body, /Weekly staleness sweep \(.*\): removed 1 service\(s\).*services\/core\/dead-service/, '…and the note names it for the audit trail');
  assert.match(res.stdout, /swept tracker #12 — removed 1 decommissioned service\(s\): services\/core\/dead-service/);
});

test('sweep: every listed database still exists → tracker untouched, zero edits', async (t) => {
  const api = await startFakeGitHub({
    issues: [trackerIssue(7, [blocking('services/core/wallet-service'), blocking('services/core/media-service')])],
  });
  t.after(() => api.close());
  const probe = makeProbeState({ existing: ['azeebo_wallet', 'azeebo_media'] });
  t.after(() => probe.cleanup());

  const res = await runSweep({ env: sweepEnv({ base: api.base, probe }) });
  assert.equal(res.code, 0);
  assert.match(res.stdout, /every listed service still has a database/);
  assert.equal(patchCalls(api).length, 0, 'a clean sweep must not edit the tracker');
});

test('sweep: all listed services gone → tracker closed with the resolved body + note', async (t) => {
  const api = await startFakeGitHub({
    issues: [trackerIssue(21, [blocking('services/core/old-service', 'ERROR', 'x'), blocking('services/core/gone-service', 'BLOCKED-LEDGER', 'y')])],
  });
  t.after(() => api.close());
  const probe = makeProbeState({ existing: [] });
  t.after(() => probe.cleanup());

  const res = await runSweep({ env: sweepEnv({ base: api.base, probe }) });
  assert.equal(res.code, 0);
  const patch = patchCalls(api)[0];
  assert.ok(patch, 'the emptied tracker is edited');
  const body = JSON.parse(patch.body);
  assert.equal(body.state, 'closed', 'an all-gone tracker is closed by the sweep');
  assert.match(body.body, /### ✅ Schema lock holds in production/);
  assert.match(body.body, /Weekly staleness sweep/);
  assert.match(res.stdout, /every listed service was gone — tracker closed/);
});

test('sweep: probe failures within budget are tolerated — those entries are kept', async (t) => {
  const api = await startFakeGitHub({
    issues: [trackerIssue(12, [blocking('services/core/dead-service', 'ERROR', 'x'), blocking('services/core/flaky-service', 'ERROR', 'y')])],
  });
  t.after(() => api.close());
  const probe = makeProbeState({ fails: ['azeebo_flaky'] });
  t.after(() => probe.cleanup());

  const res = await runSweep({ env: sweepEnv({ base: api.base, probe }) });
  assert.equal(res.code, 0, `resilient sweep
stdout: ${res.stdout}
stderr: ${res.stderr}`);
  assert.match(res.stderr, /1 probe\(s\) failed \(within budget\).*flaky-service/);
  const patch = patchCalls(api)[0];
  const body = JSON.parse(patch.body);
  assert.match(body.body, /\| services\/core\/flaky-service \| ERROR \|/, 'the unverifiable entry is kept, not guessed about');
  assert.ok(!body.body.includes('| services/core/dead-service |'), 'the verifiably-gone entry is still removed');
});

test('sweep: dead host aborts — an unverifiable host is never mistaken for staleness', async (t) => {
  const api = await startFakeGitHub({
    issues: [trackerIssue(12, [blocking('services/core/wallet-service'), blocking('services/core/media-service'), blocking('services/core/search-service')])],
  });
  t.after(() => api.close());
  const probe = makeProbeState({ failAll: true });
  t.after(() => probe.cleanup());

  const res = await runSweep({ env: sweepEnv({ base: api.base, probe }) });
  assert.equal(res.code, 1, 'aborting is a real failure, not a silent skip');
  assert.match(res.stderr, /aborting sweep.*probe failure/);
  assert.equal(patchCalls(api).length, 0, 'no edit when the host cannot be verified');
});

test('sweep: no open tracker → nothing to sweep, no probes attempted', async (t) => {
  const api = await startFakeGitHub({ issues: [] });
  t.after(() => api.close());
  const probe = makeProbeState({});
  t.after(() => probe.cleanup());

  const res = await runSweep({ env: sweepEnv({ base: api.base, probe }) });
  assert.equal(res.code, 0);
  assert.match(res.stdout, /no open tracker with a violation table/);
  assert.equal(api.requests.filter((r) => r.method !== 'GET' || true).length > 0, true, 'search happened');
  assert.deepEqual(probedNames(probe), [], 'no database was probed without a tracker');
  assert.equal(patchCalls(api).length, 0);
});

test('sweep: dry-run prints the decision and the body but never writes', async (t) => {
  const api = await startFakeGitHub({
    issues: [trackerIssue(12, [blocking('services/core/dead-service', 'ERROR', 'x')])],
  });
  t.after(() => api.close());
  const probe = makeProbeState({ existing: [] });
  t.after(() => probe.cleanup());

  const res = await runSweep({ env: sweepEnv({ base: api.base, probe }), args: ['--dry-run'] });
  assert.equal(res.code, 0);
  assert.match(res.stdout, /decision = .* — would remove 1 decommissioned service\(s\): services\/core\/dead-service/);
  assert.match(res.stdout, /Weekly staleness sweep/);
  assert.equal(patchCalls(api).length, 0, 'dry-run must not edit the tracker');
});

test('sweep: local preview (no GITHUB_REPOSITORY) → no search, nothing to sweep', async (t) => {
  const api = await startFakeGitHub({ issues: [] });
  t.after(() => api.close());
  const probe = makeProbeState({ existing: [] });
  t.after(() => probe.cleanup());

  const env = sweepEnv({ base: api.base, probe });
  delete env.GITHUB_REPOSITORY;
  const res = await runSweep({ env });
  assert.equal(res.code, 0);
  assert.match(res.stdout, /no open tracker with a violation table/);
  assert.equal(api.requests.length, 0, 'a local preview never calls the GitHub API');
  assert.deepEqual(probedNames(probe), [], 'nothing to sweep → no probes');
});

test('sweep: identity gate — no token (App unconfigured) → skip loudly, zero API calls', async (t) => {
  const api = await startFakeGitHub({ issues: [trackerIssue(12, [blocking('services/core/wallet-service')])] });
  t.after(() => api.close());
  const probe = makeProbeState({ existing: [] });
  t.after(() => probe.cleanup());

  const res = await runSweep({ env: sweepEnv({ base: api.base, probe, token: null }) });
  assert.equal(res.code, 0, `unconfigured App is a designed skip\nstdout: ${res.stdout}\nstderr: ${res.stderr}`);
  assert.equal(api.requests.length, 0, 'no API call attempted without a token');
  assert.match(res.stdout, /no GITHUB_TOKEN/);
});
