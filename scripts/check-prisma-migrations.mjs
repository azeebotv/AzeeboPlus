#!/usr/bin/env node
// ============================================================================
// check-prisma-migrations.mjs — migrations ↔ schema.prisma drift gate
//
// For every service with prisma/schema.prisma, replays the service's
// prisma/migrations folder into a throwaway shadow database (exactly what
// `prisma migrate deploy` does on a fresh environment) and diffs the result
// against prisma/schema.prisma.
//
// Fails when:
//   DRIFTED   — replayed migrations produce a schema different from
//               schema.prisma (missing/hand-edited migrations)
//   BROKEN    — migrations cannot replay from empty (failed statement,
//               destructive op with no guard, dependency-order bug)
//   BASELINE  — `--update-baseline` was passed; writes the missing drift
//               migration and exits 0 (explicit, opt-in escape hatch)
//
// Exit codes: 0 = clean (or baseline updated), 1 = drift/broken found.
//
// Usage:
//   node scripts/check-prisma-migrations.mjs                     # check all
//   node scripts/check-prisma-migrations.mjs core/user-service   # check one
//   node scripts/check-prisma-migrations.mjs --update-baseline   # escape hatch
//   SHADOW_DB_URL=postgres://... node scripts/...                # override DB
//
// Requires a reachable PostgreSQL server (no database pre-created; the script
// creates and drops one throwaway database per service).
//
// The logic lives in scripts/lib/prisma-migrations-core.mjs so unit tests can
// exercise it against fixture trees; this CLI only wires defaults from
// process.env / argv and maps the result to an exit code.
// ============================================================================

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runMigrationsGate, writeReport } from './lib/prisma-migrations-core.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const args = process.argv.slice(2);
const updateBaseline = args.includes('--update-baseline');
const filter = args.filter((a) => !a.startsWith('--'));

const outcome = runMigrationsGate(ROOT, {
  filter,
  updateBaseline,
  shadowDbUrl: process.env.SHADOW_DB_URL
    ?? 'postgresql://azeebo:azeebo_dev_2024@localhost:5432/postgres',
});

if (outcome.status === 'NO-MATCH') {
  console.error(`No matching services for: ${filter.join(', ')}`);
  console.error(`Known services:\n  ${outcome.all.join('\n  ')}`);
  process.exit(1);
}
// Machine-readable report for tooling (PR comment bot, step summaries).
writeReport(outcome, ROOT);
process.exit(outcome.exitCode);
