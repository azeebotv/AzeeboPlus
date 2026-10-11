#!/usr/bin/env node
// ============================================================================
// figma-route-coverage.mjs — Figma frame ↔ shipped route coverage map
//
// The design rollout has two questions this answers mechanically:
//   • Which shipped public pages have a Figma frame behind them, and which are
//     being built from the design SYSTEM (tokens + shared classes) alone?
//   • Which frames in the spec's layer inventory point at routes that no
//     longer exist (a renamed or deleted page the doc still claims)?
//
// The inventory in docs/design/figma-azeebo-screen-spec.md §1 is the single
// source of truth: frames are grouped per section, each group carries the
// routes it maps onto. This script re-derives the map from that markdown on
// every run instead of shadowing it with a second hand-maintained ledger —
// the doc and the tree cannot silently disagree, because the doc IS parsed.
// If a section parses to nothing, that is reported as a parse failure (exit 2)
// rather than as "0 frames", so a rewritten heading can never masquerade as
// full coverage.
//
// Usage:
//   node scripts/figma-route-coverage.mjs              # human report
//   node scripts/figma-route-coverage.mjs --json       # machine-readable
//   node scripts/figma-route-coverage.mjs --fail-on-drift   # CI posture
//   node scripts/figma-route-coverage.mjs --surface=web     # one surface
//
// Known limitation, on purpose rather than by accident: the inventory names
// routes in WEB path form (`/auth/login`), while Expo Router flattens mobile
// route groups (`(auth)/login.tsx` -> `/login`). Mobile therefore reports
// "uncovered" for pages that exist under a different spelling — read that list
// as candidates to re-capture from Figma, not as a verdict. Dangling IS judged
// across both surfaces, so a pattern counts as drift only when nothing ships it.
//
// Exit codes: 0 = map resolved, 1 = drift (--fail-on-drift and something is
// dangling), 2 = the inventory could not be parsed at all.
// ============================================================================

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { scanApp } from './lib/expo-routes-core.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const SPEC_PATH = 'docs/design/figma-azeebo-screen-spec.md';
export const SURFACE_ROOTS = {
  web: 'apps/web/src/app',
  mobile: 'apps/mobile',
};
/** Each surface's router decides what "a route" means. */
export const SURFACE_ENUMERATORS = {
  web: 'next',
  mobile: 'expo',
};

