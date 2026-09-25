/**
 * CLI-level tests for scripts/check-flag-conventions.mjs.
 *
 * Unlike flag-conventions.test.mjs (which exercises the rule core directly),
 * these spawn the actual CLI process with `--root <fixture>` and assert the
 * real exit code + output — the same surface CI sees.
 *
 * Run: `node --test scripts/__tests__/`
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { cleanFiles, makeRoot } from './fixtures.mjs';

const cliPath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'check-flag-conventions.mjs'
);

/** Run the real CLI against a fixture root. */
function runCli(root) {
  return spawnSync(process.execPath, [cliPath, '--root', root], { encoding: 'utf8' });
}

test('CLI exits 0 with the OK summary on a clean fixture', (t) => {
  const root = makeRoot(cleanFiles());
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const result = runCli(root);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Flag conventions OK \(1 unique keys, 2 universe slugs\)\./);
  assert.equal(result.stderr, '');
});

test('CLI exits 1 and prints the violation with file:line for a duplicate registration', (t) => {
  const files = cleanFiles();
  files['apps/demo/src/dup.ts'] =
    `import { FeatureFlagModule } from '@azeebo/feature-flags';\n` +
    `FeatureFlagModule.register({ global: true });\n` +
    `FeatureFlagModule.register({ global: true });\n`;
  const root = makeRoot(files);
  t.after(() => rmSync(root, { recursive: true, force: true }));

  const result = runCli(root);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Flag convention violations:/);
  assert.match(
    result.stderr,
    /apps\/demo: 2 FeatureFlagModule\.register\(\) calls/
  );
  assert.match(result.stderr, /apps\/demo\/src\/dup\.ts:2/);
  assert.equal(result.stdout, '');
});

test('CLI exits 1 for a duplicate FlagMetricsModule registration too', (t) => {
  const files = cleanFiles();
  files['services/core/other/package.json'] = '{"name":"other"}';
  files['services/core/other/src/dup.ts'] =
    `import { FlagMetricsModule } from '@azeebo/flag-metrics';\n` +
    `FlagMetricsModule.register({ service: 'other' });\n` +
    `FlagMetricsModule.register({ service: 'other' });\n`;
  const root = makeRoot(files);
  t.after(() => rmSync(root, { recursive: true, force: true }));

  const result = runCli(root);
  assert.equal(result.status, 1);
  assert.match(
    result.stderr,
    /services\/core\/other: 2 FlagMetricsModule\.register\(\) calls/
  );
});

test('CLI exits 2 with a clear message for a missing --root directory', (t) => {
  const result = runCli(path.join(process.cwd(), 'does-not-exist-flagconv'));
  assert.equal(result.status, 2);
  assert.match(result.stderr, /--root directory does not exist/);
});

test('CLI exits 2 when --root is missing its argument', (t) => {
  const result = spawnSync(process.execPath, [cliPath, '--root'], { encoding: 'utf8' });
  assert.equal(result.status, 2);
  assert.match(result.stderr, /--root requires a directory path/);
});
