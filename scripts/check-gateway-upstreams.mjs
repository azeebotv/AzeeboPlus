#!/usr/bin/env node
// ============================================================================
// check-gateway-upstreams.mjs — probe every gateway SERVICE_CONFIGS upstream
//
// After start-all.sh (or any local boot), the API gateway happily accepts
// traffic even when its upstream services are dead — requests then fail with
// 502 Bad Gateway, surfacing as browser errors far from the cause (the classic
// case was the admin backend on :4016 booting from placeholder env vars and
// dying silently while the gateway kept proxying /admin into the void).
//
// This script reads the gateway's SERVICE_CONFIGS registry, resolves each
// service's base URL exactly the way the gateway does, probes its health
// endpoint, and prints a status table.
//
// URL resolution order (mirrors the gateway):
//   1. process.env[envKey]      — exported by the launching shell
//   2. gateway .env file        — *_SERVICE_URL keys checked into the gateway
//   3. config fallbackUrl       — usually a docker-compose hostname (dead in
//                                 local dev → reported as `unconfigured`)
//
// Probe: GET <upstream>/v1/health, falling back to /health. Any HTTP < 500
// counts as alive (404 on both paths still proves the process is listening).
//
// Exit codes: 0 = advisory mode, even with dead upstreams (startup default).
//             1 = only with --strict and at least one dead/unconfigured
//                 upstream (for CI or scripted boots).
//
// Usage:
//   node scripts/check-gateway-upstreams.mjs
//   node scripts/check-gateway-upstreams.mjs --strict
//
// Options / env:
//   GATEWAY_URL         gateway base for the liveness row (default :3013)
//   GATEWAY_ENV_FILE    path to gateway .env (default services/gateway/api-gateway/.env)
//   UPSTREAM_TIMEOUT_MS per-probe timeout (default 2500)
// ============================================================================

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const strict = args.includes('--strict');
const GATEWAY_URL = process.env.GATEWAY_URL ?? 'http://localhost:3013';
const GATEWAY_ENV_FILE =
  process.env.GATEWAY_ENV_FILE ?? path.join(ROOT, 'services/gateway/api-gateway/.env');
const TIMEOUT_MS = Number(process.env.UPSTREAM_TIMEOUT_MS ?? 2500);

// ── SERVICE_CONFIGS: import gateway dist, fall back to TS regex parse ──────
async function loadServiceConfigs() {
  const candidates = [
    'services/gateway/api-gateway/dist/modules/proxy/proxy.controller.js',
    'services/gateway/api-gateway/dist/src/modules/proxy/proxy.controller.js',
  ];
  for (const rel of candidates) {
    try {
      const mod = await import(new URL(rel, `file://${ROOT}/`).href);
      if (mod.SERVICE_CONFIGS?.length) return mod.SERVICE_CONFIGS;
    } catch { /* try next */ }
  }
  // No build? Parse the handful of fields we need straight out of the source.
  const src = fs.readFileSync(
    path.join(ROOT, 'services/gateway/api-gateway/src/modules/proxy/proxy.controller.ts'),
    'utf8'
  );
  const body = src.slice(src.indexOf('SERVICE_CONFIGS'));
  const configs = [];
  const entryRe = /path:\s*'([^']+)',\s*envKey:\s*'([^']+)',\s*fallbackUrl:\s*'([^']+)'/g;
  for (const m of body.matchAll(entryRe)) {
    configs.push({ path: m[1], envKey: m[2], fallbackUrl: m[3] });
  }
  return configs;
}

// ── gateway .env as secondary URL source ────────────────────────────────────
function loadGatewayEnv() {
  const map = {};
  try {
    for (const line of fs.readFileSync(GATEWAY_ENV_FILE, 'utf8').split('\n')) {
      const m = line.match(/^([A-Z_]+)=(.*)$/);
      if (m && !line.trim().startsWith('#')) map[m[1]] = m[2].trim();
    }
  } catch { /* no .env — env vars and fallbacks only */ }
  return map;
}

