// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { TransportFlip as BackendTransportFlip } from '../../../src/modules/ops/service-probe';
import OpsPage from './ops';
import { apiFetch } from '@/lib/api/base';
import type {
  OpsStatus,
  OpsRunHistory,
  PgbouncerHealth,
  OpsServicesSnapshot,
} from '@/lib/api/admin';
/**
 * Render tests for the Ops Health page's transport-mismatch warning banner.
 *
 * A transport flip (the answering loopback family changed between probe
 * sweeps) usually means someone re-bound the service — config edit, restart
 * with a different bind address, or a port steal on the other family. The
 * page must surface it loudly, call out family changes, render nothing in
 * steady state, and let the user dismiss the banner without erroring.
 *
 * apiFetch is mocked (the same pattern settings.test.tsx uses) and routed
 * by URL, so the page's real query wiring is exercised. Assertions use
 * plain vitest matchers (the project does not ship jest-dom).
 */

vi.mock('@/lib/api/base', () => ({
  apiFetch: vi.fn(),
}));

const makeQueryClient = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

const renderPage = (client = makeQueryClient()) =>
  render(
    <QueryClientProvider client={client}>
      <OpsPage />
    </QueryClientProvider>
  );

const FLIP = {
  service: 'payment-service',
  port: 3003,
  from: 'localhost' as const,
  to: 'ipv4' as const,
  detectedAt: Date.parse('2026-09-24T12:00:00Z'),
  familyChanged: false,
};

const FAMILY_FLIP = {
  service: 'live-event-service',
  port: 3027,
  from: 'ipv6' as const,
  to: 'ipv4' as const,
  detectedAt: Date.parse('2026-09-24T12:01:00Z'),
  familyChanged: true,
};

const baseStatus: OpsStatus = {
  overall: 'healthy',
  db: { ok: true, latencyMs: 2 } as OpsStatus['db'],
  federation: { ok: true, latencyMs: 3 } as OpsStatus['federation'],
  jobs: [],
  alerts: [],
  checkedAt: new Date().toISOString(),
};

const baseSnapshot = (flips: unknown[]): OpsServicesSnapshot => ({
  services: [{ name: 'auth-service', port: 3000, status: 'healthy', latencyMs: 5, dbStatus: 'up' }],
  transportFlips: flips as OpsServicesSnapshot['transportFlips'],
  transportStore: { mode: 'redis', detail: 'Fleet-wide Redis baseline' },
  checkedAt: new Date().toISOString(),
});

/** Route the mocked apiFetch by endpoint. */
const stubRoutes = (flips: unknown[]) => {
  const respond = (url: unknown) => {
    const u = String(url);
    if (u.includes('/admin/ops/services'))
      return Promise.resolve({ success: true, data: baseSnapshot(flips) });
    if (u.includes('/admin/ops/runs'))
      return Promise.resolve({
        success: true,
        data: { perJob: [], total: 0 } as unknown as OpsRunHistory,
      });
    if (u.includes('/admin/ops/pgbouncer'))
      return Promise.resolve({
        success: true,
        data: { available: true } as unknown as PgbouncerHealth,
      });
    if (u.includes('/admin/ops/status'))
      return Promise.resolve({ success: true, data: baseStatus });
    return Promise.resolve({ success: false, data: null });
  };
  vi.mocked(apiFetch).mockImplementation(respond as never);
};

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
});

