/**
 * Unit tests for the git pre-commit hook integrity check.
 *
 * Strategy: each test builds a real temporary directory, writes (or omits)
 * the hook file, and inits a real throwaway git repo so index-mode
 * assertions (`git ls-files -s`) exercise actual git behavior rather than a
 * mock. Real `git init` is cheap (~10ms) and is the only honest way to test
 * "what a fresh clone would materialize".
 *
 * See scripts/lib/git-hooks-core.mjs for the rule definitions and
 * scripts/check-git-hooks.mjs for the CLI that consumes them.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { chmodSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { checkGitHooks, HOOK_REL_PATH, referencesStaleChecker, trackedFileMode } from '../lib/git-hooks-core.mjs';

const HOOK_BODY = `#!/usr/bin/env bash
# Azeebo+ — git pre-commit hook (opt-in)
set -euo pipefail
ROOT="$(git rev-parse --show-toplevel)"
if ! node "$ROOT/scripts/check-prisma-client-stale.mjs"; then
  echo "Commit blocked: generated Prisma client is stale."
  exit 1
fi
`;

function makeTempRoot(t) {
  const root = mkdtempSync(path.join(tmpdir(), 'git-hooks-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return root;
}

function initGitRepo(root) {
  execFileSync('git', ['init', '-q'], { cwd: root });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: root });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd: root });
}

function writeHook(root, body = HOOK_BODY, mode = 0o755) {
  mkdirSync(path.dirname(path.join(root, HOOK_REL_PATH)), { recursive: true });
  writeFileSync(path.join(root, HOOK_REL_PATH), body);
  chmodSync(path.join(root, HOOK_REL_PATH), mode);
}

const codes = (root) => checkGitHooks(root).problems.map((p) => p.code);

test('conforming hook: present, executable, tracked 100755, stale-checker wired → ok', (t) => {
  const root = makeTempRoot(t);
  initGitRepo(root);
  writeHook(root);
  gitAdd(root, HOOK_REL_PATH);

  const { ok, problems } = checkGitHooks(root);
  assert.equal(ok, true);
  assert.deepEqual(problems, []);
});

test('missing hook file is a single HOOK_MISSING problem with a restore hint', (t) => {
  const root = makeTempRoot(t);
  initGitRepo(root);

  const { ok, problems } = checkGitHooks(root);
  assert.equal(ok, false);
  assert.deepEqual(problems.map((p) => p.code), ['HOOK_MISSING']);
  assert.match(problems[0].fix, /scripts\/hooks\/pre-commit/);
});

test('hook present but not executable in worktree AND not executable in index', (t) => {
  const root = makeTempRoot(t);
  initGitRepo(root);
  writeHook(root, HOOK_BODY, 0o644);
  gitAdd(root, HOOK_REL_PATH);

  assert.deepEqual(codes(root).sort(), ['HOOK_NOT_EXECUTABLE_IN_INDEX', 'HOOK_NOT_EXECUTABLE_WORKTREE']);
});

test('worktree executable but index records 100644 → fresh clones get a dead hook', (t) => {
  const root = makeTempRoot(t);
  initGitRepo(root);
  writeHook(root, HOOK_BODY, 0o644);
  gitAdd(root, HOOK_REL_PATH);
  // Developer chmods +x afterwards but never re-adds: worktree fixed, index stale.
  chmodSync(path.join(root, HOOK_REL_PATH), 0o755);

  assert.deepEqual(codes(root), ['HOOK_NOT_EXECUTABLE_IN_INDEX']);
});

test('untracked hook (the ship-on-one-machine failure) is flagged with the add hint', (t) => {
  const root = makeTempRoot(t);
  initGitRepo(root);
  writeHook(root); // on disk, executable, but never `git add`ed

  assert.deepEqual(codes(root), ['HOOK_NOT_TRACKED']);
});

test('hook rewrite that drops the stale-checker invocation is flagged', (t) => {
  const root = makeTempRoot(t);
  initGitRepo(root);
  writeHook(root, '#!/usr/bin/env bash\necho "hook does nothing"\n');
  gitAdd(root, HOOK_REL_PATH);

  assert.deepEqual(codes(root), ['HOOK_DOES_NOT_CHECK_STALE_CLIENTS']);
});

test('trackedFileMode: null for untracked paths, real index mode for tracked ones', (t) => {
  const root = makeTempRoot(t);
  initGitRepo(root);
  writeHook(root, HOOK_BODY, 0o644);

  assert.equal(trackedFileMode(root, HOOK_REL_PATH), null);
  gitAdd(root, HOOK_REL_PATH);
  assert.equal(trackedFileMode(root, HOOK_REL_PATH), '100644');
});

test('referencesStaleChecker: true for the real hook body, false otherwise', (t) => {
  const root = makeTempRoot(t);
  writeHook(root, HOOK_BODY);
  assert.equal(referencesStaleChecker(root), true);

  writeHook(root, '#!/usr/bin/env bash\nexit 0\n');
  assert.equal(referencesStaleChecker(root), false);
});

test('non-git directory degrades to HOOK_NOT_TRACKED (no crash, exit-1 CLI path)', (t) => {
  const root = makeTempRoot(t);
  writeHook(root); // no git init at all

  assert.deepEqual(codes(root), ['HOOK_NOT_TRACKED']);
});

test('informational note surfaces when this clone has no core.hooksPath set', (t) => {
  const root = makeTempRoot(t);
  initGitRepo(root);
  writeHook(root);
  gitAdd(root, HOOK_REL_PATH);

  const { info } = checkGitHooks(root);
  assert.equal(info.length, 1);
  assert.match(info[0], /git config core\.hooksPath scripts\/hooks/);
});

test('informational note flags a hooksPath pointing somewhere else', (t) => {
  const root = makeTempRoot(t);
  initGitRepo(root);
  writeHook(root);
  gitAdd(root, HOOK_REL_PATH);
  execFileSync('git', ['config', 'core.hooksPath', '.githooks'], { cwd: root });

  const { info } = checkGitHooks(root);
  assert.equal(info.length, 1);
  assert.match(info[0], /\.githooks/);
  assert.match(info[0], /not active locally/);
});

function gitAdd(root, relPath) {
  execFileSync('git', ['add', relPath], { cwd: root });
}
