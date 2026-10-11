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
