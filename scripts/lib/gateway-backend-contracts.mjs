/**
 * Gateway↔backend contract core.
 *
 * The gateway proxies by service prefix: `GET /api/v1/{service}/...` forwards
 * to `{upstream}/v1/{service}/...` (all path strategies except `no-prefix`),
 * so a SERVICE_CONFIGS endpoint entry is documentation — the real routing
 * decision happens upstream. When a declaration and the backend disagree,
 * the failure is silent: declared-but-missing returns 404/502 from the
 * upstream, backend routes absent from the doc block rot invisibly. Both
 * classes surfaced in a live pass (GET /lifestyle/city-guide and the whole
 * /genres service existed upstream but had no endpoint entries).
 *
 * This module diffs SERVICE_CONFIGS endpoint entries against the actual
 * NestJS controllers of each backend service:
 *
 *   1. Extract every @Controller('...') + @Get/@Post/@/@Put/@Patch/@Delete
 *      route from a backend directory (services/<group>/<svc> or apps/<app>).
 *      `@All()` expands to GET/POST/PUT/PATCH/DELETE. `@Version('')` /
 *      VERSION_NEUTRAL marks a route version-neutral (matches any /vX).
 *   2. Reconstruct the upstream path the gateway would forward to, from the
 *      service's own pathStrategy + version + pathRewrite (mirroring
 *      forwardRequest() in proxy.controller.ts).
 *   3. Diff both directions:
 *      - gateway-declared but backend-missing → would 404/502 at runtime
 *      - backend route not declared → undeclared upstream surface
 *
 * Known drift is frozen in scripts/route-contracts-baseline.json under
 * gatewayUndeclaredBackendRoutes / gatewayGhostEndpoints; ratchet semantics
 * are identical to unmatchedClientCalls (may only shrink).
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

/** The gateway's own source file (single source of SERVICE_CONFIGS truth). */
export const GATEWAY_PROXY_FILE =
  'services/gateway/api-gateway/src/modules/proxy/proxy.controller.ts';

/** HTTP methods @All() serves; kept as the canonical expansion list. */
export const ALL_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

/** Controller dirs that never serve gateway-proxied traffic. */
const SKIP_DIRS = new Set(['node_modules', 'dist', 'build', '__tests__', 'test', 'spec']);

/**
 * envKey → backend source directory (repo-root relative). Proxy controller
 * path names are single-source: local-dev.sh maps env vars to these dirs.
 */
export const ENV_TO_DIR = {
  AUTH_SERVICE_URL: 'services/core/auth-service',
  USER_SERVICE_URL: 'services/core/user-service',
  WALLET_SERVICE_URL: 'services/core/wallet-service',
  PAYMENT_SERVICE_URL: 'services/core/payment-service',
  CONTENT_SERVICE_URL: 'services/core/content-service',
  SEARCH_SERVICE_URL: 'services/core/search-service',
  MEDIA_SERVICE_URL: 'services/core/media-service',
  KNOWLEDGE_SERVICE_URL: 'services/core/knowledge-service',
  NOTIFICATION_SERVICE_URL: 'services/engagement/notification-service',
  REWARD_SERVICE_URL: 'services/engagement/reward-service',
  ENGAGEMENT_SERVICE_URL: 'services/engagement/engagement-service',
  MESSAGING_SERVICE_URL: 'services/engagement/messaging-service',
  REFERRAL_SERVICE_URL: 'services/engagement/referral-service',
  SUBSCRIPTION_SERVICE_URL: 'services/engagement/subscription-service',
  ANALYTICS_SERVICE_URL: 'services/intelligence/analytics-service',
  RECOMMENDATION_SERVICE_URL: 'services/intelligence/recommendation-service',
  MODERATION_SERVICE_URL: 'services/operations/moderation-service',
  QUEUE_SERVICE_URL: 'services/operations/queue-service',
  SUPPORT_SERVICE_URL: 'services/operations/support-service',
  REALITY_SERVICE_URL: 'services/universes/reality-service',
  MOVIE_SERVICE_URL: 'services/universes/movie-service',
  COMEDY_SERVICE_URL: 'services/universes/comedy-service',
  GAMES_SERVICE_URL: 'services/universes/games-service',
  LIFESTYLE_SERVICE_URL: 'services/universes/lifestyle-service',
  VERTICAL_SERVICE_URL: 'services/universes/vertical-service',
  CREATOR_SERVICE_URL: 'services/universes/creator-service',
  LIVE_EVENT_SERVICE_URL: 'services/universes/live-event-service',
  SPORTS_SERVICE_URL: 'services/universes/sports-service',
  /** The creator NestJS app (apps/creator), not the creator universe service. */
  CREATOR_APP_URL: 'apps/creator',
  ADMIN_SERVICE_URL: 'apps/admin',
};

