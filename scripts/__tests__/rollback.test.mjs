/**
 * Tests for scripts/rollback.sh.
 *
 * The bug these pin: the script used to "roll back" by rewriting
 * `<service>:.*` tags inside docker-compose.prod.yml — a file whose services
 * build from Dockerfiles and carry no registry tags — then run `docker-compose
 * up` against container names (`azeebo-auth-service-staging`, ...) that the
 * platform has never run. Meanwhile CI deploys ONE all-in-one container
 * (`azeebo` / `azeebo-staging`) from a registry image. A rollback has to move
 * that container to the target image tag, so these tests compare the script's
 * resolved plan against the deploy workflows themselves.
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
const ROOT = join(HERE, '..', '..');
const ROLLBACK = join(ROOT, 'scripts', 'rollback.sh');
const CD = join(ROOT, '.github', 'workflows', 'cd.yml');
const ROLLBACK_WORKFLOW = join(ROOT, '.github', 'workflows', 'rollback.yml');

const read = (file) => readFileSync(file, 'utf8');

/**
 * Runs rollback.sh in a sandbox with a fake `docker` on PATH that records every
 * invocation. Returns the process result plus the recorded commands.
 */
function runRollback(args, extraEnv = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'rollback-'));
  const bin = join(dir, 'bin');
  const dockerLog = join(dir, 'docker-calls.log');
  mkdirSync(bin, { recursive: true });
  // Records every docker invocation; `inspect` reports a previously deployed
  // image so the script exercises the same-image/confirm branches realistically.
  writeFileSync(
    join(bin, 'docker'),
    [
      '#!/usr/bin/env bash',
      `printf '%s\\n' "$*" >> "${dockerLog}"`,
      'case "$1" in',
      '  inspect) echo "${FAKE_CURRENT:-ghcr.io/azeebotv/azeeboplus:staging-old}" ;;',
      '  ps) : ;;',
      '  pull) exit "${FAKE_PULL:-0}" ;;',
      '  run) exit "${FAKE_RUN:-0}" ;;',
      '  *) exit 0 ;;',
      'esac',
      '',
    ].join('\n'),
    { mode: 0o755 }
  );
  writeFileSync(join(bin, 'curl'), '#!/usr/bin/env bash\nexit "${FAKE_HEALTH:-0}"\n', {
    mode: 0o755,
  });
  chmodSync(join(bin, 'docker'), 0o755);
  chmodSync(join(bin, 'curl'), 0o755);

  const envFile = join(dir, '.env.test');
  writeFileSync(envFile, 'NODE_ENV=production\n');

  const res = spawnSync('bash', [ROLLBACK, ...args], {
    encoding: 'utf8',
    cwd: dir,
    env: {
      PATH: `${bin}:${process.env.PATH}`,
      ROLLBACK_LOG: join(dir, 'rollback.log'),
      ENV_FILE: envFile,
      ASSUME_YES: '1',
      HEALTH_CHECK_RETRIES: '1',
      HEALTH_CHECK_INTERVAL: '0',
      ...extraEnv,
    },
  });

  let dockerCalls = [];
  try {
    dockerCalls = read(dockerLog).split('\n').filter(Boolean);
  } catch {
    dockerCalls = [];
  }
  rmSync(dir, { recursive: true, force: true });
  return { ...res, dockerCalls };
}

/** `Container: x` style values from the dry-run plan. */
function planValue(stdout, label) {
  const m = stdout.match(new RegExp(`^\\[.*\\] ${label}:\\s+(.+)$`, 'm'));
  return m?.[1].trim();
}

/** Ports published by the staging SSH deploy in cd.yml, e.g. ['3013', ...]. */
function deployedPorts() {
  const text = read(CD);
  const ports = [...text.matchAll(/-p (\d+):\1/g)].map((m) => m[1]);
  return [...new Set(ports)].sort();
}

test('rollback.sh sources the domain registry before the first docker call', () => {
  const lines = read(ROLLBACK).split('\n');
  const sourceAt = lines.findIndex((line) => line.includes('lib/domain-env.sh'));
  const dockerAt = lines.findIndex(
    (line) => /\bdocker (pull|run|stop|rm|inspect|ps)\b/.test(line) && !line.trim().startsWith('#')
  );

  assert.notEqual(sourceAt, -1, 'rollback.sh must source scripts/lib/domain-env.sh');
  assert.notEqual(dockerAt, -1, 'expected rollback.sh to drive docker');
  assert.ok(sourceAt < dockerAt, 'the registry must load before any docker call');
});

test('rollback.sh no longer rewrites per-service compose tags', () => {
  const calls = read(ROLLBACK)
    .split('\n')
    .filter((line) => !line.trim().startsWith('#'))
    .filter((line) => /\bdocker-compose\b/.test(line));
  assert.deepEqual(calls, [], `compose tag rewriting is gone; found: ${calls.join(' | ')}`);
});

test('dry run resolves the staging container, ports, env file and health URL', () => {
  const { status, stdout, stderr } = runRollback(['staging-abc1234', '--dry-run']);
  assert.equal(status, 0, stdout + stderr);

  assert.equal(planValue(stdout, 'Container'), 'azeebo-staging');
  assert.equal(planValue(stdout, 'Health check'), 'http://localhost:3013/health');
  assert.equal(planValue(stdout, 'Ports').split(/\s+/).sort().join(','), deployedPorts().join(','));
  assert.match(planValue(stdout, 'Image candidates'), /ghcr\.io\/azeebotv\/azeebo-all-in-one/);
});

