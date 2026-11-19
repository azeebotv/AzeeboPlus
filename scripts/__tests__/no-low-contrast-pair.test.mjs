/**
 * Unit tests for the no-low-contrast-pair ESLint rule
 * (packages/eslint-rules/no-low-contrast-pair.js) and the measured table it
 * reads (packages/eslint-rules/contrast-pairs.json).
 *
 * Run via the CI conventions job: `node --test scripts/__tests__/*.test.mjs`
 *
 * The rule exists because the pairing is invisible to every other gate: both
 * classes are correct tokens, the CSS compiles, and the page only fails WCAG AA
 * where a browser measures it. These tests pin three things — the measurements
 * (ratios computed from the table's hexes, which are themselves checked against
 * the generated stylesheet), the class-list analysis (solid vs. wash, branch
 * isolation, variant co-application), and the fact that the table is the only
 * thing deciding what is enforced.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Linter } from 'eslint';

const require = createRequire(import.meta.url);
const rule = require('../../packages/eslint-rules/no-low-contrast-pair.js');

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const STYLESHEET = path.join(ROOT, 'apps/web/src/styles/design-tokens.css');
const TABLE = rule.loadTable(rule.DEFAULT_TABLE_PATH);

/** Lint `code` as a tsx file with the rule at the given severity/options. */
function lint(code, { severity = 'error', options = {} } = {}) {
  const linter = new Linter({ configType: 'flat' });
  return linter.verify(
    code,
    [
      {
        files: ['**/*.tsx'],
        plugins: { 'azeebo-custom': { rules: { 'no-low-contrast-pair': rule } } },
        languageOptions: {
          ecmaVersion: 2022,
          sourceType: 'module',
          parserOptions: { ecmaFeatures: { jsx: true } },
        },
        rules: { 'azeebo-custom/no-low-contrast-pair': [severity, options] },
      },
    ],
    'probe.tsx'
  );
}

const flagged = (code, options) => lint(code, { options }).map((m) => m.message);

// ---------------------------------------------------------------------------
// The measurements
// ---------------------------------------------------------------------------

test('computes WCAG ratios from hex, not from stored numbers', () => {
  assert.equal(rule.contrastRatio('#FFFFFF', '#EC691F'), 3.18);
  assert.equal(rule.contrastRatio('#0F0F0F', '#EC691F'), 6.03);
  assert.equal(rule.contrastRatio('#FFFFFF', '#f59e0b'), 2.15);
  assert.equal(rule.contrastRatio('#FFFFFF', '#E31E24'), 4.69);
  assert.equal(rule.contrastRatio('#EC691F', '#EC691F'), 1);
});

