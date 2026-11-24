/**
 * Parity tests: start-dev-service.sh and build-service.sh must agree on the
 * generate / dist-mirror contract.
 *
 * The two runners implement the same contract — read prisma/schema.prisma,
 * generate the client into src/prisma/client, mirror it into
 * dist/prisma/client — but each hardcoded its own copy of those paths. The
 * two per-runner suites (start-dev-runner.test.mjs, build-runner.test.mjs)
 * test each runner in isolation, so a path edit in one runner would pass CI
 * while forking the contract: dev would generate/mirror into one layout and
 * build into another, and services would silently boot against stale dist
 * artifacts or a client in the wrong place.
 *
 * Two layers of protection here:
 *
 *   Structural — the path literals in both scripts are extracted and
 *   compared against canonical constants in dev-wiring-core.mjs
 *   (SERVICE_SCHEMA_PATH / SERVICE_CLIENT_DIR / SERVICE_DIST_CLIENT_DIR).
 *   Editing a path in one runner without the other (or without moving the
 *   canonical constant) fails here.
 *
 *   Behavioral — both runners are executed for real (stub pnpm) in ONE
 *   sandbox: build→dev and dev→build interop, so the contract is proven by
 *   execution, not just by reading literals.
 *
 * Run: `node --test scripts/__tests__/runner-parity.test.mjs`
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SERVICE_SCHEMA_PATH, SERVICE_CLIENT_DIR, SERVICE_DIST_CLIENT_DIR } from '../lib/dev-wiring-core.mjs';

const SCRIPTS_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DEV_RUNNER = path.join(SCRIPTS_DIR, 'start-dev-service.sh');
const BUILD_RUNNER = path.join(SCRIPTS_DIR, 'build-service.sh');

// ---------- structural helpers -------------------------------------------

function extractAssignment(scriptText, name) {
  const m = scriptText.match(new RegExp(`^${name}="([^"]+)"`, 'm'));
  if (!m) throw new Error(`${name}="..." assignment not found in script`);
  return m[1];
}

/** All dist/... path literals in a script, trailing slashes normalized. */
function distLiterals(scriptText) {
  return [...new Set((scriptText.match(/dist\/[A-Za-z0-9_./-]+/g) ?? []).map((s) => s.replace(/\/+$/, '')))];
}

// ---------- behavioral harness --------------------------------------------

// Same stub contract as the per-runner suites: log every invocation,
// simulate generate producing the client, honor PRISMA_FAIL.
const STUB_PNPM = `#!/bin/bash
echo "pnpm $*" >> "$PWD/pnpm-calls.log"
if [ -n "$PRISMA_FAIL" ] && [ "$1" = "exec" ] && [ "$2" = "prisma" ]; then
  echo "Error: Prisma schema validation - error validating field x in model Y." >&2
  exit 1
fi
if [ "$1" = "exec" ] && [ "$2" = "prisma" ] && [ "$3" = "generate" ]; then
  mkdir -p src/prisma/client
  echo embedded > src/prisma/client/schema.prisma
  echo "Generated Prisma Client"
fi
exit 0
`;

function makeSandbox(t, { schema = true } = {}) {
  const sandbox = mkdtempSync(path.join(tmpdir(), 'runner-parity-'));
  t.after(() => rmSync(sandbox, { recursive: true, force: true }));
  writeFileSync(path.join(sandbox, 'package.json'), JSON.stringify({ name: 'parity-svc' }));
  if (schema) {
    mkdirSync(path.join(sandbox, 'prisma'), { recursive: true });
    writeFileSync(path.join(sandbox, 'prisma', 'schema.prisma'), 'generator client { provider = "prisma-client-js" }\n');
  }
  const stubDir = path.join(sandbox, '.stub-bin');
  mkdirSync(stubDir, { recursive: true });
  const stubPath = path.join(stubDir, 'pnpm');
  writeFileSync(stubPath, STUB_PNPM);
  chmodSync(stubPath, 0o755);
  return sandbox;
}

/**
 * Run a real runner script in the sandbox. The pnpm-calls.log is shared
 * across invocations (the stub appends), so callers snapshot
 * `calls.length` between phases to attribute calls to a phase.
 */
function runScript(t, script, sandbox, { prismaFail = false } = {}) {
  const res = spawnSync('bash', [script], {
    cwd: sandbox,
    encoding: 'utf8',
    timeout: 20_000,
    env: {
      ...process.env,
      PATH: `${path.join(sandbox, '.stub-bin')}:${process.env.PATH}`,
      PRISMA_FAIL: prismaFail ? '1' : '',
    },
  });
  let calls = [];
  try {
    calls = readFileSync(path.join(sandbox, 'pnpm-calls.log'), 'utf8').split('\n').filter(Boolean);
  } catch {
    // Stub never invoked.
  }
  let distClientContent = null;
  try {
    // .trim(): the stub's `echo` appends a newline.
    distClientContent = readFileSync(path.join(sandbox, 'dist', 'prisma', 'client', 'schema.prisma'), 'utf8').trim();
  } catch {
    // Nothing mirrored yet.
  }
  return { status: res.status, stdout: res.stdout ?? '', stderr: res.stderr ?? '', calls, distClientContent };
}

