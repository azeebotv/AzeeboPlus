/**
 * Unit tests for the no-retired-brand-alias ESLint rule
 * (packages/eslint-rules/no-retired-brand-alias.js).
 *
 * Run via the CI conventions job: `node --test scripts/__tests__/*.test.mjs`
 *
 * globals.css keeps the pre-design-system `--brand-*`/`--hp-*` alias layer alive
 * for the internal consoles, so a page reading `var(--brand-orange)` looks fine
 * while silently stepping outside the generated token ramp. The rule maps each
 * retired alias to its canonical `--color-az-*` equivalent — and deliberately
 * says nothing about the ones that must not be swapped: the theme-flipping
 * `--text-*` variables, gold and purple, whose legacy hexes have no registry
 * counterpart, and green/amber, which match a status ramp byte for byte but are
 * used in app code as genre identities.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { Linter } from 'eslint';

const require = createRequire(import.meta.url);
const rule = require('../../packages/eslint-rules/no-retired-brand-alias.js');

const ALIASES = {
  '--brand-orange': '--color-az-flame',
  '--brand-red': '--color-az-scarlet',
  '--brand-near-black': '--color-az-surface-root',
  '--hp-bg': '--color-az-surface-root',
  '--hp-bg-alt': '--color-az-surface-raised',
};

function lint(code, options = { aliases: ALIASES }, fix = false) {
  const linter = new Linter({ configType: 'flat' });
  const config = [
    {
      files: ['**/*.tsx'],
      plugins: { 'azeebo-custom': { rules: { 'no-retired-brand-alias': rule } } },
      languageOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        parserOptions: { ecmaFeatures: { jsx: true } },
      },
      rules: { 'azeebo-custom/no-retired-brand-alias': ['warn', options] },
    },
  ];
  return fix
    ? linter.verifyAndFix(code, config, { filename: 'probe.tsx' }).output
    : lint0(code, config);
}

function lint0(code, config) {
  const linter = new Linter({ configType: 'flat' });
  return linter.verify(code, config, 'probe.tsx');
}

const flagged = (code, options) => lint(code, options).map((m) => m.message);

test('flags a retired alias and names its canonical token', () => {
  const messages = flagged(
    `export const A = () => <div style={{ color: 'var(--brand-orange)' }} />;`
  );
  assert.equal(messages.length, 1, JSON.stringify(messages));
  assert.match(messages[0], /'--brand-orange'/);
  assert.match(messages[0], /--color-az-flame/);
});

test('does not flag the canonical token', () => {
  assert.deepEqual(
    flagged(`export const A = () => <div style={{ color: 'var(--color-az-flame)' }} />;`),
    []
  );
});

test('flags every use in one string and counts them', () => {
  const messages = flagged(
    `export const A = () => <div className="border-[var(--brand-orange)] bg-[var(--brand-orange)]" />;`
  );
  assert.equal(messages.length, 1, JSON.stringify(messages));
  assert.match(messages[0], /\(2 use\(s\) here\)/);
});

test('the longest matching alias wins, so --hp-bg-alt is not read as --hp-bg', () => {
  const messages = flagged(
    `export const A = () => <div style={{ background: 'var(--hp-bg-alt)' }} />;`
  );
  assert.equal(messages.length, 1, JSON.stringify(messages));
  assert.match(messages[0], /'--hp-bg-alt'/);
  assert.match(messages[0], /--color-az-surface-raised/);
});

test('a whitespace-padded var() is still caught', () => {
  assert.equal(
    flagged(`export const A = () => <div style={{ color: 'var( --brand-red )' }} />;`).length,
    1
  );
});

test('the theme-flipping text variables are out of scope', () => {
  // --text-primary changes value per theme; the az ramp is static, so a
  // substitution would break light mode. Silence here is the rule working.
  assert.deepEqual(
    flagged(`export const A = () => <p style={{ color: 'var(--text-primary)' }} />;`),
    []
  );
});

