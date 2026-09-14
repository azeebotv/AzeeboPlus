/**
 * Integration test for the PR-comment pass of scripts/ci-dark-watchdog.mjs —
 * the bot runs as a REAL subprocess against a fake GitHub API implementing
 * the surface it touches:
 *
 *   GET  /repos/:o/:r/pulls?state=open           open PR list
 *   GET  /repos/:o/:r/actions/runs?head_sha=…    runs for a PR head sha
 *   GET  /repos/:o/:r/actions/runs/:id/jobs      jobs + executed steps
 *   GET  /repos/:o/:r/check-runs/:id/annotations job annotations
 *   POST /repos/:o/:r/issues/:n/comments        create PR comment
 *   GET  /repos/:o/:r/issues/:n/comments        list existing comments
 *   PATCH /repos/:o/:r/issues/comments/:id      upsert in place
 *
 * Covered: dark head → one marker comment created (with the billing cause and
 * the not-your-code framing); real-failure head → NO comment (the classifier's
 * conservatism is the point); identical re-sweep → zero writes; changed
 * outage → update in place, never a duplicate; no token → silent skip.
 *
 * The issue-sweep half of the CLI is intentionally starved here (the fake
 * `/actions/runs` without a head_sha returns no branch runs → decision
 * "none"), so these tests isolate the PR pass.
 *
 * Run: `node --test scripts/__tests__/ci-dark-watchdog.integration.test.mjs`
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { startFakeGitHub } from './helpers/fake-github-server.mjs';
import { PR_COMMENT_MARKER } from '../lib/ci-dark-watchdog-core.mjs';

const WATCHDOG = fileURLToPath(new URL('../ci-dark-watchdog.mjs', import.meta.url));

// ── Bot subprocess driver ───────────────────────────────────────────────────

function runBot(env) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [WATCHDOG], {
      env: { PATH: process.env.PATH ?? '', ...env },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => (stdout += d));
    child.stderr.on('data', (d) => (stderr += d));
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new Error(`bot run timed out\nstdout: ${stdout}\nstderr: ${stderr}`));
    }, 15000);
    child.on('error', (e) => {
      clearTimeout(timer);
      reject(e);
    });
    child.on('close', (code) => resolve({ code, stdout, stderr }));
  });
}

// ── Fixtures ────────────────────────────────────────────────────────────────

const SHA_DARK = 'd'.repeat(40);
const SHA_REAL = 'e'.repeat(40);
const BILLING_ANNOTATION =
  'The job was not started because recent account payments have failed or your spending limit needs to be increased.';

const darkRun = (id, name) => ({
  id,
  name,
  conclusion: 'failure',
  createdAt: '2026-09-14T21:43:00Z',
  updatedAt: '2026-09-14T21:43:01Z',
  jobs: [{ name: 'job', conclusion: 'failure', steps: [], annotations: [BILLING_ANNOTATION] }],
});

const realFailureRun = {
  id: 9902,
  name: 'Lint',
  conclusion: 'failure',
  createdAt: '2026-09-01T18:58:12Z',
  updatedAt: '2026-09-01T19:05:00Z',
  jobs: [{ name: 'lint', conclusion: 'failure', steps: Array(8).fill('success') }],
};

const baseHeadRuns = () => ({
  [SHA_DARK]: [darkRun(9900, 'PR Checks'), darkRun(9901, 'Lint')],
  [SHA_REAL]: [realFailureRun],
});

const basePullRequests = () => [
  { number: 85, headSha: SHA_DARK },
  { number: 86, headSha: SHA_REAL },
];

function botEnv(base) {
  return {
    GITHUB_REPOSITORY: 'acme/repo',
    GITHUB_API_BASE_URL: base,
    GITHUB_TOKEN: 'ghs_watchdog_token',
  };
}

async function withServer(t, options) {
  const api = await startFakeGitHub(options);
  t.after(() => api.close());
  return api;
}

// ── The integration tests ───────────────────────────────────────────────────

test('dark head sha → creates exactly one marker comment; real-failure head → none', async (t) => {
  const api = await withServer(t, { pullRequests: basePullRequests(), headRuns: baseHeadRuns() });

  const { code, stdout, stderr } = await runBot(botEnv(api.base));
  assert.equal(code, 0, `bot should exit 0\nstdout: ${stdout}\nstderr: ${stderr}`);
  assert.match(stdout, /PR #85 dark-comment created/);

  // Exactly one POST to the PR comment collection, for #85 only.
  const creates = api.requests.filter(
    (r) => r.method === 'POST' && /\/issues\/\d+\/comments$/.test(r.url)
  );
  assert.equal(creates.length, 1);
  assert.match(creates[0].url, /\/issues\/85\/comments$/);

  const comment = JSON.parse(creates[0].body);
  assert.ok(comment.body.includes(PR_COMMENT_MARKER));
  assert.ok(comment.body.includes('not a code failure'));
  assert.ok(bodyIncludes(comment.body, 'nothing to debug'));
  assert.ok(bodyIncludes(comment.body, 'billing block'));
  assert.ok(bodyIncludes(comment.body, 'PR Checks'));
  assert.ok(bodyIncludes(comment.body, SHA_DARK.slice(0, 7)));
});

test('idempotent: an identical re-sweep writes nothing (no duplicate, no churn)', async (t) => {
  const api = await withServer(t, { pullRequests: basePullRequests(), headRuns: baseHeadRuns() });

  const first = await runBot(botEnv(api.base));
  assert.equal(first.code, 0);
  const afterFirst = api.requests.length;

  const second = await runBot(botEnv(api.base));
  assert.equal(second.code, 0);
  assert.match(second.stdout, /PR #85 dark-comment unchanged/);

  const newWrites = api.requests
    .slice(afterFirst)
    .filter(
      (r) =>
        (r.method === 'POST' && /\/comments$/.test(r.url)) ||
        (r.method === 'PATCH' && /\/comments\/\d+$/.test(r.url))
    );
  assert.equal(newWrites.length, 0, 'no comment writes on an unchanged sweep');
});

test('changed outage → updates the existing comment in place (never a duplicate)', async (t) => {
  const api = await withServer(t, { pullRequests: basePullRequests(), headRuns: baseHeadRuns() });

  const first = await runBot(botEnv(api.base));
  assert.equal(first.code, 0);
  assert.match(first.stdout, /created/);

  // The outage grows: another workflow on the same head also dies dark.
  // Injected in the fake server's REST shape (its derived store is keyed by
  // run id for jobs + annotations — see fake-github-server.mjs).
  api.state.jobsByRunId[9903] = [{ id: 990300, name: 'job', conclusion: 'failure', steps: [] }];
  api.state.annotationsByJobId[990300] = [BILLING_ANNOTATION];
  api.state.runsBySha[SHA_DARK].push({
    id: 9903,
    name: 'Dockerized E2E',
    conclusion: 'failure',
    html_url: 'http://x/actions/runs/9903',
    head_sha: SHA_DARK,
    created_at: '2026-09-14T21:43:00Z',
    updated_at: '2026-09-14T21:43:01Z',
  });

  const second = await runBot(botEnv(api.base));
  assert.equal(second.code, 0);
  assert.match(second.stdout, /PR #85 dark-comment updated/);

  const patches = api.requests.filter(
    (r) => r.method === 'PATCH' && /\/issues\/comments\/\d+$/.test(r.url)
  );
  assert.equal(patches.length, 1, 'updated in place');
  assert.match(JSON.parse(patches[0].body).body, /Dockerized E2E/);
  const creates = api.requests.filter(
    (r) => r.method === 'POST' && /\/issues\/\d+\/comments$/.test(r.url)
  );
  assert.equal(creates.length, 1, 'still exactly one comment total');
});

test('no open PR carries dark batteries → the pass is a loud no-op', async (t) => {
  const api = await withServer(t, {
    pullRequests: [{ number: 85, headSha: SHA_REAL }],
    headRuns: { [SHA_REAL]: [realFailureRun] },
  });

  const { code, stdout } = await runBot(botEnv(api.base));
  assert.equal(code, 0);
  assert.match(stdout, /no open PRs carry dark head batteries/);
  assert.equal(api.requests.filter((r) => r.method === 'POST').length, 0);
});

test('identity: no GITHUB_TOKEN → silent skip, zero API calls', async (t) => {
  const api = await withServer(t, { pullRequests: basePullRequests(), headRuns: baseHeadRuns() });

  const { code, stdout } = await runBot({
    GITHUB_REPOSITORY: 'acme/repo',
    GITHUB_API_BASE_URL: api.base,
    // no token
  });
  assert.equal(code, 0);
  assert.match(stdout, /skipping/);
  assert.equal(api.requests.length, 0, 'not a single request without a token');
});

function bodyIncludes(body, needle) {
  return body.includes(needle);
}
