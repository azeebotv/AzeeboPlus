#!/usr/bin/env node
/**
 * Swagger/OpenAPI consistency check.
 *
 * Verifies every service with a NestJS main.ts:
 *  - sets up Swagger docs (SwaggerModule.setup) so the OpenAPI spec exists at /docs
 *  - declares an OpenAPI version in its DocumentBuilder config (spec consistency)
 *
 * Note: API versioning is owned by the api-gateway (routes /v1/...); services
 * don't call setGlobalPrefix themselves.
 *
 * Run: `node scripts/check-swagger-consistency.mjs`
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();

/** Recursive glob for service src/main.ts files (Node-20 compatible — no globSync). */
function findMains(dir) {
  const out = [];
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    if (e.name === 'node_modules' || e.name === 'dist' || e.name === '.git') continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      out.push(...findMains(full));
    } else if (e.name === 'main.ts' && full.includes(`${path.sep}src${path.sep}`)) {
      out.push(full);
    }
  }
  return out;
}

const mains = findMains(path.join(root, 'services')).map((f) => path.relative(root, f));

const errors = [];
let checked = 0;

for (const rel of mains) {
  const abs = path.join(root, rel);
  const src = readFileSync(abs, 'utf8');
  const service = rel.split('/')[1];
  checked++;

  if (!src.includes('SwaggerModule.setup')) {
    errors.push(`${service}: no SwaggerModule.setup in main.ts`);
  }
  if (!src.includes('SwaggerModule.createDocument')) {
    errors.push(`${service}: no SwaggerModule.createDocument in main.ts`);
  }
  if (!src.includes('.setVersion(')) {
    errors.push(`${service}: DocumentBuilder has no setVersion(...) — OpenAPI spec version missing`);
  }
}

if (errors.length > 0) {
  console.error('Swagger consistency violations:');
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log(`Swagger consistency OK (${checked} services checked).`);
