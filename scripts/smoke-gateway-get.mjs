#!/usr/bin/env node
// ============================================================================
// smoke-gateway-get.mjs — gateway-wide GET smoke test
//
// Enumerates every registered GET route from the gateway's SERVICE_CONFIGS
// registry (services/gateway/api-gateway/src/modules/proxy/proxy.controller.ts)
// and hits each one through the running gateway with a minted dev JWT
// (user role, plus admin role where required). Reports every 5xx.
//
// What it does NOT fail on:
//   4xx — those are legitimate contract responses for an empty dev database
//         (401 invalid token, 403 wrong role, 404 missing resource, 409/422
//         state conflicts). The failure mode this test hunts is 5xx: the
//         preferences bug class, where an internal failure surfaces as a 500.
//
// Usage:
//   GATEWAY_URL=http://localhost:3013 \
//   JWT_ACCESS_SECRET=... \
//   node scripts/smoke-gateway-get.mjs
//
// Options / env:
//   GATEWAY_URL        gateway base URL        (default http://localhost:3013)
//   JWT_ACCESS_SECRET  HS256 signing secret    (must match gateway + services)
//   JWT_ISSUER         token iss claim         (default azeebo-auth)
//   JWT_AUDIENCE       token aud claim         (default azeebo-api)
//   DEV_USER_ID        sub claim               (default 00000000-...-01)
//   DEV_USER_EMAIL     email claim             (default dev@azeebo.local)
//   SMOKE_CONCURRENCY  parallel requests       (default 2 — the parallel blast can
//                      exhaust dev Postgres connection slots, and a tripped
//                      breaker then 502s every route for its 60s reset window)
//   SMOKE_TIMEOUT_MS   per-request timeout     (default 15000)
//   SMOKE_RETRIES      retries for transient upstream failures (default 2)
//   SMOKE_RETRY_DELAY_MS  delay between retries       (default 5000)
//   SMOKE_SKIP_SERVICES   comma-separated services to skip (e.g. admin,creator
//                      when the standalone admin/creator apps are not running)
//
// Exit codes: 0 = no 5xx / connection failures (stale-route warnings tolerated),
//             1 = at least one 5xx / setup error.
// ============================================================================

import { createHmac } from 'node:crypto';

// ── Config ──────────────────────────────────────────────────────────────────
const GATEWAY_URL = (process.env.GATEWAY_URL ?? 'http://localhost:3013').replace(/\/$/, '');
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET ?? '';
const JWT_ISSUER = process.env.JWT_ISSUER ?? 'azeebo-auth';
const JWT_AUDIENCE = process.env.JWT_AUDIENCE ?? 'azeebo-api';
const DEV_USER_ID = process.env.DEV_USER_ID ?? '00000000-0000-4000-8000-000000000001';
const DEV_USER_EMAIL = process.env.DEV_USER_EMAIL ?? 'dev@azeebo.local';
const CONCURRENCY = Number(process.env.SMOKE_CONCURRENCY ?? 2);
const TIMEOUT_MS = Number(process.env.SMOKE_TIMEOUT_MS ?? 15000);
const RETRIES = Number(process.env.SMOKE_RETRIES ?? 2);
const RETRY_DELAY_MS = Number(process.env.SMOKE_RETRY_DELAY_MS ?? 5000);
const SKIP_SERVICES = new Set(
  (process.env.SMOKE_SKIP_SERVICES ?? '').split(',').map((s) => s.trim()).filter(Boolean)
);

const JSON_HEADER = { 'content-type': 'application/json' };

// Exit with a setup error instead of silently scanning nothing.
if (!JWT_ACCESS_SECRET) {
  console.error('smoke-gateway-get: JWT_ACCESS_SECRET is required (must match the gateway/ services secret)');
  process.exit(1);
}

// ── Route table: import the gateway's own registry ─────────────────────────
// SERVICE_CONFIGS lives in TS source; in CI it is compiled to dist. Resolve
// dist first, fall back to parsing the TS source (CI smoke runs without a
// build step).
const candidates = [
  'services/gateway/api-gateway/dist/modules/proxy/proxy.controller.js',
  'services/gateway/api-gateway/dist/src/modules/proxy/proxy.controller.js',
];
let SERVICE_CONFIGS = null;
for (const rel of candidates) {
  try {
    const mod = await import(new URL(rel, `file://${process.cwd()}/`).href);
    SERVICE_CONFIGS = mod.SERVICE_CONFIGS;
    break;
  } catch { /* try next candidate */ }
}
if (!SERVICE_CONFIGS) {
  try {
    const ts = (await import('node:fs')).readFileSync(
      'services/gateway/api-gateway/src/modules/proxy/proxy.controller.ts',
      'utf8'
    );
    SERVICE_CONFIGS = parseServiceConfigsFromTs(ts);
    console.error('smoke-gateway-get: dist not found — parsed SERVICE_CONFIGS from TS source');
  } catch { /* fall through to the error below */ }
}
if (!SERVICE_CONFIGS) {
  console.error('smoke-gateway-get: cannot load SERVICE_CONFIGS — build the gateway (pnpm --filter api-gateway build) or keep the TS source at its default path');
  process.exit(1);
}

