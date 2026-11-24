#!/usr/bin/env node
/**
 * Prisma unique-key lookup CI check — CLI entry point.
 *
 * All rule logic lives in `scripts/lib/prisma-find-first-core.mjs` so it can be
 * unit-tested against fixture trees (see scripts/__tests__). This file only
 * resolves the repo root, prints violations, and sets the exit code.
 *
 * Rule: a `findFirst`/`findFirstOrThrow`/`findMany` whose `where` filters on
 * exactly the field(s) of a `@id`/`@unique`/`@@unique` constraint should be
 * `findUnique`.
 *
 * Run: `node scripts/check-prisma-find-first.mjs`
 *
 * Optional `--root <dir>` overrides the repo root (used by the unit tests).
 */

import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { runPrismaFindFirstChecks } from './lib/prisma-find-first-core.mjs';

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

const { errors, modelCount, constraintCount, fileCount } = runPrismaFindFirstChecks(root);

if (errors.length > 0) {
  console.error('Prisma unique-key lookup violations (use findUnique):');
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log(
  `Prisma findFirst/findMany check OK (${modelCount} models, ${constraintCount} unique finders, ` +
    `${fileCount} files scanned).`
);
