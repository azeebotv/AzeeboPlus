#!/usr/bin/env node
// ============================================================================
// check-deployed-schema.mjs — `prisma migrate deploy` + literal drift gate
//
// The CI gate in check-prisma-migrations.mjs replays migrations with
// `prisma migrate diff --from-migrations` — a SHAPE check of the migration
// folder. It cannot see drift introduced at the ledger level:
//
//   • a failed migration RESOLVED with `migrate resolve --applied` whose SQL
//     never actually ran (the deployed DB then misses those statements), or
//     marked `rolled-back` while its statements remain in the folder;
//   • migration files edited after they were applied to some environment.
//
// This gate runs the OTHER direction — it does exactly what a fresh deploy
// does, then diffs the deployed database against schema.prisma:
//
//   1. `prisma migrate deploy` into a throwaway database
//   2. `prisma migrate diff --from-url <deployed> --to-schema-datamodel schema`
//
// ANY diff statement = DRIFTED (exit 1). There is no classification and no
// advisory mode: a clean migration chain deploys into the exact schema shape,
// so the diff must be empty. This is the literal "schema lock".
//
// Exit codes: 0 = all services deploy cleanly and diff empty
//             1 = DRIFTED (deployed DB ≠ schema), BROKEN (deploy failed),
//                 or ERROR (diff could not run)
//
// Usage:
//   node scripts/check-deployed-schema.mjs                    # all services
//   node scripts/check-deployed-schema.mjs user-service       # one service
//   SHADOW_DB_URL=postgres://... node scripts/...             # override host
//
// Requires a reachable PostgreSQL server; creates and drops one throwaway
// database per service.
//
// The logic lives in scripts/lib/prisma-deployed-schema-core.mjs so unit
// tests can exercise it against fixture trees; this CLI only wires defaults
// from process.env / argv and maps the result to an exit code.
// ============================================================================

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runDeployedSchemaGate, writeReport } from './lib/prisma-deployed-schema-core.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const args = process.argv.slice(2);
const filter = args.filter((a) => !a.startsWith('--'));

const outcome = runDeployedSchemaGate(ROOT, {
  filter,
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