/**
 * Extract SERVICE_CONFIGS from the controller TS source without compiling.
 * Tolerates comments and blank lines before `path:` and endpoints spelled
 * across multiple lines.
 */
function parseServiceConfigsFromTs(src) {
  const start = src.indexOf('export const SERVICE_CONFIGS');
  if (start === -1) throw new Error('SERVICE_CONFIGS not found in source');
  const text = src.slice(start);
  const entryRe = /\n  \{\n(?:\s*\/\/[^\n]*\n)*\s*path: '\/([a-z0-9_-]+)',/g;
  const entries = [];
  let m;
  while ((m = entryRe.exec(text)) !== null) entries.push({ service: m[1], start: m.index });
  if (entries.length === 0) throw new Error('no service entries parsed from TS source');
  const configsEnd = text.indexOf('\n];', entries.at(-1).start);
  return entries.map((e, i) => {
    const slice = text.slice(e.start, i + 1 < entries.length ? entries[i + 1].start : configsEnd);
    const defaultVersion = /defaultVersion: '([^']+)'/.exec(slice)?.[1] ?? '1';
    const isNew = /isNew: true/.test(slice);
    // endpoints as `{ method: 'GET', path: '/x', ... }` — single- or multi-line
    const endpoints = [...slice.matchAll(/\{\s*method: 'GET',\s*path: '([^']+)'/g)].map((mm) => ({
      method: 'GET',
      path: mm[1],
    }));
    return { path: `/${e.service}`, defaultVersion, isNew, endpoints };
  });
}

// ── JWT minting (HS256, no dependencies) ───────────────────────────────────
const b64url = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');
function mintJwt(claims) {
  const header = b64url({ alg: 'HS256', typ: 'JWT' });
  const payload = b64url(claims);
  const sig = createHmac('sha256', JWT_ACCESS_SECRET)
    .update(`${header}.${payload}`)
    .digest('base64url');
  return `${header}.${payload}.${sig}`;
}
const now = Math.floor(Date.now() / 1000);
const baseClaims = {
  iss: JWT_ISSUER,
  aud: JWT_AUDIENCE,
  iat: now,
  exp: now + 3600,
};
const userToken = mintJwt({ ...baseClaims, sub: DEV_USER_ID, email: DEV_USER_EMAIL, role: 'user' });
const adminToken = mintJwt({ ...baseClaims, sub: DEV_USER_ID, email: DEV_USER_EMAIL, role: 'admin' });

// ── GET route enumeration ──────────────────────────────────────────────────
// Gateway URL shape (from proxy.controller.ts):
//   versioned:  /api/v{defaultVersion}/{service}{path}
// (the legacy unversioned /api/{service} form is not served — verified against
// the running gateway: /api/auth/me → 404, /api/v1/auth/me → 200)
const routes = [];
for (const cfg of SERVICE_CONFIGS) {
  if (cfg.isNew) continue; // behind gateway_new_routes, 404 until enabled — not smokeable
  const service = cfg.path.replace(/^\//, '');
  if (SKIP_SERVICES.has(service)) continue;
  const version = cfg.defaultVersion ?? '1';
  const gets = (cfg.endpoints ?? []).filter((e) => e.method === 'GET');
  for (const ep of gets) {
    // Parametrized routes (:id, :showId, …) are not smokeable without
    // per-route fixtures — hitting them with literal ':id' just produces
    // noisy 4xx/404s. Only concrete routes are exercised.
    if (ep.path.includes(':')) continue;
    const gatewayPath = `/api/v${version}/${service}${ep.path}`;
    const adminService = service === 'admin';
    routes.push({
      service,
      path: ep.path,
      url: `${GATEWAY_URL}${gatewayPath}`,
      concrete: true,
      adminRequired: adminService || /^\/admin\//.test(ep.path),
      token: adminService || /^\/admin\//.test(ep.path) ? adminToken : userToken,
    });
  }
}
if (routes.length === 0) {
  console.error('smoke-gateway-get: no GET routes found in SERVICE_CONFIGS');
  process.exit(1);
}

// ── Request plumbing ───────────────────────────────────────────────────────
async function hit(route) {
  const attempt = async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const started = Date.now();
    try {
      const res = await fetch(route.url, {
        method: 'GET',
        headers: { authorization: `Bearer ${route.token}`, ...JSON_HEADER },
        signal: controller.signal,
        redirect: 'manual',
      });
      let body = null;
      try {
        const text = await res.text();
        body = text ? JSON.parse(text) : null;
      } catch { /* non-JSON body is fine */ }
      return {
        ...route,
        status: res.status,
        ms: Date.now() - started,
        successFlag: body && typeof body === 'object' ? body.success : undefined,
        message: body && typeof body === 'object' ? (body.message ?? body.error) : undefined,
      };
    } catch (err) {
      return {
        ...route,
        status: 0,
        ms: Date.now() - started,
        error: err.name === 'AbortError' ? `timeout after ${TIMEOUT_MS}ms` : String(err.message ?? err),
      };
    } finally {
      clearTimeout(timer);
    }
  };

  let result = await attempt();
  // Transient-failure retry: the gateway's circuit breaker returns 502/503
  // after a single upstream hiccup (or while it cools down); one retry after
  // a short delay separates that noise from stable 5xx. Connection-level
  // failures (status 0) get the same treatment.
  for (let i = 0; i < RETRIES && (result.status === 0 || result.status === 502 || result.status === 503); i++) {
    await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
    const retried = await attempt();
    if (retried.status !== result.status || retried.status === 0) result = retried;
    else break;
  }
  return result;
}

