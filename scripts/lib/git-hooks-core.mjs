/**
 * Core of the git pre-commit hook check — parameterized by the repo `root` so
 * it can be unit-tested against fixture trees (see
 * scripts/__tests__/git-hooks.test.mjs).
 *
 * The pre-commit hook (scripts/hooks/pre-commit) blocks commits when a
 * generated Prisma client is stale. Because git only runs hooks from
 * core.hooksPath (never from a worktree file), installation is per-clone and
 * invisible to CI — so a hook that is deleted, left untracked, loses its
 * executable bit in the index, or stops invoking the stale-client checker
 * would silently disable the guard for every new clone. This check makes each
 * of those regressions fail loudly.
 *
 * The executable-bit contract is verified against the git index mode
 * (`git ls-files -s`), not the worktree bit: macOS filesystems don't track a
 * fully posix exec model the way CI's Linux runners do, and the worktree bit
 * can differ from what a fresh `git clone` will materialize. Index mode
 * 100755 is the only thing that reliably predicts the hook being executable
 * after checkout.
 */

import { execFileSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';
import path from 'node:path';

export const HOOK_REL_PATH = 'scripts/hooks/pre-commit';

/**
 * Run git in `root`, returning stdout or null on any failure (missing git,
 * not a repo, pathspec matches nothing, etc.).
 */
function git(root, args) {
  try {
    return execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
  } catch {
    return null;
  }
}

/**
 * Index mode for `relPath` (e.g. "100755"), or null when the file is not
 * tracked. Uses `git ls-files -s --` so fixtures without a real index return
 * null rather than throwing.
 */
export function trackedFileMode(root, relPath) {
  const out = git(root, ['ls-files', '-s', '--', relPath]);
  if (out === null || out.length === 0) return null;
  const mode = out.split('\n')[0].split(' ')[0];
  return /^\d{6}$/.test(mode) ? mode : null;
}

/**
 * Worktree stat for `relPath`, or null when missing.
 */
function worktreeStat(root, relPath) {
  try {
    return statSync(path.join(root, relPath));
  } catch {
    return null;
  }
}

/**
 * Whether the hook references the stale-client checker. The hook's entire
 * value is gating commits on client freshness; a rewrite that drops the
 * invocation would preserve presence/executability while silently gutting
 * the guard.
 */
export function referencesStaleChecker(root) {
  try {
    const stat = worktreeStat(root, HOOK_REL_PATH);
    if (!stat || !stat.isFile()) return false;
    const content = readFileSync(path.join(root, HOOK_REL_PATH), 'utf8');
    return content.includes('check-prisma-client-stale.mjs');
  } catch {
    return false;
  }
}

/**
 * Full audit of the pre-commit hook wiring. Returns a structured result so
 * the CLI renders problems; every failure carries a fix hint.
 *
 * Result shape:
 *   { ok, problems: [{ code, message, fix }], info: [{ message }] }
 */
export function checkGitHooks(root) {
  const problems = [];
  const info = [];

  const hookPath = path.join(root, HOOK_REL_PATH);
  const stat = worktreeStat(root, HOOK_REL_PATH);

  if (!stat) {
    problems.push({
      code: 'HOOK_MISSING',
      message: `${HOOK_REL_PATH} does not exist`,
      fix: 'Restore scripts/hooks/pre-commit (see git history) — it blocks commits with stale Prisma clients.',
    });
    return { ok: false, problems, info };
  }
  if (!stat.isFile()) {
    problems.push({
      code: 'HOOK_NOT_A_FILE',
      message: `${HOOK_REL_PATH} exists but is not a regular file`,
      fix: `Remove whatever occupies ${HOOK_REL_PATH} and restore the hook script.`,
    });
    return { ok: false, problems, info };
  }

  // Worktree executable bit: what a developer running the hook right now
  // would get on this checkout.
  if (!(stat.mode & 0o111)) {
    problems.push({
      code: 'HOOK_NOT_EXECUTABLE_WORKTREE',
      message: `${HOOK_REL_PATH} is present but not executable in the worktree (chmod -x)`,
      fix: `chmod +x ${HOOK_REL_PATH}`,
    });
  }

  // Index mode: what a fresh `git clone` will materialize. The hook being
  // untracked is the most common real-world failure — it ships on one
  // machine and is missing for everyone else.
  const mode = trackedFileMode(root, HOOK_REL_PATH);
  if (mode === null) {
    problems.push({
      code: 'HOOK_NOT_TRACKED',
      message: `${HOOK_REL_PATH} is not tracked by git — fresh clones will not have it`,
      fix: `git add ${HOOK_REL_PATH} && git commit`,
    });
  } else if (mode !== '100755') {
    problems.push({
      code: 'HOOK_NOT_EXECUTABLE_IN_INDEX',
      message: `${HOOK_REL_PATH} is tracked with mode ${mode}, not 100755 — fresh clones will get a non-executable hook`,
      fix: `chmod +x ${HOOK_REL_PATH} && git add ${HOOK_REL_PATH}`,
    });
  }

  if (!referencesStaleChecker(root)) {
    problems.push({
      code: 'HOOK_DOES_NOT_CHECK_STALE_CLIENTS',
      message: `${HOOK_REL_PATH} no longer invokes scripts/check-prisma-client-stale.mjs`,
      fix: 'Re-add the stale-client verification (see git history for the original hook body).',
    });
  }

  // Informational: whether THIS checkout actually has the hook active. Not a
  // failure — hooks are opt-in per clone by design (the hook header documents
  // the opt-in), and CI cannot assume a developer's local git config.
  const hooksPath = git(root, ['config', '--get', 'core.hooksPath']);
  if (hooksPath === null || hooksPath === '') {
    info.push(
      'This clone has core.hooksPath unset, so the pre-commit hook is not active locally. ' +
      'Install with: git config core.hooksPath scripts/hooks',
    );
  } else if (hooksPath !== 'scripts/hooks') {
    info.push(
      `This clone has core.hooksPath="${hooksPath}" (expected "scripts/hooks"); ` +
      'the repo pre-commit hook is not active locally. Install with: git config core.hooksPath scripts/hooks',
    );
  }

  return { ok: problems.length === 0, problems, info };
}
