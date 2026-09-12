/**
 * Unit tests for the git hook auto-installer
 * (scripts/install-git-hooks.sh — the `prepare` script's payload).
 *
 * Each test builds a throwaway sandbox (a real `git init` repo, or a plain
 * directory for the no-git case), pre-seeds core.hooksPath where needed, and
 * runs the REAL installer with bash. That exercises the actual script —
 * quoting, `set -uo pipefail`, and the git-config interactions — the same way
 * the dev/build runner suites exercise their scripts.
 *
 * The contract pinned here:
 *   - fresh clone      → sets core.hooksPath=scripts/hooks, announces it
 *   - non-git dir      → silent no-op, exit 0 (Docker builds, tarballs)
 *   - existing hooksPath → untouched, informational note, exit 0
 *   - already installed  → silent no-op, exit 0 (repeat `pnpm install`)
 *   - never fails the install → every path exits 0
 *
 * Run: node --test scripts/__tests__/install-git-hooks.test.mjs
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const INSTALLER = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'install-git-hooks.sh');

/** Strip GIT_* env vars so the outer checkout can never leak into the sandbox. */
function cleanEnv() {
  const env = { ...process.env, HOME: tmpdir() };
  for (const k of Object.keys(env)) {
    if (k.startsWith('GIT_')) delete env[k];
  }
  return env;
}

function runInstaller(cwd) {
  return spawnSync('bash', [INSTALLER], { cwd, env: cleanEnv(), encoding: 'utf8' });
}

function getHooksPath(cwd) {
  return spawnSync('git', ['config', '--get', 'core.hooksPath'], { cwd, env: cleanEnv(), encoding: 'utf8' }).stdout.trim();
}

function setHooksPath(cwd, value) {
  const r = spawnSync('git', ['config', 'core.hooksPath', value], { cwd, env: cleanEnv(), encoding: 'utf8' });
  assert.equal(r.status, 0, `setup failed: ${r.stderr}`);
}

function makeSandbox(t, { git = true } = {}) {
  const root = mkdtempSync(path.join(tmpdir(), 'install-hooks-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  if (git) {
    const r = spawnSync('git', ['init', '-q'], { cwd: root, env: cleanEnv(), encoding: 'utf8' });
    assert.equal(r.status, 0, `git init failed: ${r.stderr}`);
  }
  return root;
}

test('fresh repo: sets core.hooksPath=scripts/hooks, announces it, exits 0', (t) => {
  const root = makeSandbox(t);
  const r = runInstaller(root);
  assert.equal(r.status, 0, `installer failed: ${r.stderr}`);
  assert.equal(getHooksPath(root), 'scripts/hooks');
  assert.match(r.stdout, /pre-commit hook active/);
});

test('non-git directory: silent no-op, exit 0 (Docker build / tarball case)', (t) => {
  const root = makeSandbox(t, { git: false });
  const r = runInstaller(root);
  assert.equal(r.status, 0, `installer failed: ${r.stderr}`);
  assert.equal(r.stdout, '', 'must not print anything outside a git checkout');
  assert.equal(r.stderr, '', 'must not warn outside a git checkout');
});

test('existing custom hooksPath: left untouched, informational note, exit 0', (t) => {
  const root = makeSandbox(t);
  setHooksPath(root, '.husky');
  const r = runInstaller(root);
  assert.equal(r.status, 0, `installer failed: ${r.stderr}`);
  assert.equal(getHooksPath(root), '.husky', 'must never clobber a developer-set hooksPath');
  assert.match(r.stdout, /core\.hooksPath is already '\.husky' — leaving it untouched/);
});

test('already installed (scripts/hooks): silent no-op, exit 0 (idempotent re-run)', (t) => {
  const root = makeSandbox(t);
  setHooksPath(root, 'scripts/hooks');
  const r = runInstaller(root);
  assert.equal(r.status, 0, `installer failed: ${r.stderr}`);
  assert.equal(r.stdout, '', 'repeat installs must be silent');
  assert.equal(r.stderr, '', 'repeat installs must not warn');
  assert.equal(getHooksPath(root), 'scripts/hooks');
});

test('installer never fails the install: every path exits 0', (t) => {
  for (const opts of [{ git: false }, {}]) {
    const root = makeSandbox(t, opts);
    assert.equal(runInstaller(root).status, 0);
  }
});