async function probe(url, pathname) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(new URL(pathname, url.endsWith('/') ? url : url + '/'), {
      signal: ctrl.signal,
      headers: { 'user-agent': 'azeebo-upstream-check' },
    });
    return { ok: res.status < 500, status: res.status };
  } catch (err) {
    return { ok: false, error: err?.name === 'AbortError' ? `timeout ${TIMEOUT_MS}ms` : (err?.cause?.code ?? err?.message ?? 'error') };
  } finally {
    clearTimeout(timer);
  }
}

async function checkUpstream(base) {
  // Nest services expose /v1/health (URI-versioned); a couple expose /health.
  const r1 = await probe(base, 'v1/health');
  if (r1.ok || (r1.status && r1.status < 500)) return { alive: true, detail: `v1/health ${r1.status}` };
  const r2 = await probe(base, 'health');
  if (r2.ok || (r2.status && r2.status < 500)) return { alive: true, detail: `health ${r2.status}` };
  const why = r2.error ?? `v1/health ${r1.status ?? r1.error} / health ${r2.status ?? r2.error}`;
  return { alive: false, detail: why };
}

// ── Main ────────────────────────────────────────────────────────────────────
const configs = await loadServiceConfigs();
if (!configs.length) {
  console.error('Could not load SERVICE_CONFIGS (build the gateway or keep TS source in place).');
  process.exit(1);
}
const gatewayEnv = loadGatewayEnv();

console.log(`Probing ${configs.length} gateway upstreams (+ gateway itself) — timeout ${TIMEOUT_MS}ms\n`);

const rows = [];
// Row 0: the gateway itself.
const gw = await checkUpstream(GATEWAY_URL);
rows.push({ name: '(gateway)', url: GATEWAY_URL, status: gw.alive ? 'ok' : 'DEAD', detail: gw.alive ? gw.detail : gw.detail });

for (const c of configs) {
  const url = process.env[c.envKey] ?? gatewayEnv[c.envKey] ?? c.fallbackUrl;
  const unconfigured = !process.env[c.envKey] && !gatewayEnv[c.envKey];
  if (unconfigured) {
    rows.push({ name: c.path, url: c.fallbackUrl, status: 'unconfigured', detail: `${c.envKey} not set; fallback is a container hostname` });
    continue;
  }
  const r = await checkUpstream(url);
  rows.push({ name: c.path, url, status: r.alive ? 'ok' : 'DEAD', detail: r.detail });
}

const nameW = Math.max(...rows.map((r) => r.name.length)) + 2;
const urlW = Math.min(Math.max(...rows.map((r) => r.url.length)) + 2, 60);
for (const r of rows) {
  const icon = { ok: '✅', DEAD: '🔴', unconfigured: '🟡' }[r.status];
  console.log(`  ${r.name.padEnd(nameW)} ${String(r.url).slice(0, 58).padEnd(urlW)} ${icon} ${r.status.padEnd(13)} ${r.detail}`);
}

const dead = rows.filter((r) => r.status === 'DEAD');
const unconf = rows.filter((r) => r.status === 'unconfigured');
console.log(`\nSummary: ${rows.length} checked · ${rows.filter((r) => r.status === 'ok').length} ok · ${dead.length} dead · ${unconf.length} unconfigured`);

if (dead.length) {
  console.log('\nDead upstreams — the gateway will 502 every route for these services:');
  for (const r of dead) console.log(`  - ${r.name} → ${r.url} (${r.detail})`);
  console.log('\nFix: restart the dead services (see start-all.sh / /tmp/azeebo-*-restart.log),');
  console.log('or check their .env files for placeholder secrets that kill standalone boots.');
}
if (unconf.length) {
  console.log('\nUnconfigured upstreams (env var missing; fallback hostnames only exist in Docker):');
  for (const r of unconf) console.log(`  - ${r.name} (${r.url})`);
}

if (strict && (dead.length || unconf.length)) process.exit(1);
