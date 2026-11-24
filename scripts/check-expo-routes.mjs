#!/usr/bin/env node
/**
 * Expo Router dead-link CI check — CLI entry point.
 *
 * All rule logic lives in `scripts/lib/expo-routes-core.mjs` so it can be
 * unit-tested against fixture trees (see scripts/__tests__). This file only
 * resolves the repo root, prints violations, and sets the exit code.
 *
 * Rule: every `router.push/replace/navigate('/...')` and `href="/..."`
 * target in an app's `app/` (and `src/`) trees must resolve to a route file
 * in that app's Expo Router directory. Dead targets throw "Unhandled route"
 * at runtime — navigation to a page the user can see a button for.
 *
 * Run: `node scripts/check-expo-routes.mjs`
 *
 * Optional `--root <dir>` overrides the repo root (used by the unit tests).
 */

import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { runExpoRouteChecks } from './lib/expo-routes-core.mjs';

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

const { errors, stats } = runExpoRouteChecks(root);

if (errors.length > 0) {
  console.error(`\n✗ Expo Router dead links found (${errors.length}):\n`);
  for (const err of errors) console.error(`  ${err}`);
  console.error(
    `\nEvery router.push/replace/navigate and href target must match a route file in the app's app/ directory.`
  );
  console.error(`Create the missing route, fix the target, or (last resort) add a reason to`);
  console.error(`EXPO_ROUTE_ALLOWLIST in scripts/lib/expo-routes-core.mjs.\n`);
  process.exit(1);
}

console.log(
  `✅ Expo Router links OK — ${stats.appsScanned} app(s), ${stats.filesScanned} file(s), ` +
    `${stats.targetsChecked} navigation target(s) across ${stats.routesFound} routes.`
);
