#!/usr/bin/env node
// ============================================================================
// visual-audit.mjs — render every route, fail the build on what looks broken
// ============================================================================
// The 2026-11-10 sweep found defects no unit test can see: white text on the
// flame accent measured 3.18:1 on 152 of 177 pages, the skip link included, and
// admin/creator links landed on blank documents because the redirect kept a path
// prefix the portals don't route. Both shipped because nothing rendered the app
// and looked at it.
//
// This gate does that on every PR, for all three web surfaces. Per route and
// viewport it asks four questions:
//
//   overflow      — is anything wider than the viewport (a horizontal scrollbar)?
//   clipped-text  — is text cut off without an ellipsis or line clamp?
//   broken-image  — did an <img> fail to decode (next/image host not allowed, 404)?
//   contrast      — is text readable against what is actually behind it (WCAG AA)?
//
// Zero tolerance, with a justified allowlist: current state is clean, so any
// finding fails unless scripts/visual-audit-allowlist.json names it and says why.
// An allowlist entry that no longer excuses anything also fails — an exception
// that outlives its defect forgives the next thing that looks like it.
//
// Routes are discovered from the tree (Next's app/ pages, each portal's route
// table), so a new page is audited without touching this file. Dynamic routes
// (`[id]`) are skipped: they need real ids and would mostly audit one not-found
// state forty times.
//
// API calls are stubbed by default (`--no-stub-api` to disable). PR checks have
// no gateway, database or seed data; without the stub every page would be an
// error state and the timing would follow a 502, not the layout. The stub keeps
// the gate about what a reader sees, deterministically.
//
// Two sign-in states are audited because they are different layouts: as a guest
// the protected routes bounce to /auth/login (so signed-in screens were never
// rendered at all), and as a signed-in account `/` bounces to `/home` (so the
// guest homepage is unreachable). CI runs both (`--signed-in` is the second).
//
// Usage:
//   node scripts/visual-audit.mjs                      # web, both viewports
//   node scripts/visual-audit.mjs --app all            # web + admin + creator
//   node scripts/visual-audit.mjs --only /movies       # one route (substring)
//   node scripts/visual-audit.mjs --app admin --viewport desktop
//   node scripts/visual-audit.mjs --update             # rewrite the allowlist
//   node scripts/visual-audit.mjs --json-out /tmp/visual.json --screenshots /tmp/shots
//
// Exit codes: 0 = no findings, 1 = findings or stale allowlist entries,
//             2 = could not run (server down, Playwright/Chromium missing).
// CI wiring: .github/workflows/pr-checks.yml (visual-audit-pr)
// ============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import {
  APP_ROUTE_SOURCES,
  CHECKS,
  DEFAULT_BASE_URLS,
  VIEWPORTS,
  diffAllowlist,
  discoverRoutes,
  elementLabel,
  evaluateContrast,
  formatCssColor,
  formatFindings,
  groupFindings,
  normalizeFinding,
  parseCssColor,
  parseGradientColors,
  summarize,
  validateAllowlist,
} from './lib/visual-audit.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_ALLOWLIST = path.join(ROOT, 'scripts', 'visual-audit-allowlist.json');
const DEFAULT_SCREENSHOTS = path.join(ROOT, '.visual-audit-out');

const HELP = `visual-audit — render every route and fail on layout/contrast defects

Options:
  --app <name>          web | admin | creator | all            (default: web)
  --base-url <url>      server for the app being audited, or
                        <app>=<url> to target one app           (default: per-app localhost port)
  --viewport <name>     desktop | mobile | both                (default: both)
  --checks <list>       comma-separated subset of ${CHECKS.join(', ')}
  --only <text>         only routes containing this text (repeatable)
  --allowlist <file>    allowlist JSON                         (default: scripts/visual-audit-allowlist.json)
  --update              rewrite the allowlist from this run (review the diff!)
  --json-out <file>     write the full report as JSON (concurrency 1 is implied for stable ordering)
  --screenshots <dir>   where to save failure screenshots      (default: .visual-audit-out/)
  --settle <ms>         extra wait after the page loads        (default: 600)
  --concurrency <n>     routes in flight per app               (default: 4)
  --retries <n>         retry a route once before reporting it (default: 1)
  --no-stub-api         let /api requests reach the real server
  --signed-in           audit the web app as a signed-in account (sets the
                        middleware auth marker, so /wallet, /settings, … render
                        instead of bouncing to /auth/login)
  --verbose             list every route, including clean and skipped ones
  --help                this text

Routes with a dynamic segment are skipped. A route that redirects — an auth
gate, or the /admin, /creator hand-off to a portal origin — is recorded as gated
and not audited; the destination is audited on its own line.`;

