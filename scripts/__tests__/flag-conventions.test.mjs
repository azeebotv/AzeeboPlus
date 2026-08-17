/**
 * Unit tests for the flag conventions check (scripts/lib/flag-conventions-core.mjs).
 *
 * Each test builds a minimal fixture tree (temp dir), runs the real rules
 * against it via runFlagConventionChecks, and asserts which violations are
 * reported — the same way the universe sentinel rule was verified by hand:
 * bad fixtures must fail with the expected message + file:line, clean fixtures
 * must pass.
 *
 * Run: `node --test scripts/__tests__/flag-conventions.test.mjs`
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rmSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runFlagConventionChecks } from '../lib/flag-conventions-core.mjs';
import { cleanFiles, makeRoot } from './fixtures.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const errors = (root) => runFlagConventionChecks(root).errors;

test('clean fixture passes (no violations)', (t) => {
  const root = makeRoot(cleanFiles());
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const result = runFlagConventionChecks(root);
  assert.deepEqual(result.errors, []);
  assert.equal(result.uniqueKeys, 1);
  assert.equal(result.slugCount, 2);
});

test('non-canonical sentinel key literal fails with file:line', (t) => {
  const root = makeRoot({ ...cleanFiles(), 'apps/demo/src/bad.ts': `const k = 'universe.movies.enabled';\n` });
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const errs = errors(root);
  assert.ok(
    errs.some((e) => e.includes('universe sentinel uses non-canonical slug "movies"') && e.includes('apps/demo/src/bad.ts:1')),
    errs.join('\n')
  );
});

test('non-canonical builder argument fails', (t) => {
  const root = makeRoot({ ...cleanFiles(), 'apps/demo/src/bad.ts': `const k = universeEnabledKey('creators');\n` });
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const errs = errors(root);
  assert.ok(
    errs.some((e) => e.includes('universe builder arg uses non-canonical slug "creators"')),
    errs.join('\n')
  );
});

test('bare nav-config flag value must be canonical or allowlisted', (t) => {
  const root = makeRoot({
    ...cleanFiles(),
    'apps/demo/src/nav.ts': `const EXPLORE = [{ name: 'Cinema', href: '/x', flag: 'cinemaxes' }];\n`,
  });
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const errs = errors(root);
  assert.ok(
    errs.some((e) => e.includes('universe nav flag value uses non-canonical slug "cinemaxes"') && e.includes('apps/demo/src/nav.ts:1')),
    errs.join('\n')
  );
});

test('gateway derivation removal fails', (t) => {
  const files = cleanFiles();
  files['services/gateway/api-gateway/src/app.module.ts'] =
    `import { FeatureFlagModule } from '@azeebo/feature-flags';\n` +
    `export const meta = { imports: [FeatureFlagModule.register({ global: true })] };\n`;
  const root = makeRoot(files);
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const errs = errors(root);
  assert.ok(
    errs.some((e) => e.includes('gateway app.module.ts no longer derives its universe sentinels')),
    errs.join('\n')
  );
});

test('duplicate FeatureFlagModule.register in an apps workspace fails', (t) => {
  const root = makeRoot({
    ...cleanFiles(),
    'apps/demo/src/dup.ts':
      `import { FeatureFlagModule } from '@azeebo/feature-flags';\n` +
      `FeatureFlagModule.register({ global: true });\n` +
      `FeatureFlagModule.register({ global: true });\n`,
  });
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const errs = errors(root);
  assert.ok(
    errs.some((e) => e.includes('apps/demo: 2 FeatureFlagModule.register() calls') && e.includes('apps/demo/src/dup.ts:2')),
    errs.join('\n')
  );
});

test('duplicate FeatureFlagModule.register in a services workspace fails', (t) => {
  const root = makeRoot({
    ...cleanFiles(),
    'services/core/other/package.json': '{"name":"other"}',
    'services/core/other/src/dup.ts':
      `import { FeatureFlagModule } from '@azeebo/feature-flags';\n` +
      `FeatureFlagModule.register({ global: true });\n` +
      `FeatureFlagModule.register({ global: true });\n`,
  });
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const errs = errors(root);
  assert.ok(
    errs.some((e) => e.includes('services/core/other: 2 FeatureFlagModule.register() calls') && e.includes('services/core/other/src/dup.ts:2')),
    errs.join('\n')
  );
});

test('duplicate FlagMetricsModule.register in a workspace fails (own service instance per call)', (t) => {
  const root = makeRoot({
    ...cleanFiles(),
    'services/core/other/package.json': '{"name":"other"}',
    'services/core/other/src/dup.ts':
      `import { FlagMetricsModule } from '@azeebo/flag-metrics';\n` +
      `FlagMetricsModule.register({ service: 'other' });\n` +
      `FlagMetricsModule.register({ service: 'other' });\n`,
  });
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const errs = errors(root);
  assert.ok(
    errs.some((e) => e.includes('services/core/other: 2 FlagMetricsModule.register() calls') && e.includes('services/core/other/src/dup.ts:2')),
    errs.join('\n')
  );
});

test('comments mentioning register() do not count toward registrations', (t) => {
  const root = makeRoot({
    ...cleanFiles(),
    'apps/demo/src/commented.ts':
      `// Keep exactly one: FeatureFlagModule.register({ global: true }) news its own client.\n` +
      `/* docs: FeatureFlagModule.register(...) */\n` +
      `FeatureFlagModule.register({ global: true });\n`,
  });
  t.after(() => rmSync(root, { recursive: true, force: true }));
  assert.deepEqual(errors(root), []);
});

test('test/spec files are excluded from the registration count', (t) => {
  const root = makeRoot({
    ...cleanFiles(),
    'apps/demo/src/app.module.spec.ts':
      `import { FeatureFlagModule } from '@azeebo/feature-flags';\n` +
      `FeatureFlagModule.register({});\n` +
      `FeatureFlagModule.register({});\n`,
  });
  t.after(() => rmSync(root, { recursive: true, force: true }));
  assert.deepEqual(errors(root), []);
});

test('duplicate registry keys fail', (t) => {
  const files = cleanFiles();
  files['packages/feature-flags/src/registries.ts'] =
    `export const a = { f: 'demo_f' };\nexport const b = { f: 'demo_f' };\n`;
  const root = makeRoot(files);
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const errs = errors(root);
  assert.ok(errs.some((e) => e.includes('duplicate flag key "demo_f"')), errs.join('\n'));
});

test('missing UNIVERSE_SLUGS is reported', (t) => {
  const files = cleanFiles();
  files['packages/shared-types/src/universe.ts'] = `export const NOPE = [];\n`;
  const root = makeRoot(files);
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const errs = errors(root);
  assert.ok(
    errs.some((e) => e.includes('could not find `UNIVERSE_SLUGS`')),
    errs.join('\n')
  );
});

test('FeatureFlagGuard without a matching @FeatureFlag fails', (t) => {
  const root = makeRoot({
    ...cleanFiles(),
    'services/core/other/package.json': '{"name":"other"}',
    'services/core/other/src/ctrl.ts':
      `import { FeatureFlagGuard } from '@azeebo/feature-flags';\n` +
      `@UseGuards(FeatureFlagGuard)\n` +
      `export class BadController {}\n`,
  });
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const errs = errors(root);
  assert.ok(
    errs.some(
      (e) =>
        e.includes('FeatureFlagGuard applied without a matching @FeatureFlag') &&
        e.includes('services/core/other/src/ctrl.ts:2')
    ),
    errs.join('\n')
  );
});

test('FeatureFlagGuard paired with @FeatureFlag (incl. method inheriting class-level) passes', (t) => {
  const root = makeRoot({
    ...cleanFiles(),
    'services/core/other/package.json': '{"name":"other"}',
    'services/core/other/src/ctrl.ts':
      `import { FeatureFlagGuard, FeatureFlag } from '@azeebo/feature-flags';\n` +
      `@UseGuards(FeatureFlagGuard)\n` +
      `@FeatureFlag('demo_feature_enabled')\n` +
      `export class GoodController {\n` +
      `  @UseGuards(FeatureFlagGuard)\n` +
      `  async foo() {}\n` +
      `}\n`,
  });
  t.after(() => rmSync(root, { recursive: true, force: true }));
  assert.deepEqual(errors(root), []);
});

test('fixture roots are isolated (mutations do not leak between tests)', (t) => {
  // Sanity: the real repo is never touched by the harness.
  const root = makeRoot(cleanFiles());
  t.after(() => rmSync(root, { recursive: true, force: true }));
  assert.ok(existsSync(path.join(root, 'apps/demo/package.json')));
  assert.equal(path.resolve(root).includes(path.resolve(__dirname)), false);
});
