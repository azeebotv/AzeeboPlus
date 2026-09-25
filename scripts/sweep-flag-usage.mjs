#!/usr/bin/env node
/**
 * Flag-usage sweep: finds feature-flag keys referenced in code — both as
 * string literals (`isEnabled('...')`, `getValue('...')`, `@FeatureFlag('...')`)
 * and as typed constant references (`paymentFlags.providerPaystack`,
 * `searchFlags.fuzzyTrigramWeight`, `queueFlags.dlqRetry`,
 * `WEB_FLAG_KEYS.maintenanceMode`, whole-registry `Object.values(xFlags)` /
 * `...xFlags` spreads, …) — and reports BOTH directions of drift:
 *
 *   - used-but-unregistered: a referenced key (or a `Registry.prop` whose
 *     property no longer exists) that is not registered in
 *     `packages/feature-flags/src/registries.ts`
 *   - registered-but-unused: a registered key that no code references
 *
 * Dynamic-key exemptions (`queue_process_*`, `events_consume_*`, `universe.*`)
 * are preserved for the used-but-unregistered direction (those keys are built
 * at runtime, never written as full literals).
 *
 * Run: `node scripts/sweep-flag-usage.mjs`
 */

import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();

// ── 1. Parse registries.ts into constName → { prop → key } + flat key set ──
const registriesSrc = readFileSync(
  path.join(root, 'packages/feature-flags/src/registries.ts'),
  'utf8'
);

/** @type {Record<string, Record<string, string>>} */
const registryConsts = {};
const registered = new Set();

const CONST_BLOCK_RE = /export const ([a-zA-Z][a-zA-Z0-9]*) = \{([\s\S]*?)\} as const;/g;
let cm;
while ((cm = CONST_BLOCK_RE.exec(registriesSrc)) !== null) {
  // `allFlagRegistries` is the aggregate listing, not a flag const.
  if (cm[1] === 'allFlagRegistries') continue;
  const props = {};
  const PROP_RE = /([a-zA-Z][a-zA-Z0-9]*):\s*'([a-z0-9_]+)'/g;
  let pm;
  while ((pm = PROP_RE.exec(cm[2])) !== null) {
    props[pm[1]] = pm[2];
    registered.add(pm[2]);
  }
  registryConsts[cm[1]] = props;
}

// ── 2. Walk the repo for source files ──────────────────────────────────────
const SKIP_DIRS = new Set([
  'node_modules',
  'dist',
  '.git',
  '.freebuff',
  'coverage',
  'build',
  '.next',
  '.expo',
  '.turbo',
  'generated',
  // terraform init drops multi-hundred-MB provider binaries here; they are
  // gitignored and not code, and reading one blows past Node's string limit
  '.terraform',
]);
const SKIP_EXT = new Set([
  '.json',
  '.md',
  '.snap',
  '.yml',
  '.yaml',
  '.lock',
  '.db',
  '.sqlite',
  '.wasm',
  '.png',
  '.jpg',
  '.woff2',
  '.map',
]);
const CODE_EXT = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.mts', '.cts']);

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

const allFiles = walk(root, []).filter((f) => !f.includes('registries.ts'));
const isSpec = (f) => f.includes('.spec.') || f.includes('.test.') || f.includes('/spec/');
const prodFiles = allFiles.filter((f) => !isSpec(f));

// ── 3. Detect frontend aliases: `export const ALIAS = someRegistryConst;` ──
for (const file of allFiles) {
  const src = readFileSync(file, 'utf8');
  const ALIAS_RE = /export const ([A-Za-z0-9_]+)\s*=\s*([A-Za-z0-9_]+)\s*;/g;
  let m;
  while ((m = ALIAS_RE.exec(src)) !== null) {
    if (m[2] in registryConsts) {
      // Share the canonical prop map so `WEB_FLAG_KEYS.maintenanceMode`
      // resolves to `web_maintenance_mode`.
      registryConsts[m[1]] = registryConsts[m[2]];
    }
  }
}