async function mapPool(items, limit, fn) {
  const out = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

// ── Execute ────────────────────────────────────────────────────────────────
console.log(`Smoke: ${routes.length} GET routes across ${new Set(routes.map((r) => r.service)).size} services → ${GATEWAY_URL}`);
const results = await mapPool(routes, CONCURRENCY, hit);

function classify(r) {
  if (r.status === 0) return 'CONNFAIL';
  if (r.status >= 500) return '5XX';
  return 'OK';
}
for (const r of results) r.class = classify(r);

// ── Report ─────────────────────────────────────────────────────────────────
const byClass = (c) => results.filter((r) => r.class === c);
const fives = byClass('5XX');
const connfails = byClass('CONNFAIL');
const others = results.filter((r) => r.class === 'OK' && r.status >= 400);
const healthy = results.filter((r) => r.status >= 200 && r.status < 400);

const line = (r) => {
  const flag = r.successFlag === false ? ' [success:false envelope]' : '';
  const msg = r.message ? ` — ${String(r.message).slice(0, 120)}` : '';
  const err = r.error ? ` — ${r.error}` : '';
  return `  ${r.status || 'ERR'} ${r.service.padEnd(14)} ${r.path.padEnd(40)} ${r.ms}ms${flag}${msg}${err}`;
};

console.log('\n── 5xx (must be zero) ─────────────────────────────');
console.log(fives.length ? fives.map(line).join('\n') : '  none');

console.log('\n── Connection failures (upstream down) ────────────');
console.log(connfails.length ? connfails.map(line).join('\n') : '  none');

console.log('\n── Other 4xx (contract responses, tolerated) ──────');
console.log(others.length ? `${others.map(line).join('\n')}\n  … ${results.filter((r) => r.class === 'OK' && r.status < 400).length} more 2xx/3xx` : `  none`);

const failed = fives.length + connfails.length;

// Token sanity: if the dev token is misconfigured (wrong secret/issuer/
// audience), every protected route 401s and the 5xx gate would silently
// pass over a run that tested nothing. Guard against that.
const unauthorized = results.filter((r) => r.status === 401);
if (results.length >= 10 && unauthorized.length / results.length > 0.5) {
  console.error(`\n❌ ${unauthorized.length}/${results.length} routes returned 401 — the dev token was rejected (JWT_ACCESS_SECRET, JWT_ISSUER or JWT_AUDIENCE mismatch). Fix the token before trusting this run.`);
  process.exit(1);
}

console.log(`\nSummary: ${results.length} GET routes · ${healthy.length} healthy · ${fives.length} × 5xx · ${connfails.length} conn-fail · ${others.length} tolerated-4xx (${unauthorized.length} × 401)`);

// CI-facing one-liner
if (process.env.GITHUB_STEP_SUMMARY && fives.length) {
  const fs = await import('node:fs');
  fs.appendFileSync(
    process.env.GITHUB_STEP_SUMMARY,
    ['| Status | Service | Path | Detail |', '|---|---|---|---|', ...fives.map((r) => `| ${r.status} | ${r.service} | ${r.path} | ${String(r.message ?? '').slice(0, 100)} |`)].join('\n')
  );
}

// Gate: 5xx and connection failures fail the run. Unexpected 404s mean the
// gateway's route registry advertises routes the upstream no longer serves —
// reported for cleanup, but they are contract rot, not runtime failures.
process.exit(fives.length + connfails.length ? 1 : 0);
