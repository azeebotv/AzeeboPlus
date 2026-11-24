/**
 * Tests for the deploy image identity.
 *
 * The bug these pin: cd.yml/rollback.yml built image refs from
 * `${{ github.repository }}`, which preserves the repo's casing
 * (`ghcr.io/azeebotv/AzeeboPlus`) — Docker rejects uppercase repository names,
 * so `staging-<sha>` / `production-<sha>` never resolved, while compose files
 * and every doc named `ghcr.io/azeebotv/azeebo-all-in-one`. Coolify also could
 * not select a version: its deploy API's `tag` is a resource-tag group, not a
 * Docker tag, so the version has to come from compose interpolation.
 *
 * Run via the CI conventions job: `node --test scripts/__tests__/*.test.mjs`
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..');
const read = (rel) => readFileSync(join(ROOT, rel), 'utf8');

const CD = '.github/workflows/cd.yml';
const ROLLBACK = '.github/workflows/rollback.yml';
const SUPPLY_CHAIN = '.github/workflows/supply-chain-security.yml';
const COMPOSE_ROOT = 'docker-compose.all-in-one.yml';
const COMPOSE_DEPLOY = 'deploy/docker-compose.all-in-one.yml';

const CANONICAL = 'ghcr.io/azeebotv/azeebo-all-in-one';

test('CI declares one lowercase image identity', () => {
  for (const file of [CD, ROLLBACK]) {
    const text = read(file);
    assert.match(text, /^\s+REGISTRY: ghcr\.io$/m, `${file} must declare REGISTRY`);
    assert.match(
      text,
      /^\s+IMAGE_NAME: azeebotv\/azeebo-all-in-one$/m,
      `${file} must declare the canonical IMAGE_NAME`
    );
  }
});

test('no workflow derives an image ref from github.repository', () => {
  // github.repository keeps the repo's casing, and Docker rejects uppercase
  // repository names, so these refs can never be pulled.
  for (const file of [CD, ROLLBACK, SUPPLY_CHAIN]) {
    const offending = read(file)
      .split('\n')
      .filter((line) => /ghcr\.io\/\$\{\{\s*github\.repository/.test(line));
    assert.deepEqual(offending, [], `${file} still builds image refs from github.repository`);
  }
});

test('cd.yml publishes the tagged image the deploy paths pull', () => {
  const text = read(CD);
  // The build tag and the retags all resolve through the one identity.
  assert.match(
    text,
    /tags: \$\{\{ env\.REGISTRY \}\}\/\$\{\{ env\.IMAGE_NAME \}\}:staging-\$\{\{ github\.sha \}\}/
  );
  assert.match(text, /IMAGE="\$\{REGISTRY\}\/\$\{IMAGE_NAME\}"/);
  for (const push of [
    'docker push "${IMAGE}:staging-${{ github.sha }}"',
    'docker push "${IMAGE}:staging"',
    'docker push "${IMAGE}:production-${{ github.sha }}"',
    'docker push "${IMAGE}:latest"',
  ]) {
    assert.ok(text.includes(push), `the push step must publish: ${push}`);
  }
  // Both SSH fallbacks deploy the same ref the push step produced.
  assert.match(
    text,
    /docker pull "\$\{\{ env\.REGISTRY \}\}\/\$\{\{ env\.IMAGE_NAME \}\}:staging-/
  );
  assert.match(
    text,
    /docker pull "\$\{\{ env\.REGISTRY \}\}\/\$\{\{ env\.IMAGE_NAME \}\}:production-/
  );
});

test('compose files select the version through IMAGE_TAG', () => {
  for (const file of [COMPOSE_ROOT, COMPOSE_DEPLOY]) {
    const text = read(file);
    assert.match(
      text,
      /^\s+image: ghcr\.io\/azeebotv\/azeebo-all-in-one:\$\{IMAGE_TAG:-dev\}$/m,
      `${file} must interpolate IMAGE_TAG, defaulting to dev`
    );
  }
});

test('Coolify is driven through IMAGE_TAG, not a Docker tag in the deploy body', () => {
  const text = read(CD) + read(ROLLBACK);
  // The old (invalid) payloads: Coolify would read `tag` as a resource-tag
  // group, and `compose_file` is not an API parameter at all.
  assert.doesNotMatch(text, /\\"compose_file\\"/, 'compose_file is not a Coolify API parameter');
  assert.doesNotMatch(text, /-d "?\{\\"tag\\"/, 'Coolify tag selects resource groups, not images');
  assert.match(text, /scripts\/coolify-set-image-tag\.sh/, 'deploys must select IMAGE_TAG');
  assert.match(text, /-d '\{"force":false\}'/, 'the deploy trigger body must be a valid API body');
});

test('the rollback workflow verifies the package the workflows publish', () => {
  const text = read(ROLLBACK);
  const pkg = text.match(/packages\/container\/([a-z0-9-]+)\/versions/);
  assert.ok(pkg, 'rollback.yml must verify the published package');
  assert.equal(`ghcr.io/azeebotv/${pkg[1]}`, CANONICAL);
});

test('every literal ghcr.io reference in the deploy surface is lowercase', () => {
  const files = [
    CD,
    ROLLBACK,
    SUPPLY_CHAIN,
    COMPOSE_ROOT,
    COMPOSE_DEPLOY,
    'docker-compose.prod.yml',
  ];
  const offenders = [];
  for (const file of files) {
    for (const line of read(file).split('\n')) {
      for (const match of line.matchAll(/ghcr\.io\/[A-Za-z0-9._/-]+/g)) {
        if (match[0] !== match[0].toLowerCase()) offenders.push(`${file}: ${match[0]}`);
      }
    }
  }
  assert.deepEqual(offenders, [], `uppercase image refs cannot be pulled: ${offenders.join(', ')}`);
});