// ---------------------------------------------------------------------------
// Arguments
// ---------------------------------------------------------------------------

export function parseArgs(argv) {
  const options = {
    apps: ['web'],
    baseUrls: { ...DEFAULT_BASE_URLS },
    viewports: ['desktop', 'mobile'],
    checks: [...CHECKS],
    only: [],
    allowlist: DEFAULT_ALLOWLIST,
    update: false,
    jsonOut: null,
    screenshots: DEFAULT_SCREENSHOTS,
    settle: 600,
    concurrency: 4,
    retries: 1,
    stubApi: true,
    signedIn: false,
    verbose: false,
    help: false,
  };

  const needValue = (flag, value) => {
    if (value === undefined || value.startsWith('--')) throw new Error(`${flag} needs a value`);
    return value;
  };

  let baseUrlOverride = null;
  const perAppBaseUrls = {};

  for (let i = 0; i < argv.length; i += 1) {
    const raw = argv[i];
    const [flag, inline] = raw.includes('=') ? raw.split(/=(.*)/s) : [raw, undefined];
    const value = () => needValue(flag, inline ?? argv[++i]);

    switch (flag) {
      case '--help':
      case '-h':
        options.help = true;
        break;
      case '--app': {
        const app = value();
        if (!['web', 'admin', 'creator', 'all'].includes(app))
          throw new Error(`unknown --app ${app}`);
        options.apps = app === 'all' ? ['web', 'admin', 'creator'] : [app];
        break;
      }
      case '--base-url': {
        const url = value();
        // `--base-url admin=http://host:5173` targets one app; a bare URL applies
        // to every app being audited. CI serves three surfaces on three ports.
        const [appName, appUrl] = url.split(/=(.*)/s);
        const perApp = appUrl && APP_ROUTE_SOURCES[appName];
        if (perApp && !/^https?:\/\//.test(appUrl))
          throw new Error(`--base-url must be http(s): ${appUrl}`);
        if (!perApp && !/^https?:\/\//.test(url))
          throw new Error(`--base-url must be http(s): ${url}`);
        // Applied after the loop so flag order cannot change which app it hits.
        if (perApp) perAppBaseUrls[appName] = appUrl.replace(/\/+$/, '');
        else baseUrlOverride = url.replace(/\/+$/, '');
        break;
      }
      case '--viewport': {
        const viewport = value();
        if (!['desktop', 'mobile', 'both'].includes(viewport))
          throw new Error(`unknown --viewport ${viewport}`);
        options.viewports = viewport === 'both' ? ['desktop', 'mobile'] : [viewport];
        break;
      }
      case '--checks': {
        const checks = value()
          .split(',')
          .map((c) => c.trim())
          .filter(Boolean);
        const unknown = checks.filter((c) => !CHECKS.includes(c));
        if (unknown.length) throw new Error(`unknown check(s): ${unknown.join(', ')}`);
        options.checks = checks;
        break;
      }
      case '--only':
        options.only.push(value());
        break;
      case '--allowlist':
        options.allowlist = path.resolve(ROOT, value());
        break;
      case '--update':
        options.update = true;
        break;
      case '--json-out':
        options.jsonOut = path.resolve(value());
        break;
      case '--screenshots':
        options.screenshots = path.resolve(value());
        break;
      case '--settle':
        options.settle = Number(value());
        if (!Number.isFinite(options.settle) || options.settle < 0)
          throw new Error('--settle must be a number ≥ 0');
        break;
      case '--concurrency':
        options.concurrency = Number(value());
        if (!Number.isInteger(options.concurrency) || options.concurrency < 1)
          throw new Error('--concurrency must be ≥ 1');
        break;
      case '--retries':
        options.retries = Number(value());
        if (!Number.isInteger(options.retries) || options.retries < 0)
          throw new Error('--retries must be ≥ 0');
        break;
      case '--no-stub-api':
        options.stubApi = false;
        break;
      case '--signed-in':
        options.signedIn = true;
        break;
      case '--verbose':
        options.verbose = true;
        break;
      default:
        throw new Error(`unknown option ${raw}`);
    }
  }

  if (baseUrlOverride) {
    for (const app of options.apps) options.baseUrls[app] = baseUrlOverride;
  }
  for (const [app, url] of Object.entries(perAppBaseUrls)) options.baseUrls[app] = url;

  return options;
}

// ---------------------------------------------------------------------------
// Browser plumbing
// ---------------------------------------------------------------------------

/** Playwright is a dependency of apps/web; resolve it from there, not the root. */
function loadChromium() {
  const requireFromWeb = createRequire(path.join(ROOT, 'apps', 'web', 'package.json'));
  try {
    return requireFromWeb('playwright').chromium;
  } catch {
    return requireFromWeb('@playwright/test').chromium;
  }
}

/**
 * The signed-in identity the portals are audited as.
 *
 * Both portals ask the gateway `GET /api/v1/auth/me` for an httpOnly-cookie
 * session (they no longer read a user out of localStorage — the older e2e
 * suites still seed one, but it authenticates nothing). Without this answer
 * every portal route renders the login hand-off, every route is recorded as
 * "gated", and the audit silently checks nothing.
 */
const PORTAL_SESSIONS = {
  admin: {
    id: 'visual-audit-admin',
    email: 'audit@azeebo.com',
    role: 'admin',
    displayName: 'Visual Audit',
  },
  creator: {
    id: 'visual-audit-creator',
    email: 'audit@azeebo.com',
    role: 'creator',
    displayName: 'Visual Audit',
  },
};

/**
 * One envelope for every API call, so pages render their real layout in an
 * empty state instead of an error banner — the state a brand-new account sees.
 *
 * The web app gets `data: []` (its queries unwrap with `res.data ?? []` and
 * render empty states from it). The portals get a shaped default of `data:
 * null`: they guard with `requireData(value, [])`, which is safe for null, but a
 * page that reads `data?.domains.length` throws on an array — an array default
 * turns every unknown endpoint into an error boundary, and the gate would then
 * audit the crash screen. Endpoints whose real shape is known are listed below.
 *
 * The session probe gets a real profile for the portal being audited, so the
 * gate sees the screens an operator sees.
 */
const PORTAL_ENDPOINT_SHAPES = [
  // Admin: the flag console reads `domains` off the known-keys summary and
  // `available`/`staleRunning` off the metrics join; both are objects upstream.
  [/\/admin\/feature-flags\/known$/, { total: 0, domains: [] }],
  [
    /\/admin\/feature-flags\/stale\/metrics$/,
    { available: false, fetchedAt: null, staleRunning: {}, autoDisabled: {} },
  ],
  [/\/admin\/feature-flags\/nightly\/last$/, null],
  // List endpoints the sidebars and dashboards map over directly.
  [/(\/admin\/feature-flags|\/admin\/audit|\/admin\/universes\/feature-flags)$/, []],
];

async function stubApi(page, app) {
  const session = PORTAL_SESSIONS[app] ?? null;
  await page.route('**/api/**', async (route) => {
    const requestUrl = new URL(route.request().url());
    const pathname = requestUrl.pathname;
    const fulfill = (body) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });

    if (session && /\/auth\/me$/.test(pathname)) return fulfill({ success: true, data: session });
    if (session && /\/auth\/refresh$/.test(pathname)) {
      return fulfill({ success: true, data: { accessToken: 'visual-audit-token', user: session } });
    }

    if (!session) {
      const isFlags = /\/flags(\/|[?]|$)/.test(requestUrl.href);
      return fulfill(
        isFlags
          ? { success: true, data: [] }
          : { success: true, data: [], meta: { total: 0, page: 1, limit: 20 } }
      );
    }

    const shaped = PORTAL_ENDPOINT_SHAPES.find(([pattern]) => pattern.test(pathname));
    const data = shaped ? shaped[1] : null;
    return fulfill({ success: true, data, meta: { total: 0, page: 1, limit: 20 } });
  });
}

