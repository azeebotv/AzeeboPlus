/**
 * Multi-rule ratchet tests (scripts/check-lint-warning-ratchet.mjs).
 *
 * Proves the per-rule flow a SECOND migrating rule gets for free: two rules
 * declared in one promotion-rules.json, ONE shared ESLint results pass,
 * per-rule baselines generated/validated/compared independently, and
 * regression/improvement detection isolated per rule. Workspaces come from a
 * fixture tree; the ESLint payload is synthetic (the same shape
 * runEslintJson returns) so no lint run is needed — the real single-rule
 * gate is exercised live in CI and by the live smoke in the repo root.
 *
 * Run: `node --test scripts/__tests__/lint-warning-ratchet-multirule.test.mjs`
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const {
  discoverWorkspaces,
  countFindings,
  validateBaseline,
  buildBaselineRecord,
  compare,
  resolveRatchetRules,
} = await import('../check-lint-warning-ratchet.mjs');

const RULE_A = 'azeebo-custom/require-map-and-throw';
const RULE_B = 'azeebo-custom/no-console-log';

/** Fixture repo: two eslint workspaces + a two-rule promotion config. */
function makeFixtureRepo() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ratchet-multi-'));
  const writePkg = (rel) => {
    const dir = path.join(root, rel);
    fs.mkdirSync(path.join(dir, 'src'), { recursive: true });
    fs.writeFileSync(
      path.join(dir, 'package.json'),
      JSON.stringify({ name: `fixture/${rel.replaceAll('/', '-')}`, scripts: { lint: 'eslint src' } }),
    );
    return dir;
  };
  writePkg('services/core/svc-a');
  writePkg('services/engagement/svc-b');
  fs.mkdirSync(path.join(root, 'scripts'), { recursive: true });
  fs.writeFileSync(
    path.join(root, 'scripts', 'promotion-rules.json'),
    JSON.stringify({
      rules: [
        { id: RULE_A, ratchet: 'scripts/baseline-a.json' },
        { id: RULE_B, ratchet: 'scripts/baseline-b.json' },
      ],
    }),
  );
  // The referenced baselines exist (empty-but-valid) so the config loads
  // without "generate it with --update" warnings.
  for (const [file, rule] of [
    ['baseline-a.json', RULE_A],
    ['baseline-b.json', RULE_B],
  ]) {
    fs.writeFileSync(
      path.join(root, 'scripts', file),
      JSON.stringify({ rule, generatedAt: '2026-09-12T00:00:00Z', total: 0, workspaces: {} }),
    );
  }
  return { root, cleanup: () => fs.rmSync(root, { recursive: true, force: true }) };
}

const msg = (ruleId) => ({ ruleId, severity: 1, line: 1, message: 'x' });

test('two ratcheted rules resolve from one config, each carrying its own baseline path', () => {
  const { root, cleanup } = makeFixtureRepo();
  try {
    const { rules, warnings } = resolveRatchetRules(root);
    assert.deepEqual(
      rules.map((r) => [r.id, r.ratchet]),
      [
        [RULE_A, 'scripts/baseline-a.json'],
        [RULE_B, 'scripts/baseline-b.json'],
      ],
    );
    assert.equal(warnings.length, 0);
  } finally {
    cleanup();
  }
});

test('one shared ESLint pass feeds per-rule counts; baselines are per-rule', () => {
  const { root, cleanup } = makeFixtureRepo();
  try {
    const workspaces = discoverWorkspaces(root);
    assert.equal(workspaces.length, 2);

    // ONE results payload (what the single runEslintJson call returns),
    // containing warnings for BOTH rules across both workspaces.
    const results = [
      {
        filePath: path.join(workspaces[0].lintDirs[0], 'wallet.ts'),
        messages: [msg(RULE_A), msg(RULE_A)],
      },
      {
        filePath: path.join(workspaces[1].lintDirs[0], 'logger.ts'),
        messages: [msg(RULE_B)],
      },
    ];

    const countsA = countFindings(results, workspaces, RULE_A).counts;
    const countsB = countFindings(results, workspaces, RULE_B).counts;
    assert.equal(countsA.get('fixture/services-core-svc-a'), 2, 'rule A counts only its own warnings');
    assert.equal(countsA.get('fixture/services-engagement-svc-b'), 0);
    assert.equal(countsB.get('fixture/services-engagement-svc-b'), 1, 'rule B counts only its own warnings');
    assert.equal(countsB.get('fixture/services-core-svc-a'), 0);

    // Per-rule baselines from the shared pass; both validate under their own id.
    const recordA = buildBaselineRecord(RULE_A, countsA);
    const recordB = buildBaselineRecord(RULE_B, countsB);
    assert.equal(recordA.total, 2);
    assert.equal(recordB.total, 1);
    assert.equal(validateBaseline(recordA, RULE_A), null);
    assert.match(validateBaseline(recordA, RULE_B), /baseline rule/, 'a record validates only under its own rule id');
    assert.equal(validateBaseline(recordB, RULE_B), null);
  } finally {
    cleanup();
  }
});

test('a regression in one rule fails independently of the other rule', () => {
  const { root, cleanup } = makeFixtureRepo();
  try {
    const workspaces = discoverWorkspaces(root);
    const baselineA = { rule: RULE_A, total: 2, workspaces: { 'fixture/services-core-svc-a': 2, 'fixture/services-engagement-svc-b': 0 } };
    const baselineB = { rule: RULE_B, total: 1, workspaces: { 'fixture/services-core-svc-a': 0, 'fixture/services-engagement-svc-b': 1 } };

    const results = [
      {
        filePath: path.join(workspaces[1].lintDirs[0], 'new.ts'),
        messages: [msg(RULE_A), msg(RULE_A), msg(RULE_A)], // rule A grew in svc-b
      },
    ];
    const violationsA = compare(baselineA, countFindings(results, workspaces, RULE_A).counts).violations;
    const violationsB = compare(baselineB, countFindings(results, workspaces, RULE_B).counts).violations;
    assert.deepEqual(violationsA.map((v) => [v.name, v.delta]), [['fixture/services-engagement-svc-b', 3]]);
    assert.deepEqual(violationsB, [], 'the clean rule stays clean');
  } finally {
    cleanup();
  }
});

test('--update regeneration: dropped counts lower the per-rule floor', () => {
  const { root, cleanup } = makeFixtureRepo();
  try {
    const workspaces = discoverWorkspaces(root);
    const results = [
      { filePath: path.join(workspaces[0].lintDirs[0], 'a.ts'), messages: [msg(RULE_A)] },
    ];
    const counts = countFindings(results, workspaces, RULE_A).counts;
    const regenerated = buildBaselineRecord(RULE_A, counts);
    assert.equal(regenerated.total, 1);
    // The regenerated record is a valid, lower floor for the same rule.
    assert.equal(validateBaseline(regenerated, RULE_A), null);
    const { improvements } = compare(
      { rule: RULE_A, total: 2, workspaces: { 'fixture/services-core-svc-a': 2, 'fixture/services-engagement-svc-b': 0 } },
      counts,
    );
    assert.deepEqual(improvements.map((i) => [i.name, i.delta]), [['fixture/services-core-svc-a', 1]]);
  } finally {
    cleanup();
  }
});
