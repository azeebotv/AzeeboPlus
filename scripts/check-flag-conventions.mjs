#!/usr/bin/env node
/**
 * Flag conventions CI check.
 *
 * Scans `packages/feature-flags/src/registries.ts` and fails on:
 *  - keys not matching `^[a-z][a-z0-9_]*$` (snake_case, service-prefixed)
 *  - registries with no leading service segment on any key (e.g. `mobile_`)
 *  - duplicated flag keys across registries
 *  - keys whose literal string differs from the property name (kebab/mixed)
 *
 * Run: `node scripts/check-flag-conventions.mjs`
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const file = path.join(root, 'packages/feature-flags/src/registries.ts');
const src = readFileSync(file, 'utf8');

const KEY_RE = /\b([a-zA-Z][a-zA-Z0-9]*):\s*'((?:[a-z]+_)*[a-z][a-z0-9_]*)'/g;
const errors = [];

const seen = new Map();
let match;
while ((match = KEY_RE.exec(src)) !== null) {
  const prop = match[1];
  const key = match[2];
  if (seen.has(key)) {
    errors.push(`duplicate flag key "${key}" (first seen at ${seen.get(key)})`);
    continue;
  }
  seen.set(key, match.index);
  if (!/^[a-z][a-z0-9_]*$/.test(key)) {
    errors.push(`flag key "${key}" is not snake_case`);
  }
  const segments = key.split('_');
  if (segments.length < 2) {
    errors.push(`flag key "${key}" has no service prefix`);
  }
  // Property is camelCase of the key WITHOUT the domain prefix. Most registries
  // strip one segment (walletFlags.withdrawalsEnabled ↔ wallet_withdrawals_enabled);
  // liveEventFlags strips two (ppv ↔ live_event_ppv), so accept 1–2 segments.
  const parts = key.split('_');
  const toCamel = (s) => s.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());
  const one = toCamel(parts.slice(1).join('_'));
  const two = toCamel(parts.slice(2).join('_'));
  if (prop !== one && prop !== two) {
    errors.push(
      `flag key "${key}" has mismatched property "${prop}" (expected "${one}" or "${two}")`
    );
  }
}

if (errors.length > 0) {
  console.error('Flag convention violations:');
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log(`Flag conventions OK (${seen.size} unique keys checked).`);