/**
 * Backend routes that are intentionally not part of the public gateway
 * contract (internal health/metrics surfaces the gateway never proxies).
 * Keyed `METHOD path`. Advisory-only: still reported, never gates.
 */
const BACKEND_ROUTE_IGNORES = [/^\/health$/, /^\/health\//, /^\/metrics$/, /^\/live$/, /^\/ready$/];

/** Recursively collect controller files. */
function collectControllers(dir, out = []) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      collectControllers(full, out);
    } else if (entry.name.endsWith('.controller.ts')) {
      out.push(full);
    }
  }
  return out;
}

/**
 * Extract routes from one controller file:
 *   @Controller('lifestyle') + @Get('city-guide') → GET /lifestyle/city-guide
 *   @Controller() + @Get()                        → GET /
 * Returns [{ method, path, versionNeutral }] with gateway-style ':param'.
 */
export function extractControllerRoutes(content) {
  const routes = [];
  const controllerRe = /@Controller\(\s*(?:['"`]([^'"`]*)['"`])?\s*\)/g;
  const methodRe = /@(Get|Post|Put|Patch|Delete|All)\(\s*(?:['"`]([^'"`]*)['"`])?\s*\)/g;

  // Class-level: split the file into chunks per @Controller occurrence so a
  // file with several controller classes is handled correctly.
  const controllers = [];
  let cm;
  while ((cm = controllerRe.exec(content)) !== null) {
    controllers.push({
      prefix: cm[1] ?? '',
      start: cm.index,
      // Heuristic class span: up to the next @Controller or end of file.
      end: -1,
    });
  }
  for (let i = 0; i < controllers.length; i++) {
    controllers[i].end = i + 1 < controllers.length ? controllers[i + 1].start : content.length;
  }

  for (const controller of controllers) {
    const chunk = content.slice(controller.start, controller.end);
    let mm;
    methodRe.lastIndex = 0;
    while ((mm = methodRe.exec(chunk)) !== null) {
      const raw = mm[2] ?? '';
      // @All('*')-style catch-alls (proxy controllers) serve the controller
      // base path AND every subpath — represented as two routes so both the
      // exact base declaration and deeper declared paths match.
      const isCatchAll = raw.trim().startsWith('*');
      const normalized = normalizeNestPath(raw);
      // Find the decorator's parameter-list span: the route path may also be
      // declared via @HttpCode/@ApiOperation after it; none affect the path.
      const versionNeutral =
        versionNeutralNear(chunk, mm.index, mm.index + mm[0].length) ||
        /VERSION_NEUTRAL/.test(chunk.slice(mm.index, mm.index + 400));
      const methods = mm[1] === 'All' ? ['ALL'] : [mm[1].toUpperCase()];
      for (const method of methods) {
        routes.push({
          method,
          path: joinRoute(controller.prefix, isCatchAll ? '' : normalized),
          versionNeutral,
          catchAll: isCatchAll,
        });
      }
    }
  }
  return routes;
}

/** Look for @Version('') / VERSION_NEUTRAL near a route handler. */
const VERSION_RE = /@Version\(\s*(?:['"`]([^'"`]*)['"`]|VERSION_NEUTRAL)\s*\)/;

function versionNeutralNear(chunk, start, end) {
  const window = chunk.slice(Math.max(0, start - 200), end + 400);
  const m = window.match(VERSION_RE);
  return Boolean(m && (m[1] === '' || m[1] === undefined));
}

/** Collapse Nest path syntax to the gateway contract form. */
function normalizeNestPath(raw) {
  let p = raw
    // Query params have no business in route matching.
    .split('?')[0]
    // Nest wildcard redirect tokens.
    .replace(/\*.*$/, '')
    // @Param tokens are already :name; normalize any {name} too.
    .replace(/\{([a-zA-Z0-9_]+)\}/g, ':$1');
  p = '/' + p.split('/').filter(Boolean).join('/');
  return p === '/' ? '' : p;
}

function joinRoute(prefix, route) {
  const joined = `${prefix}${route}`;
  const p = '/' + joined.split('/').filter(Boolean).join('/');
  return p === '/' ? '/' : p.replace(/\/+$/, '');
}

/** Normalize a path for comparison: strip query, collapse slashes. */
function norm(p) {
  const q = ('/' + String(p ?? '').split('?')[0].split('/').filter(Boolean).join('/')).replace(
    /\/+$/,
    ''
  );
  return q === '/' ? '/' : q;
}

/** Segment-aware matcher: literal + :param wildcards, both directions. */
export function pathMatches(a, b) {
  const as = norm(a).split('/').filter(Boolean);
  const bs = norm(b).split('/').filter(Boolean);
  if (as.length !== bs.length) return false;
  for (let i = 0; i < as.length; i++) {
    if (as[i] !== bs[i]) return false;
  }
  return true;
}

/** Parse all SERVICE_CONFIGS blocks: service name → config + endpoints. */
export function parseServiceConfigs(content) {
  const configs = [];
  // Block start: `  {` then optional full-line // comments, then `    path:`.
  // Comment-tolerant because several blocks document their strategy inline
  // (e.g. /movies) — a strict regex silently swallowed the whole block into
  // the preceding service's config.
  const blockRe = /\n  \{\n(?:\s*\/\/[^\n]*\n)*\s*path:\s*'([^']+)'/g;
  let bm;
  const positions = [];
  while ((bm = blockRe.exec(content)) !== null) {
    positions.push({ service: bm[1].replace(/^\//, ''), start: bm.index });
  }
  for (let i = 0; i < positions.length; i++) {
    const { service, start } = positions[i];
    const end = i + 1 < positions.length ? positions[i + 1].start : content.length;
    const block = content.slice(start, end);
    const envKey = block.match(/envKey:\s*'([^']+)'/)?.[1] ?? null;
    const pathStrategy = block.match(/pathStrategy:\s*'([a-z-]+)'/)?.[1] ?? 'default';
    const defaultVersion = block.match(/defaultVersion:\s*'([^']+)'/)?.[1] ?? '1';
    const rewriteMatch = block.match(/pathRewrite:\s*\{([^}]*)\}/);
    const pathRewrite = {};
    if (rewriteMatch) {
      for (const rm of rewriteMatch[1].matchAll(/'([^']+)'\s*:\s*'([^']+)'/g)) {
        pathRewrite[rm[1]] = rm[2];
      }
    }
    const endpoints = [];
    for (const em of block.matchAll(/\{\s*method:\s*'([A-Za-z]+)'\s*,\s*path:\s*'([^']+)'/g)) {
      endpoints.push({ method: em[1].toUpperCase(), path: em[2] });
    }
    configs.push({ service, envKey, pathStrategy, defaultVersion, pathRewrite, endpoints });
  }
  return configs;
}

/**
 * Upstream URL path for a gateway call — mirrors forwardRequest():
 *   default/includes-prefix/auth-service-strategy → /v{v}/{service}{path}
 *   no-prefix                                     → /{service}{path}
 * then applies pathRewrite.
 */
export function upstreamPathFor(config, endpointPath, version) {
  const path = norm(endpointPath) === '/' ? '' : norm(endpointPath);
  let target;
  if (config.pathStrategy === 'no-prefix') {
    target = `/${config.service}${path}`;
  } else {
    target = `/v${version}/${config.service}${path}`;
  }
  for (const [pattern, replacement] of Object.entries(config.pathRewrite ?? {})) {
    target = target.replace(new RegExp(pattern), replacement);
  }
  return target;
}

/**
 * Reconstruct the upstream route for one controller route.
 *
 * Nest prepends the controller path to the version segment itself
 * (`@Controller('lifestyle/celebrities')` serves `/v1/lifestyle/celebrities`),
 * so a backend route only gains the `/v{version}` prefix — the service slug
 * is already part of the controller path. Version-neutral handlers
 * (@Version('') / VERSION_NEUTRAL) serve any /vX and are compared bare.
 * pathRewrite is NOT applied here: it rewrites the gateway-built path
 * before forwarding, so it belongs to the declared side only.
 */
function upstreamFor(config, route) {
  const p = norm(route.path);
  return route.versionNeutral ? p : `/v${config.defaultVersion}${p}`;
}

/** Aggregate backend routes for a directory → list of { method, path, file }. */
function backendRoutesForDir(root, dir) {
  const list = [];
  let files = [];
  try {
    files = collectControllers(path.join(root, dir));
  } catch {
    return list;
  }
  for (const file of files) {
    let content;
    try {
      content = readFileSync(file, 'utf8');
    } catch {
      continue;
    }
    const relFile = path.relative(root, file);
    for (const route of extractControllerRoutes(content)) {
      if (BACKEND_ROUTE_IGNORES.some((re) => re.test(norm(route.path)))) continue;
      // @All() stays a single 'ALL' pseudo-method: it serves every verb, so
      // it satisfies any declared method (ghost check) and is reported once
      // (undeclared check) instead of exploding 5×.
      if (route.catchAll) {
        list.push({ method: route.method, path: norm(route.path), file: relFile });
        list.push({ method: route.method, path: `${norm(route.path)}/**`, file: relFile });
      } else {
        list.push({ method: route.method, path: norm(route.path), file: relFile });
      }
    }
  }
  return list;
}

/**
 * Full gateway↔backend diff.
 * Returns { configs, results, stats } where results is per service:
 *   { service, backendDir?, ghost: [...], undeclared: [...], skipped? }
 *   ghost      = declared in SERVICE_CONFIGS, absent upstream
 *   undeclared = backend route with no declaration
 * Each violation is "{METHOD} {upstreamPath}" (+ origin file for undeclared).
 */
export function diffGatewayBackend(root, gatewayContent) {
  const configs = parseServiceConfigs(gatewayContent);
  const results = [];
  let servicesCompared = 0;
  let backendRoutesTotal = 0;
  let declaredTotal = 0;

  // Several gateway services share one upstream (public/content/universe →
  // content-service); declarations must be pooled per backend directory, or
  // every sibling service would flag the shared routes as undeclared.
  const byDir = new Map(); // dir -> { configs, backendUpstream }
  const order = [];
  for (const config of configs) {
    const dir = ENV_TO_DIR[config.envKey ?? ''];
    if (!dir) {
      results.push({ service: config.service, skipped: 'unknown envKey' });
      continue;
    }
    if (!byDir.has(dir)) {
      const backendList = backendRoutesForDir(root, dir);
      const backendUpstream = new Map(); // "METHOD upstream" -> first file
      for (const route of backendList) {
        const key = `${route.method} ${upstreamFor(config, route)}`;
        if (!backendUpstream.has(key)) backendUpstream.set(key, route.file);
      }
      byDir.set(dir, { configs: [], backendUpstream });
      order.push(dir);
    }
    byDir.get(dir).configs.push(config);
  }

  for (const dir of order) {
    const { configs: dirConfigs, backendUpstream } = byDir.get(dir);
    const primary = dirConfigs[0];
    const declaredAll = dirConfigs.flatMap((c) =>
      c.endpoints.map((ep) => ({ ...ep, config: c }))
    );
    declaredTotal += declaredAll.length;
    backendRoutesTotal += backendUpstream.size;
    servicesCompared++;

    // Declared endpoint → does an upstream route match? Both sides are
    // compared in UPSTREAM form: endpoint + strategy transforms vs backend
    // route + /v{version}.
    const ghost = [];
    for (const ep of declaredAll) {
      const upstream = upstreamPathFor(ep.config, ep.path, ep.config.defaultVersion);
      const matched = [...backendUpstream.keys()].some((key) => {
        const [m, p] = key.split(' ');
        // An @All() upstream route serves every verb.
        return (m === ep.method || m === 'ALL') && segmentMatch(p, upstream);
      });
      if (!matched) {
        ghost.push({
          method: ep.method,
          path: upstream,
          service: ep.config.service,
          declared: ep.path,
        });
      }
    }

    // Backend route → is it declared by ANY service on this upstream? An
    // @All() route ('ALL') is satisfied by a declaration with any verb.
    const undeclared = [];
    for (const [key, file] of backendUpstream) {
      const [method, upstream] = key.split(' ');
      const declared = declaredAll.some((ep) => {
        const epUpstream = upstreamPathFor(ep.config, ep.path, ep.config.defaultVersion);
        return (ep.method === method || method === 'ALL') && segmentMatch(upstream, epUpstream);
      });
      if (!declared) {
        undeclared.push({ method, path: upstream, file });
      }
    }

    // One result entry per gateway service: each carries its own ghost
    // subset; undeclared routes are a property of the shared upstream, so
    // they are reported once, under the primary (first) service on it.
    for (const config of dirConfigs) {
      results.push({
        service: config.service,
        backendDir: dir,
        ghost: ghost.filter((g) => g.service === config.service),
        undeclared: config === primary ? undeclared : [],
      });
    }
  }

  return { configs, results, stats: { servicesCompared, backendRoutesTotal, declaredTotal } };
}

/** Baseline key for a declared-but-backend-missing endpoint (ghost). */
export function ghostKey(g) {
  return `ghost:${g.service}:${g.method} ${g.path}`;
}

/** Baseline key for an undeclared backend route (scoped to its upstream dir —
 * identical upstream paths can exist in different services). */
export function undeclaredKey(u, backendDir) {
  return `undeclared:${backendDir ?? ''}:${u.method} ${u.path}`;
}

/**
 * Segment match where ':param' on either side matches any non-empty segment
 * (no catch-all handling needed: Nest wildcards were stripped and gateway
 * paths have no ** semantics).
 */
function segmentMatch(a, b) {
  const as = norm(a).split('/').filter(Boolean);
  const bs = norm(b).split('/').filter(Boolean);
  const ai = as.indexOf('**');
  const bi = bs.indexOf('**');
  if (ai === -1 && bi === -1) {
    for (let i = 0; i < Math.max(as.length, bs.length); i++) {
      if (as.length !== bs.length) return false;
      const x = as[i];
      const y = bs[i];
      if (x.startsWith(':') || y.startsWith(':')) continue;
      if (x !== y) return false;
    }
    return true;
  }
  // A trailing '**' (catch-all proxy route) matches the fixed prefix plus at
  // least one further segment of the other path.
  const pat = ai !== -1 ? as : bs;
  const other = ai !== -1 ? bs : as;
  const star = pat.indexOf('**');
  if (star !== pat.length - 1) return false;
  if (other.length < pat.length) return false;
  for (let i = 0; i < star; i++) {
    const x = pat[i];
    const y = other[i];
    if (x.startsWith(':') || y.startsWith(':')) continue;
    if (x !== y) return false;
  }
  return true;
}