test('dry run resolves the production container from the registry', () => {
  const { status, stdout, stderr } = runRollback(['production-abc1234', '--dry-run'], {
    ENVIRONMENT: 'production',
  });
  assert.equal(status, 0, stdout + stderr);
  assert.equal(planValue(stdout, 'Container'), 'azeebo');

  const domains = Object.fromEntries(
    read(join(ROOT, 'deploy', 'domains.env'))
      .split('\n')
      .map((line) => line.match(/^([A-Z_]+)=(.*)$/))
      .filter(Boolean)
      .map((m) => [m[1], m[2]])
  );
  assert.equal(planValue(stdout, 'Public host'), domains.BASE_DOMAIN);
});

test('dry run changes nothing: docker is only inspected, never mutated', () => {
  const { status, dockerCalls } = runRollback(['staging-abc1234', '--dry-run']);
  assert.equal(status, 0);
  const mutating = dockerCalls.filter((call) => /^(pull|run|stop|rm)\b/.test(call));
  assert.deepEqual(
    mutating,
    [],
    `dry run must not change the container; calls: ${mutating.join(' | ')}`
  );
});

test('a missing env file aborts before any container is stopped', () => {
  const { status, stdout, stderr, dockerCalls } = runRollback(['staging-abc1234'], {
    ENV_FILE: '/nonexistent/.env.staging',
  });
  assert.equal(status, 1, stdout + stderr);
  assert.match(stdout + stderr, /env file not found: \/nonexistent\/\.env\.staging/);
  assert.deepEqual(dockerCalls, [], 'must fail before stopping or pulling anything');
});

test('an invalid tag is rejected before docker runs', () => {
  const { status, stdout, stderr, dockerCalls } = runRollback(['not a tag', '--dry-run']);
  assert.equal(status, 1, stdout + stderr);
  assert.match(stdout + stderr, /invalid image tag/);
  assert.deepEqual(dockerCalls, []);
});

test('the plan matches what the deploy workflows actually run', () => {
  const cd = read(CD);
  const workflow = read(ROLLBACK_WORKFLOW);

  // Container names the pipeline creates, on the same ports the plan publishes.
  assert.match(cd, /--name azeebo-staging/, 'cd.yml should run the staging container');
  assert.match(cd, /--name azeebo\b/, 'cd.yml should run the production container');
  assert.deepEqual(deployedPorts(), ['3013', '4000', '4014', '4016']);

  // Registry package the rollback workflow verifies.
  assert.match(workflow, /packages\/container\/azeebo-all-in-one\/versions/);

  const { stdout } = runRollback(['dev', '--dry-run']);
  assert.match(planValue(stdout, 'Image candidates'), /azeebo-all-in-one/);
});

test('a successful rollback starts the target image under the deployed container name', () => {
  const { status, stdout, stderr, dockerCalls } = runRollback(['dev']);
  assert.equal(status, 0, stdout + stderr);
  assert.match(stdout, /Resolved image: ghcr\.io\/azeebotv\/azeebo-all-in-one:dev$/m);

  const runs = dockerCalls.filter((call) => call.startsWith('run '));
  assert.equal(runs.length, 1, dockerCalls.join(' | '));
  assert.match(runs[0], /--name azeebo-staging/);
  assert.match(runs[0], /--env-file .*\.env\.test/);
  assert.match(runs[0], /ghcr\.io\/azeebotv\/azeebo-all-in-one:dev$/);
  for (const port of deployedPorts()) {
    assert.match(runs[0], new RegExp(`-p ${port}:${port}`));
  }
});

test('an unhealthy rollback restores the previous image and fails', () => {
  const { status, stdout, stderr, dockerCalls } = runRollback(['dev'], { FAKE_HEALTH: '1' });
  assert.equal(status, 1, stdout + stderr);
  assert.match(stdout, /Restoring previous image ghcr\.io\/azeebotv\/azeeboplus:staging-old/);

  const runs = dockerCalls.filter((call) => call.startsWith('run '));
  assert.equal(runs.length, 2, `expected target then previous; got ${runs.join(' | ')}`);
  assert.match(runs[1], /ghcr\.io\/azeebotv\/azeeboplus:staging-old$/);
});

test('a failed pull leaves the running container alone', () => {
  const { status, stdout, stderr, dockerCalls } = runRollback(['dev'], { FAKE_PULL: '1' });
  assert.equal(status, 1, stdout + stderr);
  assert.match(stdout, /nothing was stopped/);
  const mutating = dockerCalls.filter((call) => /^(run|stop|rm)\b/.test(call));
  assert.deepEqual(
    mutating,
    [],
    `pull failure must not touch the container: ${mutating.join(' | ')}`
  );
});

test('rollback.sh stays shell-parseable', () => {
  const res = spawnSync('bash', ['-n', ROLLBACK], { encoding: 'utf8' });
  assert.equal(res.status, 0, res.stderr);
});