// ── 4. Scan for references ─────────────────────────────────────────────────
const usedKeys = new Set();
/** Literal keys referenced in PRODUCTION (non-spec) files — feeds the
 *  used-but-unregistered direction only (spec fixtures use arbitrary keys). */
const prodLiterals = new Map(); // key -> first referencing file
/** Typed references whose property no longer exists in the registry. */
const missingProps = []; // { ref, file }

/** Literal keys passed to flag APIs/decorators (same surface as before). */
const LITERAL_RE =
  /(?:isEnabled|getValue|getFlag|isFlagEnabled|setFlag)\(\s*'([a-z0-9_]+)'|@FeatureFlag\(\s*'([a-z0-9_]+)'\)|consumerToggle\(\s*'([a-z0-9_]+)'\)/g;

/** Whole-const consumption: Object.values/entries/keys(xFlags) or `...xFlags`. */
const WHOLE_CONST_RE = /Object\.(?:values|entries|keys)\(\s*([a-zA-Z][a-zA-Z0-9]*)\)|\.\.\.([a-zA-Z][a-zA-Z0-9]*)\b/g;

function recordUsed(key) {
  usedKeys.add(key);
}

for (const file of allFiles) {
  const src = readFileSync(file, 'utf8');
  const isProd = !isSpec(file);

  // Literal keys (all files, so test-only flags still count as referenced;
  // only production files feed the used-but-unregistered report).
  LITERAL_RE.lastIndex = 0;
  let lm;
  while ((lm = LITERAL_RE.exec(src)) !== null) {
    const key = lm[1] || lm[2] || lm[3];
    if (!key) continue;
    recordUsed(key);
    if (isProd && !prodLiterals.has(key)) prodLiterals.set(key, file);
  }

  // Whole-const consumption (all files).
  WHOLE_CONST_RE.lastIndex = 0;
  let wm;
  while ((wm = WHOLE_CONST_RE.exec(src)) !== null) {
    const constName = wm[1] || wm[2];
    if (constName && constName in registryConsts) {
      for (const key of Object.values(registryConsts[constName])) recordUsed(key);
    }
  }

  // Typed `Const.prop` references — only in code files (avoids non-code text).
  if (CODE_EXT.has(path.extname(file))) {
    for (const constName of Object.keys(registryConsts)) {
      const REF_RE = new RegExp(`\\b${constName}\\.([a-zA-Z0-9_]+)`, 'g');
      let rm;
      while ((rm = REF_RE.exec(src)) !== null) {
        const key = registryConsts[constName][rm[1]];
        if (key) {
          recordUsed(key);
        } else if (isProd) {
          // A removed/renamed property still referenced in production source.
          missingProps.push({ ref: `${constName}.${rm[1]}`, file });
        }
      }
    }
  }
}

// ── 5. Report both directions ──────────────────────────────────────────────
const KNOWN_PREFIXES = ['queue_process_', 'events_consume_', 'universe.'];
const problems = [];

// used-but-unregistered: literal keys not registered and not dynamically built.
for (const [key, file] of prodLiterals) {
  if (registered.has(key)) continue;
  if (KNOWN_PREFIXES.some((p) => key.startsWith(p))) continue;
  problems.push(`'${key}' used in ${path.relative(root, file)} is not a registered flag key`);
}
for (const { ref, file } of missingProps) {
  problems.push(
    `${ref} referenced in ${path.relative(root, file)} — property no longer exists in the registry`
  );
}

// registered-but-unused: registered keys with no reference anywhere.
const unused = [...registered].filter((key) => !usedKeys.has(key)).sort();
for (const key of unused) {
  problems.push(`'${key}' is registered but never referenced (dead flag)`);
}

if (problems.length > 0) {
  console.error(`Flag-usage sweep found ${problems.length} issue(s):`);
  for (const p of problems.sort((a, b) => a.localeCompare(b))) console.error(`  - ${p}`);
  process.exit(1);
}

console.log(
  `Flag-usage sweep OK (${registered.size} registered keys, ${usedKeys.size} referenced).`
);
