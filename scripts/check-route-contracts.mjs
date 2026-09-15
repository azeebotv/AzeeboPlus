#!/usr/bin/env node
/**
 * Route-contract check: extracts API calls from client code and verifies they
 * match routes defined in the gateway's SERVICE_CONFIGS.
 *
 * Two passes:
 *   1. Client → gateway: every /api/v1/{service}/... call in client code must
 *      match a gateway endpoint, else it 404s at runtime (exit 1).
 *   2. Gateway → client (dead routes): gateway endpoints no client code calls
 *      anymore are reported (advisory; exit unaffected).
 *
 * Run: node scripts/check-route-contracts.mjs
 *
 * Exit 0 = all client calls match a gateway route.
 * Exit 1 = mismatches found (details printed).
 */

import { readFileSync, readdirSync, statSync, existsSync, writeFileSync } from 'node:fs';
import { join, relative, extname } from 'node:path';

// Ratchet baseline: client calls known to have no SERVICE_CONFIGS entry (and, in
// some cases, no backend route at all — real 404s tracked for repair). The list
// may only shrink; a NEW unmatched call fails CI even though old ones are
// accepted. Regenerate with --update after fixing entries.
const BASELINE_PATH = join(process.cwd(), 'scripts/route-contracts-baseline.json');
const UPDATE_MODE = process.argv.includes('--update');

function loadBaseline() {
  try {
    const parsed = JSON.parse(readFileSync(BASELINE_PATH, 'utf8'));
    return new Set(parsed.unmatchedClientCalls ?? []);
  } catch {
    return new Set();
  }
}

// ── 1. Collect all client API calls ──────────────────────────────────────

const CLIENT_DIRS = [
  'apps/web/src',
  'apps/mobile/src',
  'apps/mobile/app',
  'apps/admin/client/src',
  'apps/creator/client/src',
];

const CLIENT_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx']);

/**
 * Matches `/api/v1/{service}/{path}` string literals and template literals:
 * - '/api/v1/payments/health'
 * - `/api/v1/creators/content/${id}`
 * - '/api/v1/admin/users?role=x' and `/api/v1/...?genre=${slug}` (query
 *   strings are kept in the capture, then stripped by normalizeCallPath)
 * The call-site wrapper (api.get/fetch/request/...) doesn't matter — the
 * path shape is the contract.
 */
const API_CALL_RE = /['"`]\/api\/v1\/([a-z][a-z0-9_-]*)(\/[a-zA-Z0-9/_.${}:=?&()-]*)?['"`]/g;

/**
 * Normalize a raw captured path to the contract form:
 * - strip query string (not part of the route)
 * - template expressions (${...}) and :params → :param
 * - trailing slash dropped
 */
function normalizeCallPath(rawPath) {
  let path = rawPath;
  // A template expression NOT preceded by '/' is appended to a path segment
  // directly — in practice a query string built by hand (`/x${qs}`), not a
  // path param. Drop it and everything after; keep the segment itself.
  path = path.replace(/([^/])\$\{[^}]*\}.*/, '$1');
  // Complete expressions (may contain '?' etc. inside the braces) → :param.
  path = path.replace(/\$\{[^}]*\}/g, ':param');
  // Unterminated expression (capture was cut mid-template, e.g. by a char
  // the regex class doesn't span) → :param, swallowing any truncated tail.
  path = path.replace(/\$\{[^}]*$/, ':param');
  // Plain query strings (raw or trailing template) are not part of the route.
  path = path.split('?')[0];
  path = path.replace(/:[a-zA-Z]+/g, ':param');
  if (path.length > 1) path = path.replace(/\/+$/, '');
  return path || '/';
}

// `service:path` with ':' inside paths is ambiguous to split; use the last
// index — service names can't contain ':' so this is safe.
function callKey(service, path) {
  return `${service}:${path}`;
}

function splitCallKey(key) {
  const idx = key.indexOf(':');
  return [key.slice(0, idx), key.slice(idx + 1)];
}

