/**
 * Unit tests for the lint scorecard (scripts/lint-scorecard.mjs) — pure
 * helpers only: rule resolution, baseline history extraction from git commit
 * lines, the like-for-like trend computation, row ordering, and table
 * rendering.
 *
 * Run: `node --test scripts/__tests__/lint-scorecard.test.mjs`
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractHistory, trendFrom, buildRows, renderTable, resolveScorecardRules } from '../lint-scorecard.mjs';

// ---------------------------------------------------------------------------
// extractHistory
// ---------------------------------------------------------------------------

const NOW = '2026-09-12T00:00:00Z';
const OLDER = '2026-09-01T00:00:00Z';

test('extractHistory: parses newest-first commit lines into oldest-first snapshots', async () => {
  const commits = [`aaa${'\x1f'}${NOW}`, `bbb${'\x1f'}${OLDER}`];
  const out = await extractHistory(commits, async (sha) =>
    sha === 'aaa' ? { workspaces: { a: 1 } } : { workspaces: { a: 5 } },
  );
  assert.deepEqual(out.map((h) => h.sha), ['bbb', 'aaa']);
  assert.deepEqual(out.map((h) => h.total), [5, 1]);
});

test('extractHistory: skips unparsable snapshots instead of poisoning the trend', async () => {
  const commits = [`aaa${'\x1f'}${NOW}`, `bbb${'\x1f'}${OLDER}`, `ccc${'\x1f'}${OLDER}`];
  const out = await extractHistory(commits, async (sha) => {
    if (sha === 'aaa') return { workspaces: { a: 1 } };
    if (sha === 'bbb') return null; // file absent at that commit
    return { workspaces: { a: 'garbage' } }; // malformed
  });
  assert.deepEqual(out.map((h) => h.sha), ['aaa']);
});

test('extractHistory: a snapshot violating the baseline contract is skipped wholesale', async () => {
  // One malformed historical snapshot must not manufacture phantom deltas —
  // the ratchet's validateBaseline requires non-negative integers, and a
  // partial sum (skipping only the bad entries) would understate the past
  // and fake progress. Out: empty history → trend unavailable.
  const out = await extractHistory([`aaa${'\x1f'}${NOW}`], async () => ({ workspaces: { a: 2, b: -1, c: 'x' } }));
  assert.deepEqual(out, []);
});

test('extractHistory: a well-formed snapshot sums all workspace counts', async () => {
  const out = await extractHistory([`aaa${'\x1f'}${NOW}`], async () => ({ workspaces: { a: 2, b: 3, c: 0 } }));
  assert.equal(out.length, 1);
  assert.equal(out[0].total, 5);
});

// ---------------------------------------------------------------------------
// trendFrom — the like-for-like comparison
// ---------------------------------------------------------------------------

test('trendFrom: compares only the workspaces in view (services), not the repo-wide total', () => {
  const history = [{ sha: 'bbb', date: OLDER, total: 100, workspaces: { '@azeebo/payment-service': 7, '@azeebo/pkg/security': 11 } }];
  // Services in view total 7 in the snapshot; live services total 3.
  const trend = trendFrom(history, 3, new Set(['@azeebo/payment-service']));
  assert.equal(trend.delta, -4);
  assert.equal(trend.scopeTotal, 7);
  assert.equal(trend.since.sha, 'bbb');
});

test('trendFrom: missing snapshot entries count as 0 (new services started clean)', () => {
  const history = [{ sha: 'bbb', date: OLDER, total: 4, workspaces: { '@azeebo/old-service': 4 } }];
  const trend = trendFrom(history, 0, new Set(['@azeebo/old-service', '@azeebo/new-service']));
  assert.equal(trend.delta, -4);
});

test('trendFrom: null when there is no history yet', () => {
  assert.equal(trendFrom([], 5, new Set(['a'])), null);
});

test('trendFrom: null workspaceNames falls back to the repo-wide total (documented behavior)', () => {
  const history = [{ sha: 'bbb', date: OLDER, total: 9, workspaces: { a: 3 } }];
  assert.equal(trendFrom(history, 6).delta, -3);
});

// ---------------------------------------------------------------------------
// buildRows — ordering
// ---------------------------------------------------------------------------

const row = (name, warnCount, status, severity = warnCount > 0 ? 1 : 2) => ({ name, warnCount, status, severity });

test('buildRows: migrating first (most warnings on top), then clean-ungated, then gated', () => {
  const rows = buildRows([
    row('@azeebo/gated-service', 0, 'healthy'),
    row('@azeebo/clean-service', 0, 'promote', 1),
    row('@azeebo/few-warns', 2, 'migrating', 1),
    row('@azeebo/many-warns', 7, 'migrating', 1),
  ]);
  assert.deepEqual(
    rows.map((r) => r.name),
    ['@azeebo/many-warns', '@azeebo/few-warns', '@azeebo/clean-service', '@azeebo/gated-service'],
  );
});

test('buildRows: name ascending within the same group and count', () => {
  const rows = buildRows([
    row('@azeebo/b-service', 3, 'migrating', 1),
    row('@azeebo/a-service', 3, 'migrating', 1),
  ]);
  assert.deepEqual(rows.map((r) => r.name), ['@azeebo/a-service', '@azeebo/b-service']);
});

// ---------------------------------------------------------------------------
// renderTable
// ---------------------------------------------------------------------------

test('renderTable: shows a per-service delta and a scope-correct footer', () => {
  const trend = {
    delta: -4,
    scopeTotal: 7,
    since: { sha: 'bbb1111', date: OLDER, total: 100, workspaces: { '@azeebo/payment-service': 7 } },
  };
  const out = renderTable([row('@azeebo/payment-service', 3, 'migrating')], {
    trend,
    historyCommits: 1,
    historyWindow: 12,
  });
  assert.match(out, /@azeebo\/payment-service\s+3\s+warn\s+↓4 \/ \d+d/);
  assert.match(out, /trend: 4 down since bbb1111 \(2026-09-01\)/);
  assert.match(out, /1 baseline commit\(s\) in the 12-commit window/);
});

test('renderTable: per-row flat when the service count is unchanged even while others moved', () => {
  const trend = {
    delta: -4,
    scopeTotal: 7,
    since: { sha: 'bbb1111', date: OLDER, total: 100, workspaces: { '@azeebo/payment-service': 7, '@azeebo/quiet-service': 0 } },
  };
  const out = renderTable([row('@azeebo/quiet-service', 0, 'healthy')], { trend, historyCommits: 1, historyWindow: 12 });
  assert.match(out, /@azeebo\/quiet-service\s+0\s+gated\s+· flat/);
});

test('renderTable: no history renders a dash and the fill-in explanation', () => {
  const out = renderTable([row('@azeebo/x-service', 2, 'migrating')], { trend: null, historyCommits: 0, historyWindow: 12 });
  assert.match(out, /@azeebo\/x-service\s+2\s+warn\s+–/);
  assert.match(out, /trend: unavailable/);
});

test('renderTable: up-arrow and exempt suffix render', () => {
  const trend = {
    delta: 2,
    scopeTotal: 0,
    since: { sha: 'bbb1111', date: OLDER, total: 0, workspaces: { '@azeebo/regressed-service': 0 } },
  };
  const out = renderTable(
    [row('@azeebo/regressed-service', 2, 'migrating'), row('@azeebo/exempt-service', 0, 'exempt', 1)],
    { trend, historyCommits: 3, historyWindow: 12 },
  );
  assert.match(out, /@azeebo\/regressed-service\s+2\s+warn\s+↑2/);
  assert.match(out, /1 exempt/);
});

// ---------------------------------------------------------------------------
// resolveScorecardRules
// ---------------------------------------------------------------------------

const CONFIG = [
  { id: 'azeebo-custom/require-map-and-throw', ratchet: 'scripts/lint-warning-baseline.json' },
  { id: 'azeebo-custom/no-console-log' }, // no ratchet — not a default scoring target
  { id: 'azeebo-custom/no-hex-colors', ratchet: 'scripts/hex-baseline.json' },
];

test('resolveScorecardRules: without --rule, only ratcheted rules are scored', () => {
  assert.deepEqual(resolveScorecardRules(CONFIG, undefined).map((r) => r.id), [
    'azeebo-custom/require-map-and-throw',
    'azeebo-custom/no-hex-colors',
  ]);
});

test('resolveScorecardRules: --rule selects exactly one rule, ratcheted or not', () => {
  assert.deepEqual(resolveScorecardRules(CONFIG, 'azeebo-custom/no-console-log'), [
    { id: 'azeebo-custom/no-console-log' },
  ]);
});

test('resolveScorecardRules: an unlisted --rule is an operator error', () => {
  assert.throws(() => resolveScorecardRules(CONFIG, 'no-console'), /not promotion-enforced/);
});

test('resolveScorecardRules: no ratcheted rules at all is an operator error', () => {
  assert.throws(() => resolveScorecardRules([{ id: 'x' }, { id: 'y', ratchet: '' }], undefined), /declares a ratchet/);
});
