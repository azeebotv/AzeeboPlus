import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { apiFetch } from '@/lib/api';
import CounterpartyPage from '@/app/commerce/counterparty/page';
import RevenueClassesPage from '@/app/commerce/revenue-classes/page';
import TelcoReconciliationPage from '@/app/commerce/telco-reconciliation/page';

vi.mock('@/lib/api', () => ({ apiFetch: vi.fn() }));
vi.mock('@/components/layout/AppHeader', () => ({ default: () => null }));
vi.mock('@/components/layout/AppFooter', () => ({ default: () => null }));

const mockFetch = vi.mocked(apiFetch);

const OUTAGE = {
  success: false,
  status: 503,
  statusCode: 503,
  message: 'Commerce service is restarting',
};

function renderWithQuery(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

const COUNTERPARTY = [
  {
    id: 'cp-1',
    name: 'Lagos Arena (venue)',
    type: 'venue',
    status: 'active',
    exposure: 250000,
    relationshipCount: 3,
    lastActivity: '2026-09-30T00:00:00.000Z',
  },
];

describe('commerce dashboards under a failed read', () => {
  beforeEach(() => mockFetch.mockReset());

  it('withholds counterparty totals instead of claiming a zero-exposure book', async () => {
    mockFetch.mockResolvedValue(OUTAGE as never);
    const { container } = renderWithQuery(<CounterpartyPage />);

    await waitFor(() => expect(screen.getByText(/Counterparty records unavailable/)).toBeTruthy());
    expect(container.textContent).toContain('Commerce service is restarting');
    // Four headline stats, all withheld — none may read as a computed 0/₦0.
    expect(screen.getAllByText('—')).toHaveLength(4);
    expect(container.textContent).not.toMatch(/Total Exposure[^—]*₦0/);
    expect(container.textContent).not.toContain('Lagos Arena');
  });

  it('restates the counterparty figures once the list loads again', async () => {
    mockFetch.mockResolvedValueOnce(OUTAGE as never);
    renderWithQuery(<CounterpartyPage />);
    await waitFor(() => expect(screen.getByText(/Counterparty records unavailable/)).toBeTruthy());

    mockFetch.mockResolvedValue({ success: true, data: COUNTERPARTY } as never);
    fireEvent.click(screen.getByText('Retry'));

    await waitFor(() => expect(screen.queryByText(/Counterparty records unavailable/)).toBeNull());
    expect(screen.getByText('Lagos Arena (venue)')).toBeTruthy();
    expect(containerHasDash()).toBe(false);
  });

  it('still renders real zeros for a genuinely empty counterparty book', async () => {
    mockFetch.mockResolvedValue({ success: true, data: [] } as never);
    renderWithQuery(<CounterpartyPage />);

    await waitFor(() => expect(screen.getByText('Total Exposure')).toBeTruthy());
    expect(screen.queryByText(/Counterparty records unavailable/)).toBeNull();
    expect(containerHasDash()).toBe(false);
  });

  it('does not report ₦0 GMV when the revenue service never answered', async () => {
    mockFetch.mockResolvedValue(OUTAGE as never);
    renderWithQuery(<RevenueClassesPage />);

    await waitFor(() => expect(screen.getByText(/Revenue figures unavailable/)).toBeTruthy());
    expect(screen.getAllByText('—')).toHaveLength(4);
    expect(screen.queryAllByText('₦0')).toHaveLength(0);
  });

  it('reports the real GMV once revenue classes load', async () => {
    mockFetch.mockResolvedValue({
      success: true,
      data: [
        {
          id: 'rc-1',
          name: 'Voting passes',
          description: 'Reality voting',
          amount: 1200000,
          percentage: 60,
          universe: 'reality',
          recognition: 'immediate',
          collection: 'collected',
        },
      ],
    } as never);
    const { container } = renderWithQuery(<RevenueClassesPage />);

    await waitFor(() => expect(container.textContent).toContain('₦1,200,000'));
    expect(screen.queryByText(/Revenue figures unavailable/)).toBeNull();
  });

  it('does not certify a clean telco reconciliation on a failed read', async () => {
    mockFetch.mockResolvedValue(OUTAGE as never);
    const { container } = renderWithQuery(<TelcoReconciliationPage />);

    await waitFor(() =>
      expect(screen.getByText(/Reconciliation figures unavailable/)).toBeTruthy()
    );
    // "Discrepancy ₦0" is the all-clear this page has to earn.
    expect(container.textContent).not.toMatch(/Discrepancy\s*₦0/);
    expect(screen.getAllByText('—')).toHaveLength(4);
  });
});

function containerHasDash(): boolean {
  return document.body.textContent?.includes('—') ?? false;
}
