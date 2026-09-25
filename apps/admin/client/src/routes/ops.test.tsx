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
