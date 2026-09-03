'use client';
import { Suspense, lazy, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { EmptyState } from '@/components/ui/EmptyState';
import analytics from '@/lib/analytics';

interface Offer {
  id: string;
  title: string;
  description: string;
  partnerName: string;
  discount: string;
  validUntil: string;
  category: string;
}

function OffersContent() {
  useEffect(() => {
    analytics.pageView('offers');
  }, []);
  const query = useQuery({
    queryKey: ['lifestyle', 'offers'],
    queryFn: async () => {
      const res = await api.request<Offer[]>('/api/v1/lifestyle/offers');
      if (res.success && res.data) return res.data;
      throw new Error('Failed');
    },
  });
  const items: Offer[] = query.data ?? [];
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--brand-near-black)' }}>
      <AppHeader active="9TLIFE" />
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Tag Offers</h1>
          <p className="text-white/50 mb-8">Exclusive deals from our venue partners</p>
        </motion.div>
        {query.isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="az-glass p-6">
                <Skeleton height="140px" borderRadius="12" />
              </div>
            ))}
          </div>
        ) : query.error ? (
          <ErrorState
            title="Failed"
            description={query.error.message}
            onButtonPress={() => query.refetch()}
          />
        ) : items.length === 0 ? (
          <EmptyState
            icon="gift"
            title="No offers available yet"
            description="Check back later for exclusive lifestyle offers"
            dark
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((o, i) => (
              <motion.a
                key={o.id}
                href={`/lifestyle/offers/${o.id}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="az-glass p-6 cursor-pointer hover:ring-1 hover:ring-white/10 transition-all"
              >
                <div className="flex justify-between items-start mb-2">
                  <span
                    className="px-2 py-0.5 rounded text-xs font-medium"
                    style={{
                      backgroundColor: 'rgba(16,185,129,0.15)',
                      color: 'var(--brand-green)',
                    }}
                  >
                    {o.discount}
                  </span>
                  <span className="text-xs text-white/30">{o.category}</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-1">{o.title}</h3>
                <p className="text-sm text-white/50 mb-3 line-clamp-2">{o.description}</p>
                <div className="flex justify-between text-xs text-white/40">
                  <span>{o.partnerName}</span>
                  <span>Until {new Date(o.validUntil).toLocaleDateString()}</span>
                </div>
              </motion.a>
            ))}
          </div>
        )}
      </section>
      <AppFooter />
    </div>
  );
}
const Lazy = lazy(() => Promise.resolve({ default: OffersContent }));
export default function OffersPage() {
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
