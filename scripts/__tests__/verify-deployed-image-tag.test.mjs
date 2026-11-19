/**
 * Tests for scripts/verify-deployed-image-tag.sh.
 *
 * The bug these pin: the post-deploy gate used to accept /health and skip the
 * identification when commitSha was missing or "dev", so a deploy that never
 * replaced the old container — or deployed the wrong image tag — went green.
 *
 * Everything runs against loopback HTTP servers: one stands in for the
 * deployed API (/version, /health) and one for the Coolify API
 * (GET /api/v1/applications/<uuid>/envs). No Docker, no network, no daemon.
 *
 * Run via the CI conventions job: `node --test scripts/__tests__/*.test.mjs`
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import http from 'node:http';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..');
const SCRIPT = join(ROOT, 'scripts', 'verify-deployed-image-tag.sh');
const CD = join(ROOT, '.github', 'workflows', 'cd.yml');
const DEPLOYMENT_DOC = join(ROOT, 'docs', 'DEPLOYMENT.md');
const ROLLBACK_WF = join(ROOT, '.github', 'workflows', 'rollback.yml');
const read = (file) => readFileSync(file, 'utf8');

const SHA = '1a2b3c4d5e6f7890abcdef1234567890abcdef12';
const TAG = `staging-${SHA}`;

/** Starts a server with a fixed handler map; returns { url, close }. */
async function serve(handler) {
  const server = http.createServer(handler);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  return { url: `http://127.0.0.1:${port}`, close: () => new Promise((r) => server.close(r)) };
}

/**
 * Fake deployed API. `version` is either a JSON object, a numeric status, or
 * omitted (404). `health` behaves the same once /version has failed.
 */
function deployedApi({ version, health }) {
  return async (req, res) => {
    const send = (spec) => {
      if (spec === undefined) {
        res.writeHead(404, { 'content-type': 'application/json' });
        res.end('{"message":"Not Found"}');
        return;
      }
      if (typeof spec === 'number') {
        res.writeHead(spec, { 'content-type': 'text/plain' });
        res.end('nope');
        return;
      }
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify(spec));
    };
    if ((req.url || '').split('?')[0] === '/version') return send(version);
    if ((req.url || '').split('?')[0] === '/health') return send(health);
    res.writeHead(404);
    res.end();
  };
}

/** Fake Coolify app envs endpoint; 401 when `status` is given. */
function coolifyApi(envs, { status } = {}) {
  return async (req, res) => {
    if (status) {
      res.writeHead(status, { 'content-type': 'application/json' });
      res.end('{"message":"Unauthenticated."}');
      return;
    }
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify(envs));
  };
}

function run(args, env) {
  // execFile, not spawnSync: the fake servers run in this process, and a
  // blocking spawn would deadlock the event loop that has to answer curl.
  return promisify(execFile)('bash', [SCRIPT, ...args], {
    encoding: 'utf8',
    // A clean env: the developer's own COOLIFY_* must never leak into a test.
    env: { PATH: process.env.PATH, ...env },
  }).then(
    (res) => ({ status: 0, stdout: res.stdout, stderr: res.stderr }),
    (err) => ({
      status: typeof err.code === 'number' ? err.code : 1,
      stdout: err.stdout || '',
      stderr: err.stderr || '',
    })
  );
}

const IMAGE_TAG_ENV = (value) => [
  {
    id: 1,
    uuid: 'env-uuid',
    key: 'IMAGE_TAG',
    value,
    real_value: value,
    is_literal: true,
    is_shown_once: false,
  },
];

test('a matching commit and Coolify tag verify', async () => {
  const api = await serve(deployedApi({ version: { commitSha: SHA } }));
  const coolify = await serve(coolifyApi(IMAGE_TAG_ENV(TAG)));
  try {
    const res = await run([TAG, api.url], {
      COOLIFY_API_URL: coolify.url,
      COOLIFY_API_TOKEN: 'token',
      COOLIFY_APP_UUID: 'app-uuid',
    });
    assert.equal(res.status, 0, res.stdout + res.stderr);
    assert.match(res.stdout, new RegExp(`Running artifact matches ${TAG}`));
    assert.match(res.stdout, new RegExp(`Coolify IMAGE_TAG=${TAG}`));
  } finally {
    await api.close();
    await coolify.close();
  }
});

