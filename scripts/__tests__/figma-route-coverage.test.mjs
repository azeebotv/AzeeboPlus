/**
 * Unit tests for scripts/figma-route-coverage.mjs — the Figma frame ↔ route
 * coverage map.
 *
 * Run via the CI conventions job: `node --test scripts/__tests__/*.test.mjs`
 *
 * The parser and the route walkers are exercised against fixture trees so the
 * map cannot quietly degrade: a renamed spec heading must surface as "coverage
 * unknown" (parseFailed), not as "0 frames", and a deleted page must surface as
 * a dangling pattern instead of vanishing from the report.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import {
  parseInventory,
  listNextRoutes,
  patternResolves,
  classify,
  uncoveredRoutes,
  buildReport,
} from '../figma-route-coverage.mjs';

const FIXTURE_SPEC = `
# Azeebo Figma — Design Extraction & Screen Spec

## 1. Frame Inventory (verified from layer tree)

### Design System
- \`TYPEfACE OF aZEEBO\`, \`Button\` — type scale specimens

### Authentication & Onboarding
\`Login\`, \`Register\`
→ existing routes: \`/auth/login\`, \`/auth/register\`

### Universe Sections
- **Comedy Universe:** \`Comedians\`, \`comedy series\` → \`/comedy/*\`
- **Messaging:** group frame (contents below top-level)

## 2. Design Language
irrelevant prose
`;

test('parseInventory: reads groups, frames and route patterns from the spec', () => {
  const groups = parseInventory(FIXTURE_SPEC);
  assert.ok(groups, 'fixture must parse');
  const names = groups.map((g) => g.group);
  assert.deepEqual(names, [
    'Design System',
    'Authentication & Onboarding',
    'Universe Sections / Comedy Universe',
    'Universe Sections / Messaging',
  ]);
  // Specimen frames carry no routes; they are inventory, not coverage.
  assert.deepEqual(groups[0].routes, []);
  assert.deepEqual(groups[0].frames, ['TYPEfACE OF aZEEBO', 'Button']);
  // A frame list followed by its own arrow line is ONE group, not two.
  assert.deepEqual(groups[1].frames, ['Login', 'Register']);
  assert.deepEqual(groups[1].routes, ['/auth/login', '/auth/register']);
  assert.deepEqual(groups[2].routes, ['/comedy/*']);
});

test('parseInventory: a frames-only group at the end of §1 is still inventory', () => {
  // Regression: the pending frames list used to be dropped whenever no
  // `→ routes:` line followed it, which silently deleted the last group of the
  // section (the spec ends with "Mobile-format frames").
  const groups = parseInventory('## 1. Frame Inventory\n\n### Misc\n`Desktop - 1`, `1 1`\n');
  assert.equal(groups.length, 1);
  assert.deepEqual(groups[0].frames, ['Desktop - 1', '1 1']);
  assert.deepEqual(groups[0].routes, []);
});

test('parseInventory: blockquote notes inside §1 are prose, not frames', () => {
  const groups = parseInventory(
    '## 1. Frame Inventory\n\n> Note: `pnpm check:design-coverage` reads this.\n\n### Misc\n`Login`\n→ \`/auth/login\`\n',
  );
  assert.equal(groups.length, 1);
  assert.deepEqual(groups[0].frames, ['Login']);
  assert.deepEqual(groups[0].routes, ['/auth/login']);
});

test('parseInventory: stops at the next numbered section', () => {
  const groups = parseInventory(FIXTURE_SPEC);
  assert.ok(!groups.some((g) => /Design Language/.test(g.group)));
  assert.ok(!groups.some((g) => g.routes.includes('/api')));
});

test('parseInventory: a renamed or missing inventory section is unknown, not zero', () => {
  assert.equal(parseInventory('# Spec\n\n## 1. Frames\n\n`Login`\n'), null);
  const report = buildReportFixture({ 'docs/design/figma-azeebo-screen-spec.md': '# Spec\n' });
  assert.equal(report.parseFailed, true);
});

test('listNextRoutes: page files are routes, groups vanish, api does not exist', () => {
  const root = fixtureApp({
    'page.tsx': '',
    'library/page.tsx': '',
    '(tabs)/home.tsx': '',
    '(tabs)/nested/page.tsx': '',
    'watch/[id]/page.tsx': '',
    'api/health/route.ts': '',
    '__tests__/page.tsx': '',
  });
  try {
    assert.deepEqual(listNextRoutes(path.join(root, 'app')), [
      '/',
      '/library',
      '/nested',
      '/watch/[id]',
    ]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('patternResolves: exact routes and /* subtrees', () => {
  const routes = ['/comedy', '/comedy/specials', '/music'];
  assert.equal(patternResolves('/music', routes), true);
  assert.equal(patternResolves('/movies', routes), false);
  assert.equal(patternResolves('/comedy/*', routes), true);
  assert.equal(patternResolves('/watch/[id]', routes), false);
});

test('classify: mapped is per surface, dangling is global', () => {
  const groups = parseInventory(FIXTURE_SPEC);
  const routesBySurface = {
    web: ['/auth/login', '/auth/register', '/comedy', '/comedy/specials'],
    // Mobile ships the same screens under flattened expo paths, and the spec's
    // `/auth/*` spelling resolves there only as `/comedy/*`.
    mobile: ['/comedy/specials'],
  };
  const { perSurface, dangling } = classify(groups, routesBySurface);
  assert.deepEqual(
    perSurface.web.map((m) => m.pattern),
    ['/auth/login', '/auth/register', '/comedy/*']
  );
  assert.deepEqual(
    perSurface.mobile.map((m) => m.pattern),
    ['/comedy/*']
  );
  // `/auth/login` resolves on web, so it must NOT be reported as drift.
  assert.deepEqual(dangling, []);
});

test('classify: a pattern no surface ships is dangling', () => {
  const groups = [{ group: 'G', frames: ['X'], routes: ['/gone', '/here'] }];
  const { dangling } = classify(groups, { web: ['/here'], mobile: [] });
  assert.deepEqual(dangling, [{ group: 'G', pattern: '/gone' }]);
});

test('uncoveredRoutes: shipped pages no frame claims, minus non-page routes', () => {
  const groups = parseInventory(FIXTURE_SPEC);
  const routes = ['/auth/login', '/comedy/specials', '/wallet', '/', '/api/x'];
  assert.deepEqual(uncoveredRoutes(groups, routes), ['/wallet', '/']);
});

test('parseInventory: consecutive frames-only bullets accumulate into one group', () => {
  // The spec's "Design System" section lists type specimens on one bullet and
  // buttons on the next; the second used to replace the first.
  const groups = parseInventory(
    '## 1. Frame Inventory\n\n### Design System\n- `Typeface 1`, `Typeface 2` — specimens\n- `Button`, `button 2` — components\n\n### Next\n`Login`\n',
  );
  assert.deepEqual(groups[0].frames, ['Typeface 1', 'Typeface 2', 'Button', 'button 2']);
  assert.deepEqual(groups[1].frames, ['Login']);
});

test('the committed spec still parses against the real tree', () => {
  const report = buildReport();
  assert.equal(report.parseFailed, false, '§1 "Frame Inventory" was renamed or removed');
  assert.ok(report.frames > 90, `expected the real inventory, got ${report.frames} frames`);
  assert.ok(report.surfaces.web.routeCount > 100);
  assert.deepEqual(report.dangling, [], 'the spec claims routes no surface ships');
});

/* ── helpers ─────────────────────────────────────────────────────── */

function fixtureApp(files) {
  const root = mkdtempSync(path.join(tmpdir(), 'figma-cov-'));
  for (const [rel, body] of Object.entries(files)) {
    const abs = path.join(root, 'app', rel);
    mkdirSync(path.dirname(abs), { recursive: true });
    writeFileSync(abs, body);
  }
  return root;
}

/** A throwaway repo root containing only the spec file. */
function buildReportFixture(files) {
  const root = mkdtempSync(path.join(tmpdir(), 'figma-repo-'));
  for (const [rel, body] of Object.entries(files)) {
    const abs = path.join(root, rel);
    mkdirSync(path.dirname(abs), { recursive: true });
    writeFileSync(abs, body);
  }
  try {
    return buildReport(root, ['web']);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}
