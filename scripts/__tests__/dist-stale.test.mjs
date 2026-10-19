import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync, utimesSync, mkdtempSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const SCRIPT = join(dirname(fileURLToPath(import.meta.url)), '..', 'check-dist-stale.mjs');

function makeFixture(files) {
  const root = mkdtempSync(join(tmpdir(), 'dist-stale-'));
  for (const [rel, mtime] of Object.entries(files)) {
    const full = join(root, rel);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, '// fixture\n');
    utimesSync(full, mtime, mtime);
  }
  return root;
}

function run(root) {
  return spawnSync(process.execPath, [SCRIPT, '--root', root], { encoding: 'utf8' });
}

test('fresh dist passes', () => {
  const old = new Date(Date.now() - 60_000);
  const recent = new Date(Date.now() - 1_000);
  const root = makeFixture({
    'packages/demo/src/index.ts': old,
    'packages/demo/dist/index.js': recent,
  });
  try {
    const res = run(root);
    assert.equal(res.status, 0, res.stderr);
    assert.match(res.stdout, /1 package dists fresh/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('src newer than dist fails with the fix command', () => {
  const old = new Date(Date.now() - 60_000);
  const recent = new Date(Date.now() - 1_000);
  const root = makeFixture({
    'packages/demo/src/index.ts': recent,
    'packages/demo/dist/index.js': old,
  });
  try {
    const res = run(root);
    assert.equal(res.status, 1);
    assert.match(res.stderr, /Stale workspace dist/);
    assert.match(res.stderr, /packages\/demo/);
    assert.match(res.stderr, /pnpm --filter .*packages\/demo.* run build/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('excluded test files do not mark a dist stale', () => {
  const old = new Date(Date.now() - 60_000);
  const recent = new Date(Date.now() - 1_000);
  const root = makeFixture({
    'packages/demo/tsconfig.json': old,
    'packages/demo/src/index.ts': old,
    'packages/demo/src/index.spec.ts': recent, // excluded from tsc
    'packages/demo/dist/index.js': old,
  });
  try {
    // tsconfig with no explicit exclude still compiles tests; only an
    // explicit exclude makes this pass — write the exclusion first.
    writeFileSync(
      join(root, 'packages/demo/tsconfig.json'),
      JSON.stringify({ exclude: ['node_modules', 'dist', '**/*.spec.ts'] })
    );
    const res = run(root);
    assert.equal(res.status, 0, res.stderr);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('packages without dist are skipped, not failed', () => {
  const recent = new Date(Date.now() - 1_000);
  const root = makeFixture({ 'packages/src-only/src/index.ts': recent });
  try {
    const res = run(root);
    assert.equal(res.status, 0, res.stderr);
    assert.match(res.stdout, /0 package dists fresh/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
