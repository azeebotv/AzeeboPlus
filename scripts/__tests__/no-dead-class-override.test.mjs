/**
 * Unit tests for the no-dead-class-override ESLint rule
 * (packages/eslint-rules/no-dead-class-override.js).
 *
 * Run via the CI conventions job: `node --test scripts/__tests__/*.test.mjs`
 *
 * globals.css defines its `.az-*` component classes outside any `@layer`, so
 * they beat a Tailwind utility on the same element every time. The rule exists
 * to report ONLY the utilities that disagree with the shared class: a token
 * that restates the same declaration is redundant markup, not a lie, so the
 * report counts below are deliberately exact on both sides.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { Linter } from 'eslint';

const require = createRequire(import.meta.url);
const rule = require('../../packages/eslint-rules/no-dead-class-override.js');

/** Lint `code` as a tsx file with the rule at the given severity/options. */
function lint(code, { severity = 'error', options = {} } = {}) {
  const linter = new Linter({ configType: 'flat' });
  return linter.verify(
    code,
    [
      {
        files: ['**/*.tsx'],
        plugins: { 'azeebo-custom': { rules: { 'no-dead-class-override': rule } } },
        languageOptions: {
          ecmaVersion: 2022,
          sourceType: 'module',
          parserOptions: { ecmaFeatures: { jsx: true } },
        },
        rules: { 'azeebo-custom/no-dead-class-override': [severity, options] },
      },
    ],
    'probe.tsx'
  );
}

const flagged = (code, options) => lint(code, { options }).map((m) => m.message);

test('flags a utility that fights the shared class', () => {
  const messages = flagged(
    `export const A = () => <div className="az-glass rounded-3xl shadow-2xl" />;`
  );
  assert.equal(messages.length, 2, JSON.stringify(messages));
  assert.match(messages[0], /'rounded-3xl' cannot override 'az-glass'/);
  assert.match(messages[1], /'shadow-2xl' cannot override 'az-glass'/);
});

test('does not flag a utility that restates the shared class', () => {
  // .az-glass already declares `border: 1px solid var(--color-az-glass-border)`
  // and `background: var(--color-az-glass-card)`.
  assert.deepEqual(
    flagged(
      `export const A = () => <div className="az-glass border border-az-glass-border bg-az-glass-card p-6" />;`
    ),
    []
  );
});

test('flags a fighting utility behind a variant', () => {
  const messages = flagged(`export const A = () => <div className="az-glass hover:shadow-xl" />;`);
  assert.equal(messages.length, 1, JSON.stringify(messages));
  assert.match(messages[0], /'hover:shadow-xl'/);
});

test('flags a class built in a helper string', () => {
  const messages = flagged(`export const card = 'az-glass p-4 rounded-2xl';`);
  assert.equal(messages.length, 1, JSON.stringify(messages));
  assert.match(messages[0], /'rounded-2xl'/);
});

test('reports a helper string once, not once per visitor', () => {
  // The Literal visitor and the className union pass both see this literal.
  const messages = flagged(`export const A = () => <div className="az-glass rounded-2xl" />;`);
  assert.equal(messages.length, 1, JSON.stringify(messages));
});

test('flags a conditional class inside a template literal', () => {
  const messages = flagged(
    `export const A = ({ on }) => <div className={\`az-glass p-4 \${on ? 'shadow-xl' : ''}\`} />;`
  );
  assert.equal(messages.length, 1, JSON.stringify(messages));
  assert.match(messages[0], /'shadow-xl'/);
});

test('flags a class passed through cn()', () => {
  const messages = flagged(
    `export const A = ({ on }) => <div className={cn('az-glass', on && 'rounded-full')} />;`
  );
  assert.equal(messages.length, 1, JSON.stringify(messages));
  assert.match(messages[0], /'rounded-full'/);
});

test('a bare utility list without a shared class is clean', () => {
  assert.deepEqual(
    flagged(
      `export const A = () => <div className="flex items-center gap-4 rounded-2xl shadow-xl" />;`
    ),
    []
  );
});

test('the documented escape-hatch modifiers suppress their own utility', () => {
  // .az-btn-primary sets width:100%; --inline is the sanctioned replacement.
  assert.deepEqual(
    flagged(`export const A = () => <button className="az-btn-primary az-btn-primary--inline" />;`),
    []
  );
  const withoutHatch = flagged(
    `export const A = () => <button className="az-btn-primary w-auto" />;`
  );
  assert.equal(withoutHatch.length, 1, JSON.stringify(withoutHatch));
  assert.match(withoutHatch[0], /'w-auto'/);
});

test('text-* resolves to colour or size by keyword, not by prefix', () => {
  // .az-label sets color + font-size + text-transform + display.
  assert.deepEqual(
    flagged(
      `export const A = () => <label className="az-label block uppercase text-az-overline font-bold text-center" />;`
    ),
    []
  );
  const messages = flagged(
    `export const A = () => <label className="az-label text-white text-sm" />;`
  );
  assert.equal(messages.length, 2, JSON.stringify(messages));
  assert.match(messages[0], /'text-white'.*'color'/);
  assert.match(messages[1], /'text-sm'.*'font-size'/);
});

