#!/usr/bin/env node
// Cross-container admin → Redis → service flag chain check (dockerized CI).
//
// Boots against REAL service containers (docker-compose.flagchain.yml):
// the admin API container PUTs a gateway kill-switch into the shared Redis,
// and the api-gateway container — which evaluates gateway flags on EVERY
// proxied request — must flip to 503 (maintenance mode) and back. This proves
// the chain across processes/containers, not just two ioredis connections in
// one jest process (which is what feature-flags.redis-live.spec.ts covers).
//
// Env:
//   ADMIN_URL   (default http://localhost:4016)  — admin API container
//   GATEWAY_URL (default http://localhost:3013)  — api-gateway container
//   JWT_SECRET  (required) — must equal the containers' JWT_ACCESS_SECRET
//   FLAG_KEY    (default gateway_maintenance_mode)
//   PROBE_PATH  (default /api/v1/auth/health) — MUST be a gateway-PROXIED
//               route; /health|/live|/ready are served by the gateway itself
//               and bypass the maintenance kill-switch.
//   TIMEOUT_MS  (default 30000), POLL_MS (default 500)
//
// Exit codes: 0 = chain verified, 1 = chain broken, 2 = misconfiguration.

import { createHmac } from 'node:crypto';

const ADMIN_URL = process.env.ADMIN_URL || 'http://localhost:4016';
const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:3013';
const JWT_SECRET = process.env.JWT_SECRET;
const FLAG_KEY = process.env.FLAG_KEY || 'gateway_maintenance_mode';
const PROBE_PATH = process.env.PROBE_PATH || '/api/v1/auth/health';
const TIMEOUT_MS = parseInt(process.env.TIMEOUT_MS || '30000', 10);
const POLL_MS = parseInt(process.env.POLL_MS || '500', 10);

if (!JWT_SECRET) {
  console.error('[flag-chain] JWT_SECRET is required (must match the containers\' JWT_ACCESS_SECRET)');
  process.exit(2);
}

