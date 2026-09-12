/**
 * Permanent unit tests for the shared dev runner's contract
 * (scripts/start-dev-service.sh — the single source of truth for
 * `pnpm start:dev` in every NestJS service).
 *
 * Strategy: each test builds a throwaway "service directory" sandbox
 * (schema present/absent, client present/absent), drops a STUB `pnpm` on
 * PATH that records every invocation to a log, and runs the REAL runner
 * with bash. That exercises the actual script — quoting, `set -euo pipefail`,
 * the exec — rather than a reimplementation of it.
 *
 * Contract under test (the drift that broke real services before this
 * runner existed):
 *   1. First run on a fresh clone: `prisma generate` runs exactly once.
 *   2. Restart with an existing client: no generate (skip path).
 *   3. Generate failure: error block + banner + fix hint on stderr, exit 1,
 *      and `nest` NEVER starts — the service must not boot against a
 *      missing/stale client.
 *   4. Client is mirrored into dist/prisma/client so compiled imports
 *      resolve before the first watch rebuild.
 *   5. Extra args pass through to `nest start --watch` verbatim.
 *   6. Invoked outside a service directory: exit 2, nest never starts.
 *   7. Schema-less workspaces (api-gateway): no generate, straight to nest.
 *
 * Run: `node --test scripts/__tests__/start-dev-runner.test.mjs`
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { chmodSync, cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RUNNER = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../start-dev-service.sh');

// The stub pnpm records `pnpm <args>` lines into pnpm-calls.log, simulates a
// successful generate by creating the client dir, and — when PRISMA_FAIL is
// set — reproduces a realistic Prisma schema-validation failure.
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

/**
 * Build a sandbox service dir, write the requested files, install the stub
 * pnpm, and run the real runner from that cwd.
 *
 * files: { schema?: boolean, clientDir?: boolean, packageJson?: boolean }
 */
function runRunner(t, { files = {}, args = [], prismaFail = false } = {}) {
  const sandbox = mkdtempSync(path.join(tmpdir(), 'start-dev-runner-'));
  t.after(() => rmSync(sandbox, { recursive: true, force: true }));

  if (files.packageJson !== false) {
    writeFileSync(path.join(sandbox, 'package.json'), JSON.stringify({ name: 'sandbox-svc' }));
  }
  if (files.schema) {
    mkdirSync(path.join(sandbox, 'prisma'), { recursive: true });
    writeFileSync(
      path.join(sandbox, 'prisma', 'schema.prisma'),
      'generator client { provider = "prisma-client-js" }\n',
    );
  }
  if (files.clientDir) {
    mkdirSync(path.join(sandbox, 'src', 'prisma', 'client'), { recursive: true });
    writeFileSync(path.join(sandbox, 'src', 'prisma', 'client', 'schema.prisma'), 'embedded');
  }

  const stubDir = path.join(sandbox, '.stub-bin');
  mkdirSync(stubDir, { recursive: true });
  const stubPath = path.join(stubDir, 'pnpm');
  writeFileSync(stubPath, STUB_PNPM);
  chmodSync(stubPath, 0o755);

  const res = spawnSync('bash', [RUNNER, ...args], {
    cwd: sandbox,
    encoding: 'utf8',
    timeout: 20_000,
    env: {
      ...process.env,
      PATH: `${stubDir}:${process.env.PATH}`,
      PRISMA_FAIL: prismaFail ? '1' : '',
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
    nestCalls: calls.filter((c) => c.startsWith('pnpm exec nest')).length,
    nestArgs: (calls.find((c) => c.startsWith('pnpm exec nest')) ?? '').split(' ').slice(3),
    clientMirrored: (() => {
      try {
        // .trim(): the stub's `echo` appends a newline, the fixture does not.
        return readFileSync(path.join(sandbox, 'dist', 'prisma', 'client', 'schema.prisma'), 'utf8').trim() === 'embedded';
      } catch {
        return false;
      }
    })(),
  };
}

test('first run: generate runs exactly once, banner shown, nest starts', (t) => {
  const r = runRunner(t, { files: { schema: true } });
  assert.equal(r.status, 0, `runner failed:\n${r.stdout}\n${r.stderr}`);
  assert.equal(r.generateCalls, 1);
  assert.equal(r.nestCalls, 1);
  assert.match(r.stdout, /Generating Prisma client \(first run\)/);
  // The stub simulates generate creating the client; the runner mirrors it.
  assert.equal(r.clientMirrored, true);
});

test('restart with an existing client: no generate, client re-mirrored', (t) => {
  const r = runRunner(t, { files: { schema: true, clientDir: true } });
  assert.equal(r.status, 0, `runner failed:\n${r.stdout}\n${r.stderr}`);
  assert.equal(r.generateCalls, 0);
  assert.equal(r.nestCalls, 1);
  assert.equal(r.clientMirrored, true);
  assert.doesNotMatch(r.stdout, /Generating Prisma client/);
});

test('generate failure: error block + banner + fix hint, exit 1, nest NEVER starts', (t) => {
  const r = runRunner(t, { files: { schema: true }, prismaFail: true });
  assert.equal(r.status, 1);
  assert.equal(r.generateCalls, 1);
  assert.equal(r.nestCalls, 0, 'nest must never start when generation fails');
  // The captured generate output is echoed with a "|" prefix — unmissable.
  assert.match(r.stdout, /\|\s+.*schema validation/);
  // The banner and the concrete fix land on stderr.
  assert.match(r.stderr, /prisma generate FAILED — not starting/);
  assert.match(r.stderr, /pnpm run prisma:generate/);
});

test('extra args pass through to nest verbatim', (t) => {
  const r = runRunner(t, { files: { schema: true, clientDir: true }, args: ['--entryFile', 'main2'] });
  assert.equal(r.status, 0, `runner failed:\n${r.stdout}\n${r.stderr}`);
  assert.equal(r.nestCalls, 1);
  assert.deepEqual(r.nestArgs, ['start', '--watch', '--entryFile', 'main2']);
});

test('schema-less workspace (api-gateway class): no generate, straight to nest', (t) => {
  const r = runRunner(t, { files: {} });
  assert.equal(r.status, 0, `runner failed:\n${r.stdout}\n${r.stderr}`);
  assert.equal(r.generateCalls, 0);
  assert.equal(r.nestCalls, 1);
  assert.equal(r.clientMirrored, false);
});

test('invoked outside a service directory: exit 2 with guidance, nest never starts', (t) => {
  const bare = mkdtempSync(path.join(tmpdir(), 'start-dev-nopkg-'));
  t.after(() => rmSync(bare, { recursive: true, force: true }));
  const stubDir = path.join(bare, '.stub-bin');
  mkdirSync(stubDir, { recursive: true });
  const stubPath = path.join(stubDir, 'pnpm');
  writeFileSync(stubPath, STUB_PNPM);
  chmodSync(stubPath, 0o755);

  const res = spawnSync('bash', [RUNNER], {
    cwd: bare, // no package.json here
    encoding: 'utf8',
    timeout: 20_000,
    env: { ...process.env, PATH: `${stubDir}:${process.env.PATH}` },
  });

  assert.equal(res.status, 2);
  assert.match(res.stderr, /no package\.json/);
  assert.match(res.stderr, /run from a service directory/);
});
