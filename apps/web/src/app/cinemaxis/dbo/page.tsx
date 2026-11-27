'use client';
import { Suspense, lazy, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import { PageHero } from '@/components/layout/PageHero';
import { PageShell } from '@/components/layout/PageShell';
import analytics from '@/lib/analytics';

interface DboData {
  totalRevenue: number;
  totalTickets: number;
  averageTicketPrice: number;
  films: { id: string; title: string; ticketsSold: number; revenue: number; views: number }[];
  recentTransactions: {
    id: string;
    filmTitle: string;
    amount: number;
    type: string;
    date: string;
  }[];
}

function DboContent() {
  useEffect(() => {
    analytics.pageView('cinemaxis-dbo');
  }, []);

  const query = useQuery({
    queryKey: ['cinemaxis', 'dbo'],
    queryFn: async () => {
      const res = await api.request<DboData>('/api/v1/movies/dbo/overview');
      if (res.success && res.data) return res.data;
      throw new Error(res.message || 'Failed to load DBO data');
    },
  });

  const data = query.data;
  if (query.isLoading)
    return (
      <PageShell maxWidth="7xl" activeNav="Cinemaxis">
        <div className="py-12">
          <Skeleton height="400px" borderRadius="16" />
        </div>
      </PageShell>
    );
  if (query.error || !data)
    return (
      <PageShell maxWidth="7xl" activeNav="Cinemaxis">
        <div className="py-12">
          <ErrorState title="Failed to load" description={query.error?.message} />
        </div>
      </PageShell>
    );

  return (
    <PageShell maxWidth="7xl" activeNav="Cinemaxis">
      <PageHero
        eyebrow="Cinemaxis"
        title="Digital Box Office"
        description="Rights holder revenue and ticket analytics"
      />

      <div className="-mt-4 pb-12">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <div className="az-glass p-5">
            <p className="az-caption mb-1 text-az-ink-dim">Total Revenue</p>
            <p className="az-section-title text-az-ink">₦{data.totalRevenue.toLocaleString()}</p>
          </div>
          <div className="az-glass p-5">
            <p className="az-caption mb-1 text-az-ink-dim">Tickets Sold</p>
            <p className="az-section-title text-az-ink">{data.totalTickets.toLocaleString()}</p>
          </div>
          <div className="az-glass p-5">
            <p className="az-caption mb-1 text-az-ink-dim">Avg Ticket Price</p>
            <p className="az-section-title text-az-ink">₦{data.averageTicketPrice}</p>
          </div>
          <div className="az-glass p-5">
            <p className="az-caption mb-1 text-az-ink-dim">Active Films</p>
            <p className="az-section-title text-az-ink">{data.films.length}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="az-glass p-6">
            <h2 className="az-title mb-4 text-az-ink">Film Performance</h2>
            <div className="space-y-3">
              {data.films.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center justify-between py-3 border-b border-az-ink/5"
                >
                  <div>
                    <p className="az-body-strong text-az-ink">{f.title}</p>
                    <p className="az-caption text-az-ink-dim">
                      {f.views.toLocaleString()} views · {f.ticketsSold} tickets
                    </p>
                  </div>
                  <p className="az-body-strong text-az-ink">₦{f.revenue.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="az-glass p-6">
            <h2 className="az-title mb-4 text-az-ink">Recent Transactions</h2>
            <div className="space-y-3">
              {data.recentTransactions.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between py-3 border-b border-az-ink/5"
                >
                  <div>
                    <p className="az-body-strong text-az-ink">{t.filmTitle}</p>
                    <p className="az-caption text-az-ink-dim">
                      {t.type} · {new Date(t.date).toLocaleDateString()}
                    </p>
                  </div>
                  <p
                    className={`az-body-strong ${t.type === 'sale' ? 'text-az-success-500' : 'text-az-warning-500'}`}
                  >
                    {t.type === 'refund' ? '-' : '+'}₦{t.amount.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

const Lazy = lazy(() => Promise.resolve({ default: DboContent }));
export default function DboPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--color-az-surface-root)]">
          <p className="az-lead text-az-ink-muted">Loading...</p>
        </div>
      }
    >
      <Lazy />
    </Suspense>
  );
}
