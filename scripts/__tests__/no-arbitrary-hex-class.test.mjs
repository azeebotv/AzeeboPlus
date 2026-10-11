/**
 * Unit tests for the no-arbitrary-hex-class ESLint rule
 * (packages/eslint-rules/no-arbitrary-hex-class.js).
 *
 * Run via the CI conventions job: `node --test scripts/__tests__/*.test.mjs`
 *
 * The ratchet counts warnings per rule per workspace, so report counts must be
 * exact: one per distinct hex per site, never doubled, never dropped.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { Linter } from 'eslint';

const require = createRequire(import.meta.url);
const rule = require('../../packages/eslint-rules/no-arbitrary-hex-class.js');

/** Lint `code` as a tsx file with the rule at the given severity/options. */
function lint(code, { severity = 'error', options = {} } = {}) {
  const linter = new Linter({ configType: 'flat' });
  return linter.verify(
    code,
    [
      {
        files: ['**/*.tsx'],
        plugins: { 'azeebo-custom': { rules: { 'no-arbitrary-hex-class': rule } } },
        languageOptions: {
          ecmaVersion: 2022,
          sourceType: 'module',
          parserOptions: { ecmaFeatures: { jsx: true } },
        },
        rules: { 'azeebo-custom/no-arbitrary-hex-class': [severity, options] },
      },
    ],
    'probe.tsx',
  );
}

test('flags a raw hex in a className arbitrary value', () => {
  const messages = lint(`export const A = () => <div className="bg-[#0b090e]" />;`);
  assert.equal(messages.length, 1, JSON.stringify(messages));
  assert.match(messages[0].message, /#0b090e/);
});

test('reports once per distinct hex in the same class string', () => {
  const messages = lint(
    `export const B = () => <div className="bg-[#0b090e] text-[#E8420A]" />;`,
  );
  assert.equal(messages.length, 2, JSON.stringify(messages));
});

test('flags the same hex repeated at two different sites', () => {
  const messages = lint(
    `export const C = () => (<div><span className="bg-[#18151e]" /><span className="bg-[#18151e]" /></div>);`,
  );
  assert.equal(messages.length, 2, 'per-position dedupe must not collapse distinct sites');
});

test('flags a variant-prefixed arbitrary hex', () => {
  const messages = lint(`export const D = () => <div className="hover:bg-[#18151e]" />;`);
  assert.equal(messages.length, 1);
});

test('flags hexes reached through a cn()/clsx argument', () => {
  const messages = lint(
    `const x = cn('px-4', active && 'border-[#cc1c1c]'); export const E = () => <div className={x} />;`,
  );
  assert.equal(messages.length, 1, JSON.stringify(messages));
});

test('flags a hex inside a template literal in className', () => {
  const messages = lint(
    `export const F = ({ tone }) => <div className={\`text-[#4ADE80] \${tone}\`} />;`,
  );
  assert.equal(messages.length, 1, JSON.stringify(messages));
});

test('flags the arbitrary-property form', () => {
  const messages = lint(`export const G = () => <div className="[color:#c83a08]" />;`);
  assert.equal(messages.length, 1, JSON.stringify(messages));
});

test('ignores hexes that are not arbitrary values', () => {
  const messages = lint(
    `export const H = () => <a href="#section" aria-label="issue #1234">x</a>;`,
  );
  assert.equal(messages.length, 0, JSON.stringify(messages));
});

test('honours allowList', () => {
  const messages = lint(`export const I = () => <div className="bg-[#FFFFFF]" />;`, {
    options: { allowList: ['#FFFFFF'] },
  });
  assert.equal(messages.length, 0, JSON.stringify(messages));
});

test('allowList matches case-insensitively and without the hash', () => {
  const messages = lint(`export const J = () => <div className="bg-[#e8420a]" />;`, {
    options: { allowList: ['E8420A'] },
  });
  assert.equal(messages.length, 0, JSON.stringify(messages));
});
