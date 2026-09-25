/**
 * One-off triage for baseline gatewayGhostEndpoints entries.
 * Usage: node scripts/triage-ghosts.mjs [--service admin]
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import {
  GATEWAY_PROXY_FILE,
  parseServiceConfigs,
  upstreamPathFor,
} from './lib/gateway-backend-contracts.mjs';

const ROOT = process.cwd();
const only = process.argv.includes('--service')
  ? process.argv[process.argv.indexOf('--service') + 1]
  : null;

const baseline = JSON.parse(readFileSync(path.join(ROOT, 'scripts/route-contracts-baseline.json'), 'utf8'));
const ghosts = baseline.gatewayGhostEndpoints ?? [];

const gatewayContent = readFileSync(path.join(ROOT, GATEWAY_PROXY_FILE), 'utf8');
const configs = parseServiceConfigs(gatewayContent);
const byService = new Map(configs.map((c) => [c.service, c]));

// ── client calls (same shape as check-route-contracts.mjs) ──
const CLIENT_DIRS = [
  'apps/web/src',
  'apps/mobile/src',
  'apps/mobile/app',
  'apps/admin/client/src',
  'apps/creator/client/src',
];
const API_CALL_RE = /['"`]\/api\/v1\/([a-z][a-z0-9_-]*)(\/[a-zA-Z0-9/_.${}:=?&()-]*)?['"`]/g;
const VERB_HELPER_RE = /\.(get|post|put|patch|delete|del|fetch)(<[\s\S]{0,80}?>)?\s*\(\s*$/i;
const VERB_TO_METHOD = { get: 'GET', post: 'POST', put: 'PUT', patch: 'PATCH', delete: 'DELETE', del: 'DELETE', fetch: 'GET' };

function normalizeCallPath(rawPath) {
  let p = rawPath || '/';
  p = p.replace(/([^/])\$\{[^}]*\}.*/, '$1');
  p = p.replace(/\$\{[^}]*\}/g, ':param');
  p = p.replace(/\$\{[^}]*$/, ':param');
  p = p.split('?')[0];
  p = p.replace(/:[a-zA-Z]+/g, ':param');
  if (p.length > 1) p = p.replace(/\/+$/, '');
  return p || '/';
}

function inferMethod(content, matchStart, matchEnd) {
  const before = content.slice(Math.max(0, matchStart - 160), matchStart);
  const verb = before.match(VERB_HELPER_RE);
  if (verb) return VERB_TO_METHOD[verb[1].toLowerCase()] ?? null;
  const after = content.slice(matchEnd, matchEnd + 200);
  const opts = after.match(/^\s*,\s*\{\s*method\s*:\s*['"`]([A-Za-z]+)['"`]/);
  if (opts) return opts[1].toUpperCase();
  return null;
}

const clientCalls = new Map(); // "service path" -> [method, file]
function walk(dir, out = []) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    if (e.name.startsWith('.') || e.name === 'node_modules') continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx|js|jsx)$/.test(e.name)) out.push(full);
  }
  return out;
}
for (const dir of CLIENT_DIRS) {
  for (const file of walk(path.join(ROOT, dir))) {
    const content = readFileSync(file, 'utf8');
    let m;
    API_CALL_RE.lastIndex = 0;
    while ((m = API_CALL_RE.exec(content)) !== null) {
      const svc = m[1];
      const p = normalizeCallPath(m[2] || '/');
      const method = inferMethod(content, m.index, m.index + m[0].length);
      const key = `${svc} ${p}`;
      if (!clientCalls.has(key)) clientCalls.set(key, []);
      clientCalls.get(key).push({ method, file: path.relative(ROOT, file) });
    }
  }
}

// ── ghost classification ──
// For each ghost, find same-service DECLARED endpoints whose upstream form is
// param-width-compatible with the ghost path (would shadow it at runtime).
function segments(p) {
  return p.split('/').filter(Boolean);
}
function shadows(ghostSegs, declaredSegs) {
  if (ghostSegs.length !== declaredSegs.length) return false;
  for (let i = 0; i < ghostSegs.length; i++) {
    const g = ghostSegs[i];
    const d = declaredSegs[i];
    if (g === d) continue;
    if (d.startsWith(':')) continue; // declared param swallows the ghost segment
    return false;
  }
  return true;
}

