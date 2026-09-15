/**
 * Unit tests for the generalized PROMOTION gate
 * (scripts/check-rule-promotion.mjs) — the tripwire that keeps a finished
 * lint migration finished: every service under services/ must resolve
 * each promotion-enforced rule to 'error' severity, and a service that
 * lints clean where the rule has dropped below 'error' fails CI. Which
 * rules are enforced is config-driven (scripts/promotion-rules.json).
 *
 * Pure pieces (scope, classification, snippet, config validation, rule
 * selection) are tested directly; severity resolution is tested against the
 * REAL eslint.config.js through calculateConfigForFile — the same resolution
 * the CLI uses — and the promotion config is asserted to actually pin the
 * require-map-and-throw rule, so the gate can never silently no-op.
 *
 * Run: `node --test scripts/__tests__/rule-promotion.test.mjs`
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  SCOPE_PREFIXES,
  inScope,
  classifyServices,
  resolveSeverities,
  severityOf,
  loadPromotionConfig,
  selectRules,
  PROMOTION_CONFIG_PATH,
} from '../check-rule-promotion.mjs';
import { discoverWorkspaces, RULE } from '../check-lint-warning-ratchet.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

// ---------------------------------------------------------------------------
// inScope / SCOPE_PREFIXES
// ---------------------------------------------------------------------------

test('inScope: services are in, apps and packages are out', () => {
  assert.equal(inScope('services/core/user-service'), true);
  assert.equal(inScope('services/engagement/subscription-service'), true);
  assert.equal(inScope('apps/web'), false);
  assert.equal(inScope('packages/security'), false);
  assert.equal(inScope('scripts'), false);
});

test('inScope handles windows-style separators', () => {
  assert.equal(inScope('services\\core\\user-service'), true);
  assert.equal(inScope('apps\\web'), false);
});

test('inScope rejects lookalike prefixes (servicesfoo)', () => {
  assert.equal(inScope('servicesfoo/thing'), false);
});

// ---------------------------------------------------------------------------
// loadPromotionConfig — validation against temp-dir fixtures
// ---------------------------------------------------------------------------

/** Write a config to a temp root; returns the root path. */
function makeConfigRoot(json) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'promo-config-'));
  fs.mkdirSync(path.join(root, 'scripts'), { recursive: true });
  fs.writeFileSync(path.join(root, PROMOTION_CONFIG_PATH), json);
  return root;
}

