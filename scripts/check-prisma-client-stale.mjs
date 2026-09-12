#!/usr/bin/env node
/**
 * Stale-Prisma-client check — CLI entry point.
 *
 * All rule logic lives in `scripts/lib/prisma-client-stale-core.mjs` so it can
 * be unit-tested against fixture trees (see
 * scripts/__tests__/prisma-client-stale.test.mjs). This file only resolves the
 * repo root, prints a per-workspace report, and sets the exit code.
 *
 * Rule: the schema copy embedded in each generated Prisma client
 * (`<output>/schema.prisma`, or `node_modules/.prisma/client/schema.prisma`
 * for the default location) must match the canonical
 * `<ws>/prisma/schema.prisma` token-for-token. A mismatch means the client on
 * disk was generated from an older schema — typecheck/tests would silently
 * run against the old types. The comparison ignores whitespace and comments,
 * so Prisma's formatter (which re-aligns columns when copying the schema)
 * never triggers a false positive.
 *
 * Fails when a generated client is STALE. Also fails when a custom-output
 * client is MISSING entirely (the workspace should be generatable — a missing
 * client breaks builds and is a generation failure, not a freshness gap).
 * Workspaces that generate to the default location are reported UNVERIFIED
 * when never generated (expected on a fresh clone) without failing.
 *
 * Run: `node scripts/check-prisma-client-stale.mjs`
 *
 * Optional `--root <dir>` overrides the repo root (used by the unit tests).
 */

import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { runStaleClientChecks, STATUSES } from './lib/prisma-client-stale-core.mjs';

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

const { results, stale, missing, unverified } = runStaleClientChecks(root);

if (results.length === 0) {
  console.error('No prisma/schema.prisma found — nothing to check.');
  process.exit(2);
}

const ICONS = {
  [STATUSES.FRESH]: '✓',
  [STATUSES.STALE]: '✗',
  [STATUSES.MISSING]: '✗',
  [STATUSES.UNVERIFIED]: '?',
};

for (const r of results) {
  const icon = ICONS[r.status] ?? '·';
  const detail = r.detail ? ` — ${r.detail}` : '';
  console.log(`  ${icon} ${r.status.padEnd(10)} ${r.workspace}${detail}`);
}

if (stale.length > 0) {
  console.error(`\nSTALE generated Prisma client(s) — schema changed since generate: ${stale.join(', ')}`);
  console.error('Run: pnpm run prisma:generate');
}

if (missing.length > 0) {
  console.error(`\nMISSING generated Prisma client(s): ${missing.join(', ')}`);
  console.error('The client dir exists in the schema output but has no schema copy — run: pnpm run prisma:generate');
}

if (stale.length > 0 || missing.length > 0) {
  process.exit(1);
}

if (unverified.length > 0) {
  console.log(`\nPrisma client freshness OK (${results.length - unverified.length}/${results.length} workspaces verified; ${unverified.length} unverified: ${unverified.join(', ')})`);
} else {
  console.log(`\nPrisma client freshness OK (${results.length}/${results.length} workspaces verified).`);
}
