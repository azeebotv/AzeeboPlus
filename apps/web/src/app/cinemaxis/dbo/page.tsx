'use client';
import { Suspense, lazy, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
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
      <div className="min-h-screen" style={{ backgroundColor: 'var(--brand-near-black)' }}>
        <AppHeader />
        <div className="max-w-7xl mx-auto px-4 py-12">
          <Skeleton height="400px" borderRadius="16" />
        </div>
      </div>
    );
  if (query.error || !data)
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--brand-near-black)' }}>
        <AppHeader />
        <div className="max-w-7xl mx-auto px-4 py-12">
          <ErrorState title="Failed to load" description={query.error?.message} />
        </div>
      </div>
    );

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--brand-near-black)' }}>
      <AppHeader active="Cinemaxis" />
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            BarChart3Digital Box Office
          </h1>
          <p className="text-white/50 mb-8">Rights holder revenue and ticket analytics</p>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <div className="az-glass p-5">
            <p className="text-xs text-white/40 mb-1">Total Revenue</p>
            <p className="text-2xl font-bold text-white">₦{data.totalRevenue.toLocaleString()}</p>
          </div>
          <div className="az-glass p-5">
            <p className="text-xs text-white/40 mb-1">Tickets Sold</p>
            <p className="text-2xl font-bold text-white">{data.totalTickets.toLocaleString()}</p>
          </div>
          <div className="az-glass p-5">
            <p className="text-xs text-white/40 mb-1">Avg Ticket Price</p>
            <p className="text-2xl font-bold text-white">₦{data.averageTicketPrice}</p>
          </div>
          <div className="az-glass p-5">
            <p className="text-xs text-white/40 mb-1">Active Films</p>
            <p className="text-2xl font-bold text-white">{data.films.length}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="az-glass p-6">
            <h2 className="text-lg font-bold text-white mb-4">Film Performance</h2>
            <div className="space-y-3">
              {data.films.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center justify-between py-3 border-b border-white/5"
                >
                  <div>
                    <p className="text-white font-semibold text-sm">{f.title}</p>
                    <p className="text-xs text-white/40">
                      {f.views.toLocaleString()} views · {f.ticketsSold} tickets
                    </p>
                  </div>
                  <p className="text-white font-bold text-sm">₦{f.revenue.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="az-glass p-6">
            <h2 className="text-lg font-bold text-white mb-4">Recent Transactions</h2>
            <div className="space-y-3">
              {data.recentTransactions.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between py-3 border-b border-white/5"
                >
                  <div>
                    <p className="text-white font-semibold text-sm">{t.filmTitle}</p>
                    <p className="text-xs text-white/40">
                      {t.type} · {new Date(t.date).toLocaleDateString()}
                    </p>
                  </div>
                  <p
                    className="text-sm font-bold"
                    style={{
                      color: t.type === 'sale' ? 'var(--brand-green)' : 'var(--brand-amber)',
                    }}
                  >
                    {t.type === 'refund' ? '-' : '+'}₦{t.amount.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      <AppFooter />
    </div>
  );
}

const Lazy = lazy(() => Promise.resolve({ default: DboContent }));
export default function DboPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--brand-near-black)]">
          <p className="text-white/50 text-lg">Loading...</p>
        </div>
      }
    >
      <Lazy />
    </Suspense>
  );
}
