/**
 * Unit tests for the no-hex-colors ESLint rule
 * (packages/eslint-rules/no-hex-colors.js).
 *
 * Run via the CI conventions job: `node --test scripts/__tests__/*.test.mjs`
 *
 * Each case runs the real rule through the ESLint Linter API (flat config)
 * and asserts the exact number of reports — the ratchet counts rule
 * warnings per workspace, so a double-report or a traversal blind spot
 * would silently distort every baseline.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { Linter } from 'eslint';

const require = createRequire(import.meta.url);
const rule = require('../../packages/eslint-rules/no-hex-colors.js');

/** Lint `code` as a tsx file with the rule at the given severity/options. */
function lint(code, { severity = 'error', options = {}, parser = null } = {}) {
  const linter = new Linter({ configType: 'flat' });
  return linter.verify(
    code,
    [
      {
        files: ['**/*.tsx'],
        plugins: { 'azeebo-custom': { rules: { 'no-hex-colors': rule } } },
        languageOptions: {
          ecmaVersion: 2022,
          sourceType: 'module',
          ...(parser ? { parser } : {}),
          parserOptions: { ecmaFeatures: { jsx: true } },
        },
        rules: { 'azeebo-custom/no-hex-colors': [severity, options] },
      },
    ],
    'probe.tsx',
  );
}

test('flags a hex in StyleSheet.create exactly once (dedupe regression)', () => {
  const messages = lint(
    `const styles = StyleSheet.create({ card: { backgroundColor: '#123456' } });`,
  );
  assert.equal(messages.length, 1, JSON.stringify(messages));
});

test('flags a hex in a JSX inline style object', () => {
  const messages = lint(`export const A = () => <div style={{ backgroundColor: '#234567' }} />;`);
  assert.equal(messages.length, 1);
  assert.match(messages[0].message, /#234567/);
});

test('flags hexes inside gradient shorthand strings (background property)', () => {
  const messages = lint(
    `export const B = () => <div style={{ background: 'linear-gradient(180deg, #100e14 0%, #0b090e 100%)' }} />;`,
  );
  assert.equal(messages.length, 2, 'one report per distinct hex, none lost, none doubled');
});

test('flags hexes through spread into an inline style object', () => {
  const messages = lint(
    `const x = {}; export const C = () => <div style={{ ...x, borderColor: '#456789' }} />;`,
  );
  assert.equal(messages.length, 1);
});

test('allowList suppresses listed colors (case-insensitive)', () => {
  const messages = lint(
    `const styles = StyleSheet.create({ a: { color: '#ABCDEF' } });`,
    { options: { allowList: ['#abcdef'] } },
  );
  assert.equal(messages.length, 0);
});

test('hexes outside style positions are untouched', () => {
  const messages = lint(
    `export const id = '#aabbcc';\nconst notAColor = { label: '#112233' };\nexport const D = () => <div data-marker="#445566" />;`,
  );
  assert.equal(messages.length, 0);
});

test('non-hex color syntax is untouched (rgba, hsl, token vars, transparent)', () => {
  const messages = lint(
    `export const E = () => <div style={{ color: 'rgba(0,0,0,0.5)', borderColor: 'var(--border-default)', background: 'transparent' }} />;`,
  );
  assert.equal(messages.length, 0);
});

test('8-digit hex (with alpha) is flagged', () => {
  const messages = lint(`const styles = StyleSheet.create({ a: { backgroundColor: '#11223344' } });`);
  assert.equal(messages.length, 1);
});

test('reports EVERY occurrence of a hex, under the typescript-eslint parser (per-file dedupe regression)', () => {
  // Regression: the dedupe key was `${node.start}:${hex}` — but the
  // typescript-eslint parser (used by the repo's real flat config) does not
  // populate node.start, so every key collapsed to 'undefined:<hex>' and
  // each distinct hex reported only once PER FILE, masking every duplicate
  // after the first (which is exactly why the token migration kept unmasking
  // twins as leaders were converted). The key must use node.range[0].
  // This case is only meaningful under tseslint's parser; espree populates
  // node.start and therefore cannot reproduce the bug.
  const { parser } = require('typescript-eslint');
  const code = [
    `export const A = () => <div style={{ backgroundColor: 'var(--x, #0b090e)' }} />;`,
    `export const B = () => <div style={{ backgroundColor: 'var(--x, #0b090e)' }} />;`,
    `export const C = () => <div style={{ backgroundColor: 'var(--x, #0b090e)' }} />;`,
  ].join('\n');
  const messages = lint(code, { parser });
  assert.equal(
    messages.length,
    3,
    `every occurrence must report independently; got ${messages.length}`,
  );
});
