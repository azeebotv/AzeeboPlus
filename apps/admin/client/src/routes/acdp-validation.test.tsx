// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AcdpValidationPage from './acdp-validation';
import { apiFetch } from '@/lib/api/base';

vi.mock('@/lib/api/base', () => ({ apiFetch: vi.fn() }));
const mockApiFetch = vi.mocked(apiFetch);

const OUTAGE = {
  success: false,
  status: 503,
  statusCode: 503,
  message: 'Content service is restarting',
};

const SAMPLE_PACKAGE = {
  id: 'pkg-1',
  contentId: 'cnt-1',
  title: 'Omíṣẹwà Episode 1',
  universe: 'vertical',
  version: '1.0.0',
  status: 'under_review',
  universeFitScore: 92,
  masterVideoValid: true,
  verticalDerivativeValid: true,
  audioTracksValid: true,
  subtitlesValid: true,
  talentClearanceStatus: 'cleared',
  aiDisclosureStatus: 'disclosed',
  components: [],
  submittedAt: '2026-11-20T00:00:00Z',
  submittedBy: 'Studio Lead',
};

const renderPage = () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <AcdpValidationPage />
    </QueryClientProvider>
  );
};

describe('ACDP validation page', () => {
  beforeEach(() => {
    mockApiFetch.mockReset();
  });

  afterEach(cleanup);

  it('renders error banner when package read fails', async () => {
    mockApiFetch.mockResolvedValue(OUTAGE as never);
    renderPage();

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('Failed to load ACDP packages');
  });

  it('renders package items and universe fit score', async () => {
    mockApiFetch.mockResolvedValue({
      success: true,
      data: { items: [SAMPLE_PACKAGE], total: 1 },
    } as never);
    renderPage();

    expect(await screen.findByText('Omíṣẹwà Episode 1')).toBeTruthy();
    expect(screen.getByText('92%')).toBeTruthy();
    expect(screen.getByText('UNDER REVIEW')).toBeTruthy();
  });

  it('handles approve mutation with success message', async () => {
    mockApiFetch.mockResolvedValueOnce({
      success: true,
      data: { items: [SAMPLE_PACKAGE], total: 1 },
    } as never);
    renderPage();

    await screen.findByText('Omíṣẹwà Episode 1');

    mockApiFetch.mockResolvedValueOnce({
      success: true,
      data: { approved: true },
    } as never);

    fireEvent.click(screen.getByRole('button', { name: /Approve/ }));

    await waitFor(() => {
      expect(screen.getByText(/ACDP Package approved for publication/i)).toBeTruthy();
    });
  });
});