/** Scroll the whole page once so scroll-reveal content is actually painted. */
async function revealContent(page) {
  await page.evaluate(async () => {
    const step = Math.max(200, Math.floor(window.innerHeight * 0.8));
    const height = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
    for (let y = 0; y < height; y += step) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 40));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(250);
}

/**
 * Runs inside the page. Returns raw observations only —
 * contrast maths and identity building happen in Node, against the same helpers
 * the unit tests cover, so the gate has one definition of "fails AA".
 */
function collect() {
  const viewportWidth = document.documentElement.clientWidth;
  const isVisible = (element) => {
    const style = getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0)
      return false;
    const rect = element.getBoundingClientRect();
    if (rect.width < 1 && rect.height < 1) return false;
    // Visually-hidden utility (clip to a 1px box) — announced, not seen.
    if (rect.width <= 1 || rect.height <= 1) return false;
    if (/inset\(50%\)/.test(style.clipPath || '')) return false;
    return true;
  };
  const ignored = (element) =>
    Boolean(element.closest('[aria-hidden="true"], [data-visual-audit-ignore]'));

  const label = (element) => ({
    tag: element.tagName,
    id: element.id || '',
    className: typeof element.className === 'string' ? element.className : '',
  });

  // --- overflow ---------------------------------------------------------
  const scrollWidth = document.documentElement.scrollWidth;
  const horizontalOverflow = scrollWidth - viewportWidth;
  const overflowOffenders = [];
  if (horizontalOverflow > 1) {
    for (const element of document.querySelectorAll('body *')) {
      if (!isVisible(element) || ignored(element)) continue;
      if (element.getClientRects().length === 0) continue;
      const rect = element.getBoundingClientRect();
      if (rect.right <= viewportWidth + 1 || rect.width === 0) continue;
      // Elements inside an explicitly scrollable ancestor are the intended
      // pattern (carousels, tables); the page itself is still not overflowing.
      let ancestor = element.parentElement;
      let inScroller = false;
      while (ancestor && ancestor !== document.body) {
        const style = getComputedStyle(ancestor);
        if (
          /(auto|scroll|hidden)/.test(style.overflowX) &&
          ancestor.getBoundingClientRect().right <= viewportWidth + 1
        ) {
          inScroller = true;
          break;
        }
        ancestor = ancestor.parentElement;
      }
      if (inScroller) continue;
      overflowOffenders.push({
        element: label(element),
        right: Math.round(rect.right),
        width: Math.round(rect.width),
        text: (element.textContent || '').trim().slice(0, 60),
      });
      if (overflowOffenders.length >= 5) break;
    }
  }

  // --- clipped text -----------------------------------------------------
  const clipped = [];
  for (const element of document.querySelectorAll('body *')) {
    if (element.children.length > 0) continue;
    const text = (element.textContent || '').trim();
    if (text.length < 4 || !isVisible(element) || ignored(element)) continue;
    const style = getComputedStyle(element);
    if (style.overflowX === 'visible') continue;
    if (style.textOverflow === 'ellipsis') continue; // explicit truncation
    if (style.webkitLineClamp && style.webkitLineClamp !== 'none') continue; // clamp
    if (element.scrollWidth <= element.clientWidth + 2 || element.clientWidth < 8) continue;
    clipped.push({ element: label(element), text: text.slice(0, 50) });
    if (clipped.length >= 5) break;
  }

  // --- broken images ----------------------------------------------------
  const brokenImages = [];
  for (const image of document.images) {
    if (!image.currentSrc) continue;
    if (image.complete && image.naturalWidth === 0) {
      brokenImages.push({ src: image.currentSrc, alt: image.alt || '' });
      if (brokenImages.length >= 5) break;
    }
  }

  // --- text samples for the contrast check ------------------------------
  // The background is resolved here because it needs the ancestor chain; the
  // pass/fail decision is made in Node.
  const seen = new Set();
  const textSamples = [];
  for (const element of document.querySelectorAll(
    'p, span, a, h1, h2, h3, h4, h5, h6, li, button, label, td, th, div, strong, em, small, time'
  )) {
    if (element.children.length > 0) continue;
    const text = (element.textContent || '').trim();
    if (text.length < 2 || !isVisible(element) || ignored(element)) continue;
    const style = getComputedStyle(element);
    const fontSize = parseFloat(style.fontSize);
    if (!Number.isFinite(fontSize)) continue;
    // Find the layer actually painted behind the glyphs. Walking up stops at the
    // first ancestor that paints anything (a background image is painted over a
    // background colour), so a text node inside a gradient card is judged
    // against the gradient, not against some dark ancestor further up.
    //
    // A url() layer, or a semi-transparent one, cannot be judged from CSS — the
    // sample is dropped rather than measured against a guess. Guessing is how a
    // dark-theme app reports every label as black-on-black.
    const rgba = /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+))?\s*\)/;
    const isOpaque = (value) => {
      if (!value || value === 'transparent') return false;
      const match = value.match(rgba);
      if (!match) return true; // a named colour other than `transparent`
      return match[4] === undefined || Number(match[4]) >= 0.9;
    };
    // Gradient-clipped text: `background-clip: text` paints the glyphs with a
    // gradient and the computed colour is `rgba(0, 0, 0, 0)`. Measuring that
    // transparent colour as black-on-gradient invents a failure on text that is
    // actually flame. The glyph colour *is* the gradient, so its opaque stops
    // become the foreground and the backdrop is the first layer painted behind
    // the element — the clip means the element's own background never shows.
    const clip = `${style.backgroundClip} ${style.webkitBackgroundClip}`;
    const gradientText = /text/.test(clip) && /gradient/i.test(style.backgroundImage);
    let background = null;
    let backgroundImage = null;
    let unknown = false;
    let node = gradientText ? element.parentElement : element;
    while (node && node !== document.documentElement) {
      const nodeStyle = getComputedStyle(node);
      const image = nodeStyle.backgroundImage;
      if (image && image !== 'none') {
        if (/gradient/i.test(image)) backgroundImage = image;
        else unknown = true;
        if (backgroundImage) break;
      }
      if (isOpaque(nodeStyle.backgroundColor)) {
        background = nodeStyle.backgroundColor;
        break;
      }
      node = node.parentElement;
    }
    if (unknown || (!background && !backgroundImage)) continue;
    const foregroundImage = gradientText ? style.backgroundImage : null;
    const key = `${style.color}|${background || ''}|${backgroundImage || ''}|${foregroundImage || ''}|${fontSize}|${style.fontWeight}`;
    if (seen.has(key)) continue;
    seen.add(key);
    textSamples.push({
      element: label(element),
      color: style.color,
      background,
      backgroundImage,
      foregroundImage,
      fontSize,
      fontWeight: Number(style.fontWeight) || 400,
      text: text.slice(0, 40),
    });
    if (textSamples.length >= 400) break;
  }

  return {
    viewportWidth,
    scrollWidth,
    horizontalOverflow,
    overflowOffenders,
    clipped,
    brokenImages,
    textSamples,
  };
}

