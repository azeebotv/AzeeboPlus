#!/usr/bin/env node
/**
 * Seed image host check — CLI entry point.
 *
 * All rule logic lives in scripts/lib/seed-image-hosts-core.mjs so it can be
 * unit-tested against fixture trees. This file only resolves the repo root,
 * prints problems, and sets the exit code.
 *
 * Rule: every host in scripts/seeders/seed-image-hosts.ts must be allowlisted
 * in apps/web/next.config.js images.remotePatterns, and no seeder may emit a
 * raw URL literal to an unregistered host — both drift shapes crash the web
 * app at runtime when the seeded data reaches next/image.
 *
 * Exit codes: 0 = green, 1 = problems found, 2 = check could not run.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkSeedImageHosts } from './lib/seed-image-hosts-core.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');

const problems = checkSeedImageHosts(root);

if (problems.some((p) => p.code === 'NO_MODULE' || p.code === 'NO_WEB_CONFIG' || p.code === 'MODULE_UNPARSEABLE' || p.code === 'WEB_CONFIG_UNPARSEABLE')) {
  for (const p of problems) {
    console.error(`✗ ${p.file}: ${p.message}`);
    console.error(`  fix: ${p.fix}`);
  }
  process.exit(2);
}

if (problems.length > 0) {
  const byCode = {};
  for (const p of problems) (byCode[p.code] ||= []).push(p);
  for (const [code, list] of Object.entries(byCode)) {
    console.error(`\n✗ ${code} (${list.length}):`);
    for (const p of list) {
      console.error(`  ${p.file}${p.line ? `:${p.line}` : ''}`);
      console.error(`    ${p.message}`);
      console.error(`    fix: ${p.fix}`);
    }
  }
  console.error(`\nEvery seeder media URL must be built via scripts/seeders/seed-image-hosts.ts`);
  console.error(`(SEED_IMAGE_HOSTS ↔ apps/web/next.config.js images.remotePatterns are kept in sync by this check).`);
  process.exit(1);
}

console.log('Seed image hosts OK (registered hosts allowlisted; no TS seeder bypass; every seed-data emission resolves against the web allowlist).');
