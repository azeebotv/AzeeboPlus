#!/usr/bin/env node
/**
 * Flag conventions CI check — CLI entry point.
 *
 * All rule logic lives in `scripts/lib/flag-conventions-core.mjs` so the rules
 * can be unit-tested against fixture trees (see scripts/__tests__). This file
 * only resolves the repo root, prints violations, and sets the exit code.
 *
 * Parts covered (see core module for details):
 *   1 — registry keys in `packages/feature-flags/src/registries.ts`
 *   2 — universe sentinels (canonical UNIVERSE_SLUGS, sentinel keys, builder
 *       args, nav-config `flag:` values, gateway derivation)
 *   3 — single-registration hygiene for shared dynamic modules per workspace
 *   4 — FeatureFlagGuard must be paired with a matching @FeatureFlag (A-8)
 *
 * Run: `node scripts/check-flag-conventions.mjs`
 *
 * Optional `--root <dir>` overrides the repo root (used by the unit tests in
 * scripts/__tests__ to run the CLI against fixture trees).
 */

import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { runFlagConventionChecks } from './lib/flag-conventions-core.mjs';

const rootArgIndex = process.argv.indexOf('--root');
let root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
if (rootArgIndex !== -1) {
  const rootArg = process.argv[rootArgIndex + 1];
  if (!rootArg) {
    console.error('--root requires a directory path');
    process.exit(2);
  }
  root = path.resolve(rootArg);
  if (!existsSync(root)) {
    console.error(`--root directory does not exist: ${root}`);
    process.exit(2);
  }
}

const { errors, uniqueKeys, slugCount } = runFlagConventionChecks(root);

if (errors.length > 0) {
  console.error('Flag convention violations:');
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log(
  `Flag conventions OK (${uniqueKeys} unique keys, ${slugCount} universe slugs).`
);