describe('Ops page transport-mismatch banner', () => {
  it('renders nothing in steady state (no flips)', async () => {
    stubRoutes([]);
    renderPage();
    await waitFor(() => expect(screen.getByText(/All systems healthy/i)).toBeTruthy());
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('renders the banner loudly when a flip is live, naming the service and transition', async () => {
    stubRoutes([FLIP]);
    renderPage();
    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy());
    expect(screen.getByText(/Transport mismatch detected/i)).toBeTruthy();
    expect(screen.getByText(/payment-service/i)).toBeTruthy();
    expect(screen.getByText(/localhost/)).toBeTruthy();
    expect(screen.getByText(/ipv4/)).toBeTruthy();
  });

  it('counts family changes in the header and marks them', async () => {
    stubRoutes([FLIP, FAMILY_FLIP]);
    renderPage();
    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy());
    // Only FAMILY_FLIP is a family change → "1 service changed loopback family"
    expect(screen.getByText(/1 service changed loopback family/i)).toBeTruthy();
    expect(screen.getAllByText(/\(family change\)/i).length).toBe(1);
  });

  it('dismiss hides the banner without erroring', async () => {
    stubRoutes([FLIP]);
    renderPage();
    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: /dismiss transport mismatch/i }));
    await waitFor(() => expect(screen.queryByRole('alert')).toBeNull());
  });

  it('a reappearing flip (new detectedAt) is shown again after dismissal of the old one', async () => {
    const client = makeQueryClient();
    stubRoutes([FLIP]);
    renderPage(client);
    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: /dismiss transport mismatch/i }));
    await waitFor(() => expect(screen.queryByRole('alert')).toBeNull());

    // Backend hold window expired and the flip re-detected → new key.
    // Refetch through the SAME client (as the 30s poll would) — the page's
    // dismissed-key state must survive the refetch, and the new detectedAt
    // key must not be swallowed by the earlier dismissal.
    stubRoutes([{ ...FLIP, detectedAt: FLIP.detectedAt + 1000 }]);
    await client.refetchQueries({ type: 'active' });
    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy());
  });

  it('type parity: backend TransportFlip matches the client mirror', () => {
    // Compile-time guard that the client mirror cannot drift from the
    // backend type — the banner renders exactly what the API returns.
    const backend: BackendTransportFlip = FLIP;
    const client: OpsServicesSnapshot['transportFlips'][number] = backend;
    expect(client.service).toBe('payment-service');
  });
});

