#!/usr/bin/env node
// ============================================================================
// check-env-consistency.mjs — .env.example ↔ code ↔ env-validator gate
//
// Catches the "runs on my machine" class of failure before CI/deploy:
//
//   1. MISSING-REQUIRED (FAIL) — code reads an env var via
//      configService.getOrThrow('KEY') (missing key = boot crash) but the
//      service's .env.example does not document it. Following .env.example
//      verbatim produces a service that cannot boot.
//
//   2. MISSING-VALIDATOR-REQUIRED (FAIL) — packages/shared-types
//      env-validation.ts declares the key as required (no .default()) —
//      validateEnvironment() runs in every service main.ts, so a service
//      whose .env.example omits it can never boot. (Covers keys read
//      indirectly, e.g. DATABASE_URL via prisma env("DATABASE_URL").)
//
//   3. VALIDATOR-OVERREACH (FAIL) — the validator marks a key required
//      (no default) but nothing in services/ or packages/ reads it and it is
//      not injected by any deploy manifest — a rule that only breaks boots.
//
//   4. MISSING-SOFT (WARN) — code reads via configService.get('KEY') without
//      a code-level default and .env.example omits it (feature degrades
//      instead of crashing; still worth documenting).
//
//   5. STALE-EXAMPLE (WARN) — .env.example documents a key that no code,
//      prisma schema, or deploy manifest uses anymore.
//
// Exit 0 = no FAIL findings. Exit 1 = at least one FAIL.
//
// Usage:
//   node scripts/check-env-consistency.mjs                # all services
//   node scripts/check-env-consistency.mjs user-service   # subset (suffix match)
// ============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SERVICES_DIR = path.join(ROOT, 'services');
const PACKAGES_DIR = path.join(ROOT, 'packages');
const ENV_VALIDATOR_PATH = 'packages/shared-types/src/env-validation.ts';

// Runtime/CI plumbing keys — never reported.
const IGNORED_EXACT = new Set(['NODE_ENV', 'PORT', 'NODE_OPTIONS', 'FORCE_COLOR', 'NO_COLOR', 'TZ']);
const IGNORED_PREFIXES = ['npm_', 'NPQ_', 'PNPM_', 'NEXT_', 'CI_'];

const isIgnored = (key) =>
  IGNORED_EXACT.has(key) || IGNORED_PREFIXES.some((p) => key.startsWith(p));

// Keys documented in examples by convention even when this specific service
// doesn't read them (shared bootstrap/logging template).
const CONVENTIONAL_EXAMPLE_KEYS = new Set([
  'SERVICE_NAME', 'LOG_LEVEL', 'LOG_FORMAT', 'RATE_LIMIT_TTL', 'RATE_LIMIT_MAX',
]);

// ---------------------------------------------------------------------------
// Discovery
// ---------------------------------------------------------------------------
function discoverServices() {
  const services = [];
  if (!fs.existsSync(SERVICES_DIR)) return services;
  for (const domain of fs.readdirSync(SERVICES_DIR, { withFileTypes: true })) {
    if (!domain.isDirectory()) continue;
    for (const name of fs.readdirSync(path.join(SERVICES_DIR, domain.name), { withFileTypes: true })) {
      if (!name.isDirectory()) continue;
      const dir = path.join(SERVICES_DIR, domain.name, name.name);
      if (fs.existsSync(path.join(dir, 'package.json'))) {
        services.push({ name: name.name, dir });
      }
    }
  }
  return services.sort((a, b) => a.name.localeCompare(b.name));
}

function collectTsFiles(rootDirs, { includeSpecs = false } = {}) {
  const out = [];
  const SKIP = new Set(['node_modules', 'dist', 'coverage', 'prisma', '__mocks__']);
  for (const root of rootDirs) {
    const walk = (current) => {
      let entries;
      try {
        entries = fs.readdirSync(current, { withFileTypes: true });
      } catch {
        return;
      }
      for (const entry of entries) {
        if (SKIP.has(entry.name)) continue;
        const full = path.join(current, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (
          /\.ts$/.test(entry.name) &&
          !/\.d\.ts$/.test(entry.name) &&
          (includeSpecs || !/\.spec\.ts$/.test(entry.name))
        ) {
          out.push(full);
        }
      }
    };
    if (fs.existsSync(root)) walk(root);
  }
  return out;
}

// ---------------------------------------------------------------------------
// 1. .env.example parsing
// ---------------------------------------------------------------------------
function parseEnvExample(dir) {
  const file = path.join(dir, '.env.example');
  if (!fs.existsSync(file)) return null;
  const keys = new Map(); // key -> value
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    keys.set(trimmed.slice(0, eq).trim(), trimmed.slice(eq + 1).trim());
  }
  return { file, keys };
}