/** Route prefixes that are not design surfaces. */
export const NON_PAGE_ROUTES = [/^\/api\//, /^\/_next/, /^\/_not-found/];

/**
 * Parse §1 ("Frame Inventory") of the screen spec into
 * `[{ group, frames: string[], routes: string[] }]`.
 *
 * Accepted shapes per bullet:
 *   • `- **Name:** \`Frame A\`, \`Frame B\` → \`/route-a\`, \`/route-b\``
 *   • a frame line followed by `→ existing routes: \`/a\`, \`/b\``
 * Frames without any route (design-system specimens) are kept with an empty
 * route list — they are coverage the other way round (a frame with no page).
 */
export function parseInventory(markdown) {
  const lines = markdown.split('\n');
  const start = lines.findIndex((l) => /^##\s+1\.\s+Frame Inventory/i.test(l));
  if (start === -1) return null;
  let end = lines.findIndex((l, i) => i > start && /^##\s+\d+\./.test(l));
  if (end === -1) end = lines.length;

  const groups = [];
  let section = 'Universe';
  let pending = null;
  const push = (group, frames, routeText) => {
    const routes = extractRoutes(routeText);
    groups.push({ group, frames, routes, routesDeclared: routeText.length > 0 });
  };
  // A frames-only line is a real group too (type specimens, screenshot piles),
  // so it must be flushed when the next heading or the end of §1 arrives rather
  // than dropped for lack of a route line.
  const flush = () => {
    if (pending) {
      push(pending.groupName, pending.frames, '');
      pending = null;
    }
  };

  for (const raw of lines.slice(start + 1, end)) {
    const line = raw.trim();
    if (!line || line.startsWith('---')) continue;
    // Blockquote notes (the section carries one explaining this very parser)
    // are prose about the inventory, never inventory themselves.
    if (line.startsWith('>')) {
      flush();
      continue;
    }
    const heading = line.match(/^#{2,4}\s+(.+)/);
    if (heading) {
      flush();
      section = heading[1].trim();
      continue;
    }
    const named = line.match(/^[-*]?\s*\*\*(.+?):\*\*\s*(.*)$/);
    const groupName = named ? `${section} / ${named[1].trim()}` : section;
    const body = named ? named[2] : line;
    const arrow = body.search(/→|->/);
    const frameText = arrow === -1 ? body : body.slice(0, arrow);
    const routeText = arrow === -1 ? '' : body.slice(arrow);
    const frames = backticked(frameText);

    if (arrow === -1) {
      if (frames.length === 0) {
        // A declared group whose frames live below the top level (prose only),
        // or plain commentary. Named groups are inventory and are kept.
        flush();
        if (named) push(groupName, [], '');
        continue;
      }
      // Consecutive frames-only bullets describe ONE section (the spec's
      // "Design System" lists type specimens then buttons); they accumulate
      // instead of replacing each other.
      if (pending && pending.groupName === groupName) {
        pending.frames.push(...frames);
        continue;
      }
      flush();
      pending = { groupName, frames };
      continue;
    }
    if (pending) {
      push(pending.groupName, [...pending.frames, ...frames], routeText || body);
      pending = null;
      continue;
    }
    push(groupName, frames, routeText);
  }
  flush();
  return groups.length ? groups : null;
}

function backticked(text) {
  return (text.match(/`([^`]+)`/g) || []).map((s) => s.slice(1, -1).trim());
}

/** `/a`, `/watch/[id]`, `/comedy/*` → route patterns (deduped, sorted). */
function extractRoutes(text) {
  const found = (text.match(/\/[A-Za-z0-9_[\]*\-/]*/g) || [])
    .map((r) => r.replace(/\/+$/, '') || '/')
    .filter((r) => r !== '/');
  return [...new Set(found)].sort();
}

/**
 * Enumerate shipped Next.js App Router routes under a surface root.
 * Directories are segments, `(group)` folders are invisible, `page.tsx` marks
 * a renderable route, and dynamic `[id]`/`[...slug]` stay as patterns.
 */
export function listNextRoutes(dir, prefix = '') {
  const routes = [];
  if (!existsSync(dir)) return routes;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isFile()) {
      if (/^page\.(tsx|jsx|ts|js)$/.test(entry.name)) routes.push(prefix || '/');
      continue;
    }
    if (!entry.isDirectory()) continue;
    const segment = entry.name;
    if (/^(api|node_modules|dist|__tests__|\.[\w-]+)$/.test(segment)) continue;
    if (/^\(.+\)$/.test(segment)) {
      routes.push(...listNextRoutes(abs, prefix));
      continue;
    }
    routes.push(...listNextRoutes(abs, `${prefix}/${segment}`));
  }
  return [...new Set(routes)].sort();
}

/** Expo Router routes for an app workspace (app/ tree, groups stripped). */
export function listExpoRoutes(appDir) {
  return [...scanApp(appDir, path.basename(appDir)).routes.keys()].sort();
}

export function listSurfaceRoutes(surface, repoRoot) {
  const root = path.join(repoRoot, SURFACE_ROOTS[surface]);
  return SURFACE_ENUMERATORS[surface] === 'expo' ? listExpoRoutes(root) : listNextRoutes(root);
}

/** Does a spec pattern (which may end in `/*`) cover a real route? */
export function patternResolves(pattern, routes) {
  if (pattern.endsWith('/*')) {
    const base = pattern.slice(0, -2);
    return routes.some((r) => r === base || r.startsWith(`${base}/`));
  }
  return routes.includes(pattern);
}

/**
 * Per surface: the patterns that resolve there. Globally: patterns that resolve
 * NOWHERE — a frame in the spec pointing at a route no surface ships any more
 * (renamed or deleted page the doc still claims). Dangling is deliberately
 * global: the inventory names routes in web form, so counting every web pattern
 * as "missing on mobile" would drown the real signal.
 */
export function classify(groups, routesBySurface) {
  const perSurface = {};
  const all = new Set(Object.values(routesBySurface).flat());
  for (const [surface, routes] of Object.entries(routesBySurface)) {
    perSurface[surface] = groups.flatMap((g) =>
      g.routes
        .filter((r) => patternResolves(r, routes))
        .map((pattern) => ({ group: g.group, pattern }))
    );
  }
  const dangling = [];
  for (const g of groups) {
    for (const r of g.routes)
      if (!patternResolves(r, [...all])) dangling.push({ group: g.group, pattern: r });
  }
  return { perSurface, dangling };
}

/** Shipped routes no frame group claims — the "build it from the system" list. */
export function uncoveredRoutes(groups, routes) {
  const claimed = groups.flatMap((g) => g.routes);
  return routes.filter(
    (r) =>
      !NON_PAGE_ROUTES.some((re) => re.test(r)) &&
      !claimed.some((c) => (c.endsWith('/*') ? r.startsWith(c.slice(0, -2)) : c === r))
  );
}

function frameCount(groups) {
  return groups.reduce((n, g) => n + g.frames.length, 0);
}

export function buildReport(repoRoot = ROOT, surfaces = Object.keys(SURFACE_ROOTS)) {
  const specFile = path.join(repoRoot, SPEC_PATH);
  if (!existsSync(specFile)) {
    throw new Error(`screen spec missing: ${SPEC_PATH}`);
  }
  const groups = parseInventory(readFileSync(specFile, 'utf8'));
  if (!groups) return { parseFailed: true, surfaces: {} };

  const routesBySurface = {};
  // Dangling is judged against EVERY surface even when the run is filtered to
  // one, so `--surface=mobile` cannot invent drift that does not exist.
  for (const surface of Object.keys(SURFACE_ROOTS)) {
    routesBySurface[surface] = listSurfaceRoutes(surface, repoRoot);
  }
  const { perSurface, dangling } = classify(groups, routesBySurface);

  const out = {
    parseFailed: false,
    frames: frameCount(groups),
    groups: groups.length,
    dangling,
    surfaces: {},
  };
  for (const surface of surfaces) {
    const routes = routesBySurface[surface] ?? [];
    out.surfaces[surface] = {
      root: SURFACE_ROOTS[surface],
      router: SURFACE_ENUMERATORS[surface],
      routeCount: routes.length,
      mapped: perSurface[surface] ?? [],
      uncovered: uncoveredRoutes(groups, routes),
    };
  }
  return out;
}

function format(report) {
  if (report.parseFailed) {
    return '✗ Could not parse §1 "Frame Inventory" of the screen spec — the section was renamed or removed, so coverage is unknown (not zero).';
  }
  const lines = [
    `Inventory: ${report.frames} frames in ${report.groups} groups.`,
    ...(report.dangling.length
      ? [
          'dangling (a frame claims a route no surface ships):',
          ...report.dangling.map((d) => `  · ${d.pattern}  [${d.group}]`),
        ]
      : ['no dangling patterns.']),
    '',
  ];
  for (const [surface, s] of Object.entries(report.surfaces)) {
    lines.push(
      `── ${surface} (${s.root}, ${s.router}) — ${s.routeCount} routes, ${s.mapped.length} mapped pattern(s) resolve here, ${s.uncovered.length} uncovered`
    );
    if (s.uncovered.length) {
      lines.push('  uncovered (shipped, no frame — build it from the token system):');
      lines.push(`    ${s.uncovered.join('  ')}`);
    }
  }
  return lines.join('\n');
}

const invokedDirectly =
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (invokedDirectly) {
  const args = process.argv.slice(2);
  const surfaceArg = args.find((a) => a.startsWith('--surface='));
  let surfaces = Object.keys(SURFACE_ROOTS);
  if (surfaceArg) {
    const wanted = surfaceArg.split('=')[1];
    if (!SURFACE_ROOTS[wanted]) {
      console.error(`--surface must be one of: ${surfaces.join(', ')}`);
      process.exit(2);
    }
    surfaces = [wanted];
  }
  const report = buildReport(ROOT, surfaces);
  if (args.includes('--json')) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(format(report));
  }
  if (report.parseFailed) process.exit(2);
  if (args.includes('--fail-on-drift') && report.dangling.length) process.exit(1);
}