test('the step summary records which build shipped', async () => {
  // Reviewers should read the shipped tag off the run page. The gate writes a
  // markdown table with the tag it published, the commit the container
  // reported, and Coolify's selector.
  const dir = mkdtempSync(join(tmpdir(), 'verify-tag-summary-'));
  const summary = join(dir, 'summary.md');
  const api = await serve(deployedApi({ version: { commitSha: SHA } }));
  const coolify = await serve(coolifyApi(IMAGE_TAG_ENV(TAG)));
  try {
    const res = await run([TAG, api.url], {
      GITHUB_STEP_SUMMARY: summary,
      GITHUB_SERVER_URL: 'https://github.com',
      GITHUB_REPOSITORY: 'azeebotv/azeebo',
      GITHUB_RUN_ID: '4242',
      COOLIFY_API_URL: coolify.url,
      COOLIFY_API_TOKEN: 'token',
      COOLIFY_APP_UUID: 'app-uuid',
    });
    assert.equal(res.status, 0, res.stdout + res.stderr);
    const text = read(summary);
    assert.match(text, /### Deploy verification — staging/);
    assert.match(text, /\*\*Shipped build:\*\*/);
    assert.ok(text.includes(TAG) && text.includes(SHA), text);
    assert.match(text, /✅ verified/);
    assert.match(text, /\| Image tag \|/);
    assert.ok(text.includes(`| Running commit | ${SHA} |`), text);
    assert.match(text, /\| Coolify .IMAGE_TAG. \|/);
    assert.match(text, /actions\/runs\/4242/);
  } finally {
    await api.close();
    await coolify.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test('a failed gate still reports which build was found', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'verify-tag-summary-'));
  const summary = join(dir, 'summary.md');
  const api = await serve(deployedApi({ version: { commitSha: 'deadbeefdeadbeefdeadbeefdeadbeefdeadbeef' } }));
  try {
    const res = await run([TAG, api.url], { GITHUB_STEP_SUMMARY: summary });
    assert.equal(res.status, 1, res.stdout + res.stderr);
    const text = read(summary);
    assert.match(text, /❌ failed/);
    assert.match(text, /\| Running commit \| deadbeefdeadbeef\w* \|/);
    assert.match(text, /\*\*Why it failed:\*\* .*deadbeef/);
  } finally {
    await api.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test('--rollback titles the summary a rollback and names the restored commit', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'verify-tag-summary-'));
  const summary = join(dir, 'summary.md');
  const api = await serve(deployedApi({ version: { commitSha: SHA } }));
  const coolify = await serve(coolifyApi(IMAGE_TAG_ENV(TAG)));
  try {
    const res = await run(['--rollback', TAG, api.url], {
      GITHUB_STEP_SUMMARY: summary,
      COOLIFY_WEBHOOK: 'https://coolify.test/hook',
      COOLIFY_API_URL: coolify.url,
      COOLIFY_API_TOKEN: 'token',
      COOLIFY_APP_UUID: 'app-uuid',
    });
    assert.equal(res.status, 0, res.stdout + res.stderr);
    const text = read(summary);
    assert.match(text, /### Rollback verification — staging/);
    assert.ok(text.includes("**Restored build:** `" + TAG + "` (commit `" + SHA + "`)"), text);
    assert.ok(text.includes('| Running commit | ' + SHA + ' |'), text);
    assert.match(text, /✅ verified — artifact and Coolify selector both match/);
    assert.match(res.stdout, /Rollback verified|Deployment verified/);
  } finally {
    await api.close();
    await coolify.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test('--rollback accepts a moving tag and records the commit that came back up', async () => {
  // `latest`/`staging` name no commit, so a rollback to one cannot be compared
  // against a SHA — but the restored tag and whatever /version reports still
  // have to be on the record, and Coolify's selector is still checkable.
  const dir = mkdtempSync(join(tmpdir(), 'verify-tag-summary-'));
  const summary = join(dir, 'summary.md');
  const api = await serve(deployedApi({ version: { commitSha: SHA } }));
  const coolify = await serve(coolifyApi(IMAGE_TAG_ENV('latest')));
  try {
    const res = await run(['--rollback', 'latest', api.url], {
      GITHUB_STEP_SUMMARY: summary,
      VERIFY_ENVIRONMENT: 'production',
      COOLIFY_WEBHOOK: 'https://coolify.test/hook',
      COOLIFY_API_URL: coolify.url,
      COOLIFY_API_TOKEN: 'token',
      COOLIFY_APP_UUID: 'app-uuid',
    });
    assert.equal(res.status, 0, res.stdout + res.stderr);
    const text = read(summary);
    assert.match(text, /### Rollback verification — production/);
    assert.ok(text.includes("**Restored build:** `latest` (commit `" + SHA + "`)"), text);
    assert.match(text, /\| Expected commit \| _moving tag — no commit pinned_ \|/);
    assert.ok(text.includes('| Running commit | ' + SHA + ' |'), text);
    assert.match(text, /✅ verified — moving tag is live/);
    assert.match(res.stdout, /Rollback verified/);
  } finally {
    await api.close();
    await coolify.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test('a pinned rollback that restored the wrong commit still fails', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'verify-tag-summary-'));
  const summary = join(dir, 'summary.md');
  const api = await serve(deployedApi({ version: { commitSha: 'deadbeefdeadbeefdeadbeefdeadbeefdeadbeef' } }));
  try {
    const res = await run(['--rollback', TAG, api.url], { GITHUB_STEP_SUMMARY: summary });
    assert.equal(res.status, 1, res.stdout + res.stderr);
    const text = read(summary);
    assert.match(text, /### Rollback verification — staging/);
    assert.match(text, /❌ failed/);
    assert.match(text, /\*\*Why it failed:\*\* .*deadbeef/);
  } finally {
    await api.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test('an SSH rollback does not judge a Coolify selector that never moved', async () => {
  // An SSH rollback pins the image ref in `docker run`; Coolify's IMAGE_TAG still
  // names the previous deploy, so comparing it would fail a rollback that worked.
  const dir = mkdtempSync(join(tmpdir(), 'verify-tag-summary-'));
  const summary = join(dir, 'summary.md');
  const api = await serve(deployedApi({ version: { commitSha: SHA } }));
  const coolify = await serve(coolifyApi(IMAGE_TAG_ENV('staging-0000000000000000000000000000000000000000')));
  try {
    const res = await run(['--rollback', TAG, api.url], {
      GITHUB_STEP_SUMMARY: summary,
      COOLIFY_API_URL: coolify.url,
      COOLIFY_API_TOKEN: 'token',
      COOLIFY_APP_UUID: 'app-uuid',
    });
    assert.equal(res.status, 0, res.stdout + res.stderr);
    assert.match(res.stdout, /rollback ran over SSH/);
    const text = read(summary);
    assert.match(text, /⚠️ restored artifact verified/);
    assert.match(text, /_Coolify did not perform this rollback/);
  } finally {
    await api.close();
    await coolify.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test('a moving tag is still rejected without --rollback', async () => {
  // The deploy gate must never lose its SHA check by accident.
  const res = await run(['latest', 'http://127.0.0.1:1'], {});
  assert.equal(res.status, 2, res.stdout + res.stderr);
  assert.match(res.stderr, /--rollback accepts a moving tag/);
});

test('rollback.yml verifies the restored tag instead of just /health', () => {
  const text = read(ROLLBACK_WF);
  assert.match(
    text,
    /bash scripts\/verify-deployed-image-tag\.sh --rollback "\$\{\{ inputs\.target_tag \}\}" "\$HEALTH_URL"/
  );
  assert.match(text, /VERIFY_ENVIRONMENT: \$\{\{ inputs\.environment \}\}/);
  // The replaced step: it slept 30s, then accepted any healthy container.
  assert.doesNotMatch(text, /Verify rollback health/);
  assert.doesNotMatch(text, /curl -sf --max-time 10/);
  // A run with no health URL still leaves a statement on the run page.
  assert.match(text, /not verified — no health URL is configured/);
  assert.match(text, /GITHUB_STEP_SUMMARY/);
  // The script has to exist on the runner.
  const job = text.slice(text.indexOf('\n  rollback:'));
  assert.match(job, /uses: actions\/checkout@/);
});

test('an unwritable summary path cannot fail a green verification', async () => {
  // The summary is an artifact of the check, never part of it: a bad path or a
  // read-only runner must not turn a verified deploy into a red build.
  const api = await serve(deployedApi({ version: { commitSha: SHA } }));
  try {
    const res = await run([TAG, api.url], {
      GITHUB_STEP_SUMMARY: join(tmpdir(), 'no-such-dir-verify-tag', 'summary.md'),
    });
    assert.equal(res.status, 0, res.stdout + res.stderr);
  } finally {
    await api.close();
  }
});

test('waits for a slow rollover instead of failing the old container', async () => {
  // First request: the previous build is still answering. Coolify then swaps
  // the container, so the retry sees the new commit.
  let calls = 0;
  const api = await serve(async (req, res) => {
    if ((req.url || '').split('?')[0] !== '/version') {
      res.writeHead(404);
      res.end();
      return;
    }
    calls += 1;
    const commitSha = calls === 1 ? 'ffffffffffffffffffffffffffffffffffffffff' : SHA;
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ commitSha }));
  });
  try {
    const res = await run([TAG, api.url], { VERIFY_WAIT_S: '10', VERIFY_POLL_S: '1' });
    assert.equal(res.status, 0, res.stdout + res.stderr);
    assert.match(res.stdout, new RegExp(`Running artifact matches ${TAG}`));
    assert.ok(calls >= 2, 'the verifier must re-poll, not judge the first response');
  } finally {
    await api.close();
  }
});

test('a wrong commit still fails once the wait window expires', async () => {
  const api = await serve(deployedApi({ version: { commitSha: 'ffffffffffffffffffffffffffffffffffffffff' } }));
  try {
    const res = await run([TAG, api.url], { VERIFY_WAIT_S: '1', VERIFY_POLL_S: '1' });
    assert.equal(res.status, 1, res.stdout + res.stderr);
    assert.match(res.stderr, /wrong deployment/);
  } finally {
    await api.close();
  }
});

test('a different running commit fails', async () => {
  const api = await serve(deployedApi({ version: { commitSha: 'deadbeefdeadbeefdeadbeefdeadbeefdeadbeef' } }));
  try {
    const res = await run([TAG, api.url], {});
    assert.equal(res.status, 1, res.stdout + res.stderr);
    assert.match(res.stderr, /wrong deployment/);
    assert.match(res.stderr, /deadbeef/);
  } finally {
    await api.close();
  }
});

test('commitSha=dev fails instead of passing unverified', async () => {
  // The regression: the old step skipped the comparison when the value was
  // "dev", which is what an image built without COMMIT_SHA reports.
  const api = await serve(deployedApi({ version: { commitSha: 'dev' } }));
  try {
    const res = await run([TAG, api.url], {});
    assert.equal(res.status, 1, res.stdout + res.stderr);
    assert.match(res.stderr, /commitSha=dev/);
  } finally {
    await api.close();
  }
});

test('a payload without any commitSha fails', async () => {
  const api = await serve(deployedApi({ version: { status: 'ok' }, health: { status: 'ok' } }));
  try {
    const res = await run([TAG, api.url], {});
    assert.equal(res.status, 1, res.stdout + res.stderr);
    assert.match(res.stderr, /no commitSha/);
  } finally {
    await api.close();
  }
});

test('an unreachable health base fails', async () => {
  const api = await serve(deployedApi({ version: undefined, health: undefined }));
  const deadUrl = api.url;
  await api.close(); // nothing is listening anymore
  const res = await run([TAG, deadUrl], {});
  assert.equal(res.status, 1, res.stdout + res.stderr);
  assert.match(res.stderr, /cannot identify the running artifact/);
});

test('/health is used when /version is unavailable', async () => {
  const api = await serve(
    deployedApi({ version: undefined, health: { info: { apiGateway: { commitSha: SHA } } } })
  );
  try {
    const res = await run([TAG, api.url], { COOLIFY_WEBHOOK: 'https://coolify/hook', COOLIFY_API_URL: '', COOLIFY_APP_UUID: '', COOLIFY_API_TOKEN: '' });
    // Commit matches, but a Coolify deploy without API credentials must fail closed.
    assert.equal(res.status, 1, res.stdout + res.stderr);
    assert.match(res.stderr, /Coolify deployed this environment/);
  } finally {
    await api.close();
  }
});

test('a stale Coolify IMAGE_TAG fails the deploy', async () => {
  const api = await serve(deployedApi({ version: { commitSha: SHA } }));
  const coolify = await serve(coolifyApi(IMAGE_TAG_ENV('staging-0000000000000000000000000000000000000000')));
  try {
    const res = await run([TAG, api.url], {
      COOLIFY_API_URL: coolify.url,
      COOLIFY_API_TOKEN: 'token',
      COOLIFY_APP_UUID: 'app-uuid',
    });
    assert.equal(res.status, 1, res.stdout + res.stderr);
    assert.match(res.stderr, /configured to deploy IMAGE_TAG=staging-0000/);
    assert.match(res.stderr, /wrong tag selected/);
  } finally {
    await api.close();
    await coolify.close();
  }
});

test('a missing IMAGE_TAG fails instead of falling back to :dev', async () => {
  const api = await serve(deployedApi({ version: { commitSha: SHA } }));
  const coolify = await serve(coolifyApi([{ key: 'POSTGRES_PASSWORD', value: 'x' }]));
  try {
    const res = await run([TAG, api.url], {
      COOLIFY_API_URL: coolify.url,
      COOLIFY_API_TOKEN: 'token',
      COOLIFY_APP_UUID: 'app-uuid',
    });
    assert.equal(res.status, 1, res.stdout + res.stderr);
    assert.match(res.stderr, /no IMAGE_TAG env var/);
  } finally {
    await api.close();
    await coolify.close();
  }
});

test('an unreadable Coolify API is a failure, not a skip', async () => {
  const api = await serve(deployedApi({ version: { commitSha: SHA } }));
  const coolify = await serve(coolifyApi([], { status: 401 }));
  try {
    const res = await run([TAG, api.url], {
      COOLIFY_API_URL: coolify.url,
      COOLIFY_API_TOKEN: 'bad-token',
      COOLIFY_APP_UUID: 'app-uuid',
    });
    assert.equal(res.status, 1, res.stdout + res.stderr);
    assert.match(res.stderr, /could not read application envs/);
  } finally {
    await api.close();
    await coolify.close();
  }
});

test('the {data: [...]} envs envelope is accepted', async () => {
  const api = await serve(deployedApi({ version: { commitSha: SHA } }));
  const coolify = await serve(coolifyApi({ data: IMAGE_TAG_ENV(TAG) }));
  try {
    const res = await run([TAG, api.url], {
      COOLIFY_API_URL: coolify.url,
      COOLIFY_API_TOKEN: 'token',
      COOLIFY_APP_UUID: 'app-uuid',
    });
    assert.equal(res.status, 0, res.stdout + res.stderr);
  } finally {
    await api.close();
    await coolify.close();
  }
});

test('the SSH deploy path verifies the commit and skips the tag with a warning', async () => {
  // No COOLIFY_WEBHOOK and no API creds: Coolify did not deploy, and the SSH
  // path pins the image ref explicitly, so only the artifact can be checked.
  const dir = mkdtempSync(join(tmpdir(), 'verify-tag-summary-'));
  const summary = join(dir, 'summary.md');
  const api = await serve(deployedApi({ version: { commitSha: SHA } }));
  try {
    const res = await run([TAG, api.url], { GITHUB_STEP_SUMMARY: summary });
    assert.equal(res.status, 0, res.stdout + res.stderr);
    assert.match(res.stdout, /Running artifact matches/);
    assert.match(res.stdout, /::warning::Coolify API not configured/);
    assert.match(res.stdout, /IMAGE_TAG check skipped/);
    // A partially-checked success must not read like a failure in the summary.
    const text = read(summary);
    assert.match(text, /artifact verified/);
    assert.match(text, /_Only the artifact could be checked;/);
    assert.doesNotMatch(text, /Why it failed/);
  } finally {
    await api.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test('usage errors exit 2', async () => {
  assert.equal((await run([], {})).status, 2);
  assert.equal((await run(['not-a-tag', 'http://127.0.0.1:1'], {})).status, 2);
  // A tag without a sha suffix cannot identify a build.
  assert.equal((await run(['latest', 'http://127.0.0.1:1'], {})).status, 2);
});

test('the deployment docs explain where the verified tag is reported', () => {
  const text = read(DEPLOYMENT_DOC);
  assert.match(text, /step summary/i);
  assert.match(text, /Which build is live\?/);
  assert.match(text, /verify-deployed-image-tag\.sh/);
  // A rollback records the same evidence as a deploy.
  assert.match(text, /Rollback verification/);
});

test('cd.yml gates both environments on the running tag, not just /health', () => {
  const text = read(CD);
  // Both health jobs must run the script with their own published tag.
  assert.match(
    text,
    /bash scripts\/verify-deployed-image-tag\.sh "staging-\$\{\{ github\.sha \}\}" "\$HEALTH_URL"/
  );
  assert.match(
    text,
    /bash scripts\/verify-deployed-image-tag\.sh "production-\$\{\{ github\.sha \}\}" "\$HEALTH_URL"/
  );
  // The old soft check is gone: it passed when the SHA was absent or "dev".
  assert.doesNotMatch(text, /DEPLOYED_SHA" != "dev"/);
  assert.doesNotMatch(text, /Verify deployed commit SHA/);
  // A Coolify deploy must hand its credentials/threshold to the verifier.
  for (const env of ['STAGING', 'PRODUCTION']) {
    assert.match(
      text,
      new RegExp(`COOLIFY_WEBHOOK: \\$\\{\\{ secrets\\.COOLIFY_${env}_WEBHOOK \\}\\}`)
    );
  }
  // Checkout is required for the script to exist on the runner.
  const healthJobs = text.split(/\n  health-check-/).slice(1);
  assert.equal(healthJobs.length, 2, 'expected two health-check jobs in cd.yml');
  for (const job of healthJobs) {
    assert.match(job.slice(0, 900), /uses: actions\/checkout@/, 'health job needs a checkout');
  }
});
