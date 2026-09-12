/**
 * Unit tests for the lint warning ratchet gate
 * (scripts/check-lint-warning-ratchet.mjs).
 *
 * These exercise the pure logic — workspace discovery on a fixture tree,
 * warning counting with workspace shadowing, baseline validation, and the
 * ratchet comparison — without invoking ESLint. The full gate (real ESLint
 * pass + baseline) is verified in CI by pr-checks.yml / lint.yml.
 *
 * Run: `node --test scripts/__tests__/lint-warning-ratchet.test.mjs`
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const {
  parseLintDirs,
  discoverWorkspaces,
  countWarnings,
  validateBaseline,
  compare,
} = await import('../check-lint-warning-ratchet.mjs');

// ---------------------------------------------------------------------------
// parseLintDirs
// ---------------------------------------------------------------------------

test('parseLintDirs extracts dirs from a simple eslint script', () => {
  assert.deepEqual(parseLintDirs('eslint src'), ['src']);
});

test('parseLintDirs drops dash-tokens; flag values survive as harmless no-match dirs', () => {
  // Only tokens starting with '-' are dropped (real dirs never start with
  // '-'), so flag VALUES like '.ts' survive — they just never match a file,
  // and skipping values would risk swallowing real dirs after boolean flags.
  assert.deepEqual(parseLintDirs('eslint src test --ext .ts'), ['src', 'test', '.ts']);
  assert.deepEqual(parseLintDirs('eslint --ext .ts src'), ['.ts', 'src']);
  assert.deepEqual(parseLintDirs('eslint --cache src'), ['src']);
});

test('parseLintDirs handles dot-directory lint scripts', () => {
  assert.deepEqual(parseLintDirs('eslint .'), ['.']);
});

test('parseLintDirs falls back to src when no dirs are given', () => {
  assert.deepEqual(parseLintDirs('eslint'), ['src']);
});

test('parseLintDirs tolerates missing/empty scripts', () => {
  assert.deepEqual(parseLintDirs(undefined), ['src']);
  assert.deepEqual(parseLintDirs(''), ['src']);
});

// ---------------------------------------------------------------------------
// discoverWorkspaces
// ---------------------------------------------------------------------------

/** Build a fixture workspace tree shaped like the repo. */
function makeFixtureRoot() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ratchet-fixture-'));
  const writePkg = (rel, scripts) => {
    const dir = path.join(root, rel);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(
      path.join(dir, 'package.json'),
      JSON.stringify({ name: `fixture/${rel.replace(/\//g, '-')}`, scripts }),
    );
    fs.mkdirSync(path.join(dir, 'src'), { recursive: true });
    return dir;
  };
  writePkg('services/core/eslint-svc', { lint: 'eslint src' });
  writePkg('services/core/no-lint-svc', { build: 'tsc' }); // no lint script
  writePkg('services/core/non-eslint-svc', { lint: 'tslint src' }); // not eslint
  writePkg('services/universes/nested-svc', { lint: 'eslint src test' });
  writePkg('apps/web-app', { lint: 'eslint src' });
  writePkg('packages/ts-only', { lint: 'tsc --noEmit' }); // not eslint
  // No apps-adjacent group dir missing: 'apps' exists above; test a missing group by not creating 'packages-alt' style entries.
  return root;
}

