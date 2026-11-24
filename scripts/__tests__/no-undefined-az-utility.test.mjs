/**
 * Unit tests for the no-undefined-az-utility ESLint rule
 * (packages/eslint-rules/no-undefined-az-utility.js).
 *
 * Run via the CI conventions job: `node --test scripts/__tests__/*.test.mjs`
 *
 * Tailwind v4 emits a utility only when the @theme block declares the matching
 * custom property, so `bg-az-accent-gold` compiled to nothing for a whole
 * migration while the registry declared the colour: the class looked authored,
 * the element rendered unstyled, and nothing failed. These fixtures use a stub
 * stylesheet so the assertions are about the vocabulary lookup, not the real
 * token list.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtempSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Linter } from 'eslint';

const require = createRequire(import.meta.url);
const rule = require('../../packages/eslint-rules/no-undefined-az-utility.js');
const { parser } = require('typescript-eslint');

const DIR = mkdtempSync(join(tmpdir(), 'az-vocab-'));
writeFileSync(
  join(DIR, 'theme.css'),
  [
    '@theme static {',
    '  --color-az-flame: #ec691f;',
    '  --color-az-warning-400: #fbbf24;',
    '  --color-az-surface-root: #0f0f0f;',
    '  --shadow-az-glow: 0 0 20px;',
    '  --text-az-heading: 32px;',
    '  --radius-az-pill: 9999px;',
    '  --spacing-az-gutter: 24px;',
    '}',
    '@utility az-heading { font-size: var(--text-az-heading); }',
  ].join('\n')
);
writeFileSync(
  join(DIR, 'globals.css'),
  [
    '.az-glass { background: red; }',
    '.az-btn-primary { color: #fff; }',
    '.az-btn-primary--sm { padding: 0; }',
    '@media print { .az-chip { color: #fff; } }',
  ].join('\n')
);

/* Absolute option paths pin the stub stylesheets, so the probe can be a bare
   filename: a flat config matches `files` patterns against the path relative to
   the cwd, and a /tmp filename matches nothing. */
const OPTIONS = {
  themeStylesheet: join(DIR, 'theme.css'),
  sharedStylesheet: join(DIR, 'globals.css'),
};

function lint(code, options = OPTIONS, filename = 'probe.tsx') {
  const linter = new Linter({ configType: 'flat' });
  return linter.verify(
    code,
    [
      {
        files: ['**/*.tsx'],
        plugins: { 'azeebo-custom': { rules: { 'no-undefined-az-utility': rule } } },
        languageOptions: {
          ecmaVersion: 2022,
          sourceType: 'module',
          parser,
          parserOptions: { ecmaFeatures: { jsx: true } },
        },
        rules: { 'azeebo-custom/no-undefined-az-utility': ['error', options] },
      },
    ],
    filename
  );
}

const flagged = (code, options) => lint(code, options).map((m) => m.message);

test('a colour utility with no token behind it is reported', () => {
  const messages = flagged(`export const A = () => <div className="bg-az-surface" />;`);
  assert.equal(messages.length, 1, JSON.stringify(messages));
  assert.match(messages[0], /'bg-az-surface' has no '--surface' entry in the bg namespace/);
});

test('the declared vocabulary is not reported', () => {
  assert.deepEqual(
    flagged(
      `export const A = () => <div className="bg-az-flame text-az-warning-400 rounded-az-pill gap-az-gutter shadow-az-glow text-az-heading" />;`
    ),
    []
  );
});

test('a shadow utility may come from either the shadow scale or the colour ramp', () => {
  // Tailwind reads `shadow-az-glow` as a shadow and `shadow-az-flame` as a
  // shadow colour; both are live, and a name absent from both is not.
  assert.deepEqual(flagged(`export const A = () => <div className="shadow-az-glow shadow-az-flame" />;`), []);
  assert.equal(flagged(`export const A = () => <div className="shadow-az-scarlet" />;`).length, 1);
});

