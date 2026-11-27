/**
 * Tests for scripts/lib/visual-audit.mjs (and the CLI's argument handling).
 *
 * The drift this pins: a page that renders wrong — white on flame at 3.18:1,
 * an admin link that lands on a blank document — passes every unit test in this
 * repo, because no test renders the page. The gate that renders them has to be
 * trustworthy in the corners a browser cannot reach: which routes exist, what
 * "large text" means at the AA boundary, and whether an allowlist entry still
 * excuses anything.
 *
 * The identity tests matter most. A finding named after its element's text or
 * position churns on every copy edit and turns the allowlist into noise; these
 * pin identities to the cause (colour pair, class signature, image host) and
 * pin the dead-entry rule that keeps excuses from outliving their defect.
 *
 * Run via the CI conventions job: `node --test scripts/__tests__/*.test.mjs`
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CHECKS,
  DEFAULT_BASE_URLS,
  diffAllowlist,
  discoverPortalRoutes,
  discoverRoutes,
  discoverWebRoutes,
  elementLabel,
  evaluateContrast,
  findingIdentity,
  formatFindings,
  groupFindings,
  normalizeFinding,
  parseCssColor,
  parseGradientColors,
  formatCssColor,
  requiredRatio,
  summarize,
  validateAllowlist,
} from '../lib/visual-audit.mjs';
import { parseArgs, siblingOrigins } from '../visual-audit.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

// ---------------------------------------------------------------------------
// Argument handling
// ---------------------------------------------------------------------------

test('parseArgs: defaults to the web app, both viewports, every check', () => {
  const options = parseArgs([]);
  assert.deepEqual(options.apps, ['web']);
  assert.deepEqual(options.viewports, ['desktop', 'mobile']);
  assert.deepEqual(options.checks, CHECKS);
  assert.equal(options.baseUrls.web, DEFAULT_BASE_URLS.web);
  assert.equal(options.update, false);
  assert.equal(options.stubApi, true);
});

test('parseArgs: --app all expands to the three web surfaces', () => {
  assert.deepEqual(parseArgs(['--app', 'all']).apps, ['web', 'admin', 'creator']);
  assert.deepEqual(parseArgs(['--app=admin']).apps, ['admin']);
});

test('parseArgs: --base-url overrides the audited app (not the others)', () => {
  const options = parseArgs(['--app', 'admin', '--base-url', 'http://localhost:9999/']);
  assert.equal(options.baseUrls.admin, 'http://localhost:9999');
  assert.equal(options.baseUrls.web, DEFAULT_BASE_URLS.web);

  // Flag order must not decide which app the URL lands on.
  const reordered = parseArgs(['--base-url', 'http://localhost:9999', '--app', 'creator']);
  assert.equal(reordered.baseUrls.creator, 'http://localhost:9999');
  assert.equal(reordered.baseUrls.web, DEFAULT_BASE_URLS.web);
});

test('parseArgs: --base-url <app>=<url> targets one surface (CI runs three ports)', () => {
  const options = parseArgs([
    '--app',
    'all',
    '--base-url',
    'web=http://localhost:3000',
    '--base-url',
    'admin=http://localhost:5173/',
  ]);
  assert.equal(options.baseUrls.web, 'http://localhost:3000');
  assert.equal(options.baseUrls.admin, 'http://localhost:5173');
  assert.equal(options.baseUrls.creator, DEFAULT_BASE_URLS.creator);
  assert.throws(() => parseArgs(['--base-url', 'admin=localhost:5173']), /must be http/);
});

test('parseArgs: --viewport both is the default spelling of the two', () => {
  assert.deepEqual(parseArgs(['--viewport', 'both']).viewports, ['desktop', 'mobile']);
  assert.deepEqual(parseArgs(['--viewport=mobile']).viewports, ['mobile']);
});

test('parseArgs: rejects nonsense instead of silently ignoring it', () => {
  assert.throws(() => parseArgs(['--nope']), /unknown option/);
  assert.throws(() => parseArgs(['--app', 'mobile']), /unknown --app/);
  assert.throws(() => parseArgs(['--viewport', 'watch']), /unknown --viewport/);
  assert.throws(() => parseArgs(['--checks', 'overflow,vibes']), /unknown check/);
  assert.throws(() => parseArgs(['--base-url', 'localhost:4000']), /must be http/);
  assert.throws(() => parseArgs(['--base-url']), /needs a value/);
  assert.throws(() => parseArgs(['--concurrency', '0']), /must be ≥ 1/);
  assert.throws(() => parseArgs(['--settle', '-5']), /must be a number/);
});

test('parseArgs: --only is repeatable and --update is a flag', () => {
  const options = parseArgs([
    '--only',
    '/movies',
    '--only',
    '/wallet',
    '--update',
    '--no-stub-api',
  ]);
  assert.deepEqual(options.only, ['/movies', '/wallet']);
  assert.equal(options.update, true);
  assert.equal(options.stubApi, false);
});

// --- portal hand-offs ------------------------------------------------------
// A web path under /admin is a 307 to the admin origin, which a `--app web` run
// does not serve. Missing these origins turned forty working hand-offs into
// "navigation-failed" findings in the first full pass, so the list is pinned.

test('siblingOrigins: every app this run is not auditing is a hand-off target', () => {
  const options = parseArgs([]);
  assert.deepEqual(siblingOrigins(options, 'web').sort(), [
    'http://localhost:5173',
    'http://localhost:5174',
  ]);
  assert.equal(siblingOrigins(options, 'admin').includes(DEFAULT_BASE_URLS.admin), false);
});

test('siblingOrigins: follows --base-url so a moved portal is still recognised', () => {
  const options = parseArgs(['--app', 'web', '--base-url', 'admin=https://admin.example.com']);
  assert.deepEqual(siblingOrigins(options, 'web').sort(), [
    'http://localhost:5174',
    'https://admin.example.com',
  ]);
});

test('siblingOrigins: --app all has no siblings to stand in for', () => {
  const options = parseArgs(['--app', 'all']);
  for (const app of options.apps) {
    const origins = siblingOrigins(options, app);
    assert.equal(origins.includes(DEFAULT_BASE_URLS[app]), false, `${app} is itself`);
  }
});

// ---------------------------------------------------------------------------
// Route discovery
// ---------------------------------------------------------------------------

test('discoverWebRoutes: finds real pages, skips dynamic segments and test dirs', () => {
  const routes = discoverWebRoutes(ROOT);
  assert.ok(routes.includes('/'), 'the index route is a route');
  assert.ok(routes.includes('/movies'));
  assert.ok(routes.includes('/auth/login'));
  assert.ok(routes.includes('/wallet/transactions'));
  assert.equal(
    routes.some((route) => route.includes('[')),
    false,
    'dynamic routes need ids, not guesses'
  );
  assert.equal(
    routes.some((route) => route.includes('__tests__')),
    false
  );
  assert.equal(
    routes.some((route) => route.includes('//')),
    false
  );
  assert.deepEqual(routes, [...routes].sort(), 'routes are sorted for stable reports');
});

test('discoverWebRoutes: route groups contribute no URL segment', () => {
  const fixture = mkdtempSync(join(tmpdir(), 'visual-audit-'));
  try {
    for (const relative of [
      'page.tsx',
      '(marketing)/about/page.tsx',
      'shop/[id]/page.tsx',
      '__tests__/page.tsx',
    ]) {
      const file = join(fixture, 'apps/web/src/app', relative);
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, 'export default function Page() {}\n');
    }
    const routes = discoverWebRoutes(fixture);
    assert.deepEqual(routes, ['/', '/about']);
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
});

test('discoverPortalRoutes: reads the route table and drops params', () => {
  const routes = discoverPortalRoutes(ROOT, 'admin');
  assert.ok(routes.includes('/'), 'the index route renders the dashboard');
  assert.ok(routes.includes('/users'));
  assert.ok(routes.includes('/feature-flags/global'));
  assert.equal(
    routes.some((route) => route.includes(':')),
    false
  );
  assert.equal(routes.includes('*'), false, 'the catch-all is not a page to audit');

  const creator = discoverPortalRoutes(ROOT, 'creator');
  assert.ok(creator.includes('/earnings'));
  assert.ok(creator.includes('/challenges'));
});

test('discoverRoutes routes each app to its own source', () => {
  assert.deepEqual(discoverRoutes(ROOT, 'web'), discoverWebRoutes(ROOT));
  assert.deepEqual(discoverRoutes(ROOT, 'creator'), discoverPortalRoutes(ROOT, 'creator'));
  assert.throws(() => discoverRoutes(ROOT, 'tv'), /unknown app/);
});

// ---------------------------------------------------------------------------
// Contrast: the WCAG 2.2 AA rule
// ---------------------------------------------------------------------------

test('parseCssColor: rgb, rgba, short and long hex, and the shapes it must refuse', () => {
  assert.deepEqual(parseCssColor('rgb(15, 15, 15)'), { r: 15, g: 15, b: 15, a: 1 });
  assert.deepEqual(parseCssColor('rgba(255, 255, 255, 0.5)'), { r: 255, g: 255, b: 255, a: 0.5 });
  assert.deepEqual(parseCssColor('#0f0f0f'), { r: 15, g: 15, b: 15, a: 1 });
  assert.deepEqual(parseCssColor('#fff'), { r: 255, g: 255, b: 255, a: 1 });
  assert.equal(parseCssColor('transparent'), null);
  assert.equal(parseCssColor('var(--color-az-flame)'), null);
  assert.equal(parseCssColor(undefined), null);
});

test('contrastRatio: the pairs this platform actually shipped', () => {
  const white = parseCssColor('#ffffff');
  const flame = parseCssColor('#EC691F');
  const scarlet = parseCssColor('#E31E24');
  const surfaceRoot = parseCssColor('#0F0F0F');

  // The defect that motivated this gate: 3.18:1 at 12–14px, on 152 pages.
  const whiteOnFlame = evaluateContrast({
    foreground: '#ffffff',
    background: '#EC691F',
    fontSizePx: 14,
    fontWeight: 400,
  });
  assert.equal(whiteOnFlame.ratio, 3.18);
  assert.equal(whiteOnFlame.required, 4.5);
  assert.equal(whiteOnFlame.passes, false);

  // The fix: the deep surface ink on flame clears AA with room to spare.
  const inkOnFlame = evaluateContrast({
    foreground: '#0F0F0F',
    background: '#EC691F',
    fontSizePx: 12,
    fontWeight: 700,
  });
  assert.equal(inkOnFlame.ratio, 6.03);
  assert.equal(inkOnFlame.passes, true);

  // White on scarlet is still a legitimate pairing — 4.69:1 at body size.
  assert.equal(
    evaluateContrast({ foreground: '#ffffff', background: '#E31E24', fontSizePx: 14 }).passes,
    true
  );
  assert.equal(
    evaluateContrast({ foreground: '#E31E24', background: '#0F0F0F', fontSizePx: 14 }).passes,
    false,
    'scarlet as 14px body text on the dark canvas is 4.09:1 — documented as a brand decision, not excused silently'
  );

  // Black on black is the floor, not zero.
  const black = parseCssColor('#000000');
  assert.equal(
    evaluateContrast({ foreground: '#000000', background: '#000000', fontSizePx: 16 }).ratio,
    1
  );
  assert.ok(white && flame && scarlet && surfaceRoot);
});

test('requiredRatio: the large-text boundary (24px, or 18.66px bold)', () => {
  assert.equal(requiredRatio(14), 4.5);
  assert.equal(requiredRatio(18, 400), 4.5);
  assert.equal(requiredRatio(18, 700), 4.5, '17.99px bold is not large text');
  assert.equal(requiredRatio(18.66, 700), 3);
  assert.equal(requiredRatio(24, 400), 3);
  assert.equal(requiredRatio(24, 700), 3);
});

test('parseGradientColors: every opaque stop, or null when the gradient is unmeasurable', () => {
  const stops = parseGradientColors('linear-gradient(90deg, #0F0F0F 0%, rgb(26, 26, 26) 100%)');
  assert.deepEqual(stops?.map(formatCssColor), ['rgb(15, 15, 15)', 'rgb(26, 26, 26)']);
  assert.equal(stops?.length, 2, 'duplicate stops collapse');

  assert.equal(parseGradientColors('none'), null);
  assert.equal(parseGradientColors('url("/hero.png")'), null);
  assert.equal(
    parseGradientColors('linear-gradient(to top, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 1) 100%)'),
    null,
    'a fade to transparent reveals an unmeasurable layer'
  );
});

test('evaluateContrast: the brand CTA gradient at large-text size', () => {
  // `.az-btn-primary` is white on a scarlet → flame gradient. At 20px/700 the
  // label is "large text", so the 3:1 floor applies and both stops clear it;
  // at the 16px it used to be, the flame stop fails. This pins the reason the
  // CTA label is 20px.
  const white = '#ffffff';
  const flame = '#EC691F';
  const scarlet = '#E31E24';
  assert.equal(
    evaluateContrast({ foreground: white, background: flame, fontSizePx: 20, fontWeight: 700 })
      .passes,
    true
  );
  assert.equal(
    evaluateContrast({ foreground: white, background: scarlet, fontSizePx: 20, fontWeight: 700 })
      .passes,
    true
  );
  assert.equal(
    evaluateContrast({ foreground: white, background: flame, fontSizePx: 16, fontWeight: 700 })
      .passes,
    false
  );
  // Dark ink is not the answer either: scarlet stops it at 4.48:1.
  assert.equal(
    evaluateContrast({
      foreground: '#0F0F0F',
      background: scarlet,
      fontSizePx: 16,
      fontWeight: 700,
    }).passes,
    false
  );
});

test('evaluateContrast: an uncomputable pair returns null rather than a verdict', () => {
  assert.equal(
    evaluateContrast({ foreground: 'var(--x)', background: '#0F0F0F', fontSizePx: 14 }),
    null
  );
});

// ---------------------------------------------------------------------------
// Identity
// ---------------------------------------------------------------------------

test('elementLabel: class order does not change the name, and group/peer hints are dropped', () => {
  const a = elementLabel({ tag: 'SPAN', className: 'az-overline rounded-az-pill bg-az-flame' });
  const b = elementLabel({ tag: 'span', className: 'bg-az-flame az-overline rounded-az-pill' });
  assert.equal(a, b);
  assert.equal(a, 'span.az-overline.bg-az-flame.rounded-az-pill');
  assert.equal(elementLabel({ tag: 'DIV', id: 'main-content' }), 'div#main-content');
  assert.equal(
    elementLabel({
      tag: 'button',
      className: 'group flex group-hover:text-az-ink peer-checked:bg-az-flame',
    }),
    'button.flex'
  );
  assert.equal(elementLabel({}), 'element');
});

test('elementLabel: keeps at most three class tokens so the name stays readable', () => {
  assert.equal(elementLabel({ tag: 'div', className: 'a b c d e' }), 'div.a.b.c');
});

test('findingIdentity: a finding is named after its cause', () => {
  const contrast = normalizeFinding({
    app: 'web',
    route: '/movies',
    viewport: 'desktop',
    check: 'contrast',
    identity: 'rgb(255, 255, 255)|on|rgb(236, 105, 31)|12px',
    detail: '3.18:1',
    sample: 'Premium',
  });
  assert.equal(contrast.id, 'contrast|rgb(255, 255, 255)|on|rgb(236, 105, 31)|12px');

  // The same chip on another route is the same identity: one decision excuses it.
  const sameChipElsewhere = normalizeFinding({
    app: 'web',
    route: '/vote',
    viewport: 'desktop',
    check: 'contrast',
    identity: 'rgb(255, 255, 255)|on|rgb(236, 105, 31)|12px',
  });
  assert.equal(contrast.id, sameChipElsewhere.id);

  assert.throws(() => findingIdentity({ check: 'contrast' }), /needs check and identity/);
});

// ---------------------------------------------------------------------------
// Allowlist: justified exceptions, and the dead-entry ratchet
// ---------------------------------------------------------------------------

const validEntry = {
  check: 'contrast',
  identity: 'rgb(227, 30, 36)|on|rgb(15, 15, 15)|18px',
  reason: 'Brand scarlet as display type on the dark canvas; a brand decision, tracked separately.',
};

test('validateAllowlist: an exception must say what it excuses and why', () => {
  assert.deepEqual(validateAllowlist({ allowlist: [validEntry] }), []);
  assert.deepEqual(validateAllowlist({ allowlist: [] }), []);

  assert.match(
    validateAllowlist({ allowlist: [{ ...validEntry, reason: 'because' }] })[0],
    /reason is required/
  );
  assert.match(
    validateAllowlist({ allowlist: [{ ...validEntry, reason: '   ' }] })[0],
    /reason is required/
  );
  assert.match(
    validateAllowlist({ allowlist: [{ ...validEntry, identity: '' }] })[0],
    /identity is required/
  );
  assert.match(
    validateAllowlist({ allowlist: [{ ...validEntry, check: 'vibes' }] })[0],
    /check must be one of/
  );
  assert.match(
    validateAllowlist({ allowlist: [{ ...validEntry, app: 'tv' }] })[0],
    /app must be one of/
  );
  assert.match(validateAllowlist({ allowlist: ['nope'] })[0], /must be an object/);
  assert.match(validateAllowlist({ allowlist: 'nope' })[0], /must be an array/);
});

test('validateAllowlist: identity is the cause, not the full finding id', () => {
  const doubled = { ...validEntry, identity: `contrast|${validEntry.identity}` };
  assert.match(validateAllowlist({ allowlist: [doubled] })[0], /is the cause, not the full id/);
});

test('diffAllowlist: excuses what it names, reports what it does not', () => {
  const finding = normalizeFinding({
    app: 'web',
    route: '/terms',
    viewport: 'desktop',
    check: 'contrast',
    identity: 'rgb(227, 30, 36)|on|rgb(15, 15, 15)|18px',
    detail: '4.09:1',
  });
  const other = normalizeFinding({
    app: 'web',
    route: '/movies',
    viewport: 'desktop',
    check: 'overflow',
    identity: 'div.grid',
  });

  const { unmatched, matched, stale } = diffAllowlist({ allowlist: [validEntry] }, [
    finding,
    other,
  ]);
  assert.deepEqual(
    unmatched.map((f) => f.id),
    ['overflow|div.grid']
  );
  assert.equal(matched.length, 1);
  assert.deepEqual(stale, []);
});

test('diffAllowlist: an entry that excuses nothing is stale (the dead-exception rule)', () => {
  const { unmatched, stale } = diffAllowlist({ allowlist: [validEntry] }, []);
  assert.deepEqual(unmatched, []);
  assert.equal(stale.length, 1);
  assert.equal(stale[0].identity, validEntry.identity);
});

test('diffAllowlist: app and route narrow an entry without weakening the others', () => {
  const finding = normalizeFinding({
    app: 'admin',
    route: '/users',
    viewport: 'desktop',
    check: 'clipped-text',
    identity: 'span.az-caption',
  });
  const narrowed = { ...validEntry, check: 'clipped-text', identity: 'span.az-caption' };

  assert.equal(
    diffAllowlist({ allowlist: [{ ...narrowed, app: 'creator' }] }, [finding]).unmatched.length,
    1
  );
  assert.equal(
    diffAllowlist({ allowlist: [{ ...narrowed, app: 'admin' }] }, [finding]).unmatched.length,
    0
  );
  assert.equal(
    diffAllowlist({ allowlist: [{ ...narrowed, route: '/wallets' }] }, [finding]).unmatched.length,
    1
  );
  assert.equal(
    diffAllowlist({ allowlist: [{ ...narrowed, route: '/users' }] }, [finding]).unmatched.length,
    0
  );
});

test('diffAllowlist: one entry excuses one finding, not every look-alike', () => {
  const findings = [
    normalizeFinding({
      app: 'web',
      route: '/a',
      viewport: 'desktop',
      check: 'overflow',
      identity: 'div.grid',
    }),
    normalizeFinding({
      app: 'web',
      route: '/b',
      viewport: 'desktop',
      check: 'overflow',
      identity: 'div.grid',
    }),
  ];
  const { unmatched, matched } = diffAllowlist(
    {
      allowlist: [
        {
          check: 'overflow',
          identity: 'div.grid',
          reason: 'Two entries are needed for two routes.',
        },
      ],
    },
    findings
  );
  assert.equal(matched.length, 1, 'an entry is consumed by the finding it excuses');
  assert.equal(unmatched.length, 1, 'the second look-alike still has to be justified');
});

test('the committed allowlist is valid and never excuses white text on flame', () => {
  const parsed = JSON.parse(
    readFileSync(join(ROOT, 'scripts/visual-audit-allowlist.json'), 'utf8')
  );
  assert.deepEqual(validateAllowlist(parsed), []);
  const whiteOnFlame = parsed.allowlist.filter((entry) =>
    entry.identity.includes('rgb(255, 255, 255)|on|rgb(236, 105, 31)')
  );
  assert.deepEqual(
    whiteOnFlame,
    [],
    'white on flame is the defect this gate exists for — it gets fixed, never excused'
  );
});

// ---------------------------------------------------------------------------
// Reporting
// ---------------------------------------------------------------------------

test('summarize counts by check', () => {
  const findings = [
    normalizeFinding({
      check: 'contrast',
      identity: 'a',
      app: 'web',
      route: '/',
      viewport: 'desktop',
    }),
    normalizeFinding({
      check: 'contrast',
      identity: 'b',
      app: 'web',
      route: '/',
      viewport: 'desktop',
    }),
    normalizeFinding({
      check: 'overflow',
      identity: 'c',
      app: 'web',
      route: '/',
      viewport: 'desktop',
    }),
  ];
  assert.deepEqual(summarize(findings), { total: 3, byCheck: { contrast: 2, overflow: 1 } });
});

test('groupFindings collapses one identity across routes, and formatFindings stays readable', () => {
  const findings = [
    normalizeFinding({
      app: 'web',
      route: '/movies',
      viewport: 'desktop',
      check: 'contrast',
      identity: 'white|on|flame|12px',
      detail: '3.18:1',
      sample: 'Premium',
    }),
    normalizeFinding({
      app: 'web',
      route: '/vote',
      viewport: 'desktop',
      check: 'contrast',
      identity: 'white|on|flame|12px',
      detail: '3.18:1',
      sample: 'Popular',
    }),
  ];
  const groups = groupFindings(findings);
  assert.equal(groups.length, 1);
  assert.deepEqual(groups[0].routes, ['web:/movies', 'web:/vote']);

  const text = formatFindings(groups).join('\n');
  assert.match(text, /\[contrast\] white\|on\|flame\|12px/);
  assert.match(text, /sample: "Premium"/);
  assert.match(text, /2 route\(s\): web:\/movies, web:\/vote/);
});

test('formatFindings truncates long route lists instead of printing hundreds', () => {
  const findings = Array.from({ length: 12 }, (_, index) =>
    normalizeFinding({
      app: 'web',
      route: `/page-${index}`,
      viewport: 'desktop',
      check: 'contrast',
      identity: 'same',
    })
  );
  const text = formatFindings(groupFindings(findings), { maxRoutes: 3 }).join('\n');
  assert.match(text, /12 route\(s\): web:\/page-0, web:\/page-1, web:\/page-10 \(\+9 more\)/);
  assert.equal(text.includes('page-11'), false, 'only maxRoutes routes are printed');
});
