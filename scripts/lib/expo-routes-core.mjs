/**
 * Expo Router dead-link check — rule core.
 *
 * Every `router.push/replace/navigate('/...')` and `href="/..."` in an Expo
 * Router app must resolve to a route file under that app's `app/` directory.
 * A target with no matching route throws at navigation time ("Unhandled
 * route") / silently no-ops on web — the exact class of dead buttons this
 * check exists to prevent (it was written after a live pass found pushes to
 * routes that had never existed, e.g. `/rewards/redeem-options` consumers
 * and `/music/${id}` with no `/music/[id].tsx`).
 *
 * Matching rules (per app):
 *  - Route files: every `.ts`/`.tsx` under the app's Expo Router directory
 *    except layouts (`_layout.tsx`), private folders (`_*`), and special
 *    files (`+*.tsx`). Group segments
 *    `(group)` and the `index` filename are dropped, `[param]` is dynamic,
 *    `[...all]` matches one-or-more segments, `[[...all]]` zero-or-more.
 *  - Targets: string/template literals passed to `router.push`,
 *    `router.replace`, `router.navigate` or assigned to `href=`. Query
 *    strings (`?a=b`) are ignored; group segments in the target are dropped;
 *    segments containing `${...}` are dynamic and may only be filled by a
 *    dynamic route segment (a literal `${}` segment can never match a static
 *    route, and a literal target segment CAN fill a `[param]` route — both
 *    are real Expo Router behavior).
 *
 * Excluded from the scan: `__tests__`, `*.test.*`, `*.spec.*` files, and any
 * path component starting with `.` (`.expo`, `.expo-shared`, ...).
 *
 * Targets listed in EXPO_ROUTE_ALLOWLIST (below) are skipped — every entry
 * needs a `reason`. Run: `node scripts/check-expo-routes.mjs`
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

/** Apps without an `app/` directory are skipped (non-Expo workspaces). */
const APPS_DIR = 'apps';

/**
 * Targets that are known-bad but deliberately tolerated, with the reason.
 * Keep EMPTY — prefer creating the missing route over allowlisting.
 * Shape: { app: 'mobile' | 'tv' | <dir name>, target: '/exact/target', reason }
 */
export const EXPO_ROUTE_ALLOWLIST = [];

const SKIP_DIRS = new Set(['node_modules', '__tests__', '__mocks__', 'dist', 'build']);

