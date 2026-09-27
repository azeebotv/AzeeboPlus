#!/usr/bin/env node
/**
 * Ops API contract smoke: GET /admin/ops/services + /admin/ops/transport-flips
 * against a REAL admin backend, asserting the field shapes the Ops Health
 * cards render. The Playwright render sweep (apps/admin/client/e2e/) mocks
 * these endpoints — which means payload drift on the backend would pass it
 * silently while the real cards render blanks. This script is the other
 * half: the REAL-payload contract, cheap enough to run in CI against the
 * all-in-one container.
 *
 * Auth (first that applies):
 *   1. JWT_ACCESS_SECRET set  → mint an HS256 admin token (issuer azeebo-auth,
 *      audience azeebo-api — the admin backend's JwtStrategy is stateless, so
 *      no seeded user is needed). This is the CI all-in-one mode.
 *   2. ADMIN_EMAIL/ADMIN_PASSWORD (or defaults) → real POST /api/v1/auth/login
 *      and use data.access_token. The local-dev mode.
 *
 * Usage:
 *   node scripts/ops-smoke.mjs                       # localhost:4016, login
 *   ADMIN_URL=http://localhost:4016 node scripts/ops-smoke.mjs
 *   JWT_ACCESS_SECRET=… ADMIN_URL=… node scripts/ops-smoke.mjs   # CI mode
 *
 * Exit 0 = every assertion held. Exit 1 = any contract violation (all
 * violations are printed before exiting, so one run shows the full damage).
 */

import { createHmac } from 'node:crypto';

const ADMIN_URL = (process.env.ADMIN_URL || 'http://localhost:4016').replace(/\/$/, '');
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || '';
const JWT_ISSUER = process.env.JWT_ISSUER || 'azeebo-auth';
const JWT_AUDIENCE = process.env.JWT_AUDIENCE || 'azeebo-api';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@azeeboplus.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Demo123!';
const TIMEOUT_MS = Number(process.env.OPS_SMOKE_TIMEOUT_MS || 15_000);

/** The loopback-transport enum the probe sweep reports (service-probe.ts). */
const TRANSPORTS = ['localhost', 'ipv6', 'ipv4'];
const SERVICE_STATUSES = ['healthy', 'degraded', 'down'];
const DB_STATUSES = ['up', 'down', 'unknown'];
const STORE_MODES = ['redis', 'memory'];

let passCount = 0;
let failCount = 0;
const pass = (label) => {
  passCount += 1;
  console.log(`  ✅ ${label}`);
};
const fail = (label, detail) => {
  failCount += 1;
  console.log(`  ❌ ${label}${detail ? ` — ${detail}` : ''}`);
};

const isStr = (v) => typeof v === 'string' && v.length > 0;
const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
const isDate = (v) => typeof v === 'string' && !Number.isNaN(Date.parse(v));
const isEnum = (v, values) => values.includes(v);
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

// ── HTTP + auth ─────────────────────────────────────────────────────────────

