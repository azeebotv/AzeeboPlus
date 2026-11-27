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
import { fileURLToPath } from 'node:url';
import { Linter } from 'eslint';

const require = createRequire(import.meta.url);
const rule = require('../../packages/eslint-rules/no-hex-colors.js');

// Linter resolves a probe filename against its basePath (the repo root), so
// path-based rule options can only be exercised with real absolute paths
// inside this repo — an invented '/repo/…' prefix silently matches nothing.
const REPO = fileURLToPath(new URL('../..', import.meta.url)).replace(/\/$/, '');

/** Lint `code` as a tsx file with the rule at the given severity/options. */
function lint(
  code,
  { severity = 'error', options = {}, parser = null, filename = 'probe.tsx' } = {}
) {
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
    filename,
  ).map((msg) => {
    // A probe that matches no config yields a ruleId-less "No matching
    // configuration found" notice, which would masquerade as one report.
    assert.equal(
      msg.ruleId,
      'azeebo-custom/no-hex-colors',
      `probe ${filename} was not linted by the rule: ${msg.message}`,
    );
    return msg;
  });
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

/* ── retired brand accents ─────────────────────────────────────────
 * The old #E8420A/#CC1C1C pair is still in the shared allowList for the
 * internal consoles, so the ban has to be checked BEFORE the allow-list and
 * keyed on the absolute filename — the ratchet runs ESLint from each
 * workspace directory, where a repo-relative config override never matches.
 */
const RETIRED = {
  retired: ['#E8420A', '#CC1C1C', '#FF6B35'],
  retiredExemptPaths: ['/apps/admin/', '/apps/creator/'],
  allowList: ['#E8420A', '#FFFFFF'],
};

test('reports a retired accent even though the allowList tolerates it', () => {
  const messages = lint(
    `const styles = StyleSheet.create({ cta: { backgroundColor: '#E8420A' } });`,
    { options: RETIRED, filename: `${REPO}/apps/mobile/app/(tabs)/home.tsx` }
  );
  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, 'retiredBrandAccent');
});

test('exempts a console file by path fragment', () => {
  const messages = lint(
    `const styles = StyleSheet.create({ cta: { backgroundColor: '#E8420A' } });`,
    { options: RETIRED, filename: `${REPO}/apps/admin/client/src/routes/users.tsx` }
  );
  assert.deepEqual(messages, []);
});

test('matches a retired accent case-insensitively and spares allowed colors', () => {
  const lower = lint(
    `const styles = StyleSheet.create({ cta: { color: '#e8420a' } });`,
    { options: RETIRED, filename: `${REPO}/apps/web/src/ui/Badge.tsx` }
  );
  assert.equal(lower.length, 1);
  assert.equal(lower[0].messageId, 'retiredBrandAccent');
  const allowed = lint(
    `const styles = StyleSheet.create({ cta: { color: '#FFFFFF' } });`,
    { options: RETIRED, filename: `${REPO}/apps/web/src/ui/Badge.tsx` }
  );
  assert.deepEqual(allowed, []);
});

test('reports every retired hex in one gradient string, deduped per site', () => {
  const messages = lint(
    `const styles = StyleSheet.create({ cta: { background: '#E8420A to #CC1C1C' } });`,
    { options: RETIRED, filename: `${REPO}/apps/mobile/src/ui/hero.tsx` }
  );
  assert.equal(messages.length, 2);
});

test('the real flat config hands the rule the retired-accent campaign options', async () => {
  // The unit cases above feed options by hand; this pins that eslint.config.js
  // actually passes them, so the ban cannot rot into an unconfigured option.
  const { ESLint } = await import('eslint');
  const eslint = new ESLint({ cwd: REPO });
  const file = await eslint.calculateConfigForFile('apps/mobile/src/ui/hero.tsx');
  const entry = file.rules['azeebo-custom/no-hex-colors'];
  assert.ok(Array.isArray(entry), 'rule must be configured with options');
  assert.equal(entry[0], 2, 'the ban is a hard error on public surfaces');
  const [, options] = entry;
  assert.deepEqual(options.retired, ['#E8420A', '#CC1C1C', '#FF6B35']);
  assert.ok(
    options.retiredExemptPaths.includes('/apps/admin/'),
    'internal consoles stay exempt while they migrate',
  );
  assert.ok(
    !options.retiredExemptPaths.includes('/packages/shared-services/'),
    'shared-services is off the retired accent, so its exemption was removed',
  );
});
