// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { creatorApi } from '@/lib/api/creator';
import EarningsPage from './earnings';

vi.mock('@/lib/api/creator', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api/creator')>();
  return {
    ...actual,
    creatorApi: {
      ...actual.creatorApi,
      getEarnings: vi.fn(),
      getEarningsHistory: vi.fn(),
    },
  };
});

const getEarnings = vi.mocked(creatorApi.getEarnings);
const getEarningsHistory = vi.mocked(creatorApi.getEarningsHistory);

const OUTAGE = {
  success: false,
  statusCode: 503,
  message: 'Wallet service is restarting',
};

const SUMMARY = { total: 250000, count: 4, pendingPayout: 0, lifetimeEarnings: 900000 };

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <EarningsPage />
    </QueryClientProvider>
  );
}

describe('Earnings page under a failed read', () => {
  beforeEach(() => {
    getEarnings.mockReset();
    getEarningsHistory.mockReset();
  });
  afterEach(cleanup);

  it('names the outage instead of claiming there is no earnings data', async () => {
    getEarnings.mockResolvedValue(OUTAGE as never);
    getEarningsHistory.mockResolvedValue(OUTAGE as never);
    const { container } = renderPage();

    await waitFor(
      () => expect(screen.getByText(/Wallet service is restarting/)).toBeTruthy(),
      { timeout: 10000 }
    );
    expect(container.textContent).not.toContain('No earnings data available');
    expect(container.textContent).not.toContain('No earnings recorded yet');
  });

  it('still renders the real zero for a creator who has earned nothing', async () => {
    getEarnings.mockResolvedValue({
      success: true,
      data: { total: 0, count: 0, pendingPayout: 0, lifetimeEarnings: 0 },
    } as never);
    getEarningsHistory.mockResolvedValue({ success: true, data: { items: [], total: 0 } } as never);
    const { container } = renderPage();

    await waitFor(() => expect(container.textContent).toContain('No earnings recorded yet'));
    expect(container.textContent).not.toContain('Wallet service is restarting');
  });

  it('keeps the summary cards while only the history read fails', async () => {
    getEarnings.mockResolvedValue({ success: true, data: SUMMARY } as never);
    getEarningsHistory.mockResolvedValue(OUTAGE as never);
    const { container } = renderPage();

    await waitFor(() =>
      expect(container.textContent).toContain('Wallet service is restarting')
    );
    // The summary answered, so its ₦250,000 stays on screen…
    expect(container.textContent).toContain('250,000');
    // …and the failed history read is not presented as an empty ledger.
    expect(container.textContent).not.toContain('No earnings recorded yet');
  });
});