test('sharedClasses option narrows the check', () => {
  const messages = flagged(`export const A = () => <div className="az-glass rounded-2xl" />;`, {
    sharedClasses: ['az-chip'],
  });
  assert.deepEqual(messages, []);
});

/**
 * Apply the rule's fixes and return the rewritten source. Mirrors ESLint's own
 * `--fix` loop: non-overlapping edits per pass, up to ten passes, so a string
 * carrying two dead utilities converges the same way the CLI does.
 */
function fix(code) {
  let text = code;
  for (let pass = 0; pass < 10; pass += 1) {
    const fixes = lint(text)
      .filter((message) => message.fix)
      .map((message) => message.fix)
      .sort((a, b) => a.range[0] - b.range[0]);
    if (fixes.length === 0) break;

    const applied = [];
    let cursor = -1;
    for (const fixEntry of fixes) {
      if (fixEntry.range[0] < cursor) continue;
      applied.push(fixEntry);
      cursor = fixEntry.range[1];
    }
    for (const entry of applied.reverse()) {
      text = text.slice(0, entry.range[0]) + entry.text + text.slice(entry.range[1]);
    }
  }
  return text;
}

test('--fix drops the dead utility and keeps the live ones', () => {
  const output = fix(`export const A = () => <div className="az-glass rounded-3xl p-6" />;`);
  assert.match(output, /className="az-glass p-6"/);
  assert.doesNotMatch(output, /rounded-3xl/);
});

test('--fix removes every dead utility in one string', () => {
  const output = fix(
    `export const A = () => <div className="az-glass rounded-3xl shadow-2xl text-center" />;`
  );
  assert.match(output, /className="az-glass text-center"/);
});

test('--fix keeps size-* (it also sets height) but drops w-*', () => {
  // .az-btn-primary sets width:100%; `size-*` would lose the height too.
  const output = fix(`export const A = () => <button className="az-btn-primary size-4 w-auto" />;`);
  assert.match(output, /size-4/);
  assert.doesNotMatch(output, /w-auto/);
});

test('--fix edits the class string inside a template literal', () => {
  const output = fix(
    `export const A = () => <div className={\`az-glass \${on ? 'rounded-2xl' : ''} p-4\`} />;`
  );
  assert.doesNotMatch(output, /rounded-2xl/);
  assert.match(output, /p-4/);
});

test('--fix keeps template delimiters when the dead token is in the static part', () => {
  const output = fix(
    `export const A = () => <div className={\`az-glass rounded-2xl \${tone}\`} />;`
  );
  assert.doesNotMatch(output, /rounded-2xl/);
  assert.match(output, /az-glass \$\{tone\}/);
});

test('--fix leaves equivalent tokens in place', () => {
  const output = fix(
    `export const A = () => <div className="az-glass border border-az-glass-border p-6" />;`
  );
  assert.match(output, /az-glass border border-az-glass-border p-6/);
});

test('flags width/height/padding that fight the fixed-size OTP cell', () => {
  // .az-input--otp pins a 3rem x 3.5rem square with flush padding; .az-input
  // already pins width, so a Tailwind sizing utility on the same element is dead.
  const messages = flagged(
    `export const A = () => <input className="az-input az-input--otp w-16 h-16 p-4" />;`
  );
  assert.equal(messages.length, 3, JSON.stringify(messages));
  assert.match(messages[0], /'w-16' cannot override/);
  assert.match(messages[1], /'h-16' cannot override/);
  assert.match(messages[2], /'p-4' cannot override/);
});

test('does not flag the otp cell utilities that restate its box model', () => {
  assert.deepEqual(
    flagged(
      `export const A = () => <input className="az-input az-input--otp w-12 h-14 p-0 text-center font-bold" />;`
    ),
    []
  );
});

test('flags the padding-right that .az-input--trailing already reserves', () => {
  const messages = flagged(
    `export const A = () => <input className="az-input az-input--trailing pr-20" />;`
  );
  assert.equal(messages.length, 1, JSON.stringify(messages));
  assert.match(messages[0], /'pr-20' cannot override 'az-input'.*'padding'/);
});

test('flags a blur that fights the ambient glow', () => {
  const messages = flagged(`export const A = () => <div className="az-ambient-red blur-xl" />;`);
  assert.equal(messages.length, 1, JSON.stringify(messages));
  assert.match(messages[0], /'blur-xl' cannot override 'az-ambient-red'/);
});

test('flags a size utility that fights .az-hero-title', () => {
  // PageHero's title is unlayered, so `text-5xl` beside it is never read.
  const messages = flagged(
    `export const A = () => <h1 className="az-headline az-hero-title text-5xl" />;`
  );
  assert.equal(messages.length, 1, JSON.stringify(messages));
  assert.match(messages[0], /'text-5xl' cannot override 'az-hero-title'/);
});

test('does not flag the responsive size a layered type role is meant to step up to', () => {
  // az-lead/az-title are @utility classes, i.e. layered, so `sm:text-lg` does
  // win at that breakpoint. They are deliberately absent from the table.
  assert.deepEqual(
    flagged(`export const A = () => <p className="az-lead text-az-ink-dim sm:text-lg" />;`),
    []
  );
});
