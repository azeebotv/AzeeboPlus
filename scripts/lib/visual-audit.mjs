// ============================================================================
// visual-audit.mjs — the pure half of the full-route visual gate
// ============================================================================
// The gate (scripts/visual-audit.mjs) renders every static route in a headless
// browser and asks four questions a reader would ask: is anything wider than the
// viewport, is any text cut off, is any image missing, and can the text be read
// against what is behind it? Everything that can be answered without a browser
// lives here so it can be tested in the conventions job:
//
//   discoverWebRoutes / discoverPortalRoutes  — which routes exist
//   contrastRatio / requiredRatio             — the WCAG 2.2 AA rule
//   elementLabel / findingIdentity            — what a finding *is*, stably
//   diffAllowlist                             — which findings are excused
//
// The identity problem is the whole reason this module exists. A finding has to
// keep the same name when the copy around it changes, or the allowlist becomes a
// churn machine: "white on flame at 12px" is the defect, not "the span at
// x=412,y=980 of the third card on /movies". Identities are therefore built from
// the *cause* (a colour pair, an element's class signature, an image's host and
// path) and never from text content or geometry.
// ============================================================================

import fs from 'node:fs';
import path from 'node:path';

/** The checks the gate runs. Keep in sync with the CLI's --checks help. */
export const CHECKS = ['overflow', 'clipped-text', 'broken-image', 'contrast', 'route-error'];

export const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  mobile: { width: 390, height: 844 },
};

/** App → where its routes come from. */
export const APP_ROUTE_SOURCES = {
  web: { kind: 'next-app', dir: 'apps/web/src/app' },
  admin: { kind: 'react-router', entry: 'apps/admin/client/src/App.tsx' },
  creator: { kind: 'react-router', entry: 'apps/creator/client/src/App.tsx' },
};

export const DEFAULT_BASE_URLS = {
  web: 'http://localhost:4000',
  admin: 'http://localhost:5173',
  creator: 'http://localhost:5174',
};

// ---------------------------------------------------------------------------
// Route discovery
// ---------------------------------------------------------------------------

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '__tests__') continue;
      walk(full, out);
    } else if (entry.name === 'page.tsx' || entry.name === 'page.ts' || entry.name === 'page.jsx') {
      out.push(full);
    }
  }
  return out;
}

/**
 * Every static route in the Next.js app, derived from the tree.
 *
 * Dynamic segments (`[id]`, `[...slug]`) are skipped: they need real ids to
 * render anything but a not-found state, and auditing forty copies of the same
 * not-found page buys nothing. Route groups (`(tabs)`) contribute no segment —
 * Next strips them from the URL.
 */
export function discoverWebRoutes(root) {
  const appDir = path.join(root, APP_ROUTE_SOURCES.web.dir);
  const routes = new Set();
  for (const file of walk(appDir)) {
    const relative = path.relative(appDir, file).replace(/(?:^|[\\/])page\.(?:tsx|ts|jsx)$/, '');
    if (/\[.+\]/.test(relative)) continue;
    const segments = relative.split(/[\\/]/).filter((s) => s && !/^\(.*\)$/.test(s));
    routes.add(segments.length ? `/${segments.join('/')}` : '/');
  }
  return [...routes].sort();
}

/**
 * Every static route in a React Router portal, read from its route table.
 *
 * The portals mount at their own origin root, so the paths in `App.tsx` are the
 * real URLs. Route entries with a `:param` are skipped for the same reason as
 * Next's dynamic segments. A redirect/hand-off route is a route too — the audit
 * records it and moves on rather than following it.
 */
export function discoverPortalRoutes(root, app) {
  const source = APP_ROUTE_SOURCES[app];
  if (!source || source.kind !== 'react-router') {
    throw new Error(`discoverPortalRoutes: ${app} has no react-router route table`);
  }
  const content = fs.readFileSync(path.join(root, source.entry), 'utf8');
  const routes = new Set(['/']);
  for (const match of content.matchAll(/path="([^"]+)"/g)) {
    const route = match[1];
    if (route.includes(':') || route === '*') continue;
    routes.add(route.startsWith('/') ? route : `/${route}`);
  }
  return [...routes].sort();
}

/** Routes for one app, whichever kind it is. */
export function discoverRoutes(root, app) {
  const source = APP_ROUTE_SOURCES[app];
  if (!source)
    throw new Error(`unknown app: ${app} (expected ${Object.keys(APP_ROUTE_SOURCES).join(', ')})`);
  return source.kind === 'next-app' ? discoverWebRoutes(root) : discoverPortalRoutes(root, app);
}

// ---------------------------------------------------------------------------
// Contrast (WCAG 2.2 AA: 1.4.3)
// ---------------------------------------------------------------------------

