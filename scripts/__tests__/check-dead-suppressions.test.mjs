/**
 * Tests for scripts/lib/dead-entries.mjs and scripts/check-dead-suppressions.mjs.
 *
 * The drift these pin: an exception outlives the thing it excepted. A literal
 * `!scripts/build.sh` un-ignore whose file was renamed still reads as "the build
 * gets this script", a stale `// eslint-disable-next-line` still reads as "this
 * is deliberate", and neither fails anything — so the next file to land on that
 * name is silently forgiven or silently excluded.
 *
 * Ignore entries are the list this gate can prove dead from the tree alone.
 * eslint-disable directives are the same problem, but only ESLint knows whether
 * a rule would have fired, so that half is a config setting
 * (linterOptions.reportUnusedDisableDirectives: 'error') rather than a text
 * scan — asserted here so it cannot be lowered back to the default warning.
 *
 * Run via the CI conventions job: `node --test scripts/__tests__/*.test.mjs`
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import {
  classifyIgnoreEntry,
  findDeadEntries,
  ignorePatternMatches,
  parseIgnoreFile,
} from '../lib/dead-entries.mjs';
import { findDeadSuppressions, IGNORE_FILE_RE } from '../check-dead-suppressions.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..');
const SCRIPT = join(ROOT, 'scripts', 'check-dead-suppressions.mjs');
const read = (file) => readFileSync(join(ROOT, file), 'utf8');

/** Writes files into a temp dir and runs a callback with its path. */
function withFiles(files, fn) {
  const dir = mkdtempSync(join(tmpdir(), 'dead-suppressions-'));
  try {
    for (const [name, content] of Object.entries(files)) {
      const abs = join(dir, name);
      mkdirSync(dirname(abs), { recursive: true });
      writeFileSync(abs, content);
    }
    return fn(dir, Object.keys(files));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test('parseIgnoreFile keeps line numbers and classifies each shape', () => {
  const entries = parseIgnoreFile(
    ['# a comment', '', 'node_modules', '!scripts/build.sh', '*.log', '  dist/  '].join('\n')
  );
  assert.deepEqual(
    entries.map((e) => [e.line, e.pattern, e.kind]),
    [
      [3, 'node_modules', 'path'],
      [4, '!scripts/build.sh', 'negation'],
      [5, '*.log', 'glob'],
      [6, 'dist/', 'path'],
    ]
  );
  assert.equal(entries[1].body, 'scripts/build.sh');
});

test('ignorePatternMatches follows gitignore shapes', () => {
  // A bare name matches that segment at any depth (`node_modules/x`).
  assert.equal(ignorePatternMatches('node_modules', 'apps/web/node_modules/x.js'), true);
  assert.equal(ignorePatternMatches('node_modules', 'apps/web/src/index.ts'), false);
  // A directory pattern covers everything beneath it.
  assert.equal(ignorePatternMatches('scripts/lib', 'scripts/lib/a.mjs'), true);
  // `**/x` matches at the root too.
  assert.equal(ignorePatternMatches('**/dist', 'dist/a.js'), true);
  assert.equal(ignorePatternMatches('**/dist', 'apps/web/dist/a.js'), true);
  // Globs stay inside one segment.
  assert.equal(ignorePatternMatches('*.env.example', 'deploy/staging.env.example'), true);
  assert.equal(ignorePatternMatches('*.env.example', 'deploy/staging.env.example.bak'), false);
  // A negation is matched by its body — the `!` only flips the list.
  assert.equal(ignorePatternMatches('!deploy/domains.env', 'deploy/domains.env'), true);
});

test('classifyIgnoreEntry separates exceptions from guards', () => {
  assert.equal(classifyIgnoreEntry('!scripts/build.sh'), 'negation');
  assert.equal(classifyIgnoreEntry('*.log'), 'glob');
  assert.equal(classifyIgnoreEntry('infra/config/pgbouncer.ini'), 'path');
});

test('findDeadEntries reports only entries whose probe fails', () => {
  const alive = new Set(['kept']);
  assert.deepEqual(
    findDeadEntries(['kept', 'gone'], (entry) => alive.has(entry)),
    ['gone']
  );
});

test('a literal un-ignore that lost its file is an error, a guard is not', () => {
  withFiles(
    {
      '.gitignore': [
        'node_modules',
        '!scripts/build.sh', // scripts/ is real, the file is gone → error
        '!nowhere/extensions.json', // the directory never existed → guard
        'deploy/staging.env', // specific path that does not exist → advisory
        '*.log', // shape guard → never reported
      ].join('\n'),
      'scripts/keep.sh': '#!/bin/sh\n',
      'apps/web/src/index.ts': 'export const x = 1;\n',
    },
    (dir, files) => {
      const { errors, advisories } = findDeadSuppressions(dir, files);
      assert.deepEqual(
        errors.map((e) => [e.file, e.line, e.pattern]),
        [['.gitignore', 2, '!scripts/build.sh']]
      );
      assert.deepEqual(advisories.map((a) => a.pattern), [
        '!nowhere/extensions.json',
        'deploy/staging.env',
      ]);
    }
  );
});

test('a per-directory .gitignore is matched against its own directory', () => {
  // `infra/scripts/!.template` protects infra/scripts/.template, never
  // infra/config/.template — the mistake the real gate caught.
  withFiles(
    {
      'infra/scripts/.gitignore': 'pgbouncer_userlist.txt\n!pgbouncer_userlist.txt.template\n',
      'infra/scripts/generate.sh': '#!/bin/sh\n',
      'infra/config/pgbouncer_userlist.txt.template': 'user=pass\n',
    },
    (dir, files) => {
      const { errors } = findDeadSuppressions(dir, files);
      assert.equal(errors.length, 1, 'the template in infra/config must not satisfy it');
      assert.equal(errors[0].target, 'pgbouncer_userlist.txt.template');
    }
  );
});

test('the gate fails a dead un-ignore end to end, and --strict escalates guards', () => {
  const run = (files, args = []) => {
    let result;
    withFiles(files, (dir) => {
      execFileSync('git', ['init', '-q'], { cwd: dir });
      execFileSync('git', ['add', '-A'], { cwd: dir });
      result = spawnSync(process.execPath, [SCRIPT, '--root', dir, ...args], { encoding: 'utf8' });
    });
    return result;
  };

  const base = {
    '.gitignore': '!scripts/build.sh\n!never/existed.json\n',
    'scripts/present.sh': '#!/bin/sh\n',
  };

  const dead = run(base);
  assert.equal(dead.status, 1, dead.stdout + dead.stderr);
  assert.match(dead.stderr, /dead un-ignore entries \(1\)/);
  assert.match(dead.stderr, /\.gitignore:1\s+!scripts\/build\.sh/);

  // The guard for a directory that never existed is advisory, so the gate is
  // green; --strict is the one-off cleanup mode that fails it.
  const fixed = run({ ...base, 'scripts/build.sh': '#!/bin/sh\n' });
  assert.equal(fixed.status, 0, fixed.stdout + fixed.stderr);
  assert.match(fixed.stdout, /every un-ignore points at a tracked path/);
  assert.match(fixed.stdout, /1 advisory entry/);

  const strict = run({ ...base, 'scripts/build.sh': '#!/bin/sh\n' }, ['--strict']);
  assert.equal(strict.status, 1, strict.stdout + strict.stderr);
  assert.match(strict.stderr, /unmatched ignore pattern\(s\) under --strict/);
});

test('the repo has no dead un-ignore entries', () => {
  const { ignoreFiles, errors } = findDeadSuppressions(ROOT);
  assert.ok(ignoreFiles >= 30, `expected the tracked .gitignore tree, saw ${ignoreFiles}`);
  assert.deepEqual(
    errors.map((e) => `${e.file}:${e.line} ${e.pattern}`),
    [],
    'a literal un-ignore no longer points at a file — fix the path or delete the entry'
  );
});

test('the gate understands the ignore files this repo actually has', () => {
  for (const file of ['.gitignore', '.dockerignore', '.prettierignore', 'apps/web/.gitignore']) {
    assert.equal(IGNORE_FILE_RE.test(file), true, `${file} should be checked`);
  }
  assert.equal(IGNORE_FILE_RE.test('docs/ignore-notes.md'), false);
});

test('eslint reports unused disable directives as errors', () => {
  // The eslint half of the same drift. Flat config defaults to "warn", which
  // `eslint src` prints while still exiting 0 — a dead directive would linger
  // forever. Pinned here so the severity cannot quietly drop back.
  const config = read('eslint.config.js');
  assert.match(config, /reportUnusedDisableDirectives:\s*'error'/);
  const rootPkg = read('package.json');
  assert.doesNotMatch(rootPkg, /--no-report-unused-disable-directives/);
  assert.doesNotMatch(rootPkg, /--no-inline-config/);
});

test('pr-checks runs the dead-suppression gate', () => {
  const workflow = read('.github/workflows/pr-checks.yml');
  assert.match(workflow, /- run: node scripts\/check-dead-suppressions\.mjs/);
});