function scanFile(filePath) {
  const content = readFileSync(filePath, 'utf8');
  const calls = new Set();
  let match;
  while ((match = API_CALL_RE.exec(content)) !== null) {
    const service = match[1];
    const path = normalizeCallPath(match[2] || '/');
    calls.add(callKey(service, path));
  }
  return calls;
}

function scanDirectory(dir) {
  const calls = new Set();
  try {
    for (const entry of readdirSync(dir)) {
      const fullPath = join(dir, entry);
      try {
        const stat = statSync(fullPath);
        if (stat.isDirectory()) {
          // Skip node_modules, dist, .next, __tests__
          if (['node_modules', 'dist', '.next', '__tests__'].includes(entry)) continue;
          for (const call of scanDirectory(fullPath)) calls.add(call);
        } else if (CLIENT_EXTENSIONS.has(extname(entry))) {
          for (const call of scanFile(fullPath)) calls.add(call);
        }
      } catch {
        // Skip inaccessible files
      }
    }
  } catch {
    // Skip inaccessible directories
  }
  return calls;
}

// ── 2. Parse gateway SERVICE_CONFIGS ─────────────────────────────────────

function parseServiceConfigs() {
  const configPath = join(
    process.cwd(),
    'services/gateway/api-gateway/src/modules/proxy/proxy.controller.ts'
  );
  const content = readFileSync(configPath, 'utf8');

  const serviceEndpoints = new Map();
  const serviceConfigsMatch = content.match(/export const SERVICE_CONFIGS[^=]*=\s*\[([\s\S]*?)\];/);
  if (!serviceConfigsMatch) return serviceEndpoints;

  const arrayContent = serviceConfigsMatch[1];
  const serviceBlocks = arrayContent.split(/\n  \{/);

  for (let i = 1; i < serviceBlocks.length; i++) {
    const block = serviceBlocks[i];
    const pathMatch = block.match(/path:\s*'([^']+)'/);
    if (!pathMatch) continue;
    const servicePath = pathMatch[1].replace(/^\//, '');
    if (!serviceEndpoints.has(servicePath)) serviceEndpoints.set(servicePath, []);

    const endpointsMatch = block.match(/endpoints:\s*\[([\s\S]*?)\]/);
    if (!endpointsMatch) continue;

    const endpointsContent = endpointsMatch[1];
    const endpointRe = /path:\s*'([^']+)'/g;
    let endpointMatch;
    while ((endpointMatch = endpointRe.exec(endpointsContent)) !== null) {
      serviceEndpoints.get(servicePath).push(endpointMatch[1]);
    }
  }

  return serviceEndpoints;
}

// ── 3. Compare and report ────────────────────────────────────────────────

function normalizePath(path) {
  return path
    .replace(/\/+/g, '/') // collapse double slashes
    .replace(/\/$/, '') || '/';
}

function pathMatches(pattern, actual) {
  const pNorm = normalizePath(pattern);
  const aNorm = normalizePath(actual);
  if (pNorm === aNorm) return true;

  const pSegs = pNorm.split('/').filter(Boolean);
  const aSegs = aNorm.split('/').filter(Boolean);

  if (pSegs.length !== aSegs.length) return false;

  for (let i = 0; i < pSegs.length; i++) {
    const ps = pSegs[i];
    const as = aSegs[i];
    if (ps.startsWith(':') || ps.startsWith('{') || as.startsWith(':') || as.startsWith('{')) {
      continue;
    }
    if (ps !== as) return false;
  }
  return true;
}

function matchRoute(service, path, serviceEndpoints) {
  const endpoints = serviceEndpoints.get(service);
  if (!endpoints) return false;
  for (const ep of endpoints) {
    if (pathMatches(ep, path)) return true;
  }
  return false;
}

console.log('Checking route contracts...\n');

// Scan client code
const clientCalls = new Set();
for (const dir of CLIENT_DIRS) {
  try {
    for (const call of scanDirectory(join(process.cwd(), dir))) {
      clientCalls.add(call);
    }
  } catch {
    // Skip missing directories
  }
}

// Parse gateway routes
const gatewayRoutes = parseServiceConfigs();

// Pass 1: client → gateway (gating)
const mismatches = [];
for (const call of clientCalls) {
  const [service, path] = splitCallKey(call);
  if (!matchRoute(service, path, gatewayRoutes)) {
    mismatches.push({ service, path });
  }
}

