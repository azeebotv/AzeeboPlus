#!/usr/bin/env node
/**
 * Route-contract check: extracts API calls from client code and verifies they
 * match routes defined in the gateway's SERVICE_CONFIGS — including the HTTP
 * method, so a client calling POST where the gateway documents PUT fails here
 * instead of 405ing at runtime.
 *
 * Two passes:
 *   1. Client → gateway (gating): every /api/v1/{service}/... call in client
 *      code must match a gateway endpoint on service + path + method.
 *      - path mismatch → "no matching gateway route"
 *      - path matches but method differs → "verb mismatch" (also gates)
 *   2. Gateway → client (dead routes): gateway endpoints no client code calls
 *      anymore are reported (advisory; exit unaffected).
 *
 * Method extraction from client code (best effort, back-compat safe):
 *   - `apiFetch('/api/v1/x', { method: 'PUT' })` and the equivalent
 *     `request('/api/v1/x', { method: 'PUT' })` options-object shape → exact.
 *   - Axios-style `apiClient.patch('/api/v1/x')` → PATCH.
 *   - `fetch('/api/v1/x')` / `.get('/api/v1/x')` → GET.
 *   - Anything else (helper indirection, dynamic method) → unknown, which
 *     matches any documented method for the path (old path-only behaviour).
 *
 * Run: node scripts/check-route-contracts.mjs
 * Update baseline: node scripts/check-route-contracts.mjs --update
 *
 * Exit 0 = all client calls match a gateway route (path AND method).
 * Exit 1 = path mismatches or verb mismatches found (details printed).
 */

import { readFileSync, readdirSync, statSync, existsSync, writeFileSync } from 'node:fs';
import { join, relative, extname } from 'node:path';
import {
  diffGatewayBackend,
  ghostKey,
  undeclaredKey,
  GATEWAY_PROXY_FILE,
} from './lib/gateway-backend-contracts.mjs';

// Ratchet baseline, three sections (each may only shrink; a NEW violation in
// any section fails CI even though old ones are accepted. Regenerate with
// --update after fixing entries):
//   unmatchedClientCalls            — client calls with no gateway entry
//                                     ("/api/v1/service/path [METHOD]", "[ANY]"
//                                     when the client method is indeterminable)
//   gatewayGhostEndpoints           — SERVICE_CONFIGS endpoint entries with no
//                                     matching backend controller route, keyed
//                                     "ghost:{service}:{METHOD} {upstreamPath}"
//                                     (would 404/502 at runtime)
//   gatewayUndeclaredBackendRoutes  — backend controller routes absent from
//                                     SERVICE_CONFIGS, keyed
//                                     "undeclared:{METHOD} {upstreamPath}"
const BASELINE_PATH = join(process.cwd(), 'scripts/route-contracts-baseline.json');
const UPDATE_MODE = process.argv.includes('--update');

