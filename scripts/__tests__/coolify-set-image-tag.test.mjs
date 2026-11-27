/**
 * Tests for scripts/coolify-set-image-tag.sh.
 *
 * A Coolify Compose deployment resolves ghcr.io/…:${IMAGE_TAG} from compose, so
 * selecting a published tag means setting that variable on the app. These tests
 * pin the request shape, the PATCH-then-POST fallback, and the best-effort
 * behaviour when the API secrets are absent.
 *
 * Run via the CI conventions job: `node --test scripts/__tests__/*.test.mjs`
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const HERE = dirname(fileURLToPath(import.meta.url));
const SCRIPT = join(HERE, '..', 'coolify-set-image-tag.sh');

const CONFIGURED = {
  COOLIFY_API_URL: 'https://coolify.example/',
  COOLIFY_API_TOKEN: 'test-token',
  COOLIFY_APP_UUID: 'app-uuid-1',
};

/** Runs the helper with a fake curl that records calls and exits per method. */
function run(args, env = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'coolify-tag-'));
  const bin = join(dir, 'bin');
  const log = join(dir, 'curl.log');
  mkdirSync(bin, { recursive: true });
  writeFileSync(
    join(bin, 'curl'),
    [
      '#!/usr/bin/env bash',
      `printf '%s\\n' "$*" >> "${log}"`,
      'case "$*" in',
      '  *"PATCH"*) exit "${FAKE_PATCH:-0}" ;;',
      '  *"POST"*) exit "${FAKE_POST:-0}" ;;',
      'esac',
      'exit 0',
      '',
    ].join('\n'),
    { mode: 0o755 }
  );
  chmodSync(join(bin, 'curl'), 0o755);

  const res = spawnSync('bash', [SCRIPT, ...args], {
    encoding: 'utf8',
    env: { PATH: `${bin}:${process.env.PATH}`, ...env },
  });
  let calls = [];
  try {
    calls = readFileSync(log, 'utf8').split('\n').filter(Boolean);
  } catch {
    calls = [];
  }
  rmSync(dir, { recursive: true, force: true });
  return { ...res, calls };
}

test('updates IMAGE_TAG with a PATCH scoped to the app', () => {
  const { status, stdout, calls } = run(['staging-1a2b3c4'], CONFIGURED);
  assert.equal(status, 0, stdout);
  assert.equal(calls.length, 1, calls.join(' | '));
  assert.match(
    calls[0],
    /-X PATCH https:\/\/coolify\.example\/api\/v1\/applications\/app-uuid-1\/envs/
  );
  assert.match(calls[0], /Authorization: Bearer test-token/);
  assert.match(calls[0], /"key":"IMAGE_TAG","value":"staging-1a2b3c4"/);
  assert.match(stdout, /IMAGE_TAG=staging-1a2b3c4 \(updated\)/);
});

test('creates the variable when the update reports it is missing', () => {
  const { status, stdout, calls } = run(['production-9f8e7d6'], {
    ...CONFIGURED,
    FAKE_PATCH: '1',
  });
  assert.equal(status, 0, stdout);
  assert.equal(calls.length, 2, calls.join(' | '));
  assert.match(calls[1], /-X POST .*\/envs/);
  assert.match(calls[1], /"value":"production-9f8e7d6"/);
  assert.match(stdout, /IMAGE_TAG=production-9f8e7d6 \(created\)/);
});

test('fails when the API is configured but neither call succeeds', () => {
  const { status, stderr } = run(['dev'], { ...CONFIGURED, FAKE_PATCH: '1', FAKE_POST: '1' });
  assert.equal(status, 1, stderr);
  assert.match(stderr, /could not set IMAGE_TAG=dev/);
});

test('is best-effort when the API secrets are absent', () => {
  for (const missing of ['COOLIFY_API_URL', 'COOLIFY_API_TOKEN', 'COOLIFY_APP_UUID']) {
    const env = { ...CONFIGURED };
    delete env[missing];
    const { status, stderr, calls } = run(['staging-1a2b3c4'], env);
    assert.equal(status, 0, `${missing} missing must not fail the deploy`);
    assert.match(stderr, /::warning::Coolify API not configured/);
    assert.match(stderr, new RegExp(missing));
    assert.deepEqual(calls, [], 'no API call without configuration');
  }
});

test('rejects a malformed tag without calling the API', () => {
  const { status, stderr, calls } = run(['staging tag'], CONFIGURED);
  assert.equal(status, 2, stderr);
  assert.match(stderr, /invalid image tag/);
  assert.deepEqual(calls, []);
});

test('requires a tag argument', () => {
  const { status, stderr } = run([], CONFIGURED);
  assert.equal(status, 2);
  assert.match(stderr, /usage/);
});