test('--fix rewrites a single-quoted style value', () => {
  const output = lint(
    `export const A = () => <div style={{ background: 'var(--brand-near-black)' }} />;`,
    undefined,
    true
  );
  assert.match(output, /var\(--color-az-surface-root\)/);
  assert.doesNotMatch(output, /--brand-near-black/);
});

test('--fix keeps the quotes a JSX attribute is written with', () => {
  const output = lint(
    `export const A = () => <div className="text-[var(--brand-orange)]" />;`,
    undefined,
    true
  );
  assert.match(output, /className="text-\[var\(--color-az-flame\)\]"/);
});

test('--fix preserves a fallback value inside var()', () => {
  const output = lint(
    `export const A = () => <div style={{ color: 'var(--brand-orange, #EC691F)' }} />;`,
    undefined,
    true
  );
  assert.match(output, /var\(--color-az-flame, #EC691F\)/);
});

test('--fix leaves template literal delimiters intact', () => {
  const output = lint(
    'export const A = () => <div className={`border-[var(--brand-orange)] ${tone}`} />;',
    undefined,
    true
  );
  assert.match(output, /`border-\[var\(--color-az-flame\)\] \$\{tone\}`/);
});

test('options replace the built-in map', () => {
  const messages = flagged(
    `export const A = () => <div style={{ color: 'var(--brand-orange)' }} />;`,
    { aliases: { '--brand-orange': '--my-flame' } }
  );
  assert.match(messages[0], /--my-flame/);
});

test('the shipped map retires the tier metals', () => {
  // No `options` argument, so this exercises the rule's own built-in map rather
  // than a test fixture. Both metals are hand-retyped copies of a generated
  // token: #CD7F32 and #C0C0C0.
  for (const [alias, canonical] of [
    ['--brand-copper', '--color-az-accent-bronze'],
    ['--brand-silver', '--color-az-accent-silver'],
  ]) {
    const messages = flagged(
      `export const A = () => <div className="border-[var(${alias})]" />;`,
      {}
    );
    assert.equal(messages.length, 1, `${alias} should be flagged: ${messages}`);
    assert.match(messages[0], new RegExp(canonical));
  }
});

test('hex-exact copies of a status ramp stay out when used as identity hues', () => {
  // `--brand-green` #22c55e and `--brand-amber` #f59e0b are byte-for-byte
  // az-success-500 / az-warning-500, so a textual swap would be value-preserving
  // — and wrong. Their only app-code uses are entries in /music/genres'
  // GENRE_COLORS, where the hex names a genre rather than a state. Banning them
  // would push pages to relabel identity hues as statuses.
  for (const alias of ['--brand-green', '--brand-amber']) {
    const messages = flagged(
      `export const A = () => <div style={{ color: 'var(${alias})' }} />;`,
      {}
    );
    assert.deepEqual(messages, [], `${alias} must not be flagged: ${messages}`);
  }
});

test('eslint.config.js wires this map rather than copying it', () => {
  // A literal alias map in the config is what ESLint actually enforces, so a copy
  // there would drift the moment one side was edited and this file's tests would
  // still pass against the stale default.
  const config = require('../../eslint.config.js');
  const configured = config
    .flatMap((entry) => Object.entries(entry?.rules ?? {}))
    .filter(([id, value]) => id === 'azeebo-custom/no-retired-brand-alias' && Array.isArray(value))
    .map(([, value]) => value[1]?.aliases);
  assert.equal(configured.length, 1, 'expected exactly one configured alias map');
  assert.equal(configured[0], rule.DEFAULT_ALIASES);
});

test('hues the registry does not own stay silent', () => {
  // --brand-gold is #FFD700 while registry gold is #FBBF24, and --brand-purple is
  // the premium violet the palette still has no ramp for. A wrong substitution
  // would move pixels and hide the gap, so the map leaves both out.
  assert.deepEqual(
    flagged(
      `export const A = () => <div style={{ color: 'var(--brand-gold)' }} className="bg-[var(--brand-purple)]" />;`,
      {}
    ),
    []
  );
});