const baseline = loadBaseline();
const active = mismatches.filter(({ service, path }) => !baseline.has(`/api/v1/${service}${path}`));
const staleBaseline = [...baseline].filter(
  (b) => !mismatches.some(({ service, path }) => `/api/v1/${service}${path}` === b)
);

if (UPDATE_MODE) {
  writeFileSync(
    BASELINE_PATH,
    JSON.stringify(
      {
        description:
          'Client calls with no SERVICE_CONFIGS entry. Ratchet: entries may only be REMOVED (by fixing the route or the client); a new unmatched call fails CI. Regenerate with: node scripts/check-route-contracts.mjs --update',
        generatedAt: new Date().toISOString(),
        total: mismatches.length,
        unmatchedClientCalls: mismatches
          .map(({ service, path }) => `/api/v1/${service}${path}`)
          .sort(),
      },
      null,
      2
    ) + '\n'
  );
  console.log(`Baseline written: ${mismatches.length} entries → ${relative(process.cwd(), BASELINE_PATH)}`);
  process.exit(0);
}

if (active.length > 0) {
  console.log(`❌ Found ${active.length} NEW client API calls with no matching gateway route:\n`);
  for (const { service, path } of active.sort((a, b) => a.service.localeCompare(b.service))) {
    console.log(`  /api/v1/${service}${path}`);
  }
  console.log(`\nTotal client calls: ${clientCalls.size}`);
  console.log(`Unmatched: ${mismatches.length} (${baseline.size} accepted via ratchet baseline, ${active.length} new)`);
  console.log(
    `\nThese calls will 404 at runtime. Add the missing routes to the gateway\nSERVICE_CONFIGS or re-point the client to an existing route.`
  );
  process.exit(1);
}

console.log(`✅ All ${clientCalls.size} client API calls match gateway routes.`);
if (baseline.size > 0) {
  console.log(
    `   (${baseline.size} known-unmatched calls accepted via the ratchet baseline —\n    prune it with --update as the underlying routes get fixed${
      staleBaseline.length > 0 ? `; ${staleBaseline.length} entries are already stale` : ''
    })`
  );
}

// Pass 2: gateway → client (dead routes, advisory)
const deadRoutes = [];
for (const [service, endpoints] of gatewayRoutes) {
  for (const ep of endpoints) {
    const epPath = normalizePath(ep);
    const isCalled = [...clientCalls].some((call) => {
      const [svc, path] = splitCallKey(call);
      return svc === service && pathMatches(epPath, path);
    });
    if (!isCalled) {
      deadRoutes.push({ service, path: epPath });
    }
  }
}

if (deadRoutes.length === 0) {
  console.log('✅ No dead gateway routes — every documented endpoint has a client caller.');
  process.exit(0);
}

// Same service+path may appear once per HTTP method; report unique paths.
const seen = new Set();
const uniqueDead = deadRoutes.filter(({ service, path }) => {
  const k = callKey(service, path);
  if (seen.has(k)) return false;
  seen.add(k);
  return true;
});

console.log(
  `\n⚠️  ${uniqueDead.length} gateway endpoint paths have no matching client call (dead routes, advisory):\n`
);
const byService = new Map();
for (const { service, path } of uniqueDead) {
  if (!byService.has(service)) byService.set(service, []);
  byService.get(service).push(path);
}
for (const service of [...byService.keys()].sort()) {
  for (const path of byService.get(service)) {
    console.log(`  /api/v1/${service}${path}`);
  }
}
console.log(
  `\nTotal gateway endpoints: ${[...gatewayRoutes.values()].reduce((n, eps) => n + eps.length, 0)} (${deadRoutes.length} endpoint entries, ${uniqueDead.length} unique dead paths)`
);
console.log(
  `\nThese endpoints are documented in SERVICE_CONFIGS but no client code calls\nthem. Not necessarily wrong — they may serve partners, scripts, mobile\nreleases, or planned features — but if a route is truly obsolete, remove its\nendpoint entry (and the backend route) so the contract stays truthful.`
);
process.exit(0);