const generateCallsIn = (calls) => calls.filter((c) => c.startsWith('pnpm exec prisma generate')).length;
const nestCallsIn = (calls) => calls.filter((c) => c.startsWith('pnpm exec nest')).length;

// ---------- structural: both scripts match the canonical constants --------

test('structural: both runners hardcode the SAME schema + client paths as the canonical constants', (t) => {
  for (const [name, file] of [['start-dev-service.sh', DEV_RUNNER], ['build-service.sh', BUILD_RUNNER]]) {
    const text = readFileSync(file, 'utf8');
    assert.equal(extractAssignment(text, 'SCHEMA'), SERVICE_SCHEMA_PATH, `${name}: SCHEMA drifted from the canonical contract`);
    assert.equal(extractAssignment(text, 'CLIENT_DIR'), SERVICE_CLIENT_DIR, `${name}: CLIENT_DIR drifted from the canonical contract`);
  }
});

test('structural: both runners mirror into the SAME dist destination (no alternate client location)', (t) => {
  for (const [name, file] of [['start-dev-service.sh', DEV_RUNNER], ['build-service.sh', BUILD_RUNNER]]) {
    const literals = distLiterals(readFileSync(file, 'utf8'));
    assert.ok(
      literals.includes(SERVICE_DIST_CLIENT_DIR),
      `${name}: expected mirror destination ${SERVICE_DIST_CLIENT_DIR}, found ${JSON.stringify(literals)}`,
    );
    const alien = literals.filter((l) => l !== SERVICE_DIST_CLIENT_DIR && l.includes('client'));
    assert.deepEqual(alien, [], `${name}: unexpected alternate dist client location(s) ${JSON.stringify(alien)}`);
  }
});

// ---------- behavioral: the two runners interop for real -------------------

test('behavioral build→dev: build outputs are exactly what dev expects (no regenerate, nest starts)', (t) => {
  const sandbox = makeSandbox(t);

  const build = runScript(t, BUILD_RUNNER, sandbox);
  assert.equal(build.status, 0, `build failed:\n${build.stdout}\n${build.stderr}`);
  assert.equal(build.distClientContent, 'embedded', 'build mirrored the generated client into dist');

  const before = build.calls.length;
  const dev = runScript(t, DEV_RUNNER, sandbox);
  assert.equal(dev.status, 0, `dev failed:\n${dev.stdout}\n${dev.stderr}`);
  const devCalls = dev.calls.slice(before);
  assert.equal(generateCallsIn(devCalls), 0, 'dev must not regenerate after a build produced the client');
  assert.equal(nestCallsIn(devCalls), 1, 'dev must go straight to nest');
  assert.doesNotMatch(dev.stdout, /Generating Prisma client/);
  assert.equal(dev.distClientContent, 'embedded');
});

test('behavioral dev→build: dev first-run generate satisfies build, build refreshes the dist mirror', (t) => {
  const sandbox = makeSandbox(t);

  const dev = runScript(t, DEV_RUNNER, sandbox);
  assert.equal(dev.status, 0, `dev failed:\n${dev.stdout}\n${dev.stderr}`);
  assert.equal(dev.distClientContent, 'embedded', 'dev mirrored the first-run client into dist');

  const before = dev.calls.length;
  const build = runScript(t, BUILD_RUNNER, sandbox);
  assert.equal(build.status, 0, `build failed:\n${build.stdout}\n${build.stderr}`);
  const buildCalls = build.calls.slice(before);
  assert.equal(generateCallsIn(buildCalls), 1, 'build always regenerates (never trusts a pre-existing client)');
  assert.equal(build.distClientContent, 'embedded', 'build re-mirrored the freshly generated client');
});

test('behavioral: same failure presentation — both runners fail loud and identically framed on generate failure', (t) => {
  const devSandbox = makeSandbox(t);
  const buildSandbox = makeSandbox(t);

  const devFail = runScript(t, DEV_RUNNER, devSandbox, { prismaFail: true });
  const buildFail = runScript(t, BUILD_RUNNER, buildSandbox, { prismaFail: true });

  assert.equal(devFail.status, 1);
  assert.equal(buildFail.status, 1);
  for (const [name, r] of [['start-dev-service.sh', devFail], ['build-service.sh', buildFail]]) {
    assert.match(r.stdout, /\|\s+.*schema validation/, `${name}: |-prefixed error block missing`);
    assert.match(r.stderr, /prisma generate FAILED/, `${name}: failure banner missing`);
  }
  assert.equal(nestCallsIn(devFail.calls), 0, 'dev must not start nest on generate failure');
});
