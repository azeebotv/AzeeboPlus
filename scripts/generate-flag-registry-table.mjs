#!/usr/bin/env node
/**
 * Generates the machine-checked per-service flag reference appendix.
 *
 * Reads the canonical registries (`packages/feature-flags/src/registries.ts`)
 * and rewrites the table between the markers in
 * `docs/feature-flags-implementation.md`. Run it after adding/renaming a flag;
 * CI (`check:flags:docs`) runs `--check` and fails if the docs are stale.
 *
 * Run:
 *   node scripts/generate-flag-registry-table.mjs          # write docs
 *   node scripts/generate-flag-registry-table.mjs --check  # fail if stale
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const registriesFile = path.join(root, 'packages/feature-flags/src/registries.ts');
const docsFile = path.join(root, 'docs/feature-flags-implementation.md');
const checkOnly = process.argv.includes('--check');

const START = '<!-- flag-registry-table:start -->';
const END = '<!-- flag-registry-table:end -->';

const src = readFileSync(registriesFile, 'utf8');

// Each registry is `export const {name}Flags = { ... } as const;` — comments
// inside the bodies are fine; the key regex only matches `prop: 'key'` lines.
const BLOCK_RE = /export const (\w+Flags)\s*=\s*\{([\s\S]*?)\n\} as const;/g;
const KEY_RE = /\b([a-zA-Z][\w]*):\s*'([^']+)'/g;

const registries = [];
let block;
while ((block = BLOCK_RE.exec(src)) !== null) {
  const name = block[1].replace(/Flags$/, '');
  const keys = [];
  let key;
  while ((key = KEY_RE.exec(block[2])) !== null) keys.push(key[2]);
  if (keys.length === 0) {
    console.error(`[flag-registry-table] registry "${name}" has no keys — aborting`);
    process.exit(1);
  }
  registries.push({ name, keys: [...new Set(keys)].sort() });
}
registries.sort((a, b) => a.name.localeCompare(b.name));

const totalKeys = registries.reduce((n, r) => n + r.keys.length, 0);
const duplicateKeys = new Map();
for (const r of registries) {
  for (const key of r.keys) duplicateKeys.set(key, (duplicateKeys.get(key) ?? 0) + 1);
}
const dupes = [...duplicateKeys.entries()].filter(([, n]) => n > 1);
if (dupes.length > 0) {
  console.error(
    `[flag-registry-table] duplicate flag keys across registries:\n  ${dupes
      .map(([k, n]) => `${k} (${n}x)`)
      .join('\n  ')}`
  );
  process.exit(1);
}

const rows = [];
for (const r of registries) {
  for (const key of r.keys) rows.push(`| ${r.name} | \`${key}\` |`);
}

const body = [
  '## Appendix A — Per-Service Flag Registry (machine-checked)',
  '',
  'Generated from `packages/feature-flags/src/registries.ts` by',
  '`scripts/generate-flag-registry-table.mjs` — **do not edit by hand**.',
  'After adding or renaming a flag, re-run the generator; CI (`check:flags:docs`)',
  'fails if this table is stale. Each domain is a registry consumed by one',
  'service (or client surface for `web` / `mobile` / `admin`).',
  '',
  `**${registries.length} domains · ${totalKeys} unique flag keys.**`,
  '',
  '| Domain | Flag key |',
  '| --- | --- |',
  ...rows,
  '',
].join('\n');

const generated = `${START}\n${body}\n${END}\n`;

const docs = readFileSync(docsFile, 'utf8');
const startIdx = docs.indexOf(START);
const endIdx = docs.indexOf(END);

if (checkOnly) {
  const current =
    startIdx !== -1 && endIdx !== -1
      ? docs.slice(startIdx, endIdx + END.length)
      : null;
  const fresh = generated.trimEnd();
  if (current === null || current.trimEnd() !== fresh) {
    console.error(
      `[flag-registry-table] docs appendix is STALE (${totalKeys} keys in registries). ` +
        `Run \`node scripts/generate-flag-registry-table.mjs\` to regenerate.`
    );
    process.exit(1);
  }
  console.log(
    `[flag-registry-table] docs appendix is fresh (${registries.length} domains, ${totalKeys} keys).`
  );
  process.exit(0);
}

if (startIdx === -1 || endIdx === -1) {
  // No markers yet — append the appendix at the end of the file.
  writeFileSync(docsFile, `${docs.trimEnd()}\n\n${generated}`);
  console.log(`[flag-registry-table] appended appendix (${registries.length} domains, ${totalKeys} keys).`);
} else {
  writeFileSync(docsFile, `${docs.slice(0, startIdx)}${generated}${docs.slice(endIdx + END.length)}`);
  console.log(`[flag-registry-table] regenerated appendix (${registries.length} domains, ${totalKeys} keys).`);
}