describe('Ops page transport-flip trend card', () => {
  const trendRow = {
    service: 'payment-service',
    transport: 'ipv4',
    day: '2026-09-24',
    sweeps: 42,
    flips: 3,
    familyFlips: 1,
    lastFlipAt: '2026-09-24T08:11:00.000Z',
    lastFrom: 'ipv6',
    lastTo: 'ipv4',
  };

  const stubWithTrend = (trend: unknown) => {
    const respond = (url: unknown) => {
      const u = String(url);
      if (u.includes('/admin/ops/transport-flips'))
        return Promise.resolve({ success: true, data: trend });
      if (u.includes('/admin/ops/services'))
        return Promise.resolve({ success: true, data: baseSnapshot([]) });
      if (u.includes('/admin/ops/runs'))
        return Promise.resolve({ success: true, data: { perJob: [], total: 0 } });
      if (u.includes('/admin/ops/pgbouncer'))
        return Promise.resolve({ success: true, data: { available: true } });
      if (u.includes('/admin/ops/status'))
        return Promise.resolve({ success: true, data: baseStatus });
      return Promise.resolve({ success: false, data: null });
    };
    vi.mocked(apiFetch).mockImplementation(respond as never);
  };

  it('renders the trend card when the ledger has flip rows, loudest service first', async () => {
    stubWithTrend({
      windowDays: 14,
      rows: [trendRow, { ...trendRow, service: 'auth-service', flips: 1, familyFlips: 0 }],
      events: [],
      servicesWithFlips: 2,
      totalFlips: 4,
      totalFamilyFlips: 1,
    });
    renderPage();
    await waitFor(() => expect(screen.getByText(/Transport flip trend/i)).toBeTruthy());
    expect(screen.getByText('payment-service')).toBeTruthy();
    expect(screen.getByText(/last 14d/i)).toBeTruthy();
    // Row content carries the rollup: flips count + last flip pair.
    const row = screen.getByText('payment-service').closest('tr');
    expect(row?.textContent).toContain('3');
    expect(row?.textContent).toContain('ipv6→ipv4');
    // The quieter service sorts below the louder one (flip volume desc).
    const names = screen.getAllByRole('row').map((r) => r.textContent ?? '');
    expect(names.findIndex((t) => t.includes('payment-service'))).toBeLessThan(
      names.findIndex((t) => t.includes('auth-service'))
    );
  });

  it('renders nothing when no service flipped (steady ledger)', async () => {
    stubWithTrend({
      windowDays: 14,
      rows: [
        { ...trendRow, flips: 0, familyFlips: 0, lastFlipAt: null, lastFrom: null, lastTo: null },
      ],
      events: [],
      servicesWithFlips: 0,
      totalFlips: 0,
      totalFamilyFlips: 0,
    });
    renderPage();
    await waitFor(() => expect(screen.getByText(/All systems healthy/i)).toBeTruthy());
    expect(screen.queryByText(/Transport flip trend/i)).toBeNull();
  });

  it('shows the degrade note when the ledger read failed', async () => {
    stubWithTrend({
      windowDays: 14,
      rows: [],
      events: [],
      servicesWithFlips: 0,
      totalFlips: 0,
      totalFamilyFlips: 0,
      detail: 'ledger read failed: boom',
    });
    renderPage();
    await waitFor(() => expect(screen.getByText(/Flip trend unavailable/i)).toBeTruthy());
    expect(screen.getByText(/ledger read failed: boom/i)).toBeTruthy();
  });

  it('renders the recent flip-events table with exact timestamps and family flags', async () => {
    stubWithTrend({
      windowDays: 14,
      rows: [trendRow],
      events: [
        {
          service: 'payment-service',
          port: 3014,
          from: 'ipv6',
          to: 'ipv4',
          familyChanged: true,
          detectedAt: '2026-09-24T08:11:00.000Z',
        },
        {
          service: 'auth-service',
          port: 3000,
          from: 'ipv4',
          to: 'ipv6',
          familyChanged: false,
          detectedAt: '2026-09-24T11:40:00.000Z',
        },
      ],
      servicesWithFlips: 2,
      totalFlips: 4,
      totalFamilyFlips: 1,
    });
    renderPage();
    await waitFor(() => expect(screen.getByText(/Recent flip events/i)).toBeTruthy());
    // Match event rows by service AND transition pair — bare service names
    // also appear in other page tables (fleet services, trend rollup).
    const rows = screen.getAllByRole('row').map((r) => r.textContent ?? '');
    const paymentRow = rows.find((t) => t.includes('payment-service') && t.includes('ipv6→ipv4') && t.includes('crossed'));
    expect(paymentRow).toBeTruthy();
    const authRow = rows.find((t) => t.includes('auth-service') && t.includes('ipv4→ipv6') && t.includes('rebind'));
    expect(authRow).toBeTruthy();
    // Newest first: the payment event (08:11) must appear before auth (11:40).
    expect(rows.findIndex((t) => t === paymentRow)).toBeLessThan(
      rows.findIndex((t) => t === authRow)
    );
  });

  it('hides the events table when the ledger has no flip events yet', async () => {
    stubWithTrend({
      windowDays: 14,
      rows: [trendRow],
      events: [],
      servicesWithFlips: 1,
      totalFlips: 3,
      totalFamilyFlips: 1,
    });
    renderPage();
    await waitFor(() => expect(screen.getByText(/Transport flip trend/i)).toBeTruthy());
    expect(screen.queryByText(/Recent flip events/i)).toBeNull();
  });

  it('shows the store chip as redis when the transport store is healthy', async () => {
    stubRoutes([]);
    renderPage();
    await waitFor(() => expect(screen.getByText(/store: redis/i)).toBeTruthy());
  });

  it('shows the store chip as degraded memory with the detail tooltip', async () => {
    const respond = (url: unknown) => {
      const u = String(url);
      if (u.includes('/admin/ops/services'))
        return Promise.resolve({
          success: true,
          data: {
            ...baseSnapshot([]),
            transportStore: {
              mode: 'memory',
              detail: 'Redis unreachable — flip memory is per-process',
            },
          },
        });
      if (u.includes('/admin/ops/runs'))
        return Promise.resolve({ success: true, data: { perJob: [], total: 0 } });
      if (u.includes('/admin/ops/pgbouncer'))
        return Promise.resolve({ success: true, data: { available: true } });
      if (u.includes('/admin/ops/status'))
        return Promise.resolve({ success: true, data: baseStatus });
      return Promise.resolve({ success: false, data: null });
    };
    vi.mocked(apiFetch).mockImplementation(respond as never);
    renderPage();
    const chip = await screen.findByText(/store: memory/i);
    expect(chip).toBeTruthy();
    // The degradation reason rides the title tooltip.
    expect(chip.getAttribute('title')).toMatch(/per-process/i);
  });

  it('omits the chip entirely on old snapshots without a transportStore field', async () => {
    const respond = (url: unknown) => {
      const u = String(url);
      if (u.includes('/admin/ops/services')) {
        const { transportStore: _omit, ...rest } = baseSnapshot([]);
        return Promise.resolve({ success: true, data: rest });
      }
      if (u.includes('/admin/ops/runs'))
        return Promise.resolve({ success: true, data: { perJob: [], total: 0 } });
      if (u.includes('/admin/ops/pgbouncer'))
        return Promise.resolve({ success: true, data: { available: true } });
      if (u.includes('/admin/ops/status'))
        return Promise.resolve({ success: true, data: baseStatus });
      return Promise.resolve({ success: false, data: null });
    };
    vi.mocked(apiFetch).mockImplementation(respond as never);
    renderPage();
    await waitFor(() => expect(screen.getByText(/All systems healthy/i)).toBeTruthy());
    expect(screen.queryByText(/store: /i)).toBeNull();
  });

  describe('foreign dialer persistence row links', () => {
    const pgbouncerWithPersistence = (persistence: unknown) => {
      const respond = (url: unknown) => {
        const u = String(url);
        if (u.includes('/admin/ops/pgbouncer'))
          return Promise.resolve({
            success: true,
            data: {
              available: true,
              level: 'ok',
              foreignPersistence: persistence,
            },
          });
        if (u.includes('/admin/ops/services'))
          return Promise.resolve({ success: true, data: baseSnapshot([]) });
        if (u.includes('/admin/ops/runs'))
          return Promise.resolve({ success: true, data: { perJob: [], total: 0 } });
        if (u.includes('/admin/ops/status'))
          return Promise.resolve({ success: true, data: baseStatus });
        return Promise.resolve({ success: false, data: null });
      };
      vi.mocked(apiFetch).mockImplementation(respond as never);
    };

    const baseRow = {
      workspace: '/Users/partner/fleet',
      passes: 30,
      spanHours: 30,
      lastSeen: new Date().toISOString(),
      conns: 2,
      approved: false,
      sustained: true,
      history: [0, 1, 2, 0, 3],
      bucketSeconds: 7200,
    };

    it('links a sustained row to the tracking issue when its URL resolved', async () => {
      pgbouncerWithPersistence({
        windowHours: 48,
        sustainedMinSpanHours: 24,
        rows: [baseRow],
        trackingIssueUrl: 'https://github.com/azeebotv/AzeeboPlus/issues/42',
      });
      renderPage();
      const link = await screen.findByText(/sustained — tracking issue/i);
      expect(link.getAttribute('href')).toBe('https://github.com/azeebotv/AzeeboPlus/issues/42');
      expect(link.getAttribute('target')).toBe('_blank');
    });

    it('keeps the plain badge when the URL could not be resolved (degrade)', async () => {
      pgbouncerWithPersistence({
        windowHours: 48,
        sustainedMinSpanHours: 24,
        rows: [baseRow],
        trackingIssueUrl: null,
      });
      renderPage();
      const badge = await screen.findByText(/sustained — tracked nightly/i);
      expect(badge.getAttribute('href')).toBeNull();
    });

    it('approved rows never link (they are never tracked)', async () => {
      pgbouncerWithPersistence({
        windowHours: 48,
        sustainedMinSpanHours: 24,
        rows: [{ ...baseRow, approved: true, sustained: false }],
        trackingIssueUrl: 'https://github.com/azeebotv/AzeeboPlus/issues/42',
      });
      renderPage();
      const badge = await screen.findByText(/approved — not tracked/i);
      expect(badge.getAttribute('href')).toBeNull();
      expect(screen.queryByText(/sustained — tracking issue/i)).toBeNull();
    });
  });

  describe('fleet transport table', () => {
    const withServicesSnapshot = (snapshot: unknown) => {
      const respond = (url: unknown) => {
        const u = String(url);
        if (u.includes('/admin/ops/pgbouncer'))
          return Promise.resolve({ success: true, data: { available: false, detail: 'skipped' } });
        if (u.includes('/admin/ops/services'))
          return Promise.resolve({ success: true, data: snapshot });
        if (u.includes('/admin/ops/runs'))
          return Promise.resolve({ success: true, data: { perJob: [], total: 0 } });
        if (u.includes('/admin/ops/status'))
          return Promise.resolve({ success: true, data: baseStatus });
        return Promise.resolve({ success: false, data: null });
      };
      vi.mocked(apiFetch).mockImplementation(respond as never);
    };

    const fleetServices = [
      { name: 'auth-service', port: 3001, status: 'healthy', latencyMs: 4, dbStatus: 'up', transport: 'ipv6' },
      { name: 'gateway', port: 3013, status: 'healthy', latencyMs: 9, dbStatus: 'up', transport: 'ipv4' },
      { name: 'user-service', port: 3003, status: 'healthy', latencyMs: 6, dbStatus: 'up', transport: 'localhost' },
      { name: 'search-service', port: 3004, status: 'down', latencyMs: 0, dbStatus: 'unknown', errorDetail: 'ECONNREFUSED' },
    ];

    it('renders one row per service with the family that answered', async () => {
      withServicesSnapshot({
        services: fleetServices,
        transportFlips: [],
        transportStore: { mode: 'redis', detail: 'fleet-wide' },
        checkedAt: new Date().toISOString(),
      });
      renderPage();
      const card = await screen.findByTestId('fleet-transport-card');
      expect(card).toBeTruthy();
      await screen.findByText('auth-service');
      // Family labels, exactly as transportCell maps them.
      expect(screen.getByText('IPv6-only')).toBeTruthy();
      expect(screen.getByText('IPv4-only')).toBeTruthy();
      // localhost is deliberately NOT a family claim: dual-stack.
      expect(screen.getByText('dual-stack')).toBeTruthy();
      // Down: never a family label — the sweep could not reach it. The
      // failure detail rides the title attribute, not the cell text.
      expect(screen.getByText('unreachable')).toBeTruthy();
      expect(screen.getByTitle(/last probe failure: ECONNREFUSED/)).toBeTruthy();
      expect(screen.getByText(/3\/4 answering/)).toBeTruthy();
    });

    it('a family flip from the sweep shows in the card header count', async () => {
      withServicesSnapshot({
        services: [fleetServices[0]],
        transportFlips: [
          {
            service: 'auth-service',
            port: 3001,
            from: 'ipv4',
            to: 'ipv6',
            detectedAt: Date.now(),
            familyChanged: true,
          },
        ],
        transportStore: { mode: 'redis', detail: 'fleet-wide' },
        checkedAt: new Date().toISOString(),
      });
      renderPage();
      const card = await screen.findByTestId('fleet-transport-card');
      // (the flip banner ALSO names the service — assert inside the card)
      await screen.findByText(/family flips this sweep: 1/);
      expect(card.textContent).toContain('auth-service');
    });
  });

  describe('foreign persistence pass-history sparkline', () => {
    const pgbouncerWithPersistence = (persistence: unknown) => {
      const respond = (url: unknown) => {
        const u = String(url);
        if (u.includes('/admin/ops/pgbouncer'))
          return Promise.resolve({
            success: true,
            data: {
              available: true,
              level: 'ok',
              foreignPersistence: persistence,
            },
          });
        if (u.includes('/admin/ops/services'))
          return Promise.resolve({ success: true, data: baseSnapshot([]) });
        if (u.includes('/admin/ops/runs'))
          return Promise.resolve({ success: true, data: { perJob: [], total: 0 } });
        if (u.includes('/admin/ops/status'))
          return Promise.resolve({ success: true, data: baseStatus });
        return Promise.resolve({ success: false, data: null });
      };
      vi.mocked(apiFetch).mockImplementation(respond as never);
    };

    const sparkRow = {
      workspace: '/Users/other/fleet',
      passes: 8,
      spanHours: 8,
      lastSeen: new Date().toISOString(),
      conns: 1,
      approved: false,
      sustained: false,
      history: [1, 0, 2, 0, 5, 0, 0, 0],
      bucketSeconds: 7200,
    };

    it('renders a per-row sparkline from the history buckets', async () => {
      pgbouncerWithPersistence({
        windowHours: 48,
        sustainedMinSpanHours: 24,
        rows: [sparkRow],
        trackingIssueUrl: null,
      });
      renderPage();
      const bars = await screen.findAllByRole('img', {
        name: /Flagged passes per 2h bucket/i,
      });
      expect(bars).toHaveLength(1);
      const bar = bars[0]!;
      expect(bar.getAttribute('aria-label')).toMatch(/peak bucket: 5 passes/);
      expect(bar.getAttribute('title')).toMatch(/last 48h/);
      // One bar per history bucket.
      expect(bar.children).toHaveLength(sparkRow.history.length);
    });

    it('a flat (silent) history renders with no peak callout', async () => {
      pgbouncerWithPersistence({
        windowHours: 48,
        sustainedMinSpanHours: 24,
        rows: [{ ...sparkRow, history: [0, 0, 0, 0] }],
        trackingIssueUrl: null,
      });
      renderPage();
      const bar = await screen.findByRole('img', {
        name: /Flagged passes per 2h bucket/i,
      });
      expect(bar.getAttribute('aria-label')).toMatch(/\(oldest → newest\)$/);
      expect(bar.getAttribute('aria-label')).not.toMatch(/peak bucket/i);
    });
  });
});