test('loadPromotionConfig: valid config with ratchet and exemptions', () => {
  const root = makeConfigRoot(
    JSON.stringify({
      rules: [
        { id: 'a/rule-one', ratchet: PROMOTION_CONFIG_PATH }, // exists (this file itself)
        { id: 'a/rule-two', exemptWorkspaces: ['@azeebo/x-service'] },
        { id: 'a/rule-three' },
      ],
    }),
  );
  try {
    const { rules, warnings } = loadPromotionConfig(root);
    assert.deepEqual(rules.map((r) => r.id), ['a/rule-one', 'a/rule-two', 'a/rule-three']);
    assert.equal(rules[0].ratchet, PROMOTION_CONFIG_PATH);
    assert.deepEqual(rules[1].exemptWorkspaces, ['@azeebo/x-service']);
    assert.equal(warnings.length, 0);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('loadPromotionConfig: nonexistent ratchet path survives (for --update to generate) with a warning', () => {
  // The DECLARED path must survive a missing file: the ratchet's documented
  // onboarding flow is "add the config entry, then run --update once" — if
  // the loader dropped the path, --update would silently skip the new rule.
  const root = makeConfigRoot(JSON.stringify({ rules: [{ id: 'a/rule', ratchet: 'nope/baseline.json' }] }));
  try {
    const { rules, warnings } = loadPromotionConfig(root);
    assert.equal(rules[0].ratchet, 'nope/baseline.json');
    assert.equal(warnings.length, 1);
    assert.match(warnings[0], /nope\/baseline\.json/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('loadPromotionConfig: rejects missing/empty/duplicate ids and malformed shapes', () => {
  const bad = [
    { rules: [] },
    { rules: [{ ratchet: 'x.json' }] },
    { rules: [{ id: '' }] },
    { rules: [{ id: 'a/x' }, { id: 'a/x' }] },
    { rules: [{ id: 'a/x', ratchet: 42 }] },
    { rules: [{ id: 'a/x', exemptWorkspaces: 'nope' }] },
    { rules: [{ id: 'a/x', exemptWorkspaces: ['ok', ''] }] },
    {},
  ];
  for (const rules of bad) {
    const root = makeConfigRoot(JSON.stringify(rules));
    try {
      assert.throws(() => loadPromotionConfig(root), /promotion config/, JSON.stringify(rules));
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  }
});

// ---------------------------------------------------------------------------
// selectRules — env filter
// ---------------------------------------------------------------------------

test('selectRules: no env var selects every configured rule', () => {
  const rules = [{ id: 'a/one' }, { id: 'a/two' }];
  assert.deepEqual(selectRules(rules, undefined), rules);
  assert.deepEqual(selectRules(rules, ''), rules);
});

test('selectRules: AZEEBO_LINT_RULE filters to the single listed rule', () => {
  const rules = [{ id: 'a/one' }, { id: 'a/two' }];
  assert.deepEqual(selectRules(rules, 'a/two'), [rules[1]]);
});

test('selectRules: an unlisted AZEEBO_LINT_RULE is an operator error, not a silent no-op', () => {
  const rules = [{ id: 'a/one' }];
  assert.throws(() => selectRules(rules, 'a/not-listed'), /not promotion-enforced.*a\/one/s);
});

// ---------------------------------------------------------------------------
// classifyServices — the pure decision (array-signature severities)
// ---------------------------------------------------------------------------

const ws = (name) => ({ name, dir: `/r/services/core/${name.replace('@azeebo/', '')}`, lintDirs: [] });

/** severities map in the resolveSeverities shape: name → ruleId → severity. */
const sevMap = (name, ruleId, severity) => new Map([[name, new Map([[ruleId, severity]])]]);
const warnMap = (name, count) => new Map([[name, count]]);

test('classifyServices: clean + ungated → promote (the gate failure)', () => {
  const out = classifyServices([ws('@azeebo/analytics-service')], sevMap('@azeebo/analytics-service', RULE, 1), warnMap('@azeebo/analytics-service', 0), RULE);
  assert.deepEqual(out[0].status, 'promote');
  assert.equal(out[0].gated, false);
});

test('classifyServices: clean + gated → healthy (goal state)', () => {
  const out = classifyServices([ws('@azeebo/content-service')], sevMap('@azeebo/content-service', RULE, 2), warnMap('@azeebo/content-service', 0), RULE);
  assert.deepEqual(out[0].status, 'healthy');
});

test('classifyServices: warnings + ungated → migrating (ratchet territory)', () => {
  const out = classifyServices([ws('@azeebo/payment-service')], sevMap('@azeebo/payment-service', RULE, 1), warnMap('@azeebo/payment-service', 7), RULE);
  assert.deepEqual(out[0].status, 'migrating');
});

test('classifyServices: warnings + gated → misgated (glob drift, must never pass silently)', () => {
  const out = classifyServices([ws('@azeebo/broken-service')], sevMap('@azeebo/broken-service', RULE, 2), warnMap('@azeebo/broken-service', 3), RULE);
  assert.deepEqual(out[0].status, 'misgated');
});

test('classifyServices: rule not configured (null severity) counts as ungated', () => {
  const out = classifyServices([ws('@azeebo/x-service')], sevMap('@azeebo/x-service', RULE, null), warnMap('@azeebo/x-service', 0), RULE);
  assert.deepEqual(out[0].status, 'promote');
  assert.equal(out[0].severity, null);
});

test('classifyServices: missing warn-count entry defaults to 0 (clean)', () => {
  const out = classifyServices([ws('@azeebo/y-service')], sevMap('@azeebo/y-service', RULE, 1), new Map(), RULE);
  assert.deepEqual(out[0].status, 'promote');
});

test('classifyServices: declared exemption turns a clean ungated service exempt', () => {
  const out = classifyServices(
    [ws('@azeebo/x-service')],
    sevMap('@azeebo/x-service', RULE, 1),
    warnMap('@azeebo/x-service', 0),
    RULE,
    { pinExemptions: ['@azeebo/x-service'] },
  );
  assert.deepEqual(out[0].status, 'exempt');
});

test('classifyServices: exemption never applies to a warning service or a gated one', () => {
  for (const [severity, warnCount, expected] of [
    [1, 5, 'migrating'],
    [2, 0, 'healthy'],
    [2, 5, 'misgated'],
  ]) {
    const out = classifyServices(
      [ws('@azeebo/x-service')],
      sevMap('@azeebo/x-service', RULE, severity),
      warnMap('@azeebo/x-service', warnCount),
      RULE,
      { pinExemptions: ['@azeebo/x-service'] },
    );
    assert.deepEqual(out[0].status, expected, `severity=${severity} warnCount=${warnCount}`);
  }
});

// ---------------------------------------------------------------------------
// resolveSeverities — against the REAL eslint.config.js, multi-rule shape
// ---------------------------------------------------------------------------

test('resolveSeverities: array ruleIds resolve in one pass per workspace', async () => {
  const workspaces = discoverWorkspaces(ROOT);
  const sev = await resolveSeverities(workspaces, [RULE, 'no-such-rule/whatever']);
  const content = workspaces.find((x) => x.name === '@azeebo/content-service');
  if (!content) return; // workspace absent in a given checkout state — skip
  assert.equal(severityOf(sev, '@azeebo/content-service', RULE), 2);
  assert.equal(severityOf(sev, '@azeebo/content-service', 'no-such-rule/whatever'), null);
});

test('resolveSeverities: already-gated services resolve to error severity', async () => {
  const workspaces = discoverWorkspaces(ROOT);
  const sev = await resolveSeverities(workspaces, [RULE]);
  for (const name of ['@azeebo/auth-service', '@azeebo/content-service', '@azeebo/user-service', '@azeebo/wallet-service']) {
    const w = workspaces.find((x) => x.name === name);
    if (!w) continue; // workspace absent in a given checkout state — skip
    assert.equal(severityOf(sev, name, RULE), 2, `${name} is fully gated and must resolve the rule to severity 2`);
  }
});

test('resolveSeverities: migration complete — formerly-migrating services resolve to error severity', async () => {
  // The require-map-and-throw migration finished (29/29 gated, 0 warnings).
  // These were the last services converted; this canary fails if the rule is
  // ever weakened below 'error' severity for one of them again.
  const workspaces = discoverWorkspaces(ROOT);
  const sev = await resolveSeverities(workspaces, [RULE]);
  for (const name of ['@azeebo/media-service', '@azeebo/search-service', '@azeebo/payment-service']) {
    const w = workspaces.find((x) => x.name === name);
    if (!w) continue;
    assert.equal(severityOf(sev, name, RULE), 2, `${name} was migrated and must resolve the rule to severity 2`);
  }
});

test('severityOf: unknown workspace or rule resolves to null (never throws)', async () => {
  const workspaces = discoverWorkspaces(ROOT);
  const sev = await resolveSeverities(workspaces.slice(0, 1), [RULE]);
  assert.equal(severityOf(sev, '@azeebo/absent-service', RULE), null);
});

// ---------------------------------------------------------------------------
// Wire-shape sanity — the gate can never silently no-op
// ---------------------------------------------------------------------------

test('promotion scope is services-only by contract', () => {
  assert.deepEqual(SCOPE_PREFIXES, ['services/']);
});

test('the committed promotion config is structurally valid and pins the map-and-throw rule', () => {
  const { rules, warnings } = loadPromotionConfig(ROOT);
  assert.equal(warnings.length, 0, `promotion config should be fully resolvable: ${warnings.join('; ')}`);
  const ids = rules.map((r) => r.id);
  assert.ok(ids.includes(RULE), 'require-map-and-throw must stay promotion-enforced');
  const mapThrow = rules.find((r) => r.id === RULE);
  assert.ok(
    !mapThrow.exemptWorkspaces || mapThrow.exemptWorkspaces.length === 0,
    'map-and-throw has no exemptions today — add one only as a deliberate, reviewed decision',
  );

  // The design-token migration runs no-hex-colors on the same machinery —
  // the first real second ratcheted rule: warn only inside apps/web (the
  // debt surface, via an eslint block), error everywhere else, ratcheted
  // to 0 floor by conversion.
  const HEX_RULE = 'azeebo-custom/no-hex-colors';
  assert.ok(ids.includes(HEX_RULE), 'no-hex-colors must stay promotion-enforced');
  const hexRule = rules.find((r) => r.id === HEX_RULE);
  assert.ok(
    typeof hexRule.ratchet === 'string' && hexRule.ratchet.startsWith('scripts/'),
    'no-hex-colors must carry a ratchet baseline path while its migration is in flight',
  );
  assert.ok(
    !hexRule.exemptWorkspaces || hexRule.exemptWorkspaces.length === 0,
    'no-hex-colors has no exemptions today — apps/web warns via the eslint block, not exemptWorkspaces',
  );
});

test('migration scaffolding is retired: every service resolves require-map-and-throw to error severity', async () => {
  // The migration finished (all services converted). The rule is now `error`
  // in the eslint.config.js BASE config and the per-service error-gate block
  // is retired — this canary fails if the rule is ever weakened below
  // 'error' for ANY service (downgrade, scope exception, deleted config).
  const allWorkspaces = discoverWorkspaces(ROOT);
  const workspaces = allWorkspaces.filter((w) => inScope(path.relative(ROOT, w.dir)));
  assert.ok(workspaces.length > 0, 'service workspaces must be discoverable');
  const sev = await resolveSeverities(workspaces, [RULE]);
  const weakened = workspaces
    .map((w) => ({ name: w.name, severity: severityOf(sev, w.name, RULE) }))
    .filter((x) => x.severity !== 2);
  assert.deepEqual(weakened, [], `require-map-and-throw must resolve to 'error' (2) for every service; got: ${JSON.stringify(weakened)}`);
});
