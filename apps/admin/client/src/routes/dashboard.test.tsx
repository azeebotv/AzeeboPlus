// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import DashboardPage from './dashboard';
import { apiFetch } from '@/lib/api/base';

/**
 * Observed live: GET /api/v1/admin/dashboard/governance-summary answered 502 and
 * the dashboard rendered "Awaiting Approval 0" — an admin reading that as
 * "nothing needs two-person approval" while the governance service was down.
 *
 * The page already had a failed-metrics branch, but its queryFn coerced every
 * unsuccessful response to zeros, so that branch could never fire. These tests
 * pin the distinction between "count is zero" and "count is unknown".
 */

vi.mock('@/lib/api/base', () => ({ apiFetch: vi.fn() }));
const mockApiFetch = vi.mocked(apiFetch);

const OUTAGE = { success: false, status: 503, statusCode: 503, message: 'governance unavailable' };

const byPath = (url: string) => {
  if (url.includes('governance-summary')) return OUTAGE;
  if (url.includes('wallets/stats')) return { success: true, data: { totalWallets: 79 } };
  return {
    success: true,
    data: { totalUsers: 121, totalContent: 271, totalViews: 1500, totalRevenue: 25100, newUsers: 0 },
  };
};

const renderPage = () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('dashboard failed reads', () => {
  beforeEach(() => {
    mockApiFetch.mockReset();
    mockApiFetch.mockImplementation(async (url: string) => byPath(url) as never);
  });

  afterEach(cleanup);

  it('marks governance counters unavailable instead of showing 0', async () => {
    const { container } = renderPage();

    // The governance query opts into retry: 1 (an outage must not blank the
    // dashboard), so the error only lands after the retry also fails.
    await waitFor(() => expect(container.textContent).toContain('Unavailable'), { timeout: 6000 });
    expect(container.textContent?.match(/Unavailable/g)).toHaveLength(4);
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByText('Governance')).toBeTruthy();
  });

  it('still renders a real zero when the governance service answers', async () => {
    mockApiFetch.mockImplementation(async () => ({
      success: true,
      data: { pendingDualControl: 0, approvedNotExecuted: 0, expiringClearances: 0, expiredClearances: 0 },
    }) as never);
    renderPage();

    expect(await screen.findByText('Governance')).toBeTruthy();
    expect(screen.queryByText('Unavailable')).toBeNull();
  });

  it('reaches the page-level metrics error branch when stats fail', async () => {
    mockApiFetch.mockImplementation(async () => OUTAGE as never);
    renderPage();

    expect(await screen.findByText('Failed to load dashboard metrics')).toBeTruthy();
    expect(screen.queryByText('Total Users')).toBeNull();
  });

  it('shows a dash for wallets when only the wallet aggregate is down', async () => {
    mockApiFetch.mockImplementation(async (url: string) =>
      url.includes('wallets/stats') ? (OUTAGE as never) : (byPath(url) as never)
    );
    renderPage();

    expect(await screen.findByText('Wallets')).toBeTruthy();
    expect(screen.getByText('—')).toBeTruthy();
  });
});