// ---------------------------------------------------------------------------
// 2. Code reads — strict (getOrThrow) vs soft (get) vs process.env (soft)
// ---------------------------------------------------------------------------
const GET_OR_THROW_RE = /\.getOrThrow(?:<[^>]*>)?\(\s*['"]([A-Z][A-Z0-9_]{2,})['"]/g;
const GET_RE = /\.get(?:<[^>]*>)?\(\s*['"]([A-Z][A-Z0-9_]{2,})['"]\s*(?:,)/g;
const PROCESS_ENV_RE = /process\.env(?:\.([A-Z][A-Z0-9_]{2,})|\[\s*['"]([A-Z][A-Z0-9_]{2,})['"]\s*\])/g;
const PRISMA_ENV_RE = /env\(\s*['"]([A-Z][A-Z0-9_]{2,})['"]\s*\)/g;
// Declarative indirection (api-gateway route table, media-service upload
// pipeline): `envKey: 'SOME_SERVICE_URL'` — the value is read dynamically via
// configService.get(record.envKey), which the literal-read regexes cannot see.
const ENV_KEY_DECL_RE = /\benvKey:\s*['"]([A-Z][A-Z0-9_]{2,})['"]/g;

function findEnvReads(dir) {
  const strict = new Map(); // key -> location
  const soft = new Map();
  const anyRead = new Set();

  const note = (map, key, rel, idx, content) => {
    if (isIgnored(key)) return;
    if (!map.has(key)) {
      const line = content.slice(0, idx).split('\n').length;
      map.set(key, `${rel}:${line}`);
    }
    anyRead.add(key);
  };

  for (const file of collectTsFiles([path.join(dir, 'src')])) {
    const content = fs.readFileSync(file, 'utf8');
    const rel = path.relative(dir, file);
    for (const m of content.matchAll(GET_OR_THROW_RE)) note(strict, m[1], rel, m.index, content);
    for (const m of content.matchAll(GET_RE)) note(soft, m[1], rel, m.index, content);
    for (const m of content.matchAll(PROCESS_ENV_RE)) note(soft, m[1] ?? m[2], rel, m.index, content);
    for (const m of content.matchAll(ENV_KEY_DECL_RE)) note(soft, m[1], rel, m.index, content);
  }

  // prisma schema env("KEY") counts as a strict read (Prisma errors without it)
  const schema = path.join(dir, 'prisma', 'schema.prisma');
  if (fs.existsSync(schema)) {
    const content = fs.readFileSync(schema, 'utf8');
    for (const m of content.matchAll(PRISMA_ENV_RE)) note(strict, m[1], 'prisma/schema.prisma', m.index, content);
  }

  return { strict, soft, anyRead };
}

// ---------------------------------------------------------------------------
// 3. Shared zod validator — which keys are REQUIRED (no .default())?
//    (regex parse; z.object is non-strict, so unknown keys never throw)
// ---------------------------------------------------------------------------
function parseEnvValidator() {
  const file = path.join(ROOT, ENV_VALIDATOR_PATH);
  const required = new Set();
  const declared = new Set();
  if (!fs.existsSync(file)) return { required, declared };
  const content = fs.readFileSync(file, 'utf8');
  const re = /^\s*([A-Z][A-Z0-9_]{2,})\s*:\s*z\.([\s\S]{0,200}?)\s*,\s*$/gm;
  for (const m of content.matchAll(re)) {
    declared.add(m[1]);
    if (!/\.default\(/.test(m[2]) && !/\.optional\(/.test(m[2])) required.add(m[1]);
  }
  return { required, declared };
}

// ---------------------------------------------------------------------------
// 4. Deploy manifests — keys injected by ops tooling (docker/CI/terraform)
// ---------------------------------------------------------------------------
function collectDeployedEnvKeys() {
  const keys = new Set();
  const roots = [ROOT, path.join(ROOT, '.github')];
  for (const root of roots) {
    let entries;
    try {
      entries = fs.readdirSync(root, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const e of entries) {
      const full = path.join(root, e.name);
      if (e.isFile() && /^(docker-compose.*\.yml|Dockerfile.*|workflows)$/.test(e.name) === false && !/docker-compose.*\.yml|Dockerfile.*/.test(e.name)) continue;
      if (e.name === 'workflows') {
        for (const wf of fs.readdirSync(full)) {
          if (wf.endsWith('.yml')) {
            const content = fs.readFileSync(path.join(full, wf), 'utf8');
            for (const m of content.matchAll(/^\s*([A-Z][A-Z0-9_]{2,}):\s/gm)) keys.add(m[1]);
          }
        }
        continue;
      }
      if (!e.isFile()) continue;
      const content = fs.readFileSync(full, 'utf8');
      for (const m of content.matchAll(/^\s*-?\s*([A-Z][A-Z0-9_]{2,})\s*[=:]/gm)) keys.add(m[1]);
    }
  }
  return keys;
}

// Readers across all services + shared packages (for the overreach check).
function collectGlobalReaders() {
  const readers = new Set();
  const note = (key) => {
    if (!isIgnored(key)) readers.add(key);
  };
  for (const file of collectTsFiles([SERVICES_DIR, PACKAGES_DIR], { includeSpecs: false })) {
    const content = fs.readFileSync(file, 'utf8');
    for (const m of content.matchAll(GET_OR_THROW_RE)) note(m[1]);
    for (const m of content.matchAll(GET_RE)) note(m[1]);
    for (const m of content.matchAll(PROCESS_ENV_RE)) note(m[1] ?? m[2]);
    for (const m of content.matchAll(PRISMA_ENV_RE)) note(m[1]);
    for (const m of content.matchAll(ENV_KEY_DECL_RE)) note(m[1]);
  }
  for (const schema of fs.readdirSync(SERVICES_DIR, { withFileTypes: true }).flatMap((d) => {
    const domainDir = path.join(SERVICES_DIR, d.name);
    return d.isDirectory()
      ? fs.readdirSync(domainDir, { withFileTypes: true }).filter((s) => s.isDirectory()).map((s) => path.join(domainDir, s.name, 'prisma', 'schema.prisma'))
      : [];
  })) {
    if (!fs.existsSync(schema)) continue;
    for (const m of fs.readFileSync(schema, 'utf8').matchAll(PRISMA_ENV_RE)) note(m[1]);
  }
  return readers;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
const { required: validatorRequired } = parseEnvValidator();
const deployedKeys = collectDeployedEnvKeys();
const globalReaders = collectGlobalReaders();
const all = discoverServices();
const targets = args.length ? all.filter((s) => args.some((f) => s.name === f || s.name.endsWith(f))) : all;
if (!targets.length) {
  console.error(`No matching services for: ${args.join(', ')}`);
  process.exit(1);
}

console.log(`Checking env consistency for ${targets.length} service(s)`);
console.log(`Validator: ${ENV_VALIDATOR_PATH} — required keys: ${[...validatorRequired].sort().join(', ') || '(none)'}\n`);

let failures = 0;
const report = [];

for (const { name, dir } of targets) {
  const example = parseEnvExample(dir);
  const { strict, soft } = findEnvReads(dir);
  const findings = [];

  for (const [key, loc] of strict) {
    if (!example || !example.keys.has(key)) {
      findings.push({
        kind: 'MISSING-REQUIRED',
        key,
        detail: `getOrThrow at ${loc} — boot crashes without it, but .env.example omits it`,
        blocking: true,
      });
    }
  }
  for (const [key, loc] of soft) {
    if ((!example || !example.keys.has(key)) && strict.has(key) === false) {
      findings.push({
        kind: 'MISSING-SOFT',
        key,
        detail: `optional read at ${loc} not documented in .env.example`,
        blocking: false,
      });
    }
  }
  if (example) {
    for (const key of validatorRequired) {
      if (isIgnored(key)) continue;
      if (!example.keys.has(key) && !strict.has(key)) {
        findings.push({
          kind: 'MISSING-VALIDATOR-REQUIRED',
          key,
          detail: `validator requires it (no default) and validateEnvironment runs at boot; document it in .env.example`,
          blocking: true,
        });
      }
    }
    for (const key of example.keys.keys()) {
      if (strict.has(key) || soft.has(key) || deployedKeys.has(key) || CONVENTIONAL_EXAMPLE_KEYS.has(key)) continue;
      findings.push({
        kind: 'STALE-EXAMPLE',
        key,
        detail: 'documented in .env.example but nothing in this service reads it',
        blocking: false,
      });
    }
  }

  const hard = findings.filter((f) => f.blocking);
  failures += hard.length;
  const icon = hard.length ? '🔴' : findings.length ? '🟠' : '✅';
  const status = hard.length ? 'FAIL' : findings.length ? 'WARN' : 'CLEAN';
  console.log(`  ${name.padEnd(28)} ${icon} ${status}${findings.length ? ` (${findings.length})` : ''}`);
  for (const f of findings) {
    console.log(`      ${f.blocking ? '✗' : '⚠'} ${f.kind}: ${f.key} — ${f.detail}`);
  }
  report.push({ name, status });
}

// Validator overreach: required keys nobody reads and nothing deploys.
const overreach = [...validatorRequired].filter(
  (key) => !isIgnored(key) && !globalReaders.has(key) && !deployedKeys.has(key)
);
if (overreach.length) {
  failures += overreach.length;
  console.log(`\n  ✗ VALIDATOR-OVERREACH — required in ${ENV_VALIDATOR_PATH} but read by nothing:`);
  for (const key of overreach) console.log(`      ✗ ${key}`);
}

console.log(
  `\nSummary: ${targets.length} checked · ${report.filter((r) => r.status === 'CLEAN').length} clean · ` +
    `${report.filter((r) => r.status === 'WARN').length} warn · ${report.filter((r) => r.status === 'FAIL').length} fail` +
    (overreach.length ? ` · ${overreach.length} validator overreach` : '')
);

if (failures > 0) {
  console.log(`\n${failures} blocking finding(s). Add the keys to the service's .env.example (or fix the code/validator).`);
  process.exit(1);
}
console.log('✅ .env.example files cover every boot-required key; validator rules match real reads');