// ---------------------------------------------------------------------------
// One route, one viewport
// ---------------------------------------------------------------------------

function screenshotSlug(app, route, viewport) {
  const slug = route === '/' ? 'root' : route.replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '');
  return `${app}${viewport === 'mobile' ? '-mobile' : ''}-${slug}.png`;
}

/**
 * The portals live on their own origins. A web path under /admin or /creator is
 * a hand-off, not a page: the middleware answers 307 to the portal origin, and a
 * `--app web` run does not serve that origin. Without this the navigation dies
 * with ERR_CONNECTION_REFUSED and every hand-off is reported as a broken route
 * — forty of them in the first full pass, all working as designed.
 *
 * A `page.route` stand-in cannot catch this: Chromium follows the server's 307
 * for the main-frame document without offering it to request interception
 * (verified against the production build). The redirect *response* is still
 * observable, so the audit records where a route handed off and treats a failed
 * navigation to that origin as gated. The portal is audited on its own lines
 * when it is served (`--app admin|creator`).
 */

/**
 * Origins of the apps this run is *not* auditing — every one is a hand-off.
 * Exported for the tests: a regression that stops noticing a sibling origin
 * brings back forty false route-errors.
 */
export function siblingOrigins(options, app) {
  const origins = [];
  for (const [name, url] of Object.entries(options.baseUrls)) {
    if (name === app) continue;
    try {
      origins.push(new URL(url).origin);
    } catch {
      /* an unparseable --base-url is rejected by parseArgs */
    }
  }
  return origins;
}