test('variants, the important marker, opacity and an axis infix do not hide a name', () => {
  // The axis segment (`border-t-`, `divide-y-`) is not part of the token name, so
  // `border-t-az-flame` reads the colour ramp the same way `border-az-flame` does.
  assert.deepEqual(
    flagged(`export const A = () => <div className="hover:border-t-az-flame !bg-az-flame/20 sm:rounded-az-pill divide-y-az-warning-400" />;`),
    []
  );
  const messages = flagged(`export const A = () => <div className="hover:border-t-az-unknown divide-y-az-unknown" />;`);
  assert.equal(messages.length, 2, JSON.stringify(messages));
  assert.match(messages[0], /border-t-az-unknown/);
  assert.match(messages[1], /divide-y-az-unknown/);
});

test('a shared class the stylesheet never defines is reported', () => {
  const messages = flagged(`export const A = () => <div className="az-glass az-panel" />;`);
  assert.equal(messages.length, 1, JSON.stringify(messages));
  assert.match(messages[0], /'az-panel' is not defined/);
});

test('a modifier class is checked under its own name, not its owner', () => {
  assert.deepEqual(flagged(`export const A = () => <button className="az-btn-primary az-btn-primary--sm" />;`), []);
  assert.equal(flagged(`export const A = () => <button className="az-btn-primary--xl" />;`).length, 1);
});

test('a type role emitted as @utility is a live class', () => {
  assert.deepEqual(flagged(`export const A = () => <h2 className="az-heading" />;`), []);
});

test('a var() reference is not read as a utility', () => {
  assert.deepEqual(
    flagged(`export const A = () => <div style={{ color: 'var(--color-az-flame)' }} />;`),
    []
  );
});

test('one bad name is reported once per node, not once per duplicate', () => {
  assert.equal(flagged(`export const A = () => <div className="bg-az-surface bg-az-surface" />;`).length, 1);
});

test('a workspace with no generated theme is left alone', () => {
  // Services and packages never import the web stylesheet, so they cannot be
  // outside a vocabulary they do not have. Default relative options, so this
  // exercises the walk-up lookup rather than the pinned fixture.
  assert.deepEqual(
    lint(`export const A = () => <div className="bg-az-surface az-panel" />;`, {}, 'apps/mobile/app/index.tsx'),
    []
  );
});

test('the real generated theme is the vocabulary apps/web is measured against', () => {
  // No options: the rule walks up from the linted file to apps/web's own
  // stylesheet, so this fails the moment the committed CSS and the pages drift.
  const messages = lint(
    `export const A = () => <div className="bg-az-flame text-az-heading az-glass bg-az-surface" />;`,
    {},
    'apps/web/src/app/probe.tsx'
  );
  assert.equal(messages.length, 1, JSON.stringify(messages.map((m) => m.message)));
  assert.match(messages[0].message, /'bg-az-surface'/);
});

test('the shared component library is measured against the web theme', () => {
  // packages/ui sits outside apps/web, so the default relative stylesheet paths
  // never resolve from it and the rule used to skip it silently — which is how
  // the library came to style itself with classes Tailwind v4 generates no
  // utility for. The repo config pins apps/web's theme for that subtree; without
  // this assertion a deleted config block would put the blind spot back, and the
  // only thing noticing would be a page that renders unstyled.
  const config = require('../../eslint.config.js');
  const entry = config.find(
    (block) =>
      Array.isArray(block?.files) &&
      block.files.includes('packages/ui/**') &&
      block.rules?.['azeebo-custom/no-undefined-az-utility'] !== undefined
  );
  assert.ok(entry, 'expected a packages/ui block wiring the rule');
  const options = entry.rules['azeebo-custom/no-undefined-az-utility'][1];
  assert.ok(
    existsSync(options.themeStylesheet) && existsSync(options.sharedStylesheet),
    'the pinned stylesheets must be committed files'
  );

  assert.deepEqual(
    lint(`export const A = () => <div className="bg-az-flame bg-az-surface-root" />;`, options, 'packages/ui/src/atoms.tsx'),
    []
  );
  const messages = lint(
    `export const A = () => <div className="bg-az-surface text-az-ink" />;`,
    options,
    'packages/ui/src/atoms.tsx'
  );
  assert.equal(messages.length, 1, JSON.stringify(messages.map((m) => m.message)));
  assert.match(messages[0].message, /'bg-az-surface'/);
});

test('teardown', () => rmSync(DIR, { recursive: true, force: true }));
