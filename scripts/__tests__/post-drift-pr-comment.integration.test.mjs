/**
 * Integration test for scripts/post-drift-pr-comment.mjs — the bot is run as
 * a REAL subprocess (real env vars, real argv, real exit codes) against a
 * fake GitHub API server implementing exactly the surface the bot touches:
 *
 *   GET/POST /repos/:owner/:repo/issues/:n/comments   (list + create)
 *   PATCH   /comments/:id                             (upsert in place)
 *   GET     /repos/.../actions/workflows/schema-lock-nightly.yml/runs
 *   GET     /repos/.../actions/runs/:id/artifacts
 *   GET     /repos/.../actions/artifacts/:id/zip      (upload-artifact zip)
 *
 * The gates' report.json files are materialized into a temp dir pointed at
 * via the DRIFT_REPORTS_BASE seam; nightly live reports come back as real
 * artifact zips (built byte-by-byte with the shared fixture helper). No
 * network, no repo state touched.
 *
 * Covered paths: create-then-upsert, green-quiet (no post), red→green clears
 * in place, no-report no-op, no-PR no-op, live-fetch degradation, live-only
 * alarm forcing a post, and API failure → exit 1.
 *
 * Run: `node --test scripts/__tests__/post-drift-pr-comment.integration.test.mjs`
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildZip } from './helpers/zip-fixture.mjs';
import { COMMENT_MARKER } from '../lib/drift-pr-comment.mjs';

const POSTER = fileURLToPath(new URL('../post-drift-pr-comment.mjs', import.meta.url));

// ── Fake GitHub API server ──────────────────────────────────────────────────

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function json(res, obj, status = 200) {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(JSON.stringify(obj));
}

/**
 * Start the fake API. `artifacts` maps runId → [{id, name, zip: Buffer}];
 * `behavior` can force statuses: { listCommentsStatus, runsStatus }.
 * Every request is recorded in `state.requests` (method, url, auth, body).
 */
async function startServer({ comments = [], runs = [], artifacts = {}, behavior = {} } = {}) {
  const state = { comments: [...comments], nextId: 1000, requests: [] };

  const server = http.createServer(async (req, res) => {
    const body = await readBody(req);
    state.requests.push({ method: req.method, url: req.url, auth: req.headers.authorization ?? null, body });
    const p = new URL(req.url, 'http://x').pathname;

    const mComments = /^\/repos\/[^/]+\/[^/]+\/issues\/(\d+)\/comments$/.exec(p);
    if (mComments) {
      if (behavior.listCommentsStatus) {
        res.writeHead(behavior.listCommentsStatus);
        res.end('boom');
        return;
      }
      if (req.method === 'GET') return json(res, state.comments);
      if (req.method === 'POST') {
        const { body: commentBody } = JSON.parse(body);
        const id = state.nextId++;
        // Absolute URL pointing back at THIS server (the bot PATCHes the
        // comment's `url` exactly like the real GitHub API contract).
        const created = { id, url: `${base}/comments/${id}`, body: commentBody };
        state.comments.push(created);
        return json(res, created, 201);
      }
    }

    const mComment = /^\/comments\/(\d+)$/.exec(p);
    if (mComment && req.method === 'PATCH') {
      const { body: commentBody } = JSON.parse(body);
      const existing = state.comments.find((c) => String(c.id) === mComment[1]);
      if (!existing) {
        res.writeHead(404);
        res.end();
        return;
      }
      existing.body = commentBody;
      return json(res, existing);
    }

    if (/^\/repos\/[^/]+\/[^/]+\/actions\/workflows\/schema-lock-nightly\.yml\/runs$/.test(p)) {
      if (behavior.runsStatus) {
        res.writeHead(behavior.runsStatus);
        res.end('boom');
        return;
      }
      return json(res, {
        total_count: runs.length,
        workflow_runs: runs.map((r) => ({
          id: r.id,
          html_url: `http://127.0.0.1/actions/runs/${r.id}`,
          head_sha: 'a'.repeat(40),
          created_at: '2026-09-11T04:30:00Z',
        })),
      });
    }

    const mArtifacts = /^\/repos\/[^/]+\/[^/]+\/actions\/runs\/(\d+)\/artifacts$/.exec(p);
    if (mArtifacts) {
      const list = artifacts[mArtifacts[1]] ?? [];
      return json(res, { total_count: list.length, artifacts: list.map((a) => ({ id: a.id, name: a.name })) });
    }

    const mZip = /^\/repos\/[^/]+\/[^/]+\/actions\/artifacts\/(\d+)\/zip$/.exec(p);
    if (mZip) {
      const found = Object.values(artifacts).flat().find((a) => String(a.id) === mZip[1]);
      if (!found?.zip) {
        res.writeHead(404);
        res.end('no artifact');
        return;
      }
      res.writeHead(200, { 'content-type': 'application/zip' });
      res.end(found.zip);
      return;
    }

    res.writeHead(404);
    res.end('not found');
  });

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  return {
    base,
    state,
    requests: state.requests,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}

// ── Bot subprocess driver ───────────────────────────────────────────────────

function runBot({ env, args = [] }) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [POSTER, ...args], {
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
    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({ code, stdout, stderr });
    });
  });
}