function loadBaseline() {
  try {
    const parsed = JSON.parse(readFileSync(BASELINE_PATH, 'utf8'));
    return {
      client: new Set(parsed.unmatchedClientCalls ?? []),
      ghost: new Set(parsed.gatewayGhostEndpoints ?? []),
      undeclared: new Set(parsed.gatewayUndeclaredBackendRoutes ?? []),
    };
  } catch {
    return { client: new Set(), ghost: new Set(), undeclared: new Set() };
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
 * path shape is the contract. The HTTP method is recovered separately by
 * inspecting the text just before each match.
 */
const API_CALL_RE = /['"`]\/api\/v1\/([a-z][a-z0-9_-]*)(\/[a-zA-Z0-9/_.${}:=?&()-]*)?['"`]/g;

/** Axios-style verb helpers immediately wrapping a path literal (a generic
 * type argument like `.post<{ id: string }>(` is allowed between). */
const VERB_HELPER_RE = /\.(get|post|put|patch|delete|del|fetch)(<[\s\S]{0,80}?>)?\s*\(\s*$/i;

const VERB_TO_METHOD = {
  get: 'GET',
  post: 'POST',
  put: 'PUT',
  patch: 'PATCH',
  delete: 'DELETE',
  del: 'DELETE',
  // fetch() defaults to GET
  fetch: 'GET',
};

/**
 * Options-object method next to the path: `request('/api/v1/x', {
 * method: 'PUT' ... })`. Only trusted when `method` is the options object's
 * FIRST key — later keys may belong to a request body (e.g. a wallet payload
 * with `method: 'card'`), which would report a bogus verb.
 */
const OPTIONS_METHOD_WINDOW = 200;

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

/**
 * Best-effort HTTP method for a call site. Returns 'GET'/'POST'/... or null
 * when the method can't be determined (unknown → matches any documented
 * method, preserving the old path-only behaviour for indirect call shapes).
 */
function inferMethod(content, matchStart, matchEnd) {
  // 1. Axios-style helper right before the path: apiClient.patch('/api/v1/x')
  //    or fetch('/api/v1/x') — beats the options scan so a body object
  //    following the path is never mistaken for the options object.
  const before = content.slice(Math.max(0, matchStart - 160), matchStart);
  const verb = before.match(VERB_HELPER_RE);
  if (verb) return VERB_TO_METHOD[verb[1].toLowerCase()] ?? null;

  // 2. Options object right after the path: request('/api/v1/x', { method: 'PUT' })
  const after = content.slice(matchEnd, matchEnd + OPTIONS_METHOD_WINDOW);
  const opts = after.match(/^\s*,\s*\{\s*method\s*:\s*['"`]([A-Za-z]+)['"`]/);
  if (opts) return opts[1].toUpperCase();

  return null;
}

// `service:path:METHOD` with ':' inside paths is ambiguous to split; use the
// last two indices — service names and methods can't contain ':'.
function callKey(service, path, method) {
  return `${service}:${path}:${method ?? 'ANY'}`;
}

function splitCallKey(key) {
  const first = key.indexOf(':');
  const last = key.lastIndexOf(':');
  return [key.slice(0, first), key.slice(first + 1, last), key.slice(last + 1)];
}

function scanFile(filePath) {
  const content = readFileSync(filePath, 'utf8');
  const calls = new Set();
  let match;
  API_CALL_RE.lastIndex = 0;
  while ((match = API_CALL_RE.exec(content)) !== null) {
    const service = match[1];
    const path = normalizeCallPath(match[2] || '/');
    const method = inferMethod(content, match.index, match.index + match[0].length);
    calls.add(callKey(service, path, method));
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

    // Endpoint entries are flat objects: { method: 'GET', path: '/x', ... }.
    // Entries without a method field match any client verb (opt-out hatch).
    const endpointsContent = endpointsMatch[1];
    const entryRe = /\{([^{}]*)\}/g;
    let entryMatch;
    while ((entryMatch = entryRe.exec(endpointsContent)) !== null) {
      const inner = entryMatch[1];
      const path = inner.match(/path:\s*'([^']+)'/)?.[1];
      if (!path) continue;
      const method = inner.match(/method:\s*'([A-Za-z]+)'/)?.[1]?.toUpperCase() ?? null;
      serviceEndpoints.get(servicePath).push({ method, path });
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

/** Method-compatible: null on either side is a wildcard. */
function methodMatches(docMethod, callMethod) {
  if (!docMethod || !callMethod) return true;
  return docMethod === callMethod;
}

/**
 * Returns { pathMatched, methodMatched, docMethod } for the best-matching
 * documented endpoint, or { pathMatched: false } when the service has no
 * route for the path at all.
 */
function matchRoute(service, path, method, serviceEndpoints) {
  const endpoints = serviceEndpoints.get(service);
  if (!endpoints) return { pathMatched: false };

  let pathMatched = null;
  for (const ep of endpoints) {
    if (pathMatches(ep.path, path)) {
      pathMatched = ep;
      if (methodMatches(ep.method, method)) {
        return { pathMatched: true, methodMatched: true, docMethod: ep.method };
      }
    }
  }
  if (pathMatched) {
    return {
      pathMatched: true,
      methodMatched: false,
      docMethod: pathMatched.method ?? 'ANY',
    };
  }
  return { pathMatched: false };
}

function describeMethod(method) {
  return method ?? 'ANY';
}

console.log('Checking route contracts (paths + HTTP methods)...\n');

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
const mismatches = []; // no route for the path at all
const verbMismatches = []; // path documented, method differs
for (const call of clientCalls) {
  const [service, path, method] = splitCallKey(call);
  const callMethod = method === 'ANY' ? null : method;
  const result = matchRoute(service, path, callMethod, gatewayRoutes);
  if (!result.pathMatched) {
    mismatches.push({ service, path, method: callMethod });
  } else if (!result.methodMatched) {
    verbMismatches.push({ service, path, method: callMethod, docMethod: result.docMethod });
  }
}

const baseline = loadBaseline();
const mismatchKey = ({ service, path, method }) =>
  `/api/v1/${service}${path} [${describeMethod(method)}]`;
const allMismatches = [...mismatches, ...verbMismatches];
const active = allMismatches.filter((m) => !baseline.client.has(mismatchKey(m)));
const staleBaseline = [...baseline.client].filter(
  (b) => !allMismatches.some((m) => mismatchKey(m) === b)
);

if (UPDATE_MODE) {
  // Re-run the gateway↔backend diff for the baseline file too.
  const gatewayContent = readFileSync(join(process.cwd(), GATEWAY_PROXY_FILE), 'utf8');
  const { results: gbResults } = diffGatewayBackend(process.cwd(), gatewayContent);
  const ghostKeys = [];
  const undeclaredKeys = [];
  for (const r of gbResults) {
    if (r.skipped) continue;
    for (const g of r.ghost) ghostKeys.push(ghostKey(g));
    for (const u of r.undeclared) undeclaredKeys.push(undeclaredKey(u, r.backendDir));
  }
  writeFileSync(
    BASELINE_PATH,
    JSON.stringify(
      {
        description:
          'Route-contract ratchet: entries may only be REMOVED (by fixing the route, the verb, the declaration, or the client); a NEW violation in any section fails CI. Sections: unmatchedClientCalls (client calls with no SERVICE_CONFIGS entry on path AND method; "[ANY]" = client method not determinable), gatewayGhostEndpoints (declared endpoints with no matching backend controller route, in upstream form), gatewayUndeclaredBackendRoutes (backend controller routes absent from SERVICE_CONFIGS, in upstream form). Regenerate with: node scripts/check-route-contracts.mjs --update',
        generatedAt: new Date().toISOString(),
        total: allMismatches.length,
        unmatchedClientCalls: allMismatches.map(mismatchKey).sort(),
        gatewayGhostEndpoints: [...new Set(ghostKeys)].sort(),
        gatewayUndeclaredBackendRoutes: [...new Set(undeclaredKeys)].sort(),
      },
      null,
      2
    ) + '\n'
  );
  console.log(
    `Baseline written: ${allMismatches.length} client + ${new Set(ghostKeys).size} ghost + ${new Set(undeclaredKeys).size} undeclared entries → ${relative(process.cwd(), BASELINE_PATH)}`
  );
  process.exit(0);
}

if (active.length > 0) {
  if (mismatches.some((m) => !baseline.client.has(mismatchKey(m)))) {
    const newMissing = mismatches.filter((m) => !baseline.client.has(mismatchKey(m)));
    console.log(
      `❌ Found ${newMissing.length} NEW client API calls with no matching gateway route:\n`
    );
    for (const m of newMissing.sort((a, b) => a.service.localeCompare(b.service))) {
      console.log(`  ${mismatchKey(m)}`);
    }
  }
  if (verbMismatches.some((m) => !baseline.client.has(mismatchKey(m)))) {
    const newVerb = verbMismatches.filter((m) => !baseline.client.has(mismatchKey(m)));
    console.log(`\n❌ Found ${newVerb.length} HTTP-verb mismatches (client vs gateway doc):\n`);
    for (const m of newVerb.sort((a, b) => a.service.localeCompare(b.service))) {
      console.log(
        `  ${mismatchKey(m)} — gateway documents ${m.docMethod}${
          m.method ? ` for this path; client calls ${m.method}` : ''
        } (would 405 at runtime)`
      );
    }
  }
  console.log(`\nTotal client calls: ${clientCalls.size}`);
  console.log(
    `Unmatched: ${allMismatches.length} (${baseline.size} accepted via ratchet baseline, ${active.length} new)`
  );
  console.log(
    `\nThese calls will 404/405 at runtime. Add the missing routes to the gateway\nSERVICE_CONFIGS, fix the verb, or re-point the client to an existing route.`
  );
  process.exit(1);
}

console.log(`✅ All ${clientCalls.size} client API calls match gateway routes (path + method).`);
if (baseline.client.size > 0) {
  console.log(
    `   (${baseline.client.size} known-unmatched calls accepted via the ratchet baseline —\n    prune it with --update as the underlying routes get fixed${
      staleBaseline.length > 0 ? `; ${staleBaseline.length} entries are already stale` : ''
    })`
  );
}

// Pass 3: gateway ↔ backend (gating, ratcheted). SERVICE_CONFIGS endpoint
// entries are the contract doc; the proxy just forwards by service prefix,
// so a declared-but-missing upstream route 404s/502s at runtime and an
// undeclared backend route is invisible surface. Both directions are diffed
// against the actual NestJS controllers (scripts/lib/gateway-backend-contracts.mjs).
const gatewayContent = readFileSync(join(process.cwd(), GATEWAY_PROXY_FILE), 'utf8');
const { results: gbResults, stats: gbStats } = diffGatewayBackend(process.cwd(), gatewayContent);

const activeGhosts = [];
const activeUndeclared = [];
for (const r of gbResults) {
  if (r.skipped) continue;
  for (const g of r.ghost) {
    if (!baseline.ghost.has(ghostKey(g))) activeGhosts.push(g);
  }
  for (const u of r.undeclared) {
    if (!baseline.undeclared.has(undeclaredKey(u, r.backendDir))) activeUndeclared.push(u);
  }
}

if (activeGhosts.length > 0 || activeUndeclared.length > 0) {
  if (activeGhosts.length > 0) {
    console.log(
      `\n❌ ${activeGhosts.length} gateway endpoint entries have NO matching backend route (would 404/502 at runtime):\n`
    );
    for (const g of activeGhosts.sort(
      (a, b) => a.service.localeCompare(b.service) || a.method.localeCompare(b.method)
    )) {
      console.log(`  [${g.service}] ${g.method} ${g.path}`);
    }
  }
  if (activeUndeclared.length > 0) {
    console.log(
      `\n❌ ${activeUndeclared.length} backend routes are NOT declared in SERVICE_CONFIGS (invisible surface):\n`
    );
    for (const u of activeUndeclared.sort((a, b) => a.path.localeCompare(b.path))) {
      console.log(`  ${u.method} ${u.path}  (${u.file})`);
    }
  }
  console.log(
    `\nAdd the missing backend routes or declarations, remove dead endpoint entries,\nor refresh the ratchet baseline with --update after fixing.`
  );
  process.exit(1);
}

console.log(
  `✅ Gateway↔backend contract OK — ${gbStats.declaredTotal} declared endpoints match ${gbStats.backendRoutesTotal} backend controller routes across ${gbStats.servicesCompared} upstream(s).`
);
if (baseline.ghost.size > 0 || baseline.undeclared.size > 0) {
  console.log(
    `   (${baseline.ghost.size} ghost + ${baseline.undeclared.size} undeclared accepted via the ratchet baseline — prune with --update as they get fixed)`
  );
}

// Pass 2: gateway → client (dead routes, advisory)
const deadRoutes = [];
for (const [service, endpoints] of gatewayRoutes) {
  for (const ep of endpoints) {
    const epPath = normalizePath(ep.path);
    const isCalled = [...clientCalls].some((call) => {
      const [svc, path, methodKey] = splitCallKey(call);
      const callMethod = methodKey === 'ANY' ? null : methodKey;
      return (
        svc === service &&
        pathMatches(epPath, path) &&
        methodMatches(ep.method, callMethod)
      );
    });
    if (!isCalled) {
      deadRoutes.push({ service, path: epPath, method: ep.method });
    }
  }
}

if (deadRoutes.length === 0) {
  console.log('✅ No dead gateway routes — every documented endpoint has a client caller.');
  process.exit(0);
}

// Same service+path may appear once per HTTP method; report unique entries.
const seen = new Set();
const uniqueDead = deadRoutes.filter(({ service, path, method }) => {
  const k = callKey(service, path, method);
  if (seen.has(k)) return false;
  seen.add(k);
  return true;
});

console.log(
  `\n⚠️  ${uniqueDead.length} gateway endpoints have no matching client call (dead routes, advisory):\n`
);
const byService = new Map();
for (const { service, path, method } of uniqueDead) {
  if (!byService.has(service)) byService.set(service, []);
  byService.get(service).push({ method: describeMethod(method), path });
}
for (const service of [...byService.keys()].sort()) {
  for (const { method, path } of byService.get(service)) {
    console.log(`  ${method.padEnd(7)} /api/v1/${service}${path}`);
  }
}
console.log(
  `\nTotal gateway endpoints: ${[...gatewayRoutes.values()].reduce((n, eps) => n + eps.length, 0)} (${deadRoutes.length} endpoint entries, ${uniqueDead.length} unique dead entries)`
);
console.log(
  `\nThese endpoints are documented in SERVICE_CONFIGS but no client code calls\nthem. Not necessarily wrong — they may serve partners, scripts, mobile\nreleases, or planned features — but if a route is truly obsolete, remove its\nendpoint entry (and the backend route) so the contract stays truthful.`
);
process.exit(0);
