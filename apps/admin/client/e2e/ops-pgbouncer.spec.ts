import { test, expect, type Page, type Route } from '@playwright/test';

/**
 * Browser render-regression sweep for the Ops Health pgbouncer card.
 *
 * The card's four tables (pools, budgets+rollups, bypasses, foreign
 * persistence) are the eyes on pool saturation — but unit tests stub at the
 * component boundary, so a JSX/typing/format regression would ship silently.
 * This spec mounts the REAL page (real router, AdminLayout, react-query,
 * polling) against `page.route`-mocked endpoints (the established
 * smoke.spec.ts pattern) and snapshots the card's accessibility tree with
 * toMatchAriaSnapshot — text-based YAML that is stable across OS font/DPI
 * differences where pixel screenshots are not.
 *
 * Unmocked fetches fail LOUD here on purpose: if a future endpoint the page
 * needs is missing from this spec, the run breaks instead of the card
 * silently rendering empty tables in CI while production breaks.
 */

// ── Fixture constants (extracted so assertions can't drift from inputs) ──
const MAX_CONN = 100;
const TOTAL_CLIENTS = 82; // degraded band (80–95%)
const USAGE = 82;

const POOLS = [
  {
    database: 'azeebo_admin',
    user: 'azeebo',
    clActive: 64,
    clWaiting: 3,
    svActive: 40,
    svIdle: 12,
  },
  {
    database: 'azeebo_creator',
    user: 'azeebo',
    clActive: 18,
    clWaiting: 0,
    svActive: 15,
    svIdle: 9,
  },
];

const BUDGETS = [
  {
    database: 'azeebo_admin',
    services: [
      { workspace: '@azeebo/admin', database: 'azeebo_admin', connectionLimit: 40 },
      { workspace: '@azeebo/api', database: 'azeebo_admin', connectionLimit: 30 },
    ],
    worstCaseTotal: 70,
    uncapped: [],
  },
  {
    database: 'azeebo_creator',
    services: [
      { workspace: '@azeebo/creator', database: 'azeebo_creator', connectionLimit: null },
    ],
    worstCaseTotal: 20,
    uncapped: ['@azeebo/creator'],
  },
];

const BYPASSES = [
  { workspace: 'services/core/auth-service', command: 'node', pid: 4242, connections: 2 },
  { workspace: 'apps/admin', command: 'node', pid: 4243, connections: 1 },
];

const FOREIGN = [
  { workspace: '/Users/other/YCN/services/gateway', connections: 3, ipv6: 1 },
  { workspace: '/Users/other/YCN/services/rewards', connections: 1 },
];

// 8 buckets keeps the sparkline compact; peak 5 drives the aria-label.
const HISTORY = [1, 2, 0, 0, 3, 0, 5, 0];

const PERSISTENCE = {
  windowHours: 48,
  sustainedMinSpanHours: 24,
  // Resolves the sustained row's link branch ("sustained — tracking issue").
  trackingIssueUrl: 'https://github.com/azeebotv/AzeeboPlus/issues/42',
  rows: [
    {
      workspace: '/Users/other/YCN/services/gateway',
      project: 'YCN-other',
      passes: 8,
      spanHours: 26.5,
      lastSeen: '2026-09-27T10:30:00.000Z',
      conns: 3,
      sustained: true,
      approved: false,
      history: HISTORY,
      connHistory: [null, 2, 3, null, 6, 1, null, 0],
      bucketSeconds: 7200,
    },
    {
      workspace: '/Users/other/YCN/services/rewards',
      project: 'YCN-other',
      passes: 3,
      spanHours: 4,
      lastSeen: '2026-09-27T11:50:00.000Z',
      conns: 1,
      sustained: false,
      approved: false,
      history: [0, 1, 0, 0, 0, 0, 1, 0],
      connHistory: [null, 1, null, null, null, null, 2, null],
      bucketSeconds: 7200,
    },
    {
      // Approved (allowlisted) dialer — visible, but NEVER sustained.
      workspace: '/Users/me/YCN/services/api',
      project: 'YCN-mine',
      passes: 30,
      spanHours: 30,
      lastSeen: '2026-09-27T11:55:00.000Z',
      conns: 2,
      sustained: false,
      approved: true,
      history: [3, 3, 3, 3, 3, 3, 3, 3],
      connHistory: [2, 2, 2, 2, 2, 2, 2, 2],
      bucketSeconds: 7200,
    },
  ],
};