async function auditRoute({ browser, app, route, viewport, baseUrl, options }) {
  const context = await browser.newContext({
    viewport: VIEWPORTS[viewport],
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
  });
  const page = await context.newPage();
  page.setDefaultNavigationTimeout(90_000);
  if (options.stubApi) await stubApi(page, app);
  // Signed-in state: the middleware reads this marker before rendering, so the
  // protected routes (/wallet, /settings, /messages, …) audit their real layout
  // instead of a 307 to /auth/login. Kept opt-in because it changes which
  // homepage is served (the guest homepage redirects to /home when signed in),
  // and CI runs both states.
  if (app === 'web' && options.signedIn) {
    await context.addCookies([
      { name: 'azeebo_web_auth', value: 'visual-audit', url: baseUrl, sameSite: 'Lax' },
    ]);
  }

  const handoffOrigins = siblingOrigins(options, app);
  // Where this navigation was sent, when the server answered a 3xx to another
  // app's origin. Recorded before the browser follows it, so the answer survives
  // a refused connection at the destination.
  let handoffTarget = null;
  const noteHandoff = (location) => {
    if (!location) return;
    try {
      const target = new URL(location, `${baseUrl}${route}`);
      if (handoffOrigins.includes(target.origin)) handoffTarget = target.href;
    } catch {
      /* a malformed Location is the server's defect, not a hand-off */
    }
  };
  page.on('response', (response) => {
    if (!response.request().isNavigationRequest()) return;
    const status = response.status();
    if (status >= 300 && status < 400) noteHandoff(response.headers().location);
  });

  const result = { app, route, viewport, findings: [], note: null, finalPath: null, status: null };

  try {
    const response = await page.goto(`${baseUrl}${route}`, { waitUntil: 'domcontentloaded' });
    result.status = response ? response.status() : null;
    // `networkidle` is a short courtesy wait, not a barrier: pages that poll
    // (dashboards, the flag console) never go idle, and waiting 15s for it on
    // every route turned this gate into a 20-minute job while measuring nothing
    // extra. Three seconds is enough for the mount-time fetches to paint.
    await page.waitForLoadState('load', { timeout: 30_000 }).catch(() => {});
    await page.waitForLoadState('networkidle', { timeout: 3_000 }).catch(() => {});
    await page.evaluate(() => document.fonts?.ready).catch(() => {});
    await page.waitForTimeout(options.settle);

    const finalUrl = new URL(page.url());
    result.finalPath = finalUrl.pathname;
    if (finalUrl.origin !== new URL(baseUrl).origin || finalUrl.pathname !== route) {
      // A gated or redirected route is not a defect — the destination is audited
      // on its own line. Recording it keeps the "why was this skipped" question
      // answerable from the report.
      result.note = `redirected to ${finalUrl.origin === new URL(baseUrl).origin ? '' : finalUrl.origin}${finalUrl.pathname}`;
      return result;
    }

    if (options.checks.includes('route-error') && result.status && result.status >= 400) {
      result.findings.push(
        normalizeFinding({
          app,
          route,
          viewport,
          check: 'route-error',
          identity: `http-${result.status}`,
          detail: `${route} answered ${result.status}`,
        })
      );
      return result;
    }

    await revealContent(page);
    const observed = await page.evaluate(collect);

    if (options.checks.includes('overflow') && observed.horizontalOverflow > 1) {
      const offenders = observed.overflowOffenders.length
        ? observed.overflowOffenders
        : [
            {
              element: { tag: 'document', id: '', className: '' },
              right: observed.scrollWidth,
              width: observed.scrollWidth,
              text: '',
            },
          ];
      for (const offender of offenders) {
        result.findings.push(
          normalizeFinding({
            app,
            route,
            viewport,
            check: 'overflow',
            identity: elementLabel(offender.element),
            detail: `page scrolls ${observed.horizontalOverflow}px sideways (${observed.scrollWidth}px wide viewport ${observed.viewportWidth}px); ${elementLabel(offender.element)} ends at ${offender.right}px`,
            sample: offender.text,
          })
        );
      }
    }

    if (options.checks.includes('clipped-text')) {
      for (const item of observed.clipped) {
        result.findings.push(
          normalizeFinding({
            app,
            route,
            viewport,
            check: 'clipped-text',
            identity: elementLabel(item.element),
            detail: 'text is cut off with no ellipsis or line clamp',
            sample: item.text,
          })
        );
      }
    }

    if (options.checks.includes('broken-image')) {
      for (const image of observed.brokenImages) {
        let identity = image.src;
        try {
          const src = new URL(image.src);
          identity = `${src.host}${src.pathname}`;
        } catch {
          /* leave the raw src: a data: or relative URL is still identifiable */
        }
        result.findings.push(
          normalizeFinding({
            app,
            route,
            viewport,
            check: 'broken-image',
            identity,
            detail: `image failed to decode; next/image rejects hosts missing from remotePatterns`,
            sample: image.alt || image.src.slice(0, 80),
          })
        );
      }
    }

    if (options.checks.includes('contrast')) {
      for (const sample of observed.textSamples) {
        // One background, or every opaque stop of a gradient: text sitting on a
        // gradient fails if it fails against any stop it can overlap. Stops are
        // converted back to CSS strings here — evaluateContrast takes strings,
        // and handing it parsed colours silently returns null (a skipped check,
        // which is how a failing CTA label once read as clean).
        const stops = sample.background
          ? [sample.background]
          : (parseGradientColors(sample.backgroundImage) ?? []).map(formatCssColor);
        if (stops.length === 0) continue;
        // Gradient-clipped text has one foreground per stop instead of a single
        // computed colour; anything else is measured against the surface.
        const foregrounds = sample.foregroundImage
          ? (parseGradientColors(sample.foregroundImage) ?? []).map(formatCssColor)
          : [sample.color];
        if (foregrounds.length === 0) continue;
        for (const foreground of foregrounds) {
          for (const stop of stops) {
            const verdict = evaluateContrast({
              foreground,
              background: stop,
              fontSizePx: sample.fontSize,
              fontWeight: sample.fontWeight,
            });
            if (!verdict || verdict.passes) continue;
            const onGradient = Boolean(sample.backgroundImage);
            result.findings.push(
              normalizeFinding({
                app,
                route,
                viewport,
                check: 'contrast',
                identity: `${foreground}|on|${stop}|${sample.fontSize}px`,
                detail: `${verdict.ratio}:1 on ${stop}${onGradient ? ' (gradient stop)' : ''} at ${sample.fontSize}px (AA needs ${verdict.required}:1)${sample.foregroundImage ? ' — gradient-clipped text' : ''}`,
                sample: sample.text,
              })
            );
          }
        }
      }
    }

    if (result.findings.length > 0) {
      fs.mkdirSync(options.screenshots, { recursive: true });
      const shot = path.join(options.screenshots, screenshotSlug(app, route, viewport));
      try {
        await page.screenshot({
          path: shot,
          fullPage: true,
          animations: 'disabled',
          timeout: 15_000,
        });
        result.screenshot = shot;
      } catch {
        await page
          .screenshot({ path: shot, fullPage: false, animations: 'disabled', timeout: 10_000 })
          .catch(() => {});
      }
    }
  } catch (error) {
    const message = String(error?.message || error);
    // A hand-off the browser reports as a failed connection is still a hand-off;
    // the 3xx above said where it was going. Fall back to the URL Playwright
    // puts in the error ("net::ERR_CONNECTION_REFUSED at http://host/path") in
    // case the response event was missed.
    if (handoffTarget) {
      result.note = `redirected to ${handoffTarget} (portal hand-off)`;
      return result;
    }
    const handoff = handoffOrigins.find((origin) => message.includes(origin));
    if (handoff) {
      result.note = `redirected to ${handoff} (portal hand-off)`;
      return result;
    }
    result.findings.push(
      normalizeFinding({
        app,
        route,
        viewport,
        check: 'route-error',
        identity: 'navigation-failed',
        detail: message.split('\n')[0].slice(0, 200),
      })
    );
  } finally {
    await context.close().catch(() => {});
  }

  return result;
}

