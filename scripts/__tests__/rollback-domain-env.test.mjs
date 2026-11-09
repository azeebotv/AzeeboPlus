/**
 * Tests for scripts/rollback.sh's domain-registry bootstrap.
 *
 * rollback.sh runs `docker-compose up`, and compose interpolates ${APP_HOST},
 * ${STAGING_HOST}, ... from the process environment. If the registry is not
 * loaded first, rollback starts containers with empty hostnames. These tests
 * pin the ordering and prove the helper actually exports the hosts.
 *
 * Run via the CI conventions job: `node --test scripts/__tests__/*.test.mjs`
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..');
const ROLLBACK = join(ROOT, 'scripts', 'rollback.sh');
const DOMAIN_ENV = join(ROOT, 'scripts', 'lib', 'domain-env.sh');

const read = (file) => readFileSync(file, 'utf8');

/** Parses deploy/domains.env into a plain object. */
function registryHosts() {
  const text = read(join(ROOT, 'deploy', 'domains.env'));
  const out = {};
  for (const line of text.split('\n')) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m) out[m[1]] = m[2];
  }
  return out;
}

/** Line index of the first non-comment `docker-compose` call (-1 if none). */
function firstComposeCall(lines) {
  return lines.findIndex((line) => /docker-compose/.test(line) && !line.trim().startsWith('#'));
}

test('rollback.sh sources the domain registry before it runs compose', () => {
  // Comments legitimately name compose files (the header documents the default),
  // so compare against the first *call*, not the first mention.
  const lines = read(ROLLBACK).split('\n');
  const sourceAt = lines.findIndex((line) => line.includes('lib/domain-env.sh'));
  const composeAt = firstComposeCall(lines);

  assert.notEqual(sourceAt, -1, 'rollback.sh must source scripts/lib/domain-env.sh');
  assert.notEqual(composeAt, -1, 'expected rollback.sh to invoke docker-compose');
  assert.ok(
    sourceAt < composeAt,
    'the registry must be loaded before the first docker-compose call, or compose interpolates empty hosts'
  );
});

test('rollback.sh loads the registry before any compose invocation', () => {
  const lines = read(ROLLBACK).split('\n');
  const firstSource = lines.findIndex((l) => l.includes('lib/domain-env.sh'));
  const everyCompose = lines
    .map((line, i) => ({ line, i }))
    .filter(({ line }) => /docker-compose/.test(line) && !line.trim().startsWith('#'));

  assert.ok(everyCompose.length > 0);
  for (const { line, i } of everyCompose) {
    assert.ok(
      firstSource < i,
      `compose call at line ${i + 1} runs before the registry loads: ${line}`
    );
  }
});

test('sourcing the helper exports registry hosts into a clean environment', () => {
  const hosts = registryHosts();
  const res = spawnSync(
    'bash',
    [
      '-c',
      `. "${DOMAIN_ENV}" && printf '%s|%s|%s|%s' "$APP_HOST" "$API_HOST" "$STAGING_HOST" "$BASE_DOMAIN"`,
    ],
    { encoding: 'utf8', env: { PATH: process.env.PATH } } // deliberately no pre-set hosts
  );

  assert.equal(res.status, 0, res.stderr);
  assert.equal(
    res.stdout,
    [hosts.APP_HOST, hosts.API_HOST, hosts.STAGING_HOST, hosts.BASE_DOMAIN].join('|')
  );
});

test('the helper fails fast when deploy/domains.env is missing', () => {
  const root = mkdtempSync(join(tmpdir(), 'rollback-domains-'));
  try {
    mkdirSync(join(root, 'scripts', 'lib'), { recursive: true });
    writeFileSync(join(root, 'scripts', 'lib', 'domain-env.sh'), read(DOMAIN_ENV));

    const res = spawnSync('bash', ['-c', `. "${join(root, 'scripts', 'lib', 'domain-env.sh')}"`], {
      encoding: 'utf8',
      env: { PATH: process.env.PATH },
    });

    assert.notEqual(res.status, 0, 'a missing domains.env must not be silently ignored');
    assert.match(res.stderr, /domains\.env is missing/);
    assert.match(res.stderr, /generate-domain-env\.mjs/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('the default COMPOSE_FILE is a compose file that actually exists', () => {
  // The bug this pins: the default was docker-compose.${ENVIRONMENT}.yml with
  // ENVIRONMENT=staging, but there has never been a docker-compose.staging.yml
  // — staging runs docker-compose.prod.yml with a staging .env. The default
  // rollback therefore failed on a missing path.
  const text = read(ROLLBACK);
  const match = text.match(/COMPOSE_FILE="\$\{COMPOSE_FILE:-([^}]+)\}"/);
  assert.ok(match, 'expected a COMPOSE_FILE default in rollback.sh');
  const defaultFile = match[1];

  assert.doesNotMatch(
    text,
    /docker-compose\.\$\{ENVIRONMENT\}\.yml/,
    'the compose path must not be derived from ENVIRONMENT: no per-environment file exists'
  );

  const tracked = execFileSync(
    'git',
    ['ls-files', '--', 'docker-compose*.yml', 'deploy/docker-compose*.yml'],
    { cwd: ROOT, encoding: 'utf8' }
  )
    .split('\n')
    .filter(Boolean);
  assert.ok(
    tracked.includes(defaultFile),
    `default compose file "${defaultFile}" is not tracked; tracked: ${tracked.join(', ')}`
  );
});

test('a missing compose file fails before the stack is stopped', () => {
  const res = spawnSync('bash', [ROLLBACK, 'v0.0.1'], {
    encoding: 'utf8',
    cwd: tmpdir(),
    env: { PATH: process.env.PATH, COMPOSE_FILE: 'docker-compose.does-not-exist.yml' },
  });
  assert.equal(res.status, 1, res.stdout + res.stderr);
  assert.match(res.stderr, /Compose file not found: docker-compose\.does-not-exist\.yml/);
  // It must bail out while listing candidates, not after stopping containers.
  assert.doesNotMatch(res.stdout + res.stderr, /Stopping|Pulling previous images/);
});

test('rollback.sh stays shell-parseable', () => {
  const res = spawnSync('bash', ['-n', ROLLBACK], { encoding: 'utf8' });
  assert.equal(res.status, 0, res.stderr);
});