const PGBOUNCER_PAYLOAD = {
  available: true,
  maxClientConn: MAX_CONN,
  totalClients: TOTAL_CLIENTS,
  usagePercent: USAGE,
  level: 'degraded',
  pools: POOLS,
  serviceBudgets: BUDGETS,
  bypasses: BYPASSES,
  foreignDirectClients: FOREIGN,
  foreignPersistence: PERSISTENCE,
  checkedAt: '2026-09-27T12:00:00.000Z',
  latencyMs: 7,
};

// ── Route mocking ──────────────────────────────────────────────────────────

/** Wrap any data in the apiFetch envelope. */
const ok = (data: unknown) => ({ success: true, data });

/** 200 JSON responder for a Playwright route. */
const json = (route: Route, body: unknown) =>
  route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });

async function mockOpsEndpoints(page: Page, pgbouncerData: unknown) {
  // The real auth token never matters — apiFetch just forwards it. But the
  // AdminLayout's flag/audit pollers hit real endpoints on load; mock those
  // so the layout renders identically here and in CI.
  await page.addInitScript(() => {
    localStorage.setItem(
      'azeebo_admin_user',
      JSON.stringify({
        id: 'e2e-admin',
        email: 'admin@azeebo.com',
        name: 'Test Admin',
        role: 'admin',
      })
    );
    localStorage.setItem('azeebo_admin_user_token', 'e2e-token');
  });

  // Fail-LOUD catch-all for API calls. Registered with a URL PREDICATE (not
  // a glob) so it only ever claims real /api/v1/ requests — a `**/api/**`
  // glob would also swallow vite module URLs like /src/lib/api/admin.ts
  // (the literal `api` path segment) and break the app boot. Anything not
  // matching the predicate reaches the dev server untouched.
  await page.route(
    (url) => url.pathname.includes('/api/v1/'),
    (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          message: `unmocked endpoint: ${route.request().url()}`,
        }),
      })
  );

  await page.route('**/api/v1/admin/ops/status', (route) =>
    json(
      route,
      ok({
        overall: 'healthy',
        db: { ok: true, label: 'Database', detail: 'select 1' },
        federation: { ok: true, label: 'Federation', detail: 'ok' },
        jobs: [],
        alerts: [],
        checkedAt: '2026-09-27T12:00:00.000Z',
      })
    )
  );

  await page.route('**/api/v1/admin/ops/runs**', (route) =>
    json(route, ok({ windowHours: 24, perJob: [] }))
  );

  await page.route('**/api/v1/admin/ops/pgbouncer', (route) =>
    json(route, ok(pgbouncerData))
  );

  await page.route('**/api/v1/admin/ops/services', (route) =>
    json(
      route,
      ok({
        // Three families represented so the fleet table's per-family labels
        // (IPv6-only / IPv4-only / dual-stack, plus one down row) are all
        // inside the aria snapshot — a label regression fails the sweep.
        services: [
          { name: 'auth-service', port: 3001, status: 'healthy', latencyMs: 4, dbStatus: 'up', transport: 'ipv6' },
          { name: 'gateway', port: 3013, status: 'healthy', latencyMs: 9, dbStatus: 'up', transport: 'ipv4' },
          { name: 'user-service', port: 3003, status: 'healthy', latencyMs: 6, dbStatus: 'up', transport: 'localhost' },
          { name: 'search-service', port: 3004, status: 'down', latencyMs: 0, dbStatus: 'unknown', errorDetail: 'ECONNREFUSED' },
        ],
        transportFlips: [],
        transportStore: {
          mode: 'redis',
          detail: 'fleet-wide',
          fetchedAt: '2026-09-27T12:00:00.000Z',
        },
        checkedAt: '2026-09-27T12:00:00.000Z',
      })
    )
  );

  await page.route('**/api/v1/admin/ops/transport-flips**', (route) =>
    json(
      route,
      ok({ windowDays: 7, rows: [], events: [], servicesWithFlips: 0, totalFlips: 0, totalFamilyFlips: 0 })
    )
  );

  // Layout pollers.
  await page.route('**/api/v1/admin/universes/feature-flags', (route) => json(route, ok([])));
  await page.route('**/api/v1/admin/feature-flags/stale/metrics', (route) =>
    json(route, ok({ available: false, fetchedAt: null, staleRunning: {}, autoDisabled: {} }))
  );
  await page.route('**/api/v1/admin/audit**', (route) =>
    json(route, ok({ items: [], total: 0 }))
  );
}

