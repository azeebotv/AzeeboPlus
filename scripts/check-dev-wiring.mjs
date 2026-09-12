#!/usr/bin/env node
/**
 * Dev-script wiring consistency check — CLI entry point.
 *
 * All rule logic lives in `scripts/lib/dev-wiring-core.mjs` so it can be
 * unit-tested against fixture trees (see scripts/__tests__/dev-wiring.test.mjs).
 * This file only resolves the repo root, prints violations, and sets the
 * exit code.
 *
 * Rule: every services/* workspace routes `pnpm start:dev` through the one
 * shared runner (scripts/start-dev-service.sh) and keeps no per-service
 * start-dev.sh wrapper. This is the drift that produced two real bugs
 * (live-event-service's phantom `generated/` guard and knowledge-service's
 * bypassed script); this check fails the PR if either pattern reappears.
 *
 * Run: `node scripts/check-dev-wiring.mjs`
 *
 * Optional `--root <dir>` overrides the repo root (used by the unit tests).
 */

import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { runDevWiringChecks, runAppWiringChecks, runPackageWiringChecks } from './lib/dev-wiring-core.mjs';

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

const { workspaces, errors, bypasses, legacyScripts, unwired, runnerPresent, buildBypasses } = runDevWiringChecks(root);
const appResults = runAppWiringChecks(root);
const pkgResults = runPackageWiringChecks(root);

if (workspaces === 0) {
  console.error('No services/* workspaces found — nothing to check.');
  process.exit(2);
}

let failed = false;

if (errors.length > 0) {
  console.error('Dev-script wiring violations:');
  for (const e of errors) console.error(`  - ${e}`);
  failed = true;
}
if (bypasses.length > 0) {
  console.error(`start:dev bypasses (${bypasses.length}) — must be exactly "bash ../../scripts/start-dev-service.sh":`);
  for (const b of bypasses) console.error(`  - ${b}`);
  failed = true;
}
if (legacyScripts.length > 0) {
  console.error(`Legacy per-service start-dev.sh files (${legacyScripts.length}) — delete them:`);
  for (const l of legacyScripts) console.error(`  - ${l}`);
  failed = true;
}
if (buildBypasses.length > 0) {
  console.error(`build bypasses (${buildBypasses.length}) — must be exactly "bash ../../../scripts/build-service.sh" (the shared runner owns prisma generate + tsc + client mirroring):`);
  for (const b of buildBypasses) console.error(`  - ${b}`);
  failed = true;
}
if (appResults.errors.length > 0) {
  console.error(`App wiring violations (${appResults.errors.length}):`);
  for (const e of appResults.errors) console.error(`  - ${e}`);
  failed = true;
}
if (appResults.appBypasses.length > 0) {
  console.error(`App start:dev bypasses (${appResults.appBypasses.length}) — schema-owning apps must be exactly "bash ../../scripts/start-dev-app.sh" (the runner owns first-run prisma generation):`);
  for (const b of appResults.appBypasses) console.error(`  - ${b}`);
  failed = true;
}

if (pkgResults.errors.length > 0) {
  console.error(`Package wiring violations (${pkgResults.errors.length}):`);
  for (const e of pkgResults.errors) console.error(`  - ${e}`);
  failed = true;
}
if (pkgResults.packageBuildBypasses.length > 0) {
  console.error(`Package build bypasses (${pkgResults.packageBuildBypasses.length}) — must be exactly "bash ../../scripts/build-package.sh" (compile-only tsc through the shared runner):`);
  for (const b of pkgResults.packageBuildBypasses) console.error(`  - ${b}`);
  failed = true;
}

if (failed) {
  console.error(`\nFix per the dev-wiring convention: every service's start:dev = "bash ../../../scripts/start-dev-service.sh" and build = "bash ../../../scripts/build-service.sh"; schema-owning apps' start:dev = "bash ../../scripts/start-dev-app.sh"; every package's build = "bash ../../scripts/build-package.sh" (the shared runners own prisma generation, compilation, dist mirroring, and watch startup).`);
  process.exit(1);
}

console.log(`Package wiring OK (${pkgResults.workspaces} packages, all build through the shared compile-only runner).`);

if (appResults.appUnwired.length > 0) {
  console.log(`App wiring OK (${appResults.workspaces} apps; ${appResults.appUnwired.length} schema-less with their own dev model: ${appResults.appUnwired.join(', ')})`);
} else {
  console.log(`App wiring OK (${appResults.workspaces} apps, all routed through the shared app runner).`);
}

if (unwired.length > 0) {
  console.log(`Dev wiring OK (${workspaces} workspaces; ${unwired.length} without start:dev and without a schema: ${unwired.join(', ')})`);
} else {
  console.log(`Dev wiring OK (${workspaces} workspaces, all routed through the shared runner).`);
}
