/**
 * Unit tests for the require-map-and-throw PROMOTION gate
 * (scripts/check-map-and-throw-promotion.mjs) — the progression twin of the
 * lint-warning ratchet: any service that lints clean but is missing from the
 * eslint.config.js error-gate block fails CI.
 *
 * Pure pieces (scope, classification, snippet) are tested directly; the
 * severity resolution is tested against the REAL eslint.config.js through
 * calculateConfigForFile — the same resolution the CLI uses — asserting that
 * already-gated services resolve to `error` while known warn-severity
 * services resolve to `warn`.
 *
 * Run: `node --test scripts/__tests__/map-and-throw-promotion.test.mjs`
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  SCOPE_PREFIXES,
  inScope,
  classifyServices,
  promotionSnippet,
  resolveSeverities,
  DEFAULT_RULE_ID,
} from '../check-map-and-throw-promotion.mjs';
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
// classifyServices — the pure decision
// ---------------------------------------------------------------------------

const ws = (name) => ({ name, dir: `/r/services/core/${name.replace('@azeebo/', '')}`, lintDirs: [] });

test('classifyServices: clean + ungated → promote (the gate failure)', () => {
  const out = classifyServices([ws('@azeebo/analytics-service')], new Map([['@azeebo/analytics-service', 1]]), new Map([['@azeebo/analytics-service', 0]]));
  assert.deepEqual(out[0].status, 'promote');
  assert.equal(out[0].gated, false);
});

test('classifyServices: clean + gated → healthy (goal state)', () => {
  const out = classifyServices([ws('@azeebo/content-service')], new Map([['@azeebo/content-service', 2]]), new Map([['@azeebo/content-service', 0]]));
  assert.deepEqual(out[0].status, 'healthy');
});

test('classifyServices: warnings + ungated → migrating (ratchet territory)', () => {
  const out = classifyServices([ws('@azeebo/payment-service')], new Map([['@azeebo/payment-service', 1]]), new Map([['@azeebo/payment-service', 7]]));
  assert.deepEqual(out[0].status, 'migrating');
  assert.equal(out[0].gated, false);
});

test('classifyServices: warnings + gated → misgated (glob drift, must never pass silently)', () => {
  const out = classifyServices([ws('@azeebo/broken-service')], new Map([['@azeebo/broken-service', 2]]), new Map([['@azeebo/broken-service', 3]]));
  assert.deepEqual(out[0].status, 'misgated');
});

test('classifyServices: rule not configured for the file tree (null severity) counts as ungated', () => {
  const out = classifyServices([ws('@azeebo/x-service')], new Map([['@azeebo/x-service', null]]), new Map([['@azeebo/x-service', 0]]));
  assert.deepEqual(out[0].status, 'promote');
  assert.equal(out[0].severity, null);
});

test('classifyServices: missing warn-count entry defaults to 0 (clean)', () => {
  const out = classifyServices([ws('@azeebo/y-service')], new Map([['@azeebo/y-service', 1]]), new Map());
  assert.deepEqual(out[0].status, 'promote');
  assert.equal(out[0].warnCount, 0);
});

// ---------------------------------------------------------------------------
// promotionSnippet
// ---------------------------------------------------------------------------

test('promotionSnippet renders the exact glob line for the error-gate block', () => {
  assert.equal(promotionSnippet('services/operations/queue-service'), "      'services/operations/queue-service/**/*.ts',");
});

test('promotionSnippet normalizes windows separators', () => {
  assert.equal(promotionSnippet('services\\universes\\games-service'), "      'services/universes/games-service/**/*.ts',");
});

// ---------------------------------------------------------------------------
// resolveSeverities — against the REAL eslint.config.js
// ---------------------------------------------------------------------------

test('resolveSeverities: already-gated services resolve to error severity', async () => {
  const workspaces = discoverWorkspaces(ROOT);
  const sev = await resolveSeverities(workspaces, RULE);
  for (const name of ['@azeebo/content-service', '@azeebo/user-service', '@azeebo/wallet-service']) {
    const w = workspaces.find((x) => x.name === name);
    if (!w) continue; // workspace absent in a given checkout state — skip
    assert.equal(sev.get(name), 2, `${name} is in the error-gate block and must resolve to severity 2`);
  }
});

test('resolveSeverities: known migrating services resolve to warn severity', async () => {
  const workspaces = discoverWorkspaces(ROOT);
  const sev = await resolveSeverities(workspaces, RULE);
  for (const name of ['@azeebo/payment-service', '@azeebo/search-service', '@azeebo/auth-service']) {
    const w = workspaces.find((x) => x.name === name);
    if (!w) continue;
    assert.equal(sev.get(name), 1, `${name} is not yet gated and must resolve to severity 1`);
  }
});

test('resolveSeverities: rule not configured anywhere resolves to null', async () => {
  const workspaces = discoverWorkspaces(ROOT);
  const sev = await resolveSeverities(workspaces.slice(0, 2), 'no-such-rule/whatever');
  assert.equal(sev.get(workspaces[0].name), null);
});

// ---------------------------------------------------------------------------
// Wire-shape sanity
// ---------------------------------------------------------------------------

test('promotion scope is services-only by contract', () => {
  assert.deepEqual(SCOPE_PREFIXES, ['services/']);
});

test('default rule id matches the ratchet rule', () => {
  assert.equal(DEFAULT_RULE_ID, RULE);
});