const rows = [];
for (const key of ghosts) {
  const rest = key.slice('ghost:'.length);
  const i = rest.indexOf(':');
  const service = rest.slice(0, i);
  const sp = rest.slice(i + 1);
  const sp2 = sp.indexOf(' ');
  const method = sp.slice(0, sp2);
  const upstream = sp.slice(sp2 + 1);
  if (only && service !== only) continue;

  const config = byService.get(service);
  let kind = 'STATIC';
  let shadowedBy = [];
  if (config) {
    const gSegs = segments(upstream.replace(/^\/v\d+/, ''));
    for (const ep of config.endpoints) {
      const epUp = upstreamPathFor(config, ep.path, config.defaultVersion);
      if (ep.method !== method) continue;
      if (epUp === upstream) continue; // the ghost's own declaration — not a shadow
      const dSegs = segments(epUp.replace(/^\/v\d+/, ''));
      if (shadows(gSegs, dSegs)) {
        kind = 'PARAM-WIDE';
        shadowedBy.push(`${ep.method} ${epUp} (decl: ${ep.path})`);
      }
    }
  }

  // Client usage: exact upstream-relative path (service + path after /v1/{service})
  const rel = upstream.replace(/^\/v\d+\/[^/]+/, '');
  const cExact = clientCalls.get(`${service} ${rel || '/'}`) ?? [];
  const cExactM = cExact.filter((c) => !c.method || c.method === method);
  // Any client call on the service whose path is segment-count-compatible?
  let cAny = [];
  const relSegs = segments(rel);
  for (const [k, v] of clientCalls) {
    if (!k.startsWith(`${service} `)) continue;
    const segs = segments(k.slice(service.length + 1));
    if (segs.length !== relSegs.length) continue;
    let ok = true;
    for (let s = 0; s < segs.length; s++) {
      if (segs[s] === relSegs[s] || segs[s].startsWith(':') || relSegs[s].startsWith(':')) continue;
      ok = false;
      break;
    }
    if (ok) cAny = cAny.concat(v);
  }

  rows.push({
    key: rest,
    kind,
    shadowedBy,
    clientExact: cExactM.length,
    clientAny: cAny.length,
    clientFiles: [...new Set(cAny.map((c) => c.file))].slice(0, 3),
  });
}

// ── backend grep hints: does a plausible controller route exist? ──
const ENV_TO_DIR = {
  admin: 'apps/admin',
  analytics: 'services/operations/analytics-service',
  reality: 'services/universes/reality-service',
  creator: 'services/universes/creator-service',
  lifestyle: 'services/universes/lifestyle-service',
  vertical: 'services/universes/vertical-service',
  knowledge: 'services/core/knowledge-service',
  comedy: 'services/universes/comedy-service',
  interactions: 'services/engagement/engagement-service',
  sports: 'services/universes/sports-service',
  queue: 'services/operations/queue-service',
  games: 'services/universes/games-service',
  rewards: 'services/engagement/reward-service',
  users: 'services/core/user-service',
  live: 'services/universes/live-event-service',
  auth: 'services/core/auth-service',
  'creator-entries': 'services/universes/creator-service',
  notifications: 'services/engagement/notification-service',
  search: 'services/core/search-service',
  wallet: 'services/core/wallet-service',
};

function backendHasFragment(dir, fragment) {
  const hits = [];
  const stack = [path.join(ROOT, dir)];
  while (stack.length) {
    const cur = stack.pop();
    let entries;
    try {
      entries = readdirSync(cur, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const e of entries) {
      if (e.name.startsWith('.') || ['node_modules', 'dist', 'build', '__tests__', 'test'].includes(e.name)) continue;
      const full = path.join(cur, e.name);
      if (e.isDirectory()) stack.push(full);
      else if (e.name.endsWith('.controller.ts')) {
        const content = readFileSync(full, 'utf8');
        if (content.includes(fragment)) hits.push(path.relative(ROOT, full));
      }
    }
  }
  return [...new Set(hits)].slice(0, 3);
}

console.log(`triage of ${rows.length} ghost(s)${only ? ` for ${only}` : ''}\n`);
for (const r of rows) {
  const [method, upstream] = [r.key.slice(0, r.key.indexOf(' ')), r.key.slice(r.key.indexOf(' ') + 1)];
  const svc = upstream.replace(/^\/v\d+\//, '').split('/')[0];
  const frag = upstream.replace(/^\/v\d+\/[^/]+\/?/, '').split('/:')[0];
  const dir = ENV_TO_DIR[svc] ?? null;
  const hits = dir && frag ? backendHasFragment(dir, frag) : [];
  const tag =
    r.kind === 'PARAM-WIDE' ? 'PARAM-WIDE' : r.clientExact > 0 ? 'USED-EXACT' : r.clientAny > 0 ? 'USED-SHAPE' : 'NO-CLIENT';
  console.log(`${tag.padEnd(11)} ${r.key}`);
  if (r.shadowedBy.length) console.log(`             shadowed by: ${r.shadowedBy.join(' | ')}`);
  if (r.clientFiles.length) console.log(`             client: ${r.clientFiles.join(', ')}`);
  if (r.kind === 'STATIC' && hits.length) console.log(`             backend fragment hit: ${hits.join(', ')}`);
}
console.log('\nsummary:');
const by = {};
for (const r of rows) by[r.kind === 'PARAM-WIDE' ? 'PARAM-WIDE' : r.clientExact > 0 ? 'USED-EXACT' : r.clientAny > 0 ? 'USED-SHAPE' : 'NO-CLIENT'] = (by[r.kind === 'PARAM-WIDE' ? 'PARAM-WIDE' : r.clientExact > 0 ? 'USED-EXACT' : r.clientAny > 0 ? 'USED-SHAPE' : 'NO-CLIENT'] ?? 0) + 1;
console.log(by);