/** `rgb(15, 15, 15)` / `rgba(0,0,0,.5)` / `#0f0f0f` → {r,g,b,a}, else null. */
export function parseCssColor(value) {
  if (typeof value !== 'string') return null;
  const text = value.trim().toLowerCase();
  if (text.startsWith('#')) {
    const hex = text.slice(1);
    const expanded = hex.length === 3 ? hex.replace(/./g, (c) => c + c) : hex;
    if (!/^[0-9a-f]{6}([0-9a-f]{2})?$/.test(expanded)) return null;
    return {
      r: parseInt(expanded.slice(0, 2), 16),
      g: parseInt(expanded.slice(2, 4), 16),
      b: parseInt(expanded.slice(4, 6), 16),
      a: expanded.length === 8 ? parseInt(expanded.slice(6, 8), 16) / 255 : 1,
    };
  }
  const match = text.match(/rgba?\(([^)]+)\)/);
  if (!match) return null;
  const parts = match[1]
    .split(/[,/\s]+/)
    .filter(Boolean)
    .map(Number);
  if (parts.length < 3 || parts.slice(0, 3).some((n) => !Number.isFinite(n))) return null;
  return { r: parts[0], g: parts[1], b: parts[2], a: parts.length > 3 ? parts[3] : 1 };
}

