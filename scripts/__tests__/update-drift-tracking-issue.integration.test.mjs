/**
 * Integration test for scripts/update-drift-tracking-issue.mjs — the tracker
 * runs as a REAL subprocess against the shared fake GitHub API server,
 * covering the full issue lifecycle:
 *
 *   create on first drift → no-op when the set is unchanged → update when it
 *   changes → close when production is clean → reopen when drift returns
 *
 * plus the identity paths (skip-loudly without a token, App token on every
 * call) and degradation (nightly artifact unavailable → skip, not fail).
 *
 * Run: `node --test scripts/__tests__/update-drift-tracking-issue.integration.test.mjs`
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { buildZip } from './helpers/zip-fixture.mjs';
import { startFakeGitHub } from './helpers/fake-github-server.mjs';
import { ISSUE_MARKER } from '../lib/drift-issue.mjs';

const SCRIPT = fileURLToPath(new URL('../update-drift-tracking-issue.mjs', import.meta.url));

// ── Fixtures ────────────────────────────────────────────────────────────────

const prodReport = (services) => ({
  env: 'production',
  generatedAt: '2026-09-12T04:30:00.000Z',
  services,
});

const blocking = (service, status = 'BLOCKED-LEDGER', detail = '1 tombstone') => ({ service, status, detail });
const clean = (service) => ({ service, status: 'CLEAN', detail: '' });

function nightlyArtifact(id, report) {
  const env = report.env;
  return {
    id,
    name: `schema-lock-report-${env}-9001`,
    zip: buildZip([
      { name: `.check-live-schema-lock-out/${env}/report-${env}.json`, data: Buffer.from(JSON.stringify(report)), method: 8 },
    ]),
  };
}

const WALLET_BAD = prodReport([clean('services/core/user-service'), blocking('services/core/wallet-service')]);
const MORE_BAD = prodReport([
  clean('services/core/user-service'),
  blocking('services/core/wallet-service'),
  blocking('services/core/media-service', 'DRIFT-REVIEW'),
]);
const ALL_CLEAN = prodReport([clean('services/core/user-service'), clean('services/core/wallet-service')]);

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

function trackerEnv({ base, pr = null, token = 'ghs_driftbot_app_token', extra = {} }) {
  return {
    PATH: process.env.PATH ?? '',
    GITHUB_REPOSITORY: 'acme/repo',
    GITHUB_API_BASE_URL: base,
    ...(token != null ? { GITHUB_TOKEN: token } : {}),
    ...extra,
  };
}

// ── The lifecycle ───────────────────────────────────────────────────────────

test('lifecycle: create → no-op on unchanged night → update on set change', async (t) => {
  let api = await startFakeGitHub({
    runs: [{ id: 901 }],
    artifacts: { 901: [nightlyArtifact(1, WALLET_BAD)] },
  });
  t.after(() => api.close());

  // Night 1: drift appears → CREATE.
  const first = await runTracker({ env: trackerEnv({ base: api.base }) });
  assert.equal(first.code, 0, `first run\n${first.stdout}\n${first.stderr}`);
  assert.equal(api.state.issues.length, 1);
  const created = api.state.issues[0];
  assert.match(created.title, /Schema lock violated in production/);
  assert.ok(created.body.includes(ISSUE_MARKER), 'issue body carries the tracker marker');
  assert.match(created.body, /### 🚨 1 service\(s\) violate the schema lock/);
  assert.match(created.body, /\| services\/core\/wallet-service \| BLOCKED-LEDGER \|/);
  assert.deepEqual(created.labels, ['schema-drift']);
  // Created under the App identity.
  const createReq = api.requests.find((r) => r.method === 'POST' && r.url.endsWith('/repos/acme/repo/issues'));
  assert.equal(createReq.auth, 'Bearer ghs_driftbot_app_token');

  // Night 2: same drift → NONE (no duplicate issue, no edit).
  const second = await runTracker({ env: trackerEnv({ base: api.base }) });
  assert.equal(second.code, 0);
  assert.match(second.stdout, /decision = NONE \(issue already up to date\)|issue already up to date/);
  assert.equal(api.state.issues.length, 1, 'no duplicate issue on an unchanged night');
  assert.equal(api.requests.filter((r) => r.method === 'PATCH' && /\/issues\/\d+$/.test(r.url)).length, 0, 'no noisy edit on an unchanged night');

  // Night 3: drift grows → UPDATE in place, same issue number. The fake
  // server reads its fixtures from closure, so a new night is a restart with
  // the new artifact and the existing tracker issue seeded.
  await api.close();
  api = await startFakeGitHub({
    runs: [{ id: 902 }],
    artifacts: { 902: [nightlyArtifact(2, MORE_BAD)] },
    issues: [{ number: created.number, title: created.title, body: created.body, labels: created.labels }],
  });
  t.after(() => api.close());

  const third = await runTracker({ env: trackerEnv({ base: api.base }) });
  assert.equal(third.code, 0, `third run\n${third.stdout}\n${third.stderr}`);
  assert.match(third.stdout, /updated tracking issue #\d+|decision = UPDATE/);
  assert.equal(api.state.issues.length, 1, 'update must not duplicate the tracker');
  assert.match(api.state.issues[0].body, /### 🚨 2 service\(s\) violate the schema lock/);
  assert.match(api.state.issues[0].body, /services\/core\/media-service/);
});

test('lifecycle: close on clean night, reopen when drift returns', async (t) => {
  // Existing OPEN tracker from a previous night; tonight production is clean.
  let api = await startFakeGitHub({
    runs: [{ id: 901 }],
    artifacts: { 901: [nightlyArtifact(1, ALL_CLEAN)] },
    issues: [
      {
        number: 12,
        title: 'Schema lock violated in production — nightly report',
        body: `${ISSUE_MARKER}\n### 🚨 1 service(s) violate the schema lock in production\n\n| Service | Status | Detail |\n|---|---|---|\n| services/core/wallet-service | BLOCKED-LEDGER | 1 tombstone |`,
      },
    ],
  });
  t.after(() => api.close());

  const closedRun = await runTracker({ env: trackerEnv({ base: api.base }) });
  assert.equal(closedRun.code, 0, `close run\n${closedRun.stdout}\n${closedRun.stderr}`);
  assert.match(closedRun.stdout, /closed tracking issue #12/);
  assert.equal(api.state.issues[0].state, 'closed');
  assert.match(api.state.issues[0].body, /### ✅ Schema lock holds in production/);

  // Later: drift returns → the closed tracker is REOPENED (not duplicated).
  await api.close();
  api = await startFakeGitHub({
    runs: [{ id: 902 }],
    artifacts: { 902: [nightlyArtifact(2, WALLET_BAD)] },
    issues: [{ number: 12, title: 'Schema lock violated in production — nightly report', body: api.state.issues[0].body, state: 'closed' }],
  });
  t.after(() => api.close());

  const reopenRun = await runTracker({ env: trackerEnv({ base: api.base }) });
  assert.equal(reopenRun.code, 0, `reopen run\n${reopenRun.stdout}\n${reopenRun.stderr}`);
  assert.match(reopenRun.stdout, /reopened tracking issue #12/);
  assert.equal(api.state.issues[0].state, 'open');
  assert.match(api.state.issues[0].body, /### 🚨 1 service\(s\) violate the schema lock/);
  assert.equal(api.state.issues.length, 1, 'reopening must not create a second tracker');
});

test('identity: no token (App unconfigured) → skip loudly, zero API calls', async (t) => {
  const api = await startFakeGitHub({
    runs: [{ id: 901 }],
    artifacts: { 901: [nightlyArtifact(1, WALLET_BAD)] },
  });
  t.after(() => api.close());

  const res = await runTracker({ env: trackerEnv({ base: api.base, token: null }) });
  assert.equal(res.code, 0, `unconfigured App is a designed skip\nstdout: ${res.stdout}\nstderr: ${res.stderr}`);
  assert.equal(api.state.issues.length, 0);
  assert.equal(api.requests.length, 0, 'no API call attempted without a token');
  assert.match(res.stdout, /no GITHUB_TOKEN/);
});

test('degradation: nightly artifact unavailable → skip, exit 0 (nightly is the signal owner)', async (t) => {
  const api = await startFakeGitHub({ runs: [], artifacts: {} });
  t.after(() => api.close());

  const res = await runTracker({ env: trackerEnv({ base: api.base }) });
  assert.equal(res.code, 0);
  assert.equal(api.state.issues.length, 0);
  assert.match(res.stdout, /no nightly production report found/);
});

test('API failure: issue create 500 → exit 1 with the real error', async (t) => {
  const api = await startFakeGitHub({
    runs: [{ id: 901 }],
    artifacts: { 901: [nightlyArtifact(1, WALLET_BAD)] },
    behavior: { createIssueStatus: 500 },
  });
  t.after(() => api.close());

  const res = await runTracker({ env: trackerEnv({ base: api.base }) });
  assert.equal(res.code, 1, 'a real API failure is a real failure');
  assert.match(res.stderr, /issue create failed: HTTP 500/);
  assert.equal(api.state.issues.length, 0);
});

test('search failure: 503 on /search/issues → exit 1 (not a silent create-duplicate)', async (t) => {
  const api = await startFakeGitHub({
    runs: [{ id: 901 }],
    artifacts: { 901: [nightlyArtifact(1, WALLET_BAD)] },
    behavior: { searchIssuesStatus: 503 },
  });
  t.after(() => api.close());

  const res = await runTracker({ env: trackerEnv({ base: api.base }) });
  assert.equal(res.code, 1);
  assert.match(res.stderr, /issue search failed: HTTP 503/);
  assert.equal(api.state.issues.length, 0, 'never create a duplicate when the search itself failed');
});

test('dry-run: decides and prints but never writes', async (t) => {
  const api = await startFakeGitHub({
    runs: [{ id: 901 }],
    artifacts: { 901: [nightlyArtifact(1, WALLET_BAD)] },
  });
  t.after(() => api.close());

  const res = await runTracker({ env: trackerEnv({ base: api.base }), args: ['--dry-run'] });
  assert.equal(res.code, 0);
  assert.match(res.stdout, /decision = CREATE/);
  assert.equal(api.state.issues.length, 0, 'dry-run must not create the issue');
});