async function fetchJson(path, token) {
  const res = await fetch(`${ADMIN_URL}${path}`, {
    headers: { authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const body = await res.text();
  let json = null;
  try {
    json = JSON.parse(body);
  } catch {
    /* non-JSON body → reported by the caller */
  }
  return { status: res.status, body, json };
}

function mintJwt(claims) {
  const b64url = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');
  const header = b64url({ alg: 'HS256', typ: 'JWT' });
  const payload = b64url(claims);
  const sig = createHmac('sha256', JWT_ACCESS_SECRET)
    .update(`${header}.${payload}`)
    .digest('base64url');
  return `${header}.${payload}.${sig}`;
}

async function resolveToken() {
  if (JWT_ACCESS_SECRET) {
    const now = Math.floor(Date.now() / 1000);
    const token = mintJwt({
      iss: JWT_ISSUER,
      aud: JWT_AUDIENCE,
      iat: now,
      exp: now + 3600,
      sub: 'ops-smoke-dev-user',
      email: 'ops-smoke@azeebo.dev',
      role: 'admin',
    });
    console.log('auth: minted dev JWT from JWT_ACCESS_SECRET (CI mode)');
    return token;
  }
  const res = await fetch(`${ADMIN_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const json = await res.json().catch(() => null);
  const token = json?.data?.access_token;
  if (!res.ok || !token) {
    console.error(
      `❌ login as ${ADMIN_EMAIL} failed (HTTP ${res.status}). Set ADMIN_EMAIL/ADMIN_PASSWORD for this environment, or JWT_ACCESS_SECRET to mint a dev token instead.`
    );
    process.exit(1);
  }
  console.log(`auth: logged in as ${ADMIN_EMAIL}`);
  return token;
}

// ── Contract assertions ─────────────────────────────────────────────────────

function assertServicesSnapshot(data) {
  console.log('\nGET /api/v1/admin/ops/services');
  if (!data || typeof data !== 'object') return fail('payload', 'expected an object');
  if (!Array.isArray(data.services)) return fail('services', 'expected an array');

  const services = data.services;
  services.length > 0
    ? pass(`services array non-empty (${services.length} probed)`)
    : fail('services array non-empty', 'PROBED_SERVICES is static — an empty sweep is drift');

  let checkedRows = 0;
  let healthyWithTransport = 0;
  for (const s of services) {
    const at = `services[${s?.name ?? '?'}]`;
    if (!s || typeof s !== 'object') {
      fail(at, 'row is not an object');
      continue;
    }
    checkedRows += 1;
    if (!isStr(s.name)) fail(`${at}.name`, 'expected non-empty string');
    if (!isNum(s.port)) fail(`${at}.port`, 'expected a number');
    if (!isEnum(s.status, SERVICE_STATUSES)) fail(`${at}.status`, `got ${JSON.stringify(s.status)}`);
    if (!isNum(s.latencyMs) || s.latencyMs < 0) fail(`${at}.latencyMs`, 'expected number ≥ 0');
    if (!isEnum(s.dbStatus, DB_STATUSES)) fail(`${at}.dbStatus`, `got ${JSON.stringify(s.dbStatus)}`);
    // The core contract: a service that ANSWERED the sweep must carry the
    // transport that answered. status !== 'down' ⇒ an HTTP response arrived
    // ⇒ probeAcrossTransports set outcome.transport. Down services may
    // legitimately omit it.
    if (s.status !== 'down') {
      if (s.transport === undefined) {
        fail(`${at}.transport`, 'healthy/degraded service must report the answering transport');
      } else if (!isEnum(s.transport, TRANSPORTS)) {
        fail(`${at}.transport`, `got ${JSON.stringify(s.transport)} — not in [${TRANSPORTS.join(', ')}]`);
      } else {
        healthyWithTransport += 1;
      }
    } else if (s.transport !== undefined && !isEnum(s.transport, TRANSPORTS)) {
      fail(`${at}.transport`, `down rows carrying transport must use the enum — got ${JSON.stringify(s.transport)}`);
    }
    if (s.errorDetail !== undefined && !isStr(s.errorDetail)) {
      fail(`${at}.errorDetail`, 'expected a string when present');
    }
  }
  if (checkedRows > 0) pass(`checked ${checkedRows} service rows`);
  if (healthyWithTransport > 0) {
    pass(`transport enum held on ${healthyWithTransport} answered rows`);
  } else {
    console.log('  ⚠️  no healthy service with transport observed — enum untestable this run (fleet down?)');
  }

  if (!Array.isArray(data.transportFlips)) {
    fail('transportFlips', 'expected an array');
  } else {
    data.transportFlips.length > 0
      ? pass(`transportFlips array (${data.transportFlips.length} this sweep)`)
      : pass('transportFlips array (empty — no flips this sweep, fine)');
    data.transportFlips.forEach((f, i) => {
      const at = `transportFlips[${i}]`;
      if (!isStr(f.service)) fail(`${at}.service`, 'expected non-empty string');
      if (!isNum(f.port)) fail(`${at}.port`, 'expected a number');
      if (!isEnum(f.from, TRANSPORTS)) fail(`${at}.from`, `got ${JSON.stringify(f.from)}`);
      if (!isEnum(f.to, TRANSPORTS)) fail(`${at}.to`, `got ${JSON.stringify(f.to)}`);
      if (!isNum(f.detectedAt) || f.detectedAt <= 0) fail(`${at}.detectedAt`, 'expected epoch ms > 0');
      if (typeof f.familyChanged !== 'boolean') fail(`${at}.familyChanged`, 'expected a boolean');
    });
  }

  if (!data.transportStore || typeof data.transportStore !== 'object') {
    fail('transportStore', 'expected an object (chip data)');
  } else {
    if (!isEnum(data.transportStore.mode, STORE_MODES)) {
      fail('transportStore.mode', `got ${JSON.stringify(data.transportStore.mode)}`);
    } else {
      pass(`transportStore.mode = ${data.transportStore.mode}`);
    }
    if (!isStr(data.transportStore.detail)) fail('transportStore.detail', 'expected non-empty string');
  }

  if (!isDate(data.checkedAt)) fail('checkedAt', 'expected an ISO-ish date string');
  else pass('checkedAt parses');
}

function assertFlipTrend(data) {
  console.log('\nGET /api/v1/admin/ops/transport-flips');
  if (!data || typeof data !== 'object') return fail('payload', 'expected an object');

  if (!isNum(data.windowDays) || data.windowDays < 1 || data.windowDays > 90) {
    fail('windowDays', 'expected 1..90 (backend clamps)');
  } else {
    pass(`windowDays = ${data.windowDays}`);
  }

  if (!Array.isArray(data.rows)) {
    fail('rows', 'expected an array');
  } else {
    data.rows.length > 0
      ? pass(`rows array (${data.rows.length} service-day rows)`)
      : pass('rows array (empty — quiet ledger, fine)');
    data.rows.forEach((r, i) => {
      const at = `rows[${i}]`;
      if (!isStr(r.service)) fail(`${at}.service`, 'expected non-empty string');
      if (!isEnum(r.transport, TRANSPORTS)) fail(`${at}.transport`, `got ${JSON.stringify(r.transport)}`);
      if (typeof r.day !== 'string' || !DAY_RE.test(r.day)) fail(`${at}.day`, `expected YYYY-MM-DD — got ${JSON.stringify(r.day)}`);
      if (!isNum(r.sweeps) || r.sweeps < 0) fail(`${at}.sweeps`, 'expected number ≥ 0');
      if (!isNum(r.flips) || r.flips < 0) fail(`${at}.flips`, 'expected number ≥ 0');
      if (!isNum(r.familyFlips) || r.familyFlips < 0) fail(`${at}.familyFlips`, 'expected number ≥ 0');
      // Counter invariants: every flip is observed by a sweep, and every
      // family flip is a flip. Violations mean the UPSERT merge drifted.
      if (isNum(r.sweeps) && isNum(r.flips) && r.flips > r.sweeps) {
        fail(`${at} counters`, `flips (${r.flips}) > sweeps (${r.sweeps}) — merge drift`);
      }
      if (isNum(r.familyFlips) && isNum(r.flips) && r.familyFlips > r.flips) {
        fail(`${at} counters`, `familyFlips (${r.familyFlips}) > flips (${r.flips}) — merge drift`);
      }
      if (r.lastFlipAt !== null && !isDate(r.lastFlipAt)) fail(`${at}.lastFlipAt`, 'null or date string');
      for (const k of ['lastFrom', 'lastTo']) {
        if (r[k] !== null && !isEnum(r[k], TRANSPORTS)) {
          fail(`${at}.${k}`, `null or enum — got ${JSON.stringify(r[k])}`);
        }
      }
    });
  }

  if (!Array.isArray(data.events)) {
    fail('events', 'expected an array (transport-flip-event ledger rows)');
  } else {
    data.events.length > 0
      ? pass(`events array (${data.events.length} recorded transitions)`)
      : pass('events array (empty — no flips in window, fine)');
    data.events.forEach((e, i) => {
      const at = `events[${i}]`;
      if (!isStr(e.service)) fail(`${at}.service`, 'expected non-empty string');
      if (!isNum(e.port)) fail(`${at}.port`, 'expected a number');
      if (!isEnum(e.from, TRANSPORTS)) fail(`${at}.from`, `got ${JSON.stringify(e.from)}`);
      if (!isEnum(e.to, TRANSPORTS)) fail(`${at}.to`, `got ${JSON.stringify(e.to)}`);
      if (typeof e.familyChanged !== 'boolean') fail(`${at}.familyChanged`, 'expected a boolean');
      if (!isDate(e.detectedAt)) fail(`${at}.detectedAt`, 'expected a date string');
    });
  }

  for (const k of ['servicesWithFlips', 'totalFlips', 'totalFamilyFlips']) {
    if (!isNum(data[k]) || data[k] < 0) fail(k, 'expected number ≥ 0');
  }
  if (
    isNum(data.totalFlips) &&
    isNum(data.totalFamilyFlips) &&
    data.totalFamilyFlips > data.totalFlips
  ) {
    fail('totals', `totalFamilyFlips (${data.totalFamilyFlips}) > totalFlips (${data.totalFlips})`);
  } else if (isNum(data.totalFlips)) {
    pass(`totals coherent (flips ${data.totalFlips}, family ${data.totalFamilyFlips ?? '?'})`);
  }
}

// ── Main ────────────────────────────────────────────────────────────────────

console.log(`ops-smoke: ${ADMIN_URL}`);
let token;
try {
  token = await resolveToken();
} catch (e) {
  console.error(`❌ auth failed: ${e.message}`);
  process.exit(1);
}

for (const [path, assertFn] of [
  ['/api/v1/admin/ops/services', assertServicesSnapshot],
  ['/api/v1/admin/ops/transport-flips', assertFlipTrend],
]) {
  let res;
  try {
    res = await fetchJson(path, token);
  } catch (e) {
    fail(`${path}`, `request failed: ${e.message}`);
    continue;
  }
  if (res.status !== 200) {
    fail(`GET ${path}`, `HTTP ${res.status} — ${(res.body || '').slice(0, 160)}`);
    continue;
  }
  pass(`GET ${path} → 200`);
  if (res.json?.success !== true) {
    fail(`GET ${path} envelope`, 'expected { success: true, data }');
    continue;
  }
  assertFn(res.json.data);
}

console.log(`\nops-smoke: ${passCount} passed, ${failCount} failed`);
process.exit(failCount > 0 ? 1 : 0);