export function relativeLuminance({ r, g, b }) {
  const channel = (value) => {
    const v = value / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** Contrast ratio between two opaque colours, 1–21. */
export function contrastRatio(foreground, background) {
  const a = relativeLuminance(foreground);
  const b = relativeLuminance(background);
  const [high, low] = a > b ? [a, b] : [b, a];
  return Number(((high + 0.05) / (low + 0.05)).toFixed(2));
}

/**
 * The AA floor for a piece of text. Large text — 24px, or 18.66px bold — is
 * held to 3:1; everything else to 4.5:1.
 */
export function requiredRatio(fontSizePx, fontWeight = 400) {
  const large = fontSizePx >= 24 || (fontSizePx >= 18.66 && Number(fontWeight) >= 700);
  return large ? 3 : 4.5;
}

/**
 * Opaque colour stops of a CSS gradient, or null when the gradient cannot be
 * judged from CSS alone (a url() layer, a stop below ~90% alpha, no stops).
 *
 * Text over a gradient is still text: the audit measures it against every stop
 * and fails if any one of them fails, because a label can sit on the light end.
 */
export function parseGradientColors(backgroundImage) {
  if (typeof backgroundImage !== 'string' || !/gradient\(/i.test(backgroundImage)) return null;
  const stops = [];
  for (const match of backgroundImage.matchAll(/#[0-9a-f]{3,8}\b|rgba?\([^)]*\)/gi)) {
    const color = parseCssColor(match[0]);
    if (!color) continue;
    // A translucent stop lets whatever is underneath show through, and that is
    // not in the string — the whole gradient becomes unmeasurable.
    if (color.a < 0.9) return null;
    stops.push(color);
  }
  if (!stops.length) return null;
  const unique = new Map();
  for (const stop of stops) unique.set(`${stop.r},${stop.g},${stop.b}`, stop);
  return [...unique.values()];
}

/** `rgb(15, 15, 15)` for a parsed colour — the shape the browser reports. */
export function formatCssColor({ r, g, b }) {
  return `rgb(${r}, ${g}, ${b})`;
}

/** The whole rule in one call, so the browser side and the tests agree. */
export function evaluateContrast({ foreground, background, fontSizePx, fontWeight = 400 }) {
  const fg = parseCssColor(foreground);
  const bg = parseCssColor(background);
  if (!fg || !bg) return null;
  const ratio = contrastRatio(fg, bg);
  const required = requiredRatio(fontSizePx, fontWeight);
  return { ratio, required, passes: ratio + 1e-9 >= required };
}

// ---------------------------------------------------------------------------
// Finding identity
// ---------------------------------------------------------------------------

/**
 * A stable name for an element: tag, id, and the class tokens that describe how
 * it was styled — never its text or position. Tailwind tokens are the closest
 * thing this codebase has to a stable selector, and the sort keeps the label
 * independent of class order (`str_replace` reorders them more often than you'd
 * expect).
 *
 * Variant tokens (`md:bg-az-flame`, `group-hover:text-az-ink`) and the group/peer
 * marker classes are dropped: they describe states and relationships, not the
 * resting style a finding is about, and they change when a breakpoint is added.
 */
export function elementLabel({ tag, id, className }) {
  const classes = String(className || '')
    .split(/\s+/)
    .filter(Boolean)
    .filter((token) => !token.includes(':') && !/^(group|peer)(\/|$)/.test(token))
    .slice(0, 3)
    .sort();
  const tagName = String(tag || 'element').toLowerCase();
  return `${tagName}${id ? `#${id}` : ''}${classes.length ? `.${classes.join('.')}` : ''}`;
}

/**
 * The identity of a finding: its cause, not its coordinates.
 *
 * `contrast` names the colour pair and size because that pairing is the defect —
 * the same white-on-flame chip anywhere in the app is one allowlist decision.
 * `broken-image` names the host and path (query strings are cache-busting noise).
 * Everything else names the element's class signature.
 */
export function findingIdentity(finding) {
  const { check, identity } = finding;
  if (!check || !identity) throw new Error('findingIdentity: finding needs check and identity');
  return `${check}|${identity}`;
}

/** Normalises a finding into the shape the report, allowlist and diff all use. */
export function normalizeFinding(finding) {
  return {
    app: finding.app,
    route: finding.route,
    viewport: finding.viewport,
    check: finding.check,
    id: findingIdentity(finding),
    detail: finding.detail ?? '',
    sample: finding.sample ?? '',
  };
}

// ---------------------------------------------------------------------------
// Allowlist (exception list) + ratchet
// ---------------------------------------------------------------------------

/**
 * An entry excuses one identity, optionally narrowed to an app and/or route:
 *
 *   { "check": "contrast", "identity": "rgb(255, 255, 255)|on|rgb(236, 105, 31)|12px" }
 *
 * `identity` is the *cause* only — the full finding id is `check|identity`, so a
 * leading `${check}|` in the JSON is a mistake that would never match.
 *
 * `reason` is required — an exception without a written justification is exactly
 * the drift this gate exists to catch, and parsing it here means the JSON can
 * never grow a silent entry.
 */
export function validateAllowlist(allowlist) {
  const errors = [];
  const entries = allowlist?.allowlist ?? [];
  if (!Array.isArray(entries)) return ['allowlist must be an array'];
  entries.forEach((entry, index) => {
    const at = `allowlist[${index}]`;
    if (!entry || typeof entry !== 'object') return errors.push(`${at} must be an object`);
    if (!CHECKS.includes(entry.check))
      errors.push(`${at}.check must be one of ${CHECKS.join(', ')}`);
    if (typeof entry.identity !== 'string' || !entry.identity) {
      errors.push(`${at}.identity is required`);
    } else if (entry.check && entry.identity.startsWith(`${entry.check}|`)) {
      errors.push(
        `${at}.identity is the cause, not the full id — drop the leading "${entry.check}|"`
      );
    }
    if (typeof entry.reason !== 'string' || entry.reason.trim().length < 10) {
      errors.push(`${at}.reason is required (and must say something — at least 10 characters)`);
    }
    if (entry.app && !APP_ROUTE_SOURCES[entry.app])
      errors.push(`${at}.app must be one of ${Object.keys(APP_ROUTE_SOURCES).join(', ')}`);
  });
  return errors;
}

/**
 * Which findings are excused, which are new, and which entries no longer excuse
 * anything.
 *
 * A stale entry is a failure, not a warning: the domain-literal allowlist learned
 * this the hard way — an exception that outlives its defect forgives the next
 * thing that looks like it, so the entry has to be deleted when the cause is
 * fixed (or the check stops reproducing it for another reason).
 */
export function diffAllowlist(allowlist, findings) {
  const entries = allowlist?.allowlist ?? [];
  const remaining = [...findings];
  const matched = [];
  const stale = [];

  for (const entry of entries) {
    const expected = findingIdentity({ check: entry.check, identity: entry.identity });
    const index = remaining.findIndex(
      (finding) =>
        finding.id === expected &&
        (!entry.app || entry.app === finding.app) &&
        (!entry.route || entry.route === finding.route)
    );
    if (index === -1) {
      stale.push(entry);
      continue;
    }
    matched.push({ entry, finding: remaining[index] });
    remaining.splice(index, 1);
  }

  return { unmatched: remaining, matched, stale };
}

// ---------------------------------------------------------------------------
// Reporting
// ---------------------------------------------------------------------------

/** Counts by check, so CI logs read the same way every run. */
export function summarize(findings) {
  const byCheck = {};
  for (const finding of findings) byCheck[finding.check] = (byCheck[finding.check] || 0) + 1;
  return { total: findings.length, byCheck };
}

/** Groups findings for the console report: one line per identity, with routes. */
export function groupFindings(findings) {
  const groups = new Map();
  for (const finding of findings) {
    if (!groups.has(finding.id)) {
      const prefix = `${finding.check}|`;
      groups.set(finding.id, {
        check: finding.check,
        id: finding.id,
        identity: finding.id.startsWith(prefix) ? finding.id.slice(prefix.length) : finding.id,
        detail: finding.detail,
        sample: finding.sample,
        routes: new Set(),
      });
    }
    groups.get(finding.id).routes.add(`${finding.app}:${finding.route}`);
  }
  return [...groups.values()].map((group) => ({ ...group, routes: [...group.routes].sort() }));
}

/**
 * Lines for the CI log. Kept here rather than in the CLI so the tests can assert
 * what a failure actually prints — a gate nobody can read is a gate nobody acts
 * on.
 */
export function formatFindings(groups, { maxRoutes = 6 } = {}) {
  const lines = [];
  for (const group of groups) {
    lines.push(`  [${group.check}] ${group.identity}`);
    if (group.detail) lines.push(`      ${group.detail}`);
    if (group.sample) lines.push(`      sample: "${group.sample}"`);
    const shown = group.routes.slice(0, maxRoutes).join(', ');
    const more =
      group.routes.length > maxRoutes ? ` (+${group.routes.length - maxRoutes} more)` : '';
    lines.push(`      ${group.routes.length} route(s): ${shown}${more}`);
  }
  return lines;
}