// ---- HS256 JWT mint with zero deps (admin's JwtStrategy: HS256, aud/iss enforced) ----
const b64url = (buf) => Buffer.from(buf).toString('base64url');
function mintJwt(secret) {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = b64url(JSON.stringify({
    sub: 'ci-flagchain',
    email: 'ci-flagchain@azeebo.plus',
    role: 'superadmin',
    aud: 'azeebo-api',
    iss: 'azeebo-auth',
    iat: now,
    exp: now + 300,
  }));
  const sig = createHmac('sha256', secret).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${sig}`;
}

// ---- fetch with a tiny cookie jar (admin CSRF double-submit is belt-and-suspenders
// here: the middleware only applies to 'api'-prefixed routes, but harmless to honor) ----
let cookieJar = '';
async function req(url, { method = 'GET', token, json } = {}) {
  const headers = {};
  if (token) headers.authorization = `Bearer ${token}`;
  if (cookieJar) headers.cookie = cookieJar;
  if (json !== undefined) {
    headers['content-type'] = 'application/json';
    if (cookieJar.includes('=')) headers['x-csrf-token'] = cookieJar.split('=').slice(1).join('=');
  }
  const res = await fetch(url, {
    method,
    headers,
    body: json !== undefined ? JSON.stringify(json) : undefined,
  });
  const setCookie = res.headers.get('set-cookie');
  if (setCookie) cookieJar = setCookie.split(';')[0];
  const text = await res.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { status: res.status, body };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitFor(desc, predicate, timeoutMs = TIMEOUT_MS) {
  const start = Date.now();
  let last;
  while (Date.now() - start < timeoutMs) {
    try {
      last = await predicate();
      if (last.ok) return last;
    } catch (error) {
      last = { error: String(error) };
    }
    await sleep(POLL_MS);
  }
  throw new Error(`${desc} — timed out after ${timeoutMs}ms; last=${JSON.stringify(last)}`);
}

const results = { flag: FLAG_KEY, probe: PROBE_PATH };

async function main() {
  const token = mintJwt(JWT_SECRET);
  results.adminUrl = ADMIN_URL;
  results.gatewayUrl = GATEWAY_URL;

  // Wait for both containers to be healthy.
  await waitFor('admin /health', async () => {
    const r = await req(`${ADMIN_URL}/health`);
    return { ok: r.status === 200, detail: { status: r.status } };
  });
  console.log('[flag-chain] admin container healthy');
  await waitFor('gateway /live', async () => {
    const r = await req(`${GATEWAY_URL}/live`);
    return { ok: r.status === 200, detail: { status: r.status } };
  });
  console.log('[flag-chain] gateway container healthy');

  // The admin app versioning makes the exact prefix ambiguous across builds —
  // probe candidates and pin whichever the running container serves.
  const candidates = ['/v1/admin/feature-flags', '/admin/feature-flags', '/api/v1/admin/feature-flags'];
  let apiBase = null;
  for (const candidate of candidates) {
    const r = await req(`${ADMIN_URL}${candidate}`, { token });
    if (r.status === 200) {
      apiBase = candidate;
      break;
    }
  }
  if (!apiBase) {
    const statuses = await Promise.all(
      candidates.map(async (c) => `${c}=${(await req(`${ADMIN_URL}${c}`, { token })).status}`)
    );
    throw new Error(`could not locate the admin feature-flags API (tried ${statuses.join(', ')})`);
  }
  results.adminApiBase = apiBase;
  console.log(`[flag-chain] admin API at ${apiBase}`);

  // Baseline: maintenance must be OFF before we toggle it on.
  const baseline = await req(`${GATEWAY_URL}${PROBE_PATH}`);
  if (baseline.status === 503) {
    throw new Error(`gateway already in maintenance (status 503) before the toggle — ${FLAG_KEY} was left ON`);
  }

  // Admin (container A) → Redis: turn the gateway kill-switch ON.
  const putOn = await req(`${ADMIN_URL}${apiBase}/${FLAG_KEY}`, {
    method: 'PUT',
    token,
    json: { enabled: true, owner: 'ci-flagchain', description: 'dockerized flag-chain e2e' },
  });
  if (putOn.status !== 200 && putOn.status !== 201) {
    throw new Error(`PUT ${FLAG_KEY} {enabled:true} → ${putOn.status}: ${JSON.stringify(putOn.body)}`);
  }

  // Gateway (container B) must observe the flip through Redis.
  await waitFor('gateway 503 maintenance (flag ON propagated through Redis)', async () => {
    const r = await req(`${GATEWAY_URL}${PROBE_PATH}`);
    const body = typeof r.body === 'object' && r.body ? r.body : {};
    return {
      ok: r.status === 503 && String(body.message || '').toLowerCase().includes('maintenance'),
      detail: { status: r.status, message: body.message },
    };
  });
  console.log('[flag-chain] gateway flipped to 503 (maintenance) after admin toggle');

  // Toggle back OFF via admin, then the gateway must recover.
  const putOff = await req(`${ADMIN_URL}${apiBase}/${FLAG_KEY}`, {
    method: 'PUT',
    token,
    json: { enabled: false },
  });
  if (putOff.status !== 200 && putOff.status !== 201) {
    throw new Error(`PUT ${FLAG_KEY} {enabled:false} → ${putOff.status}: ${JSON.stringify(putOff.body)}`);
  }
  await waitFor('gateway out of maintenance (flag OFF propagated through Redis)', async () => {
    const r = await req(`${GATEWAY_URL}${PROBE_PATH}`);
    return { ok: r.status !== 503, detail: { status: r.status } };
  });
  console.log('[flag-chain] gateway recovered after toggle OFF');

  // Leave Redis clean: delete the flag (falls back to its registered default, false).
  const del = await req(`${ADMIN_URL}${apiBase}/${FLAG_KEY}`, { method: 'DELETE', token });
  if (del.status !== 200) {
    console.warn(`[flag-chain] warning: DELETE ${FLAG_KEY} → ${del.status} (non-fatal)`);
  }

  results.status = 'ok';
  results.propagated = { on: '503 (maintenance)', off: 'serving again (non-503)' };
  console.log(`[flag-chain] OK — admin container → Redis → gateway container chain verified: ${JSON.stringify(results, null, 2)}`);
}

main().catch((error) => {
  console.error(`[flag-chain] FAIL — ${error.message}`);
  process.exit(1);
});