test('discoverWorkspaces finds only eslint-scripted workspaces', () => {
  const root = makeFixtureRoot();
  try {
    const found = discoverWorkspaces(root);
    const names = found.map((w) => w.name);
    assert.ok(names.includes('fixture/services-core-eslint-svc'));
    assert.ok(names.includes('fixture/services-universes-nested-svc'));
    assert.ok(names.includes('fixture/apps-web-app'));
    assert.equal(names.length, 3, `expected 3, got: ${names.join(', ')}`);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('discoverWorkspaces resolves lintDirs relative to the workspace and sorts by name', () => {
  const root = makeFixtureRoot();
  try {
    const found = discoverWorkspaces(root);
    const names = found.map((w) => w.name);
    assert.deepEqual(names, [...names].sort((a, b) => a.localeCompare(b)));
    const svc = found.find((w) => w.name === 'fixture/services-universes-nested-svc');
    assert.deepEqual(
      svc.lintDirs.map((d) => path.basename(d)),
      ['src', 'test'],
    );
    assert.ok(path.isAbsolute(svc.lintDirs[0]), 'lintDirs must be absolute');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('discoverWorkspaces falls back to relative path when package.json has no name', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ratchet-noname-'));
  try {
    const dir = path.join(root, 'packages', 'noname');
    fs.mkdirSync(path.join(dir, 'src'), { recursive: true });
    fs.writeFileSync(
      path.join(dir, 'package.json'),
      JSON.stringify({ scripts: { lint: 'eslint src' } }),
    );
    const found = discoverWorkspaces(root);
    assert.equal(found.length, 1);
    assert.equal(found[0].name, path.join('packages', 'noname'));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------------------
// countWarnings
// ---------------------------------------------------------------------------

const WS = (name, dirs) => ({ name, dir: dirs[0], lintDirs: dirs });
const root = process.platform === 'win32' ? 'C:\\repo' : '/repo';
const sep = path.sep;

test('countWarnings counts severity-1 matches of the rule per workspace', () => {
  const workspaces = [WS('svc', [root + `${sep}services${sep}core${sep}svc${sep}src`])];
  const results = [
    {
      filePath: root + `${sep}services${sep}core${sep}svc${sep}src${sep}a.service.ts`,
      messages: [
        { ruleId: 'azeebo-custom/require-map-and-throw', severity: 1, line: 10, message: 'x' },
        { ruleId: 'azeebo-custom/require-map-and-throw', severity: 1, line: 20, message: 'y' },
      ],
    },
  ];
  const { counts, other } = countWarnings(results, workspaces);
  assert.equal(counts.get('svc'), 2);
  assert.deepEqual(other, []);
});

test('countWarnings ignores non-matching rules and error-severity duplicates', () => {
  const workspaces = [WS('svc', [root + `${sep}a${sep}src`])];
  const results = [
    {
      filePath: root + `${sep}a${sep}src${sep}x.ts`,
      messages: [
        { ruleId: 'no-console', severity: 1, line: 1, message: 'unrelated' },
        { ruleId: 'azeebo-custom/require-map-and-throw', severity: 2, line: 2, message: 'error-severity' },
      ],
    },
  ];
  const { counts, other } = countWarnings(results, workspaces);
  assert.equal(counts.get('svc'), 0);
  assert.deepEqual(other, []);
});

test('countWarnings buckets warnings outside every workspace into other with location', () => {
  const workspaces = [WS('svc', [root + `${sep}a${sep}src`])];
  const outside = root + `${sep}docs${sep}snippet.ts`;
  const results = [
    {
      filePath: outside,
      messages: [{ ruleId: 'azeebo-custom/require-map-and-throw', severity: 1, line: 7, message: 'stray' }],
    },
  ];
  const { counts, other } = countWarnings(results, workspaces);
  assert.equal(counts.get('svc'), 0);
  assert.equal(other.length, 1);
  assert.ok(other[0].includes(outside) && other[0].includes(':7'));
});

test('countWarnings assigns nested workspaces by longest lintDir prefix', () => {
  const outerSrc = root + `${sep}services${sep}core${sep}outer${sep}src`;
  const innerSrc = root + `${sep}services${sep}core${sep}outer${sep}packages${sep}inner${sep}src`;
  const workspaces = [WS('outer', [outerSrc]), WS('inner', [innerSrc])];
  const results = [
    {
      filePath: innerSrc + `${sep}deep.ts`,
      messages: [{ ruleId: 'azeebo-custom/require-map-and-throw', severity: 1, line: 1, message: 'm' }],
    },
    {
      filePath: outerSrc + `${sep}top.ts`,
      messages: [{ ruleId: 'azeebo-custom/require-map-and-throw', severity: 1, line: 1, message: 'm' }],
    },
  ];
  const { counts } = countWarnings(results, workspaces);
  assert.equal(counts.get('inner'), 1);
  assert.equal(counts.get('outer'), 1);
});

test('countWarnings never misassigns sibling dirs sharing a prefix', () => {
  const workspaces = [WS('svc-a', [root + `${sep}services${sep}a`])];
  const results = [
    {
      // sibling dir that merely shares the string prefix "a"
      filePath: root + `${sep}services${sep}ab${sep}src.ts`,
      messages: [{ ruleId: 'azeebo-custom/require-map-and-throw', severity: 1, line: 1, message: 'm' }],
    },
  ];
  const { counts, other } = countWarnings(results, workspaces);
  assert.equal(counts.get('svc-a'), 0);
  assert.equal(other.length, 1);
});

// ---------------------------------------------------------------------------
// validateBaseline
// ---------------------------------------------------------------------------

const GOOD = {
  rule: 'azeebo-custom/require-map-and-throw',
  total: 3,
  workspaces: { a: 2, b: 1 },
};

test('validateBaseline accepts a well-formed baseline', () => {
  assert.equal(validateBaseline(GOOD), null);
});

test('validateBaseline rejects rule, shape, count, and total mismatches', () => {
  assert.match(validateBaseline({ ...GOOD, rule: 'other/rule' }), /baseline rule/);
  assert.match(validateBaseline({ rule: GOOD.rule, total: 0 }), /workspaces missing/);
  assert.match(validateBaseline({ ...GOOD, workspaces: { a: -1 }, total: -1 }), /non-negative integer/);
  assert.match(validateBaseline({ ...GOOD, workspaces: { a: 1.5 }, total: 1.5 }), /non-negative integer/);
  assert.match(validateBaseline({ ...GOOD, total: 99 }), /regenerate with --update/);
});

// ---------------------------------------------------------------------------
// compare — the ratchet
// ---------------------------------------------------------------------------

test('compare passes when counts equal the baseline', () => {
  const { violations, improvements } = compare(GOOD, new Map([['a', 2], ['b', 1]]));
  assert.deepEqual(violations, []);
  assert.deepEqual(improvements, []);
});

test('compare fails when a workspace grows beyond its baseline', () => {
  const { violations } = compare(GOOD, new Map([['a', 3], ['b', 1]]));
  assert.equal(violations.length, 1);
  assert.deepEqual(violations[0], { name: 'a', current: 3, allowed: 2, delta: 1 });
});

test('compare treats an unbaselined workspace as allowed=0', () => {
  const { violations } = compare(GOOD, new Map([['a', 2], ['b', 1], ['new-svc', 2]]));
  assert.deepEqual(
    violations.map((v) => v.name),
    ['new-svc'],
  );
  assert.equal(violations[0].allowed, 0);
});

test('compare reports improvements so the floor can be lowered', () => {
  const { violations, improvements } = compare(GOOD, new Map([['a', 0], ['b', 1]]));
  assert.deepEqual(violations, []);
  assert.deepEqual(improvements, [{ name: 'a', current: 0, allowed: 2, delta: 2 }]);
});

test('compare catches workspace renames per-workspace (no totals special case)', () => {
  // The renamed workspace has no baseline entry → allowed=0 → violation.
  // Per-workspace checks make this airtight: if every current ≤ allowed,
  // the total cannot exceed the baseline by construction.
  const baseline = { rule: GOOD.rule, total: 1, workspaces: { old: 1 } };
  const { violations } = compare(baseline, new Map([['renamed', 1]]));
  assert.deepEqual(violations, [{ name: 'renamed', current: 1, allowed: 0, delta: 1 }]);
});

test('compare with an empty baseline rejects every warning', () => {
  const baseline = { rule: GOOD.rule, total: 0, workspaces: {} };
  const { violations } = compare(baseline, new Map([['a', 1]]));
  assert.deepEqual(violations, [{ name: 'a', current: 1, allowed: 0, delta: 1 }]);
});

test('compare violations are sorted by workspace name', () => {
  const baseline = { rule: GOOD.rule, total: 0, workspaces: {} };
  const { violations } = compare(baseline, new Map([['z', 1], ['a', 1], ['m', 1]]));
  assert.deepEqual(
    violations.map((v) => v.name),
    ['a', 'm', 'z'],
  );
});