/**
 * Route to the ops page and wait for the card's headline data to land. The
 * degraded warning renders just above the tables — its appearance means the
 * payload arrived and all four tables are mounted. Generous timeouts: a cold
 * vite dev server (fresh CI webServer) compiles the page on first request.
 */
async function openOps(page: Page) {
  await page.goto('/ops');
  const card = page.getByTestId('pgbouncer-card');
  await expect(card).toBeVisible({ timeout: 30_000 });
  await expect(
    card.getByText(/Warning: client connections ≥80% of max_client_conn/)
  ).toBeVisible({ timeout: 15_000 });
  return card;
}

test.describe('Ops Health pgbouncer card render sweep', () => {
  // Pin locale/timezone: the persistence table renders ledger timestamps via
  // toLocaleTimeString(), and the committed aria snapshot must match the
  // rendered text on any runner (CI images default to UTC; dev machines do
  // not). Deterministic environment = portable snapshot.
  test.use({ locale: 'en-US', timezoneId: 'UTC' });

  test('happy path: all five tables render their rows, totals, and badges', async ({
    page,
  }) => {
    await mockOpsEndpoints(page, PGBOUNCER_PAYLOAD);
    const card = await openOps(page);

    // Header: saturation chip + budget line + degraded banner.
    await expect(card.getByText('DEGRADED', { exact: true })).toBeVisible();
    await expect(card.getByText(/82 \/ 100 clients \(82%\)/)).toBeVisible();
    await expect(
      card.getByText(/Warning: client connections ≥80% of max_client_conn/)
    ).toBeVisible();

    // Document-order tables: pools, budgets(+rollups), bypasses, foreign
    // direct clients (the LIVE lsof scan), persistence (the LEDGER history).
    const tables = card.getByRole('table');
    await expect(tables).toHaveCount(5);
    const poolsTable = tables.nth(0);
    const budgetsTable = tables.nth(1);
    const bypassesTable = tables.nth(2);
    const foreignDirectTable = tables.nth(3);
    const persistenceTable = tables.nth(4);

    // Pools: both databases, active/waiting counts as rendered cells.
    await expect(poolsTable).toContainText('azeebo_admin');
    await expect(poolsTable).toContainText('azeebo_creator');
    await expect(poolsTable).toContainText('64');
    await expect(poolsTable).toContainText('3');
    await expect(poolsTable).toContainText('12');

    // Budgets: capped rows, the uncapped marker, and the rollup totals.
    await expect(budgetsTable).toContainText('connection_limit');
    await expect(budgetsTable).toContainText('uncapped');
    await expect(budgetsTable).toContainText('worst case — 2 services');
    await expect(budgetsTable).toContainText('70');
    await expect(budgetsTable).toContainText('20+');

    // Bypasses: repo processes holding direct Postgres sockets.
    await expect(bypassesTable).toContainText('services/core/auth-service');
    await expect(bypassesTable).toContainText('4242');
    await expect(bypassesTable).toContainText('2');

    // Foreign direct clients: live connections from other projects, with the
    // IPv6 column (a "—" for the rewards dialer that dials IPv4 only).
    await expect(foreignDirectTable).toContainText('over IPv6');
    await expect(foreignDirectTable).toContainText('/Users/other/YCN/services/gateway');
    await expect(
      foreignDirectTable.getByRole('row', { name: /rewards/ }).getByText('—', { exact: true })
    ).toBeVisible();
    await expect(
      card.getByText(/4 other direct connections on this host belong to different projects/)
    ).toBeVisible();

    // Persistence: every badge branch exercised at once — sustained link,
    // below-threshold, and approved (never sustained, never linked).
    await expect(persistenceTable).toContainText('sustained — tracking issue');
    const trackingLink = persistenceTable.getByRole('link', {
      name: /sustained — tracking issue/,
    });
    await expect(trackingLink).toHaveAttribute('target', '_blank');
    await expect(trackingLink).toHaveAttribute('rel', 'noreferrer');
    await expect(persistenceTable).toContainText('below threshold');
    await expect(persistenceTable).toContainText('approved — not tracked');
    await expect(
      persistenceTable.getByRole('link', { name: /approved|below threshold/ })
    ).toHaveCount(0);

    // Sparklines: one per row, each carrying its own label with peak count.
    const sparklines = persistenceTable.getByRole('img');
    await expect(sparklines).toHaveCount(3);
    await expect(
      sparklines.filter({ hasText: '' }).nth(0)
    ).toHaveAttribute('aria-label', /Flagged passes per 2h bucket.*peak bucket: 5 passes/);
  });

  test('card accessibility tree matches its committed snapshot', async ({ page }) => {
    await mockOpsEndpoints(page, PGBOUNCER_PAYLOAD);
    const card = await openOps(page);

    // The real regression net: ANY new table, column, badge, or text node —
    // or a removed one — changes this YAML and fails the run. Text-based,
    // so it is font/DPI-stable across runner images.
    await expect(card).toMatchAriaSnapshot();
  });

  test('unreachable pooler degrades the whole card to one amber notice', async ({
    page,
  }) => {
    await mockOpsEndpoints(
      page,
      pgbouncerPayloadUnavailable('SHOW POOLS timed out after 3s')
    );
    await page.goto('/ops');
    const card = page.getByTestId('pgbouncer-card');
    await expect(card).toBeVisible({ timeout: 30_000 });

    await expect(
      card.getByText(/Pooler not reachable — SHOW POOLS timed out after 3s/)
    ).toBeVisible();
    await expect(card.getByRole('table')).toHaveCount(0);
    await expect(card.getByText('DEGRADED', { exact: true })).toHaveCount(0);
  });

  test('empty ledger and empty pools render their zero states', async ({ page }) => {
    await mockOpsEndpoints(
      page,
      pgbouncerPayload({
        pools: [],
        serviceBudgets: [],
        budgetsDetail: 'workspace tree not found',
        bypasses: [],
        foreignDirectClients: [],
        foreignPersistence: {
          windowHours: 48,
          sustainedMinSpanHours: 24,
          rows: [],
          trackingIssueUrl: null,
        },
      })
    );
    const card = await openOps(page);

    await expect(
      card.getByText('No pools yet — no service has connected since the pooler started.')
    ).toBeVisible();
    await expect(
      card.getByText(/Per-service budgets unavailable — workspace tree not found/)
    ).toBeVisible();
    await expect(
      card.getByText(/✓ No repo processes are connecting to Postgres directly/)
    ).toBeVisible();
    // Persistence section disappears entirely when its rows are empty and
    // nothing new was seen live; only the pools zero-state table remains.
    await expect(card.getByRole('table')).toHaveCount(1);
    await expect(card.getByText('Foreign project')).toHaveCount(0);
  });
});

/** Shallow-override helper for the pgbouncer fixture. */
function pgbouncerPayload(overrides: Record<string, unknown> = {}) {
  return { ...PGBOUNCER_PAYLOAD, ...overrides };
}

/** The unavailable-pooler shape: everything below the header disappears. */
function pgbouncerPayloadUnavailable(detail: string) {
  return {
    available: false,
    detail,
    checkedAt: '2026-09-27T12:00:00.000Z',
    latencyMs: 9,
  };
}