/**
 * Env for one bot run. `pr: null` simulates a push run (no PR context);
 * `token: null` omits GITHUB_TOKEN entirely (App not configured),
 * `token: ''` passes an empty one (mint step skipped, same semantics).
 */
function botEnv({ base, reportsDir, pr = 7, token = 'ghs_driftbot_app_token', extra = {} }) {
  return {
    PATH: process.env.PATH ?? '',
    GITHUB_REPOSITORY: 'acme/repo',
    GITHUB_API_BASE_URL: base,
    DRIFT_REPORTS_BASE: reportsDir,
    ...(token != null ? { GITHUB_TOKEN: token } : {}),
    ...(pr != null ? { PR_NUMBER: String(pr) } : {}),
    ...extra,
  };
}

// ── Gate report fixtures + temp report dir ──────────────────────────────────

const migReport = (drifted = 0) => ({
  gate: 'prisma-migrations',
  generatedAt: '2026-09-11T00:00:00.000Z',
  total: 2,
  clean: 2 - drifted,
  drifted,
  broken: 0,
  services: [
    { service: 'services/core/user-service', status: drifted > 0 ? 'DRIFTED' : 'CLEAN', detail: drifted > 0 ? '1 diff statement(s)' : '' },
    { service: 'services/core/wallet-service', status: 'CLEAN', detail: '' },
  ],
});

const deployReport = (drifted = 0) => ({ ...migReport(drifted), gate: 'deployed-schema-lock', drifted, broken: 0 });

const liveReportOk = {
  env: 'staging',
  generatedAt: '2026-09-11T04:30:00.000Z',
  summary: { total: 1, clean: 1 },
  services: [{ service: 'services/core/user-service', status: 'CLEAN', detail: '' }],
};

const liveReportBad = {
  env: 'staging',
  generatedAt: '2026-09-11T04:30:00.000Z',
  summary: { total: 1, clean: 0 },
  services: [{ service: 'services/core/user-service', status: 'BLOCKED-LEDGER', detail: '1 failed-deploy tombstone(s)' }],
};

/** Materialize gate reports into a fresh temp dir (cleaned up after the test). */
async function makeReports(t, { migration = null, deploy = null } = {}) {
  const dir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'drift-bot-reports-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const write = (rel, report) =>
    fs.promises.mkdir(path.join(dir, path.dirname(rel)), { recursive: true }).then(() =>
      fs.promises.writeFile(path.join(dir, rel), JSON.stringify(report))
    );
  if (migration) await write('.check-prisma-drift-out/report.json', migration);
  if (deploy) await write('.check-prisma-deploy-diff-out/report.json', deploy);
  return dir;
}

/** One nightly artifact (real zip) served for run `runId`. */
function nightlyArtifact({ id, env = 'staging', report }) {
  const zip = buildZip([
    { name: `.check-live-schema-lock-out/${env}/services__core__user-service.sql`, data: Buffer.from('-- diff'), method: 8 },
    { name: `.check-live-schema-lock-out/${env}/report-${env}.json`, data: Buffer.from(JSON.stringify(report)), method: 8 },
  ]);
  return { id, name: `schema-lock-report-${env}-9001`, zip };
}

async function withServer(t, options) {
  const api = await startServer(options);
  t.after(() => api.close());
  return api;
}

// ── The integration tests ───────────────────────────────────────────────────

