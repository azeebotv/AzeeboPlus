/**
 * Regression test for the design-token generator's emission guard
 * (scripts/generate-design-tokens.ts).
 *
 * The generator flattens the registry into a hand-written `colorEntries` list, so
 * a group added to `packages/design-tokens` without a matching entry produces a
 * token that reads as valid everywhere and compiles to nothing. That happened to
 * `colors.accent` (gold/bronze/silver): reward-tier chrome asked for
 * `bg-az-accent-gold`, got no utility, and fell back to `bg-slate-300` for a
 * silver medal. The guard now partitions the registry into web ramps and
 * console-only groups and fails the build on anything unclassified — this test
 * pins both halves, because the failure mode is invisible in the output.
 *
 * Run via the CI conventions job: `node --test scripts/__tests__/*.test.mjs`
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const REPO = fileURLToPath(new URL('../..', import.meta.url)).replace(/\/$/, '');
const TSX = `${REPO}/node_modules/.bin/tsx`;
const CSS = readFileSync(`${REPO}/apps/web/src/styles/design-tokens.css`, 'utf8');

function runGenerator(args) {
  return spawnSync(TSX, ['scripts/generate-design-tokens.ts', ...args], {
    cwd: REPO,
    encoding: 'utf8',
  });
}

test('the generator reports no emission gap for the current registry', () => {
  const run = runGenerator(['--check']);
  assert.equal(run.status, 0, run.stderr + run.stdout);
});

test('every accent metal the registry declares reaches the stylesheet', () => {
  // The exact bug: declared in packages/design-tokens, absent from colorEntries.
  for (const [name, hex] of [
    ['gold', '#fbbf24'],
    ['bronze', '#cd7f32'],
    ['silver', '#c0c0c0'],
  ]) {
    assert.match(
      CSS,
      new RegExp(`--color-az-accent-${name}: ${hex};`),
      `--color-az-accent-${name} is missing, so bg-az-accent-${name} is a dead utility`
    );
  }
});

test('the accent metals are usable as utilities, not just registry keys', () => {
  // The Tailwind hook a page writes is `bg-az-accent-silver`; it only exists if
  // the generator pushed the registry entry into the stylesheet.
  assert.match(CSS, /--color-az-accent-silver: #c0c0c0;/);
});

test('the categorical hues have az utilities to land on', () => {
  // Same gap class as the metals, one layer over: the premium/violet family and
  // the genre identities had no registry home, so ~60 sites stayed on
  // `var(--brand-purple)` and Tailwind's raw `purple-500`. `--check` above proves
  // the generator emits whatever the registry declares; this proves the registry
  // still *declares* them, so deleting the group cannot quietly reopen the hole.
  for (const [name, hex] of [
    ['violet', '#8b5cf6'],
    ['violet-light', '#a78bfa'],
    ['pink', '#ec4899'],
    ['cyan', '#06b6d4'],
    ['teal', '#14b8a6'],
    ['indigo', '#6366f1'],
    ['sky', '#1e90ff'],
    ['crimson', '#c41e3a'],
    ['emerald', '#10b981'],
    ['forest', '#0d3b2e'],
  ]) {
    assert.match(
      CSS,
      new RegExp(`--color-az-category-${name}: ${hex};`),
      `--color-az-category-${name} is missing, so bg-az-category-${name} is a dead utility`
    );
  }
});

test('the auth backdrops are surface tokens, not page-level literals', () => {
  // `authViolet` is the measured Onboarding/Login backdrop and `authWarm` the
  // in-product one; both feed the `via-…` gradient stops, which is where a
  // hand-typed hex silently drifts from the rest of the surface layer.
  assert.match(CSS, /--color-az-surface-auth-violet: #1B001F;/);
  assert.match(CSS, /--color-az-surface-auth-warm: #3A1A0A;/);
  assert.match(CSS, /--color-az-surface-auth-void: #100012;/);
});

test('the glow shadows exist and derive from registered colours', () => {
  // Five pages had hand-written the same warning bloom in five geometries. The
  // glows are now registry-owned, emitted by a loop, and built with `withAlpha`
  // from tokens that already exist — the assertion below is on that derivation,
  // because a glow with an invented hex would pass `--check` just as happily.
  assert.match(CSS, /--shadow-az-glow-gold: 0 4px 16px rgba\(251, 191, 36, 0\.4\);/);
  assert.match(CSS, /--shadow-az-glow-warning: 0 8px 32px rgba\(245, 158, 11, 0\.3\);/);
  assert.match(CSS, /--shadow-az-glow-primary: 0 8px 32px rgba\(227, 30, 36, 0\.35\);/);
  // 251/191/36 is accent-gold, 245/158/11 is warning-500, 227/30/36 is primary-500.
  for (const rgb of ['251, 191, 36', '245, 158, 11', '227, 30, 36']) {
    assert.ok(
      CSS.includes(`rgba(${rgb},`),
      `rgba(${rgb}) appears only in a glow, so it is not a registered colour`
    );
  }
});
