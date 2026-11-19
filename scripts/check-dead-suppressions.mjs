#!/usr/bin/env node
// ============================================================================
// check-dead-suppressions.mjs — suppress nothing, say nothing
// ============================================================================
// The repo's ignore files are exceptions in the same sense as the domain
// literal allowlist: `node_modules` is excluded, `.env` is never committed,
// `scripts/lib` is un-ignored so the image build has it. Each one promises a
// path still exists. When the path is renamed or deleted the entry stays, and
// the next file to land on that name is silently excluded — a missing
// `!scripts/demo-content` is a broken image, not a lint warning.
//
// This gate reads every tracked .gitignore / .dockerignore / .prettierignore
// and applies one rule:
//
//   a *literal* un-ignore (`!scripts/build-service.sh`) whose file does not
//   exist and whose directory does → ERROR (the path moved or was deleted)
//
// Everything else is advisory, because most ignore entries are guards for
// artifacts that do not exist yet (`*.log`, `dump.rdb`, `.DS_Store`), and
// failing on those would make the gate noise. `--strict` escalates advisories
// for a one-off cleanup; `--verbose` lists them.
//
// eslint-disable comments are handled the same way, but by ESLint itself:
// eslint.config.js sets `linterOptions.reportUnusedDisableDirectives: 'error'`,
// so a directive that suppresses nothing (rule renamed, removed, or never fired
// at that site) fails `pnpm lint`. A text scan cannot know whether a rule would
// have fired; ESLint can, so it is not re-implemented here.
//
// Usage: node scripts/check-dead-suppressions.mjs [--root <dir>] [--strict] [--verbose]
// Exit codes: 0 = no dead un-ignore entries, 1 = dead entry found, 2 = could not run.
// CI wiring: .github/workflows/pr-checks.yml
// ============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  entryMatchesTrackedFile,
  findDeadEntries,
  hasGlob,
  listTrackedPaths,
  parentDirectoryIsReal,
  parseIgnoreFile,
  relativeToIgnoreFile,
} from './lib/dead-entries.mjs';

/** Ignore files this gate understands; other ignore formats are out of scope. */
export const IGNORE_FILE_RE = /(^|\/)\.(gitignore|dockerignore|prettierignore|npmignore)$/;

/**
 * Splits every entry into `errors` (a literal un-ignore that lost its file) and
 * `advisories` (guards, unmatched globs, stale plain paths).
 */
export function findDeadSuppressions(root, files = listTrackedPaths(root)) {
  const ignoreFiles = files.filter((file) => IGNORE_FILE_RE.test(file));
  const errors = [];
  const advisories = [];

  for (const ignoreFile of ignoreFiles) {
    const entries = parseIgnoreFile(fs.readFileSync(path.join(root, ignoreFile), 'utf8'));
    const relative = relativeToIgnoreFile(ignoreFile, files);
    // A plain glob ignores a shape (`*.log`); it can only be a guard, so it is
    // never reported — nothing about it can be proven dead.
    const candidates = entries.filter((entry) => entry.kind !== 'glob');
    for (const entry of findDeadEntries(candidates, (candidate) =>
      entryMatchesTrackedFile(candidate, relative)
    )) {
      const literalUnIgnore = entry.negated && !hasGlob(entry.body);
      if (literalUnIgnore && parentDirectoryIsReal(ignoreFile, entry.body, files)) {
        errors.push({
          file: ignoreFile,
          line: entry.line,
          pattern: entry.pattern,
          target: entry.body,
        });
        continue;
      }
      // Advisories are only worth printing when the entry claims something
      // specific: an un-ignore, or a path with a directory in it. A bare
      // basename (`node_modules`, `.env`, `dist/`) is a generic guard, and the
      // per-service .gitignores are made of them.
      const mentionsDirectory = entry.body.replace(/\/+$/, '').includes('/');
      if (entry.negated || mentionsDirectory) {
        advisories.push({
          file: ignoreFile,
          line: entry.line,
          pattern: entry.pattern,
          target: entry.body,
        });
      }
    }
  }

  return { ignoreFiles: ignoreFiles.length, errors, advisories };
}

function main() {
  const args = process.argv.slice(2);
  const rootIdx = args.indexOf('--root');
  const root =
    rootIdx >= 0
      ? path.resolve(args[rootIdx + 1])
      : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const strict = args.includes('--strict');
  const verbose = args.includes('--verbose');

  let result;
  try {
    result = findDeadSuppressions(root);
  } catch (err) {
    console.error(`✗ check-dead-suppressions could not run: ${err.message}`);
    process.exit(2);
  }

  const { ignoreFiles, errors, advisories } = result;

  if (verbose && advisories.length > 0) {
    console.log(`ℹ ${advisories.length} advisory entr${advisories.length === 1 ? 'y' : 'ies'}:`);
    for (const entry of advisories) {
      console.log(`  ${entry.file}:${entry.line}  ${entry.pattern}`);
    }
    console.log('');
  }

  if (errors.length > 0) {
    console.error(
      `✗ dead un-ignore entries (${errors.length}): the path is gone, so the exception protects nothing:`
    );
    for (const entry of errors) {
      console.error(`  ${entry.file}:${entry.line}  ${entry.pattern}  (${entry.target} does not exist)`);
    }
    console.error(
      '\ndelete the entry, or fix its path if the file moved. A literal un-ignore is a promise\n' +
        'that a build step can still read that path.'
    );
    process.exit(1);
  }

  if (strict && advisories.length > 0) {
    console.error(`✗ ${advisories.length} unmatched ignore pattern(s) under --strict:`);
    for (const entry of advisories) {
      console.error(`  ${entry.file}:${entry.line}  ${entry.pattern}`);
    }
    process.exit(1);
  }

  const note =
    advisories.length > 0
      ? ` (${advisories.length} advisory ${advisories.length === 1 ? 'entry' : 'entries'} — pass --verbose)`
      : '';
  console.log(`✓ ${ignoreFiles} ignore files: every un-ignore points at a tracked path${note}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
