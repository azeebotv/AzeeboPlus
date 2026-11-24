// ============================================================================
// dead-entries.mjs — shared "an exception with no referent is drift" helpers
// ============================================================================
// Every suppression list in this repo grants an exception on the promise that
// something still needs it: a host may appear literally because a third party
// serves it, a path may be un-ignored because the build reads it. When the
// referent disappears the entry survives and silently forgives the next thing
// that looks like it — the host gets hardcoded again, the file stops being
// excluded. These helpers answer one question for those lists:
//
//   "does anything still point at this entry?"     findDeadEntries(entries, probe)
//
// Callers supply the probe, because "referenced" is list-specific (a host token
// must appear in a tracked file; an ignore pattern must match one). Everything
// else — ignore-file parsing and the gitignore matching subset used to decide
// whether a pattern still matches — lives here so the gates cannot drift.
//
// A note on the matcher: it is deliberately generous. A false "still used" only
// keeps an entry alive one more PR, while a false "dead" would fail a build over
// a working guard.
// ============================================================================

import { execFileSync } from 'node:child_process';
import path from 'node:path';

/** Every tracked path (git ls-files — untracked locals are not evidence). */
export function listTrackedPaths(root) {
  const out = execFileSync('git', ['ls-files'], { cwd: root, encoding: 'utf8' });
  return out.split('\n').filter(Boolean);
}

/**
 * The entries whose referent is gone. `isReferenced(entry)` is the caller's
 * probe; this exists so every gate reports the same concept under the same name
 * instead of each re-inventing "keep the ones that pass".
 */
export function findDeadEntries(entries, isReferenced) {
  const dead = [];
  for (const entry of entries) {
    if (!isReferenced(entry)) dead.push(entry);
  }
  return dead;
}

/** True when a pattern names a set rather than one path (`*.log`, `**\/dist`). */
export function hasGlob(pattern) {
  return /[*?[]/.test(pattern);
}

/**
 * negation — `!path`, an exception *to* the list
 * glob     — `*.log`, a shape, usually a guard against future artifacts
 * path     — `scripts/lib`, one concrete path
 */
export function classifyIgnoreEntry(pattern) {
  if (pattern.startsWith('!')) return 'negation';
  return hasGlob(pattern) ? 'glob' : 'path';
}

/** Parses an ignore file into entries, keeping 1-based line numbers. */
export function parseIgnoreFile(content) {
  const entries = [];
  content.split(/\r?\n/).forEach((raw, index) => {
    const pattern = raw.trim();
    if (!pattern || pattern.startsWith('#')) return;
    const negated = pattern.startsWith('!');
    entries.push({
      line: index + 1,
      pattern,
      negated,
      body: negated ? pattern.slice(1) : pattern,
      kind: classifyIgnoreEntry(pattern),
    });
  });
  return entries;
}

/** Translates the gitignore glob subset to a regex anchored at both ends. */
function globToRegExp(pattern) {
  let out = '';
  for (let i = 0; i < pattern.length; i += 1) {
    const ch = pattern[i];
    if (ch === '*') {
      if (pattern[i + 1] === '*') {
        // `**/` spans zero or more directories (`**/dist` matches `dist` too).
        if (pattern[i + 2] === '/') {
          out += '(?:.*/)?';
          i += 2;
        } else {
          out += '.*';
          i += 1;
        }
      } else {
        out += '[^/]*';
      }
    } else if (ch === '?') {
      out += '[^/]';
    } else if ('\\^$.|+()[]{}'.includes(ch)) {
      out += `\\${ch}`;
    } else {
      out += ch;
    }
  }
  return new RegExp(`^${out}$`);
}

/**
 * Does `pattern` cover `filePath`? Paths are relative to the ignore file's own
 * directory, as git applies them. Handles the three shapes that matter here:
 * a basename anywhere (`node_modules`), a directory (`scripts/lib` keeps
 * everything beneath it), and a glob (`*.env.example`, `**\/dist`).
 */
export function ignorePatternMatches(pattern, filePath) {
  const body = pattern
    .replace(/^!/, '')
    .replace(/^\/+/, '')
    .replace(/\/+$/, '');
  if (!body) return false;
  const re = globToRegExp(body);
  const segments = filePath.split('/');
  if (!body.includes('/')) {
    return segments.some((segment) => re.test(segment));
  }
  // Match the path itself or any ancestor directory: `**/dist` covers
  // `apps/web/dist/a.js` because it matches the ancestor `apps/web/dist`.
  for (let depth = segments.length; depth > 0; depth -= 1) {
    if (re.test(segments.slice(0, depth).join('/'))) return true;
  }
  return false;
}

/** True when any tracked path (relative to the ignore file's dir) matches. */
export function entryMatchesTrackedFile(entry, relativePaths) {
  return relativePaths.some((relative) => ignorePatternMatches(entry.body, relative));
}

/** The ignore file's directory prefix, or '' for one at the repo root. */
export function ignoreFilePrefix(ignoreFile) {
  const dir = path.posix.dirname(ignoreFile);
  return dir === '.' ? '' : `${dir}/`;
}

/** Paths of tracked files, relative to the ignore file's directory. */
export function relativeToIgnoreFile(ignoreFile, files) {
  const prefix = ignoreFilePrefix(ignoreFile);
  return files
    .filter((file) => file.startsWith(prefix) && file !== ignoreFile)
    .map((file) => file.slice(prefix.length));
}

/** Does the directory containing `body` hold any tracked file? */
export function parentDirectoryIsReal(ignoreFile, body, files) {
  const dir = path.posix.dirname(body);
  if (!dir || dir === '.') return true;
  const prefix = `${ignoreFilePrefix(ignoreFile)}${dir}/`;
  return files.some((file) => file.startsWith(prefix));
}
