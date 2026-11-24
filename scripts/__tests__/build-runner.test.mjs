/**
 * Permanent unit tests for the shared build runner's contract
 * (scripts/build-service.sh — the single source of truth for
 * `pnpm run build` in every NestJS service).
 *
 * Companion to start-dev-runner.test.mjs: same harness strategy (throwaway
 * service sandbox, STUB pnpm on PATH recording every invocation, the REAL
 * script executed with bash), different contract. The build path ALWAYS
 * regenerates (no first-run skip — that is the dev runner's behavior), and
 * the critical guarantee is stage ordering: a generate failure aborts the
 * build BEFORE tsc runs, so a service can never compile against a stale or
 * missing client and ship it.
 *
 * Contract under test:
 *   1. Schema-bearing service: generate runs, then tsc, then the client is
 *      mirrored into dist/prisma/client.
 *   2. Generate failure: error block + banner + fix hint, exit 1, and tsc
 *      NEVER runs.
 *   3. tsc failure: error block + banner, exit 1, no client mirror step.
 *   4. Schema-less service (api-gateway class): no generate, straight to
 *      tsc, no mirror.
 *   5. Always-regenerates: a pre-existing client does NOT skip generate —
 *      the dev runner's first-run skip is deliberately absent here.
 *   6. cwd guard: no package.json in cwd → exit 2, nothing runs.
 *   7. tsc exit 0 with output: surfaced with the | prefix, not swallowed.
 *
 * Run: `node --test scripts/__tests__/build-runner.test.mjs`
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RUNNER = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../build-service.sh');

// Stub pnpm: logs every invocation, simulates generate producing the client
// (with the same embedded marker start-dev-runner.test.mjs uses), and honors
// PRISMA_FAIL / TSC_FAIL to reproduce realistic stage failures.
const STUB_PNPM = `#!/bin/bash
echo "pnpm $*" >> "$PWD/pnpm-calls.log"
if [ -n "$PRISMA_FAIL" ] && [ "$1" = "exec" ] && [ "$2" = "prisma" ]; then
  echo "Error: Prisma schema validation - error validating field x in model Y." >&2
  exit 1
fi
if [ -n "$TSC_FAIL" ] && [ "$1" = "exec" ] && [ "$2" = "tsc" ]; then
  echo "src/app.module.ts(9,46): error TS2307: Cannot find module '@azeebo/missing'." >&2
  exit 2
fi
if [ -n "$TSC_WARN" ] && [ "$1" = "exec" ] && [ "$2" = "tsc" ]; then
  echo "warning TS2591: unavailable type-only declaration (simulated exit-0 noise)"
fi
if [ "$1" = "exec" ] && [ "$2" = "prisma" ] && [ "$3" = "generate" ]; then
  mkdir -p src/prisma/client
  echo embedded > src/prisma/client/schema.prisma
  echo "Generated Prisma Client"
fi
exit 0
`;

function runRunner(t, { files = {}, prismaFail = false, tscFail = false, tscWarn = false, noPackageJson = false, preExistingClient = false } = {}) {
  const sandbox = mkdtempSync(path.join(tmpdir(), 'build-runner-'));
  t.after(() => rmSync(sandbox, { recursive: true, force: true }));

  if (!noPackageJson) {
    writeFileSync(path.join(sandbox, 'package.json'), JSON.stringify({ name: 'sandbox-svc' }));
  }
  if (preExistingClient) {
    // A stale client already sitting in src/prisma/client (e.g. from a
    // previous dev run). The BUILD contract is to regenerate regardless —
    // unlike the dev runner's first-run-only skip.
    mkdirSync(path.join(sandbox, 'src', 'prisma', 'client'), { recursive: true });
    writeFileSync(path.join(sandbox, 'src', 'prisma', 'client', 'schema.prisma'), 'stale\n');
  }
  if (files.schema) {
    mkdirSync(path.join(sandbox, 'prisma'), { recursive: true });
    writeFileSync(
      path.join(sandbox, 'prisma', 'schema.prisma'),
      'generator client { provider = "prisma-client-js" }\n',
    );
  }

  const stubDir = path.join(sandbox, '.stub-bin');
  mkdirSync(stubDir, { recursive: true });
  const stubPath = path.join(stubDir, 'pnpm');
  writeFileSync(stubPath, STUB_PNPM);
  chmodSync(stubPath, 0o755);

  const res = spawnSync('bash', [RUNNER], {
    cwd: sandbox,
    encoding: 'utf8',
    timeout: 20_000,
    env: {
      ...process.env,
      PATH: `${stubDir}:${process.env.PATH}`,
      PRISMA_FAIL: prismaFail ? '1' : '',
      TSC_FAIL: tscFail ? '1' : '',
      TSC_WARN: tscWarn ? '1' : '',
    },
  });

  let calls = [];
  try {
    calls = readFileSync(path.join(sandbox, 'pnpm-calls.log'), 'utf8').split('\n').filter(Boolean);
  } catch {
    // Stub never invoked.
  }

  return {
    status: res.status,
    stdout: res.stdout ?? '',
    stderr: res.stderr ?? '',
    calls,
    generateCalls: calls.filter((c) => c.startsWith('pnpm exec prisma generate')).length,
    tscCalls: calls.filter((c) => c.startsWith('pnpm exec tsc')).length,
    clientMirrored: (() => {
      try {
        // .trim(): the stub's echo appends a newline.
        return readFileSync(path.join(sandbox, 'dist', 'prisma', 'client', 'schema.prisma'), 'utf8').trim() === 'embedded';
      } catch {
        return false;
      }
    })(),
  };
}

test('happy path: generate → tsc → client mirrored, exit 0', (t) => {
  const r = runRunner(t, { files: { schema: true } });
  assert.equal(r.status, 0, `runner failed:\n${r.stdout}\n${r.stderr}`);
  assert.equal(r.generateCalls, 1);
  assert.equal(r.tscCalls, 1);
  assert.equal(r.clientMirrored, true);
  assert.match(r.stdout, /build: OK/);
});

test('generate failure: error block + banner + fix hint, exit 1, tsc NEVER runs', (t) => {
  const r = runRunner(t, { files: { schema: true }, prismaFail: true });
  assert.equal(r.status, 1);
  assert.equal(r.generateCalls, 1);
  assert.equal(r.tscCalls, 0, 'tsc must never run when generation fails');
  assert.match(r.stdout, /\|\s+.*schema validation/);
  assert.match(r.stderr, /prisma generate FAILED — build aborted/);
  assert.match(r.stderr, /re-run 'pnpm run build'/);
  assert.equal(r.clientMirrored, false);
});

test('tsc failure: error block + banner, exit 1 (nonzero from tsc propagates)', (t) => {
  const r = runRunner(t, { files: { schema: true }, tscFail: true });
  assert.equal(r.status, 1);
  assert.equal(r.generateCalls, 1);
  assert.equal(r.tscCalls, 1);
  assert.match(r.stdout, /\|\s+.*TS2307/);
  assert.match(r.stderr, /tsc FAILED — build aborted/);
});

test('schema-less service (api-gateway class): no generate, straight to tsc, no mirror', (t) => {
  const r = runRunner(t, { files: {} });
  assert.equal(r.status, 0, `runner failed:\n${r.stdout}\n${r.stderr}`);
  assert.equal(r.generateCalls, 0);
  assert.equal(r.tscCalls, 1);
  assert.equal(r.clientMirrored, false);
  assert.match(r.stdout, /build: OK/);
});

test('always-regenerates: a pre-existing client does NOT skip generate (dev-runner skip behavior is deliberately absent here)', (t) => {
  const r = runRunner(t, { files: { schema: true }, preExistingClient: true });
  assert.equal(r.status, 0, `runner failed:\n${r.stdout}\n${r.stderr}`);
  assert.equal(r.generateCalls, 1, 'build must regenerate even when a client already exists');
  assert.equal(r.tscCalls, 1);
  // The mirrored client is the freshly generated one, not the stale copy.
  assert.equal(r.clientMirrored, true);
});

test('cwd guard: no package.json in cwd → exit 2 with guidance, nothing runs', (t) => {
  const r = runRunner(t, { noPackageJson: true });
  assert.equal(r.status, 2);
  assert.match(r.stderr, /no package\.json in/);
  assert.match(r.stderr, /run from a service directory/);
  assert.equal(r.calls.length, 0);
});

test('tsc exit 0 with output: output is surfaced with the | prefix, not swallowed', (t) => {
  const r = runRunner(t, { files: { schema: true }, tscWarn: true });
  assert.equal(r.status, 0);
  assert.match(r.stdout, /\|\s+.*TS2591/);
  assert.match(r.stdout, /build: OK/);
});
