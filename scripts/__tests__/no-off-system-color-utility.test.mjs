/**
 * Unit tests for the no-off-system-color-utility ESLint rule
 * (packages/eslint-rules/no-off-system-color-utility.js).
 *
 * Run via the CI conventions job: `node --test scripts/__tests__/*.test.mjs`
 *
 * packages/design-tokens emits --color-az-{error,success,warning,primary,
 * secondary} at 50–900, so `bg-amber-500` and `bg-az-warning-500` paint the same
 * #f59e0b — only one of them is in the system, moves with the brand, or can be
 * looked up. The rule reports the raw-palette half of that pair, and stays quiet
 * about anything the generated vocabulary already owns.
 *
 * It also reports the two layers that are worse than a wrong hue: the legacy
 * `:root` ramp (`bg-primary-500`, `bg-dark-800`) and the console layer
 * (`text-text-primary`, `border-border-default`). Those custom properties are
 * not in a `@theme` block, so Tailwind v4 generates no utility for them at all —
 * the class is dead markup and the element renders with no colour, which is how
 * packages/ui styled itself for as long as it has existed.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { Linter } from 'eslint';

const require = createRequire(import.meta.url);
const rule = require('../../packages/eslint-rules/no-off-system-color-utility.js');

function lint(code, options = {}) {
  const linter = new Linter({ configType: 'flat' });
  return linter.verify(
    code,
    [
      {
        files: ['**/*.tsx'],
        plugins: { 'azeebo-custom': { rules: { 'no-off-system-color-utility': rule } } },
        languageOptions: {
          ecmaVersion: 2022,
          sourceType: 'module',
          parserOptions: { ecmaFeatures: { jsx: true } },
        },
        rules: { 'azeebo-custom/no-off-system-color-utility': ['warn', options] },
      },
    ],
    'probe.tsx'
  );
}

const flagged = (code, options) => lint(code, options).map((m) => m.message);
const ids = (code, options) => lint(code, options).map((m) => m.message.match(/'([^']+)'/)[1]);

test('flags a raw palette colour and maps it onto the generated ramp', () => {
  const messages = flagged(`export const A = () => <div className="bg-amber-500" />;`);
  assert.equal(messages.length, 1, JSON.stringify(messages));
  assert.match(messages[0], /'bg-amber-500'/);
  assert.match(messages[0], /'amber'/);
  assert.match(messages[0], /warning/);
});

test('does not flag the generated az vocabulary', () => {
  assert.deepEqual(
    flagged(
      `export const A = () => <div className="bg-az-warning-500 text-az-ink border-az-glass-border shadow-az-lifted" />;`
    ),
    []
  );
});

test('flags every distinct hue in one class string', () => {
  assert.deepEqual(
    ids(`export const A = () => <div className="bg-amber-500 text-gray-400 border-red-500" />;`),
    ['bg-amber-500', 'text-gray-400', 'border-red-500']
  );
});

test('reports an accidentally duplicated class once, but a variant separately', () => {
  // The dedupe is per token: `bg-red-500 bg-red-500` is one mistake typed twice,
  // while `bg-red-500 hover:bg-red-500` is two markup sites that both need
  // fixing, so both are listed.
  assert.equal(
    flagged(`export const A = () => <div className="bg-red-500 bg-red-500" />;`).length,
    1
  );
  assert.equal(
    flagged(`export const A = () => <div className="bg-red-500 hover:bg-red-500" />;`).length,
    2
  );
});

test('variants, the important marker and an opacity step do not hide the hue', () => {
  // The message quotes the token as written (minus the `!`), so the opacity
  // modifier stays visible to whoever fixes it.
  assert.deepEqual(
    ids(
      `export const A = () => <div className="group-hover:text-blue-600 !bg-green-500 bg-red-500/20" />;`
    ),
    ['text-blue-600', 'bg-green-500', 'bg-red-500/20']
  );
});

test('an axis infix does not hide the hue', () => {
  assert.deepEqual(
    ids(`export const A = () => <div className="border-t-red-500 divide-y-gray-200" />;`),
    ['border-t-red-500', 'divide-y-gray-200']
  );
});

test('non-colour utilities are out of scope', () => {
  assert.deepEqual(
    flagged(
      `export const A = () => <div className="text-2xl w-12 rounded-lg bg-gradient-to-r ring-offset-2 outline-hidden p-4" />;`
    ),
    []
  );
});