async function auditWithRetries(args) {
  let result = await auditRoute(args);
  for (
    let attempt = 0;
    attempt < args.options.retries && result.findings.length > 0;
    attempt += 1
  ) {
    const retried = await auditRoute(args);
    result = retried;
  }
  return result;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

/** Repo-relative when the file is in the repo, absolute otherwise (no ../../../). */
function displayPath(file) {
  const relative = path.relative(ROOT, file);
  return relative.startsWith('..') ? file : relative;
}

function loadAllowlist(file) {
  if (!fs.existsSync(file)) return { description: '', allowlist: [] };
  const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
  const errors = validateAllowlist(parsed);
  if (errors.length)
    throw new Error(`invalid allowlist ${displayPath(file)}:\n  ${errors.join('\n  ')}`);
  return parsed;
}

function writeAllowlist(file, matched) {
  const seen = new Set();
  const allowlist = [];
  for (const { entry, finding } of matched) {
    const key = `${entry.check}|${entry.identity}|${entry.app || ''}|${entry.route || ''}`;
    if (seen.has(key)) continue;
    seen.add(key);
    allowlist.push({
      check: entry.check,
      identity: entry.identity,
      ...(entry.app ? { app: entry.app } : {}),
      ...(entry.route ? { route: entry.route } : {}),
      reason: entry.reason,
    });
  }
  const document = {
    description:
      'Justified exceptions for scripts/visual-audit.mjs. Every entry needs a reason; an entry that stops excusing a finding fails the gate (regenerate with --update after deleting the cause).',
    generatedAt: new Date().toISOString(),
    allowlist,
  };
  fs.writeFileSync(file, `${JSON.stringify(document, null, 2)}\n`);
  return allowlist.length;
}

/**
 * A server that answers within a few seconds. Retried because a dev server
 * recompiling after an edit, or a cold `next start`, can miss one probe — and
 * exit 2 ("could not run") tells a reviewer nothing about the page.
 */
async function serverIsUp(baseUrl, attempts = 5) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(baseUrl, { signal: AbortSignal.timeout(10_000) });
      if (response.status < 500) return true;
    } catch {
      /* retry */
    }
    if (attempt < attempts - 1) await new Promise((resolve) => setTimeout(resolve, 2_000));
  }
  return false;
}