test('upsert: creates on first red run, updates in place on the second', async (t) => {
  const api = await withServer(t, {
    runs: [{ id: 101 }],
    artifacts: { 101: [nightlyArtifact({ id: 1, report: liveReportOk })] },
  });
  const reportsDir = await makeReports(t, { migration: migReport(1), deploy: deployReport(0) });

  const first = await runBot({ env: botEnv({ base: api.base, reportsDir }) });
  assert.equal(first.code, 0, `first run should succeed\nstdout: ${first.stdout}\nstderr: ${first.stderr}`);
  assert.equal(api.state.comments.length, 1, 'exactly one comment after the first run');
  const created = api.state.comments[0];
  assert.ok(created.body.startsWith(COMMENT_MARKER), 'comment carries the upsert marker');
  assert.match(created.body, /### 🚨 Schema drift detected — 1 service\(s\) at the gates/);
  assert.match(created.body, /#### Live environments/);
  assert.match(created.body, /Environment: \*\*staging\*\* — schema lock holds/);
  // GitHub auth actually happened, under the App identity.
  const commentReqs = api.requests.filter((r) => r.url.includes('/comments'));
  assert.ok(commentReqs.length >= 2, 'list + create both hit the comments endpoint');
  assert.ok(commentReqs.every((r) => r.auth === 'Bearer ghs_driftbot_app_token'), 'every comment call carries the App token');

  // Second run, drift got worse — must UPDATE the same comment, not add one.
  const reportsDir2 = await makeReports(t, { migration: migReport(2), deploy: deployReport(0) });
  const second = await runBot({ env: botEnv({ base: api.base, reportsDir: reportsDir2 }) });
  assert.equal(second.code, 0, `second run should succeed\nstdout: ${second.stdout}\nstderr: ${second.stderr}`);
  assert.equal(api.state.comments.length, 1, 'upsert must not create a duplicate');
  assert.match(api.state.comments[0].body, /### 🚨 Schema drift detected — 2 service\(s\) at the gates/);
  assert.match(second.stdout, /updated comment/);
});

test('green-quiet: clean gates and clean live environments post nothing', async (t) => {
  const api = await withServer(t, {
    runs: [{ id: 102 }],
    artifacts: { 102: [nightlyArtifact({ id: 1, report: liveReportOk })] },
  });
  const reportsDir = await makeReports(t, { migration: migReport(0), deploy: deployReport(0) });

  const res = await runBot({ env: botEnv({ base: api.base, reportsDir }) });
  assert.equal(res.code, 0);
  assert.equal(api.state.comments.length, 0, 'no comment posted on a fully green run');
  assert.match(res.stdout, /skipping to keep the PR quiet/);
});

test('red→green: a prior alarm comment is cleared in place on a green run', async (t) => {
  const api = await withServer(t, {
    runs: [{ id: 103 }],
    artifacts: { 103: [nightlyArtifact({ id: 1, report: liveReportOk })] },
    comments: [{ id: 555, url: 'PLACEHOLDER', body: `${COMMENT_MARKER}\n### 🚨 Schema drift detected — old alarm` }],
  });
  // The PATCH target must be the fake server itself (the bot PATCHes the
  // comment's `url`, exactly like the real GitHub API contract).
  api.state.comments[0].url = `${api.base}/comments/555`;
  const reportsDir = await makeReports(t, { migration: migReport(0), deploy: deployReport(0) });

  const res = await runBot({ env: botEnv({ base: api.base, reportsDir }) });
  assert.equal(res.code, 0);
  assert.equal(api.state.comments.length, 1, 'comment is updated, not duplicated or deleted');
  assert.match(api.state.comments[0].body, /### ✅ Schema lock holds/);
  assert.doesNotMatch(api.state.comments[0].body, /old alarm/);
  assert.match(res.stdout, /updated comment 555/);
});

test('no-report: gates never ran → silent no-op (nightly still consulted for live-only alarms)', async (t) => {
  const api = await withServer(t, { runs: [{ id: 104 }], artifacts: {} });
  const reportsDir = await makeReports(t, {}); // no report.json at all

  const res = await runBot({ env: botEnv({ base: api.base, reportsDir }) });
  assert.equal(res.code, 0);
  assert.equal(api.state.comments.length, 0, 'nothing posted');
  assert.match(res.stdout, /no gate reports present/);
  // Design choice, pinned here: the nightly fetch happens BEFORE the
  // no-report bail-out so that if the gates crashed but the nightly world
  // shows real drift, a live-only alarm can still post. With no nightly
  // artifacts present, the comment is null and nothing ships.
  assert.equal(api.requests.filter((r) => r.url.includes('/actions/workflows/')).length, 1, 'nightly consulted exactly once');
});

test('no-PR context: push runs exit 0 and post nothing', async (t) => {
  const api = await withServer(t, { runs: [], artifacts: {} });
  const reportsDir = await makeReports(t, { migration: migReport(1) });

  const res = await runBot({ env: botEnv({ base: api.base, reportsDir, pr: null }) });
  assert.equal(res.code, 0);
  assert.equal(api.state.comments.length, 0);
  assert.match(res.stdout, /no pull request context/);
  assert.equal(api.requests.length, 0, 'no GitHub API call at all without a PR');
});

test('live-fetch failure degrades: gate-only comment still ships, exit 0', async (t) => {
  const api = await withServer(t, { runs: [], artifacts: {}, behavior: { runsStatus: 500 } });
  const reportsDir = await makeReports(t, { migration: migReport(1) });

  const res = await runBot({ env: botEnv({ base: api.base, reportsDir }) });
  assert.equal(res.code, 0, 'nightly unavailability must not fail the bot');
  assert.equal(api.state.comments.length, 1);
  assert.match(api.state.comments[0].body, /### 🚨 Schema drift detected/);
  assert.doesNotMatch(api.state.comments[0].body, /Live environments/);
  assert.match(res.stderr, /could not fetch nightly live reports/);
});

test('live-only alarm: clean gates + violating nightly report still posts', async (t) => {
  const api = await withServer(t, {
    runs: [{ id: 105 }],
    artifacts: { 105: [nightlyArtifact({ id: 1, report: liveReportBad })] },
  });
  const reportsDir = await makeReports(t, { migration: migReport(0), deploy: deployReport(0) });

  const res = await runBot({ env: botEnv({ base: api.base, reportsDir }) });
  assert.equal(res.code, 0);
  assert.equal(api.state.comments.length, 1, 'world drift must surface even when the gates are green');
  assert.match(api.state.comments[0].body, /### 🚨 Schema drift detected — 1 in live environments/);
  assert.match(api.state.comments[0].body, /🔴 BLOCKED-LEDGER/);
});

test('--no-live: live section skipped, no nightly API calls at all', async (t) => {
  const api = await withServer(t, { runs: [{ id: 106 }], artifacts: {} });
  const reportsDir = await makeReports(t, { migration: migReport(1) });

  const res = await runBot({ env: botEnv({ base: api.base, reportsDir }), args: ['--no-live'] });
  assert.equal(res.code, 0);
  assert.equal(api.requests.filter((r) => r.url.includes('/actions/')).length, 0, '--no-live must not touch the Actions API');
  assert.equal(api.state.comments.length, 1);
  assert.doesNotMatch(api.state.comments[0].body, /Live environments/);
});

test('identity: no GITHUB_TOKEN (App not configured) → skip loudly, zero API calls', async (t) => {
  const api = await withServer(t, { runs: [{ id: 107 }], artifacts: {} });
  const reportsDir = await makeReports(t, { migration: migReport(1) });

  const res = await runBot({ env: botEnv({ base: api.base, reportsDir, token: null }) });
  assert.equal(res.code, 0, 'unconfigured App is a designed skip, not a failure');
  assert.equal(api.state.comments.length, 0, 'nothing posted without an identity');
  assert.equal(api.requests.length, 0, 'no GitHub API call is attempted without a token');
  assert.match(res.stdout, /no GITHUB_TOKEN/);
  assert.match(res.stdout, /not configured for this repo; skipping comment/);
});

test('identity: empty-string token (mint step skipped) skips the same way', async (t) => {
  const api = await withServer(t, { runs: [{ id: 108 }], artifacts: {} });
  const reportsDir = await makeReports(t, { migration: migReport(1) });

  const res = await runBot({ env: botEnv({ base: api.base, reportsDir, token: '' }) });
  assert.equal(res.code, 0);
  assert.equal(api.requests.length, 0);
  assert.match(res.stdout, /no GITHUB_TOKEN/);
});

test('identity: the App token is used for every API call, not just comments', async (t) => {
  const api = await withServer(t, {
    runs: [{ id: 109 }],
    artifacts: { 109: [nightlyArtifact({ id: 1, report: liveReportOk })] },
  });
  const reportsDir = await makeReports(t, { migration: migReport(1) });

  const res = await runBot({ env: botEnv({ base: api.base, reportsDir }) });
  assert.equal(res.code, 0);
  const nightlyReqs = api.requests.filter((r) => r.url.includes('/actions/'));
  assert.ok(nightlyReqs.length > 0, 'nightly artifact reads happened');
  assert.ok(
    api.requests.every((r) => r.auth === 'Bearer ghs_driftbot_app_token'),
    'every request — comments AND artifact reads — carries the App token'
  );
});

test('identity: rejected token (revoked/uninstalled App) → exit 1, not a silent skip', async (t) => {
  const api = await withServer(t, { runs: [], artifacts: {}, behavior: { listCommentsStatus: 401 } });
  const reportsDir = await makeReports(t, { migration: migReport(1) });

  const res = await runBot({ env: botEnv({ base: api.base, reportsDir, token: 'ghs_expired_token' }) });
  assert.equal(res.code, 1, 'a present-but-rejected identity is a real failure');
  assert.match(res.stderr, /Failed to list comments: 401/);
  assert.equal(api.state.comments.length, 0);
});

test('API failure listing comments → exit 1 with a clear error', async (t) => {
  const api = await withServer(t, { runs: [], artifacts: {}, behavior: { listCommentsStatus: 503 } });
  const reportsDir = await makeReports(t, { migration: migReport(1) });

  const res = await runBot({ env: botEnv({ base: api.base, reportsDir }) });
  assert.equal(res.code, 1, 'a real API failure is a real failure');
  assert.match(res.stderr, /Failed to list comments: 503/);
  assert.equal(api.state.comments.length, 0);
});