test('black and white are not palette hues here', () => {
  // `bg-black/60` scrims over imagery are sanctioned; text-white is a separate
  // conversation from the hue ramps.
  assert.deepEqual(
    flagged(`export const A = () => <div className="bg-black/60 text-white" />;`),
    []
  );
});

test('arbitrary values are left to no-arbitrary-hex-class', () => {
  assert.deepEqual(
    flagged(
      `export const A = () => <div className="bg-[#f59e0b] text-[var(--color-az-flame)]" />;`
    ),
    []
  );
});

test('hue names arriving from a class constant are flagged', () => {
  assert.equal(
    flagged(`export const A = () => <div className={A} />;\nconst A = 'border-l-purple-300';`)
      .length,
    1
  );
});

test('the violet family is left alone until the palette owns a premium hue', () => {
  // Neither Figma file defines a purple, and --color-az-universe-* are branding
  // hues rather than a ramp. A wrong substitution would put an unmeasured
  // colour on screen, so this is a reported registry gap, not a lint error.
  assert.deepEqual(
    flagged(`export const A = () => <div className="bg-purple-500 text-pink-400 border-fuchsia-300" />;`),
    []
  );
});

test('options replace the hue list', () => {
  assert.deepEqual(
    flagged(`export const A = () => <div className="bg-amber-500" />;`, { hueNames: ['fuchsia'] }),
    []
  );
  assert.equal(
    flagged(`export const A = () => <div className="bg-mauve-500" />;`, {
      hueNames: ['mauve'],
      ramps: { mauve: ['universe-games'] },
    }).length,
    1
  );
});

test('the legacy :root ramp is flagged as dead markup, not as a wrong hue', () => {
  // `--color-primary-500` and friends are declared in globals.css under `:root`,
  // and Tailwind v4 generates utilities only from `@theme` properties, so these
  // classes compile to nothing: the component renders without the colour it asks
  // for. That is a different failure from `bg-amber-500`, so it gets its own
  // message and its own az mapping.
  const messages = flagged(
    `export const A = () => <div className="bg-primary-500 text-error-400 hover:bg-success-600/10" />;`
  );
  assert.equal(messages.length, 3, JSON.stringify(messages));
  for (const message of messages) assert.match(message, /compiles to nothing/);
  assert.match(messages[0], /az-primary/);
  assert.match(messages[1], /az-error/);
  // `primary` is the retired warm-orange ramp, so the accent tokens are offered
  // alongside the brand ramp rather than a hex-identical twin.
  assert.match(messages[0], /az-flame|az-scarlet/);
});

test('dark and light steps land on the surface and ink layers', () => {
  assert.deepEqual(
    ids(`export const A = () => <div className="bg-dark-800 text-dark-900 from-light-50" />;`),
    ['bg-dark-800', 'text-dark-900', 'from-light-50']
  );
});

test('a ring-offset infix does not hide the legacy ramp', () => {
  // `ring-offset-dark-800` puts the word `offset` where a hue would be, exactly
  // as `border-t-red-500` puts an axis letter there.
  assert.deepEqual(
    ids(`export const A = () => <div className="focus-visible:ring-offset-dark-800" />;`),
    ['ring-offset-dark-800']
  );
});

test('the console surface/text/border layer is flagged even without a step number', () => {
  // `text-text-primary` and `bg-bg-secondary` are the other half of the same
  // layer: role-word rather than ramp-step, so the numeric matcher never sees
  // them and a second matcher owns them.
  const messages = flagged(
    `export const A = () => <div className="bg-bg-secondary text-text-primary border-border-default border-t-bg-tertiary ring-bg-tertiary" />;`
  );
  assert.equal(messages.length, 5, JSON.stringify(messages));
  for (const message of messages) assert.match(message, /generates no utility/);
  assert.match(messages[0], /surface/);
  assert.match(messages[1], /ink/);
  assert.match(messages[2], /glass-border/);
});

test('generated tokens and plain utilities stay quiet', () => {
  assert.deepEqual(
    flagged(
      `export const A = () => <div className="bg-az-primary-500 text-az-ink-muted border-az-glass-border border-b-2 ring-offset-2 bg-gradient-to-r text-bg" />;`
    ),
    []
  );
});
