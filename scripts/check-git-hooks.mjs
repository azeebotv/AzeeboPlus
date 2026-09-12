#!/usr/bin/env node
/**
 * Git pre-commit hook integrity check — CLI entry point.
 *
 * All rule logic lives in `scripts/lib/git-hooks-core.mjs` so it can be
 * unit-tested against fixture trees (see scripts/__tests__/git-hooks.test.mjs).
 * This file only resolves the repo root, prints problems, and sets the exit
 * code.
 *
 * Rule: scripts/hooks/pre-commit must exist, be executable, be tracked by git
 * with mode 100755 (so fresh clones materialize an executable hook), and
 * invoke the stale-client checker. The hook only runs where a developer has
 * opted in via core.hooksPath, so any of these regressions would silently
 * disable the stale-client guard for every new clone — CI is the only place
 * that can catch it.
 *
 * Run: `node scripts/check-git-hooks.mjs`
 *
 * Optional `--root <dir>` overrides the repo root (used by the unit tests).
 */

import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { checkGitHooks, HOOK_REL_PATH } from './lib/git-hooks-core.mjs';

const rootArgIndex = process.argv.indexOf('--root');
let root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
if (rootArgIndex !== -1) {
  const rootArg = process.argv[rootArgIndex + 1];
  if (!rootArg) {
    console.error('--root requires a directory path');
    process.exit(2);
  }
  root = path.resolve(rootArg);
  if (!existsSync(root)) {
    console.error(`--root directory does not exist: ${root}`);
    process.exit(2);
  }
}

const { ok, problems, info } = checkGitHooks(root);

if (problems.length > 0) {
  console.error(`Pre-commit hook integrity violations (${problems.length}):`);
  for (const p of problems) {
    console.error(`  - ${p.message}`);
    console.error(`      fix: ${p.fix}`);
  }
  console.error('');
  console.error(`The pre-commit hook is the local guard against stale Prisma clients.`);
  console.error(`A missing/unexecutable/untracked ${HOOK_REL_PATH} silently disables it for fresh clones.`);
  process.exit(1);
}

console.log(`Pre-commit hook OK (${HOOK_REL_PATH}: present, executable, tracked, stale-checker wired).`);
for (const i of info) console.log(`  note: ${i}`);
process.exit(0);
