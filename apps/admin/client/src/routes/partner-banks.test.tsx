// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PartnerBanksPage from './partner-banks';
import QueryErrorToasts from '@/components/QueryErrorToasts';
import { apiFetch } from '@/lib/api/base';

/**
 * The bug class these tests pin down: `apiFetch` RESOLVES a failed request as
 * `{ success: false, … }`, so a list query that returned `res.data ?? []`
 * reported success and the page rendered "no lending partners configured"
 * while the wallet service was actually down. An admin then reads missing data
 * where there is only missing connectivity.
 *
 * Both surfaces must fire for the same outage: the page's inline banner and the
 * global failed-read surface mounted by AdminLayout.
 */

vi.mock('@/lib/api/base', () => ({ apiFetch: vi.fn() }));
const mockApiFetch = vi.mocked(apiFetch);

const OUTAGE = {
  success: false,
  status: 503,
  statusCode: 503,
  message: 'Wallet service is restarting',
};

const EMPTY_LIST = { success: true, data: { items: [], total: 0 }, message: 'ok' };

const renderPage = () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <PartnerBanksPage />
      <QueryErrorToasts />
    </QueryClientProvider>
  );
};

describe('partner banks — failed reads vs empty data', () => {
  beforeEach(() => {
    mockApiFetch.mockReset();
  });

  afterEach(cleanup);

  it('renders an error surface, not the empty state, when the list read fails', async () => {
    mockApiFetch.mockResolvedValue(OUTAGE as never);
    renderPage();

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('Partner list unavailable.');
    expect(screen.getByText('Partner list unavailable')).toBeTruthy();
    expect(alert.textContent).toContain(OUTAGE.message);
    expect(screen.queryByText(/No lending partners configured/)).toBeNull();
  });

  it('names the failed read on the global surface too', async () => {
    mockApiFetch.mockResolvedValue(OUTAGE as never);
    renderPage();

    const toast = await screen.findByRole('status');
    expect(toast.textContent).toContain('partner-banks');
    expect(toast.textContent).toContain(OUTAGE.message);
  });

  it('re-requests the list from the banner retry', async () => {
    mockApiFetch.mockResolvedValue(OUTAGE as never);
    renderPage();

    const alert = await screen.findByRole('alert');
    const before = mockApiFetch.mock.calls.length;

    fireEvent.click(within(alert).getByRole('button', { name: 'Retry' }));
    await waitFor(() => expect(mockApiFetch.mock.calls.length).toBeGreaterThan(before));
  });

  it('recovers both surfaces once the list loads', async () => {
    mockApiFetch.mockResolvedValue(OUTAGE as never);
    renderPage();
    const alert = await screen.findByRole('alert');
    await screen.findByRole('status');

    mockApiFetch.mockResolvedValue(EMPTY_LIST as never);
    fireEvent.click(within(alert).getByRole('button', { name: 'Retry' }));

    await waitFor(() => expect(screen.queryByRole('alert')).toBeNull());
    await waitFor(() => expect(screen.queryByRole('status')).toBeNull());
    expect(screen.getByText(/No lending partners configured/)).toBeTruthy();
  });

  it('still shows the empty state when the service answers with a genuinely empty list', async () => {
    mockApiFetch.mockResolvedValue(EMPTY_LIST as never);
    renderPage();

    await screen.findByText(/No lending partners configured/);
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.queryByRole('status')).toBeNull();
    expect(screen.getByText('0 partners · 0 shown on the public Borrow page')).toBeTruthy();
  });
});
