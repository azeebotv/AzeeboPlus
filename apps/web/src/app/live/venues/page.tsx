'use client';
import { Suspense, lazy, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import analytics from '@/lib/analytics';

interface Venue {
  id: string;
  name: string;
  city: string;
  capacity: number;
  address: string;
  upcomingEvents: number;
}

function VenuesContent() {
  useEffect(() => {
    analytics.pageView('live-venues');
  }, []);
  const query = useQuery({
    queryKey: ['live', 'venues'],
    queryFn: async () => {
      const res = await api.request<Venue[]>('/api/v1/live/venues');
      if (res.success && res.data) return res.data;
      throw new Error('Failed');
    },
  });
  const items: Venue[] = query.data ?? [];
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--brand-near-black)' }}>
      <AppHeader active="Live" />
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Stadium Venues</h1>
          <p className="text-white/50 mb-8">Event venues across Africa</p>
        </motion.div>
        {query.isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="az-glass p-6">
                <Skeleton height="120px" borderRadius="12" />
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
          <div className="text-center py-16">
            <p className="text-5xl mb-4"></p>
            <p className="text-xl text-white/60">No venues listed yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((v, i) => (
              <motion.div
                key={v.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="az-glass p-6"
              >
                <h3 className="text-lg font-bold text-white mb-1">{v.name}</h3>
                <p className="text-sm text-white/40 mb-3">{v.city}</p>
                <div className="flex justify-between text-xs text-white/40">
                  <span>{v.address}</span>
                  <span>{v.capacity.toLocaleString()}</span>
                </div>
                {v.upcomingEvents > 0 && (
                  <p className="text-xs mt-3" style={{ color: 'var(--brand-orange)' }}>
                    {v.upcomingEvents} upcoming events
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </section>
      <AppFooter />
    </div>
  );
}
const Lazy = lazy(() => Promise.resolve({ default: VenuesContent }));
export default function VenuesPage() {
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
