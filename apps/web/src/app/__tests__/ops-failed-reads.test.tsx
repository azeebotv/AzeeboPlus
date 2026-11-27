import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { apiFetch } from '@/lib/api';
import CapacityLedgerPage from '@/app/admin/capacity-ledger/page';
import ProcessMiningPage from '@/app/admin/process-mining/page';

vi.mock('@/lib/api', () => ({ apiFetch: vi.fn() }));
vi.mock('@/components/layout/AppHeader', () => ({ default: () => null }));
vi.mock('@/components/layout/AppFooter', () => ({ default: () => null }));

const mockFetch = vi.mocked(apiFetch);

const OUTAGE = {
  success: false,
  status: 503,
  statusCode: 503,
  message: 'Admin service is restarting',
};

function renderWithQuery(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe('ops dashboards under a failed read', () => {
  beforeEach(() => mockFetch.mockReset());

  it('withholds capacity totals instead of reporting zero hours released', async () => {
    mockFetch.mockResolvedValue(OUTAGE as never);
    renderWithQuery(<CapacityLedgerPage />);

    await waitFor(() => expect(screen.getByText(/Capacity releases unavailable/)).toBeTruthy());
    expect(screen.getAllByText('—')).toHaveLength(4);
    expect(screen.queryByText('Hours Released')).toBeTruthy();
  });

  it('withholds the headcount tab independently of the capacity tab', async () => {
    // On mount the capacity read fires first, then the headcount read.
    mockFetch.mockResolvedValueOnce({
      success: true,
      data: [
        {
          id: 'cr-1',
          name: 'Batch QA',
          status: 'active',
          hoursReleased: 120,
          automationLevel: 'full',
        },
      ],
    } as never);
    mockFetch.mockResolvedValue(OUTAGE as never);
    const { container } = renderWithQuery(<CapacityLedgerPage />);

    // Capacity answers, so its headline stays numeric…
    await waitFor(() => expect(container.textContent).toContain('120'));
    expect(screen.queryByText(/Capacity releases unavailable/)).toBeNull();

    fireEvent.click(screen.getByText('Headcount Avoidance'));
    await waitFor(() => expect(screen.getByText(/Headcount avoidances unavailable/)).toBeTruthy());
    // …while only the failed read's three cards are withheld.
    expect(screen.getAllByText('—')).toHaveLength(3);
  });

  it('reports the real capacity figures once the ledger loads', async () => {
    mockFetch.mockResolvedValue({
      success: true,
      data: [
        {
          id: 'cr-1',
          name: 'Automated moderation',
          status: 'completed',
          hoursReleased: 400,
          automationLevel: 'full',
        },
      ],
    } as never);
    const { container } = renderWithQuery(<CapacityLedgerPage />);

    await waitFor(() => expect(container.textContent).toContain('400'));
    expect(screen.queryByText(/—/)).toBeNull();
  });

  it('does not report an empty process inventory when workflows fail to load', async () => {
    mockFetch.mockResolvedValue(OUTAGE as never);
    const { container } = renderWithQuery(<ProcessMiningPage />);

    await waitFor(() => expect(screen.getByText(/Workflow data unavailable/)).toBeTruthy());
    // 4 headline cards + 3 automation-opportunity counts, all withheld.
    expect(screen.getAllByText(/^—/)).toHaveLength(7);
    expect(container.textContent).not.toContain('₦0');
  });

  it('reports the real workflow cost once the inventory loads', async () => {
    mockFetch.mockResolvedValue({
      success: true,
      data: [
        {
          id: 'wf-1',
          name: 'Payout review',
          department: 'finance',
          avgHours: 10,
          frequency: 4,
          costPerExecution: 5000,
          automationReadiness: 'ready',
        },
      ],
    } as never);
    const { container } = renderWithQuery(<ProcessMiningPage />);

    await waitFor(() => expect(container.textContent).toContain('₦20,000'));
    expect(screen.queryByText(/Workflow data unavailable/)).toBeNull();
  });
});
