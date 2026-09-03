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

interface Neighborhood {
  id: string;
  name: string;
  city: string;
  description: string;
  placeCount: number;
  image?: string;
}

function NeighborhoodsContent() {
  useEffect(() => {
    analytics.pageView('neighborhoods');
  }, []);
  const query = useQuery({
    queryKey: ['lifestyle', 'neighborhoods'],
    queryFn: async () => {
      const res = await api.request<Neighborhood[]>('/api/v1/lifestyle/neighborhoods');
      if (res.success && res.data) return res.data;
      throw new Error(res.message || 'Failed');
    },
  });
  const items: Neighborhood[] = query.data ?? [];

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--brand-near-black)' }}>
      <AppHeader active="9TLIFE" />
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            Building2 Neighborhoods
          </h1>
          <p className="text-white/50 mb-8">Explore the best neighborhoods across African cities</p>
        </motion.div>
        {query.isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="az-glass">
                <Skeleton height="200px" borderRadius="0" />
                <div className="p-4 space-y-3">
                  <Skeleton height="20px" width="60%" />
                </div>
              </div>
            ))}
          </div>
        ) : query.error ? (
          <ErrorState
            title="Failed to load"
            description={query.error.message}
            onButtonPress={() => query.refetch()}
          />
        ) : items.length === 0 ? (
          <EmptyState
            icon="map"
            title="No neighborhoods available yet"
            description="Explore neighborhoods in your area"
            dark
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((n, i) => (
              <motion.a
                key={n.id}
                href={`/lifestyle/neighborhoods/${n.id}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="az-glass overflow-hidden group cursor-pointer"
              >
                <div className="relative h-48 bg-gradient-to-br from-orange-900/30 to-purple-900/30 flex items-center justify-center">
                  <span className="text-5xl"></span>
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-bold text-white mb-1">{n.name}</h3>
                  <p className="text-sm text-white/40 mb-2">
                    {n.city} · {n.placeCount} places
                  </p>
                  <p className="text-sm text-white/50 line-clamp-2">{n.description}</p>
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
const Lazy = lazy(() => Promise.resolve({ default: NeighborhoodsContent }));
export default function NeighborhoodsPage() {
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
