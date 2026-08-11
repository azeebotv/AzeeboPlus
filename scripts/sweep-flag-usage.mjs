#!/usr/bin/env node
/**
 * Flag-usage sweep: finds feature-flag string keys referenced in code
 * (`isEnabled('...')`, `getValue('...')`, `@FeatureFlag('...')`, registry
 * property literals, etc.) and reports any that are NOT registered in
 * `packages/feature-flags/src/registries.ts` and NOT part of a known
 * dynamically-built convention (`queue_process_*`, `events_consume_*`,
 * `universe.{name}.{feature}`).
 *
 * Intended to run after flag removal: a removed flag that is still referenced
 * somewhere shows up here so it can be cleaned up.
 *
 * Run: `node scripts/sweep-flag-usage.mjs`
 */

import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();

// 1. Collect all registered keys from registries.ts
const registriesSrc = readFileSync(
  path.join(root, 'packages/feature-flags/src/registries.ts'),
  'utf8'
);
const registered = new Set(
  [...registriesSrc.matchAll(/(?:[a-zA-Z0-9_]+):\s*'([a-z0-9_]+)'/g)].map((m) => m[1])
);
// 2. Collect every flag-key literal used across the repo
const SKIP_DIRS = new Set(['node_modules', 'dist', '.git', '.freebuff', 'coverage', 'build', '.next', '.expo', '.turbo']);
const SKIP_EXT = new Set(['.json', '.md', '.snap', '.yml', '.yaml', '.lock', '.db', '.sqlite', '.wasm', '.png', '.jpg', '.woff2', '.map']);

function walk(dir, out) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    if (SKIP_DIRS.has(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      walk(full, out);
    } else if (e.isFile() && !SKIP_EXT.has(path.extname(e.name))) {
      out.push(full);
    }
  }
  return out;
}

const files = walk(root, []).filter(
  (f) => !f.includes('registries.ts') && !f.includes('/spec') && !f.includes('.spec.') && !f.includes('.test.')
);

const used = new Map(); // key -> first file
for (const file of files) {
  const src = readFileSync(file, 'utf8');
  // Literal keys passed to flag APIs or decorators.
  const re =
    /(?:isEnabled|getValue|getFlag|isFlagEnabled|setFlag)\(\s*'([a-z0-9_]+)'|@FeatureFlag\(\s*'([a-z0-9_]+)'\)|consumerToggle\(\s*'([a-z0-9_]+)'\)/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    const key = m[1] || m[2] || m[3];
    if (key) {
      if (!used.has(key)) used.set(key, file);
    }
  }
  // queue_process_* and events_consume_* built from constants — verify the
  // base queue/event names are referenced by something, not the generated key.
}

// 3. Report usage not covered by a registered key or a dynamic convention.
const KNOWN_PREFIXES = ['queue_process_', 'events_consume_', 'universe.'];
const missing = [];
for (const [key, file] of used) {
  if (registered.has(key)) continue;
  if (KNOWN_PREFIXES.some((p) => key.startsWith(p))) continue;
  missing.push({ key, file });
}

if (missing.length > 0) {
  console.error(`Flag-usage sweep found ${missing.length} unregistered flag key(s):`);
  for (const { key, file } of missing.sort((a, b) => a.key.localeCompare(b.key))) {
    console.error(`  - '${key}' used in ${path.relative(root, file)}`);
  }
  process.exit(1);
}
console.log(`Flag-usage sweep OK (${registered.size} registered keys, ${used.size} usage sites checked).`);
