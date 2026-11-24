import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { apiFetch } from '@/lib/api';
import CreatorAnalyticsDashboard from '@/app/creator/analytics-dashboard/page';
import PlaceDetailPage from '@/app/lifestyle/places/[id]/page';
import CinemaxisFilmDetailPage from '@/app/cinemaxis/film/[id]/page';

vi.mock('@/lib/api', () => ({
  apiFetch: vi.fn(),
  api: { request: vi.fn() },
}));
vi.mock('@/components/layout/AppHeader', () => ({ default: () => null }));
vi.mock('@/components/layout/AppFooter', () => ({ default: () => null }));
vi.mock('@/components/layout/PageShell', () => ({
  PageShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('@/components/layout/PageHero', () => ({ PageHero: () => null }));
vi.mock('@/components/motion/ScrollReveal', () => ({
  ScrollReveal: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('@/components/motion/GlowCard', () => ({
  GlowCard: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('@/components/ui/Breadcrumbs', () => ({ Breadcrumbs: () => null }));
vi.mock('@/components/OptimizedImage', () => ({ OptimizedImage: () => null }));
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user: null, isAuthenticated: false }),
}));
vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'rec-1' }),
  useRouter: () => ({ push: vi.fn() }),
}));

const mockFetch = vi.mocked(apiFetch);

const OUTAGE = {
  success: false,
  status: 503,
  statusCode: 503,
  message: 'Content service is restarting',
};

const ANALYTICS = {
  overview: {
    totalViews: 1234,
    viewsGrowth: 4,
    totalFollowers: 89,
    followersGrowth: 2,
    totalEarnings: 5000,
    earningsGrowth: 9,
    avgWatchTime: 12,
    engagementRate: 7.5,
  },
  contentPerformance: [
    {
      id: 'c1',
      title: 'House of Zaria',
      views: 900,
      likes: 40,
      comments: 3,
      shares: 8,
      revenue: 5000,
    },
  ],
};

function renderWithQuery(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe('creator analytics under a failed read', () => {
  beforeEach(() => mockFetch.mockReset());

  it('withholds every headline metric instead of reporting a zero-earning creator', async () => {
    mockFetch.mockResolvedValue(OUTAGE as never);
    renderWithQuery(<CreatorAnalyticsDashboard />);

    await waitFor(() => expect(screen.getByText(/Analytics unavailable/)).toBeTruthy());
    expect(screen.getByText(/Content service is restarting/)).toBeTruthy();
    // Views, Followers, Earnings and Avg Watch Time are all withheld.
    expect(screen.getAllByText('—')).toHaveLength(4);
    expect(screen.queryAllByText('₦0')).toHaveLength(0);
    expect(screen.queryAllByText('0m')).toHaveLength(0);
  });

  it('restates the metrics once analytics load again', async () => {
    mockFetch.mockResolvedValueOnce(OUTAGE as never);
    renderWithQuery(<CreatorAnalyticsDashboard />);
    await waitFor(() => expect(screen.getByText(/Analytics unavailable/)).toBeTruthy());

    mockFetch.mockResolvedValue({ success: true, data: ANALYTICS } as never);
    fireEvent.click(screen.getByText('Retry'));

    await waitFor(() => expect(screen.getByText('1,234')).toBeTruthy());
    // ₦5,000 appears as both the Earnings card and the asset row.
    expect(screen.getAllByText('₦5,000').length).toBeGreaterThan(0);
    expect(screen.queryByText(/Analytics unavailable/)).toBeNull();
    expect(screen.queryAllByText('—')).toHaveLength(0);
  });
});

describe('lifestyle venue detail under a failed read', () => {
  beforeEach(() => mockFetch.mockReset());

  it('says the details are unavailable rather than that the venue does not exist', async () => {
    mockFetch.mockResolvedValue(OUTAGE as never);
    renderWithQuery(<PlaceDetailPage />);

    await waitFor(() => expect(screen.getByText(/Venue details unavailable/)).toBeTruthy());
    expect(screen.getByText(/Content service is restarting/)).toBeTruthy();
    expect(screen.queryByText(/Venue Not Found/)).toBeNull();
  });

  it('still reports a genuine not-found for a successful empty read', async () => {
    mockFetch.mockResolvedValue({ success: true, data: null } as never);
    renderWithQuery(<PlaceDetailPage />);

    await waitFor(() => expect(screen.getByText(/Venue Not Found/)).toBeTruthy());
    expect(screen.queryByText(/Venue details unavailable/)).toBeNull();
  });
});

describe('cinemaxis film detail under a failed read', () => {
  beforeEach(() => mockFetch.mockReset());

  it('names the failed read and offers a retry', async () => {
    mockFetch.mockResolvedValue(OUTAGE as never);
    renderWithQuery(<CinemaxisFilmDetailPage />);

    await waitFor(() => expect(screen.getByText(/Film details unavailable/)).toBeTruthy());
    expect(screen.getByText(/Content service is restarting/)).toBeTruthy();

    mockFetch.mockResolvedValue({
      success: true,
      data: {
        id: 'f1',
        title: 'House of Zaria',
        description: 'A drama',
        rating: 'PG',
        duration: 95,
        releaseDate: '2026-09-01',
        territory: 'NG',
        genres: ['Drama'],
        cast: ['Amina Yusuf'],
        director: 'Bala Aminu',
        ticketPrice: 2500,
        currency: 'NGN',
        hasTicket: false,
      },
    } as never);
    fireEvent.click(screen.getByText('Retry'));
    await waitFor(() => expect(screen.getByText('House of Zaria')).toBeTruthy());
    expect(screen.queryByText(/Film details unavailable/)).toBeNull();
  });
});