const NAV_RE = /\brouter\s*\.\s*(?:push|replace|navigate)\s*\(\s*(['"`])([^'"`]*)\1/g;
const HREF_RE = /\bhref\s*=\s*\{?\s*(['"`])(\/[^'"`]*)\1/g;

/** Recursively collect source files under `dir`, skipping generated/tests. */
function collectFiles(dir, out) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue; // .expo, .expo-shared, ...
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      collectFiles(path.join(dir, entry.name), out);
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      if (/(\.test\.|\.spec\.)|(^|\/)_/.test(entry.name)) continue;
      out.push(path.join(dir, entry.name));
    }
  }
  return out;
}

/** Expo Router route path for a file, or null for layouts/special files. */
function toRoutePath(appDir, file) {
  const rel = path.relative(appDir, file).split(path.sep).join('/');
  const parts = rel.split('/');
  const fileName = parts[parts.length - 1];
  // Layouts, private folders and +specials are not routes.
  if (fileName.startsWith('_') || fileName.startsWith('+')) return null;
  let base = fileName.replace(/\.(ts|tsx)$/, '');
  if (base === 'index') parts.pop();
  else parts[parts.length - 1] = base;
  const segments = [];
  for (const part of parts) {
    if (part.startsWith('(') && part.endsWith(')')) continue; // route group
    if (part.startsWith('_')) return null; // file inside a private folder
    segments.push(part);
  }
  return '/' + segments.join('/');
}

function isDynamicSegment(seg) {
  return (
    (seg.startsWith('[') && seg.endsWith(']')) ||
    (seg.startsWith('(') && seg.endsWith(')') && seg.includes('...'))
  );
}

function isCatchAll(seg) {
  return seg.startsWith('[...') || seg.startsWith('[[...');
}

/** Split a URL path into route segments, dropping route groups. */
function splitSegments(routePath) {
  return routePath
    .split('?')[0]
    .split('/')
    .filter((s) => s.length > 0)
    .filter((s) => !(s.startsWith('(') && s.endsWith(')') && !s.includes('...')));
}

/**
 * Does `target` resolve to any route in `routes`?
 * Segment-wise: literal target segments match themselves or a dynamic route
 * segment; `${...}` target segments only match dynamic route segments.
 */
export function targetResolves(target, routes) {
  const rawSegs = splitSegments(target).map((seg) =>
    seg.includes('${') ? { dynamic: true } : { dynamic: false, value: seg }
  );
  if (rawSegs.length === 0) return routes.has('/'); // '/' or a group-only path

  for (const route of routes.keys()) {
    const routeSegs = splitSegments(route);
    if (matchesRoute(rawSegs, routeSegs)) return true;
  }
  return false;
}

function matchesRoute(targetSegs, routeSegs) {
  let t = 0;
  for (let r = 0; r < routeSegs.length; r++) {
    const rs = routeSegs[r];
    if (isCatchAll(rs)) {
      // Catch-all consumes the rest; optional catch-all may consume none.
      const optional = rs.startsWith('[[...');
      return optional || targetSegs.length - t > 0;
    }
    if (t >= targetSegs.length) return false;
    const ts = targetSegs[t];
    if (ts.dynamic) {
      if (!isDynamicSegment(rs)) return false;
    } else if (isDynamicSegment(rs)) {
      // literal fills a param — allowed
    } else if (ts.value !== rs) {
      return false;
    }
    t++;
  }
  return t === targetSegs.length;
}

/** Scan one app workspace; returns { routes, filesScanned, targets, violations }. */
export function scanApp(appDir, appName) {
  const routesDir = path.join(appDir, 'app');
  if (!statSyncSafe(routesDir)) {
    return { routes: new Map(), filesScanned: 0, targets: 0, violations: [] };
  }

  const routes = new Map(); // routePath -> file (first wins)
  for (const file of collectFiles(routesDir, [])) {
    const routePath = toRoutePath(routesDir, file);
    if (routePath !== null && !routes.has(routePath)) {
      routes.set(routePath, path.relative(appDir, file));
    }
  }

  // Navigation also happens from src/ (feature modules, shared screens).
  const searchDirs = [routesDir, path.join(appDir, 'src')].filter((d) => statSyncSafe(d));

  const violations = [];
  let filesScanned = 0;
  let targets = 0;

  for (const dir of searchDirs) {
    for (const file of collectFiles(dir, [])) {
      let content;
      try {
        content = readFileSync(file, 'utf8');
      } catch {
        continue;
      }
      filesScanned++;
      const relFile = path.relative(appDir, file);

      for (const re of [NAV_RE, HREF_RE]) {
        re.lastIndex = 0;
        let m;
        while ((m = re.exec(content)) !== null) {
          const rawTarget = m[2];
          if (!rawTarget.startsWith('/')) continue; // relative/protocol links
          targets++;
          const line = content.slice(0, m.index).split('\n').length;
          const normalized = '/' + splitSegments(rawTarget).join('/');

          const allowed = EXPO_ROUTE_ALLOWLIST.some(
            (a) => a.app === appName && a.target === normalized
          );
          if (allowed) continue;

          if (!targetResolves(rawTarget, routes)) {
            violations.push({
              app: appName,
              file: relFile,
              line,
              target: rawTarget,
              hint: rawTarget.includes('${')
                ? 'dynamic target has no matching route (check for a [param] segment)'
                : 'no route file matches this path',
            });
          }
        }
      }
    }
  }

  return { routes, filesScanned, targets, violations };
}

function statSyncSafe(p) {
  try {
    return statSync(p).isDirectory();
  } catch {
    return false;
  }
}

/** Entry used by both the CLI and the unit tests. */
export function runExpoRouteChecks(root) {
  const appsRoot = path.join(root, APPS_DIR);
  const errors = [];
  const stats = { appsScanned: 0, filesScanned: 0, targetsChecked: 0, routesFound: 0 };

  let appDirs = [];
  try {
    appDirs = readdirSync(appsRoot, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name);
  } catch {
    return { errors: [`apps/ directory not found at ${appsRoot}`], stats };
  }

  for (const name of appDirs) {
    const appDir = path.join(appsRoot, name);
    if (!statSyncSafe(path.join(appDir, 'app'))) continue; // not an Expo app
    const { routes, filesScanned, targets, violations } = scanApp(appDir, name);
    stats.appsScanned++;
    stats.filesScanned += filesScanned;
    stats.targetsChecked += targets;
    stats.routesFound += routes.size;
    for (const v of violations) {
      errors.push(
        `apps/${name}/${v.file}:${v.line}: navigates to '${v.target}' — ${v.hint} in apps/${name}`
      );
    }
  }

  return { errors, stats };
}