test('every table surface still matches the generated stylesheet', () => {
  const css = fs.readFileSync(STYLESHEET, 'utf8');
  const declared = new Map();
  for (const match of css.matchAll(/--color-az-([a-z0-9-]+):\s*(#[0-9a-fA-F]{3,8});/g)) {
    declared.set(match[1], match[2].toLowerCase());
  }
  assert.ok(declared.size > 0, 'no --color-az-* variables found in the generated stylesheet');

  const resolved = [];
  for (const surface of TABLE.surfaces) {
    const actual = declared.get(surface.token);
    assert.ok(actual, `--color-az-${surface.token} is missing from the generated stylesheet`);
    assert.equal(
      surface.color.toLowerCase(),
      actual,
      `bg-az-${surface.token} is listed as ${surface.color} but the theme paints ${actual} — update contrast-pairs.json and re-read the ratios`
    );
    resolved.push(surface.token);
  }

  // The ink colours the rule measures with must be the shipped tokens too.
  for (const ink of TABLE.inks.light) {
    const name = ink.utility.match(/^text-az-([a-z0-9-]+)$/);
    if (!name) continue;
    assert.equal(
      declared.get(name[1]),
      ink.color.toLowerCase(),
      `${ink.utility} is listed as ${ink.color} but the theme paints ${declared.get(name[1])}`
    );
  }
  for (const ink of TABLE.inks.deep) {
    const name = ink.utility.match(/^text-az-([a-z0-9-]+)$/);
    if (!name) continue;
    assert.equal(
      declared.get(name[1]),
      ink.color.toLowerCase(),
      `${ink.utility} is listed as ${ink.color} but the theme paints ${declared.get(name[1])}`
    );
  }

  assert.ok(resolved.includes('flame'));
  assert.ok(resolved.includes('warning-500'));
});

test('every enforced fill has a deep ink that clears the floor', () => {
  // The rule treats "a deep ink is present" as the corrected pairing, so that
  // shortcut is only sound while each enforced fill has a passing deep ink.
  const deep = TABLE.inks.deep;
  for (const surface of TABLE.surfaces) {
    const white = Math.min(
      ...TABLE.inks.light.map((ink) => rule.contrastRatio(ink.color, surface.color))
    );
    if (white >= TABLE.thresholds.bodyText) continue;
    const best = Math.max(...deep.map((ink) => rule.contrastRatio(ink.color, surface.color)));
    assert.ok(
      best >= TABLE.thresholds.bodyText,
      `bg-az-${surface.token} fails white (${white}:1) and every deep ink (best ${best}:1) — no ink in the table can fix it`
    );
  }
});

test('the table lists the light fills the design system actually uses', () => {
  const tokens = new Set(TABLE.surfaces.map((surface) => surface.token));
  // The 2026-11 sweep's flame chips, and the light fills found beside them.
  for (const expected of [
    'flame',
    'warning-500',
    'success-500',
    'error-500',
    'accent-gold',
    'accent-silver',
    'accent-bronze',
  ]) {
    assert.ok(tokens.has(expected), `bg-az-${expected} is not a table entry`);
  }
  // Every step of the semantic ramps a solid fill can be written from.
  for (const ramp of ['primary', 'secondary', 'success', 'warning', 'error']) {
    for (const step of [300, 400, 500, 600, 700]) {
      assert.ok(tokens.has(`${ramp}-${step}`), `bg-az-${ramp}-${step} is not a table entry`);
    }
  }
  // Fills where white clears AA stay listed as measured, not enforced.
  for (const passing of ['scarlet', 'primary-500', 'error-600']) {
    const surface = TABLE.surfaces.find((entry) => entry.token === passing);
    assert.ok(surface, `${passing} should stay in the table as a documented pass`);
    const white = TABLE.inks.light[0];
    assert.ok(
      rule.contrastRatio(white.color, surface.color) >= TABLE.thresholds.bodyText,
      `${passing} was listed as a pass but white now measures below the floor`
    );
  }
});

// ---------------------------------------------------------------------------
// Class-list analysis
// ---------------------------------------------------------------------------

test('flags white ink on the flame fill', () => {
  const messages = flagged(
    `export const A = () => <button className="bg-az-flame text-az-ink" />;`
  );
  assert.equal(messages.length, 1, JSON.stringify(messages));
  assert.match(messages[0], /'text-az-ink' on 'bg-az-flame' measures 3\.18:1/);
  assert.match(messages[0], /text-az-surface-root' \(6\.03:1\)/);
});

test('flags the arbitrary-value spelling and Tailwind white', () => {
  assert.equal(
    flagged(`export const A = () => <b className="bg-[var(--color-az-flame)] text-white" />;`)
      .length,
    1
  );
});

test('flags the light fills the flame-only rule missed', () => {
  // The amber step marker: 2.15:1, the worst pairing in the app.
  const messages = flagged(
    `export const A = () => <span className="bg-az-warning-500 text-az-ink" />;`
  );
  assert.equal(messages.length, 1, JSON.stringify(messages));
  assert.match(messages[0], /measures 2\.15:1/);
  assert.match(messages[0], /text-az-surface-root' \(8\.93:1\)/);

  // The reward-tier metals, which is where the sweep found them.
  assert.equal(
    flagged(`export const A = () => <i className="bg-az-accent-gold text-white" />;`).length,
    1
  );
  assert.equal(
    flagged(`export const A = () => <i className="bg-az-accent-silver text-az-ink" />;`).length,
    1
  );
  assert.equal(
    flagged(`export const A = () => <i className="bg-az-accent-bronze text-white" />;`).length,
    1
  );

  // Semantic status fills, measured the same way.
  assert.equal(
    flagged(`export const A = () => <i className="bg-az-success-500 text-az-ink" />;`).length,
    1
  );
  assert.equal(
    flagged(`export const A = () => <i className="bg-az-error-500 text-white" />;`).length,
    1
  );
});

test('allows white on fills where it clears AA, which the table keeps measured', () => {
  assert.deepEqual(
    flagged(`export const A = () => <button className="bg-az-scarlet text-az-ink" />;`),
    []
  );
  assert.deepEqual(
    flagged(`export const A = () => <button className="bg-az-primary-500 text-white" />;`),
    []
  );
});

test('flags an opacity-modified ink, which is worse than opaque white', () => {
  assert.equal(
    flagged(`export const A = () => <span className="rounded-full bg-az-flame text-az-ink/70" />;`)
      .length,
    1
  );
});

test('allows the deep surface ink the pairing should use', () => {
  assert.deepEqual(
    flagged(`export const A = () => <button className="bg-az-flame text-az-surface-root" />;`),
    []
  );
  assert.deepEqual(
    flagged(`export const A = () => <button className="bg-az-flame text-az-surface-root/80" />;`),
    []
  );
  assert.deepEqual(
    flagged(`export const A = () => <button className="bg-az-warning-500 text-black" />;`),
    []
  );
});

test('allows a translucent wash over the dark canvas', () => {
  assert.deepEqual(
    flagged(`export const A = () => <div className="bg-az-flame/10 text-az-ink" />;`),
    []
  );
  assert.deepEqual(
    flagged(`export const A = () => <div className="bg-[var(--color-az-flame)]/15 text-white" />;`),
    []
  );
  // The tier badges are exactly this shape: a 15% metal wash under the metal ink.
  assert.deepEqual(
    flagged(
      `export const A = () => <span className="bg-az-accent-gold/15 text-az-accent-gold" />;`
    ),
    []
  );
});

test('allows white on the brand gradient, which the rendered audit measures', () => {
  assert.deepEqual(
    flagged(
      `export const A = () => <button className="bg-gradient-to-r from-az-flame to-az-scarlet text-az-ink" />;`
    ),
    []
  );
});

test('allows large-text roles where white clears the large-text floor', () => {
  assert.deepEqual(
    flagged(`export const A = () => <h1 className="bg-az-flame text-az-ink az-heading" />;`),
    []
  );
  assert.deepEqual(
    flagged(`export const A = () => <p className="bg-az-flame text-az-ink text-4xl" />;`),
    []
  );
  // …but a fill that fails even the 3:1 floor is not excused by size.
  const messages = flagged(
    `export const A = () => <h1 className="bg-az-accent-gold text-az-ink text-4xl" />;`
  );
  assert.equal(messages.length, 1, JSON.stringify(messages));
  assert.match(messages[0], /below WCAG AA's 3:1/);
});

test('ignoreLargeText:false enforces the body floor at every size', () => {
  assert.equal(
    flagged(`export const A = () => <h1 className="bg-az-flame text-az-ink az-heading" />;`, {
      ignoreLargeText: false,
    }).length,
    1
  );
});

test('flags a hover state that turns the surface light under resting ink', () => {
  const messages = flagged(
    `export const A = () => <div className="bg-az-glass-card text-az-ink hover:bg-az-warning-500" />;`
  );
  assert.equal(messages.length, 1, JSON.stringify(messages));
  assert.match(messages[0], /'hover:bg-az-warning-500'/);
});

test('flags white and a light fill introduced together by the same variant', () => {
  assert.equal(
    flagged(
      `export const A = () => <div className="group-hover:bg-az-flame group-hover:text-white" />;`
    ).length,
    1
  );
});

test('does not flag variants that never apply at the same time', () => {
  assert.deepEqual(
    flagged(`export const A = () => <div className="hover:bg-az-flame focus:text-az-ink" />;`),
    []
  );
});

test('reads template quasis, ternary branches and clsx arguments', () => {
  assert.equal(
    flagged(
      `export const A = ({ active }) => <div className={\`\${active ? 'bg-az-flame' : ''} text-az-ink\`} />;`
    ).length,
    1
  );
  assert.equal(
    flagged(
      `export const A = ({ active }) => <div className={cn('text-az-ink', active && 'bg-az-flame')} />;`
    ).length,
    1
  );
  // The corrected shape — dark ink in the branch that turns the surface light.
  assert.deepEqual(
    flagged(
      `export const A = ({ active }) => <div className={active ? 'bg-az-flame text-az-surface-root' : 'text-az-ink'} />;`
    ),
    []
  );
});

test('reports only the branch that actually pairs the two tokens', () => {
  // The classic tab: flame + white when active, muted ink on the glass panel
  // when idle. The idle branch must not be flagged — changing its ink to the
  // deep surface colour would put dark text on a dark panel.
  const messages = flagged(
    `export const A = ({ active }) => <button className={\`px-4 py-1.5 rounded-full text-xs font-bold \${active ? 'bg-az-flame text-az-ink' : 'text-az-ink/60 hover:text-az-ink'}\`} />;`
  );
  assert.equal(messages.length, 1, JSON.stringify(messages));
  assert.match(messages[0], /'text-az-ink' on 'bg-az-flame'/);
});

test('flags a conditional surface under the static ink beside it', () => {
  const messages = flagged(
    `export const A = ({ destructive }) => <button className={\`text-sm font-semibold text-az-ink \${destructive ? 'bg-az-error-500' : 'bg-az-flame'}\`} />;`
  );
  assert.equal(messages.length, 2, JSON.stringify(messages));
  assert.ok(messages.some((message) => /'bg-az-error-500'/.test(message)));
  assert.ok(messages.some((message) => /'bg-az-flame'/.test(message)));
});

test('checks standalone class constants, not only JSX attributes', () => {
  assert.equal(
    flagged(`const FILTER_ACTIVE = 'w-full rounded-az-control bg-az-flame text-az-ink';`).length,
    1
  );
  assert.deepEqual(
    flagged(`const FILTER_ACTIVE = 'w-full rounded-az-control bg-az-flame text-az-surface-root';`),
    []
  );
  // The tier-swatch map shape: a solid fill constant beside a white ink.
  assert.equal(flagged(`const SWATCH = { ultimate: 'bg-az-warning-500 text-az-ink' };`).length, 1);
});

test('pseudo-element fills only pair with ink that carries the same variant', () => {
  // `file:text-az-ink` paints the picker button's label: real pairing.
  assert.equal(
    flagged(
      `export const A = () => <input className="file:bg-[var(--color-az-flame)] file:text-az-ink text-az-ink/50" />;`
    ).length,
    1
  );
  // The base `text-az-ink/50` is painted on the input, not inside the button.
  assert.deepEqual(
    flagged(`export const A = () => <input className="file:bg-az-flame text-az-ink/50" />;`),
    []
  );
});

test('one report per ink/surface pair, not per token occurrence', () => {
  assert.equal(
    flagged(`export const A = () => <div className="bg-az-flame text-az-ink text-az-ink" />;`)
      .length,
    1
  );
});

// ---------------------------------------------------------------------------
// The table drives the rule
// ---------------------------------------------------------------------------

test('a custom table changes what is enforced, in both directions', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'contrast-pairs-'));
  const tablePath = path.join(directory, 'table.json');
  try {
    fs.writeFileSync(
      tablePath,
      JSON.stringify({
        thresholds: TABLE.thresholds,
        inks: TABLE.inks,
        surfaces: [
          // White on the shipped scarlet passes, so nothing may be reported…
          { token: 'scarlet', color: '#E31E24' },
          // …and a fill that was never in the shipped table now is.
          { token: 'flame', color: '#FFFFFF' },
        ],
      })
    );

    assert.deepEqual(
      flagged(`export const A = () => <div className="bg-az-scarlet text-az-ink" />;`, {
        tablePath,
      }),
      []
    );
    const messages = flagged(
      `export const A = () => <div className="bg-az-flame text-az-ink" />;`,
      { tablePath }
    );
    assert.equal(messages.length, 1, JSON.stringify(messages));
    assert.match(messages[0], /measures 1\.00:1/);

    // A fill that is not in the table is simply not measured.
    assert.deepEqual(
      flagged(`export const A = () => <div className="bg-az-warning-500 text-az-ink" />;`, {
        tablePath,
      }),
      []
    );
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
