// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ContentReviewPage from './content-review';
import { apiFetch } from '@/lib/api/base';

/**
 * "All caught up!" is the most damaging possible lie in the panel: moderators
 * stop reviewing when the queue reads empty. A failed GET used to return [] and
 * render exactly that, and a failed approve/reject fired onSuccess, so a 403 or
 * an outage looked like a completed review action.
 */

vi.mock('@/lib/api/base', () => ({ apiFetch: vi.fn() }));
const mockApiFetch = vi.mocked(apiFetch);

const OUTAGE = {
  success: false,
  status: 503,
  statusCode: 503,
  message: 'Content service is restarting',
};

const ITEM = {
  id: 'c-1',
  title: 'Reality Ep 9',
  creatorName: 'Aisha',
  submittedAt: '2026-10-01T00:00:00Z',
  status: 'pending',
};

const renderPage = () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <ContentReviewPage />
    </QueryClientProvider>
  );
};

describe('content review queue', () => {
  beforeEach(() => {
    mockApiFetch.mockReset();
  });

  afterEach(cleanup);

  it('shows an outage instead of All caught up when the queue read fails', async () => {
    mockApiFetch.mockResolvedValue(OUTAGE as never);
    renderPage();

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('Review queue unavailable.');
    expect(alert.textContent).toContain(OUTAGE.message);
    expect(screen.queryByText('All caught up!')).toBeNull();
    expect(screen.getByText('Review queue unavailable')).toBeTruthy();
  });

  it('still shows All caught up for a genuinely empty queue', async () => {
    mockApiFetch.mockResolvedValue({ success: true, data: { items: [], total: 0 } } as never);
    renderPage();

    expect(await screen.findByText('All caught up!')).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('reports a failed approve instead of pretending it succeeded', async () => {
    mockApiFetch.mockResolvedValue({ success: true, data: { items: [ITEM], total: 1 } } as never);
    renderPage();
    await screen.findByText('Reality Ep 9');

    // Queue read, then the POST fails.
    mockApiFetch.mockResolvedValue({
      success: false,
      statusCode: 403,
      message: 'CSRF token mismatch',
    } as never);
    const callsBefore = mockApiFetch.mock.calls.length;
    fireEvent.click(screen.getByRole('button', { name: /Approve/ }));

    await waitFor(() => expect(mockApiFetch.mock.calls.length).toBeGreaterThan(callsBefore));
    expect(await screen.findByText('CSRF token mismatch')).toBeTruthy();
    expect(mockApiFetch.mock.calls.some(([, init]) => (init as RequestInit)?.method === 'POST')).toBe(
      true
    );
  });
});