async function main() {
  let options;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(`visual-audit: ${error.message}\n\n${HELP}`);
    return 2;
  }
  if (options.help) {
    console.log(HELP);
    return 0;
  }

  let allowlist;
  try {
    allowlist = loadAllowlist(options.allowlist);
  } catch (error) {
    console.error(`visual-audit: ${error.message}`);
    return 2;
  }

  for (const app of options.apps) {
    if (!(await serverIsUp(options.baseUrls[app]))) {
      console.error(
        `visual-audit: ${app} is not answering at ${options.baseUrls[app]} — start the server first (or pass --base-url).`
      );
      return 2;
    }
  }

  let chromium;
  try {
    chromium = loadChromium();
  } catch (error) {
    console.error(
      `visual-audit: cannot load Playwright from apps/web (${error.message}). Run pnpm install, then: pnpm --filter @azeebo/web exec playwright install chromium --with-deps`
    );
    return 2;
  }

  const browser = await chromium.launch();
  const results = [];
  const started = Date.now();

  try {
    for (const app of options.apps) {
      let routes = discoverRoutes(ROOT, app);
      if (options.only.length)
        routes = routes.filter((route) => options.only.some((needle) => route.includes(needle)));
      if (routes.length === 0) {
        console.error(
          `visual-audit: no routes matched for ${app}${options.only.length ? ` (--only ${options.only.join(', ')})` : ''}`
        );
        return 2;
      }
      console.log(
        `visual-audit: ${app} — ${routes.length} route(s), ${options.viewports.join(' + ')}, ${options.baseUrls[app]}${options.signedIn ? ' (signed in)' : ' (guest)'}`
      );

      const queue = routes.flatMap((route) =>
        options.viewports.map((viewport) => ({ route, viewport }))
      );
      const workers = Array.from(
        { length: Math.min(options.concurrency, queue.length) },
        async () => {
          for (;;) {
            const next = queue.shift();
            if (!next) return;
            const result = await auditWithRetries({
              browser,
              app,
              route: next.route,
              viewport: next.viewport,
              baseUrl: options.baseUrls[app],
              options,
            });
            results.push(result);
            if (options.verbose) {
              const status = result.findings.length
                ? `x ${result.findings.length}`
                : result.note
                  ? 'skip'
                  : 'ok';
              console.log(
                `  ${status.padEnd(4)} ${next.route} (${next.viewport})${result.note ? ` — ${result.note}` : ''}`
              );
            }
          }
        }
      );
      await Promise.all(workers);
    }
  } finally {
    await browser.close().catch(() => {});
  }

  const findings = results.flatMap((result) => result.findings);
  const gated = results.filter((result) => result.note);
  const { unmatched, matched, stale } = diffAllowlist(allowlist, findings);
  const summary = summarize(unmatched);
  const groups = groupFindings(unmatched);

  const report = {
    generatedAt: new Date().toISOString(),
    durationMs: Date.now() - started,
    apps: options.apps,
    viewports: options.viewports,
    checks: options.checks,
    stubApi: options.stubApi,
    signedIn: options.signedIn,
    auditedRoutes: results.length,
    gatedRoutes: gated.length,
    findings,
    newFindings: unmatched,
    excusedFindings: matched.length,
    staleAllowlistEntries: stale,
    summary,
  };
  if (options.jsonOut) {
    fs.mkdirSync(path.dirname(options.jsonOut), { recursive: true });
    fs.writeFileSync(options.jsonOut, `${JSON.stringify(report, null, 2)}\n`);
  }

  const audited = results.filter((result) => !result.note).length;
  console.log(
    `\nvisual-audit: audited ${audited} page(s), ${gated.length} gated/redirected, ${findings.length} finding(s) in ${(report.durationMs / 1000).toFixed(1)}s`
  );

  let pruned = false;
  if (options.update) {
    if (unmatched.length) {
      // --update prunes entries whose cause is gone. It will not write a reason
      // for a finding, because a generated excuse is the drift this gate exists
      // to catch: new findings are fixed or justified by a person.
      console.log(
        '\nvisual-audit: --update prunes stale entries only; new findings need a reason written by hand.'
      );
    } else {
      const count = writeAllowlist(options.allowlist, matched);
      console.log(
        `visual-audit: allowlist pruned to the entries still matching (${count} entr${count === 1 ? 'y' : 'ies'}) → ${displayPath(options.allowlist)}`
      );
      console.log('visual-audit: review the diff before committing.');
      pruned = true;
    }
  }

  if (stale.length && !pruned) {
    const subject =
      stale.length === 1
        ? '1 allowlist entry no longer excuses anything'
        : `${stale.length} allowlist entries no longer excuse anything`;
    console.log(`\nvisual-audit: ${subject} (delete ${stale.length === 1 ? 'it' : 'them'}):`);
    for (const entry of stale) console.log(`  [${entry.check}] ${entry.identity}`);
    console.log(
      pruned
        ? 'The entry was pruned above.'
        : `Run \`node scripts/visual-audit.mjs --update\` after removing the cause, or delete the entry by hand.`
    );
  }

  if (groups.length) {
    console.log(`\nvisual-audit: ${summary.total} new finding(s) — failing:\n`);
    console.log(formatFindings(groups).join('\n'));
    if (options.screenshots && findings.length) {
      console.log(`\nScreenshots: ${displayPath(options.screenshots)}`);
    }
    console.log(
      '\nEither fix the cause, or add a justified entry to scripts/visual-audit-allowlist.json (reason required).'
    );
  }

  if (groups.length === 0 && stale.length === 0) {
    console.log('visual-audit: clean.');
    return 0;
  }
  return 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main()
    .then((code) => {
      process.exitCode = code;
    })
    .catch((error) => {
      console.error(`visual-audit: ${error?.stack || error}`);
      process.exitCode = 2;
    });
}
