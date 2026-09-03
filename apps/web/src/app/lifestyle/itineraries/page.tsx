'use client';
import { Suspense, lazy, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import analytics from '@/lib/analytics';

interface Itinerary {
  id: string;
  title: string;
  description: string;
  city: string;
  duration: string;
  stops: number;
  rating: number;
}

function ItinerariesContent() {
  useEffect(() => {
    analytics.pageView('itineraries');
  }, []);
  const query = useQuery({
    queryKey: ['lifestyle', 'itineraries'],
    queryFn: async () => {
      const res = await api.request<Itinerary[]>('/api/v1/lifestyle/itineraries');
      if (res.success && res.data) return res.data;
      throw new Error(res.message || 'Failed');
    },
  });
  const items: Itinerary[] = query.data ?? [];
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--brand-near-black)' }}>
      <AppHeader active="9TLIFE" />
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Map Itineraries</h1>
          <p className="text-white/50 mb-8">Curated experiences across African cities</p>
        </motion.div>
        {query.isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="az-glass p-6">
                <Skeleton height="160px" borderRadius="12" />
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
            <p className="text-xl text-white/60">No itineraries available yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((it, i) => (
              <motion.a
                key={it.id}
                href={`/lifestyle/itineraries/${it.id}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="az-glass p-6 cursor-pointer hover:ring-1 hover:ring-white/10 transition-all"
              >
                <p className="text-xs text-white/40 mb-1">{it.city}</p>
                <h3 className="text-lg font-bold text-white mb-2">{it.title}</h3>
                <p className="text-sm text-white/50 mb-4 line-clamp-2">{it.description}</p>
                <div className="flex justify-between text-xs text-white/40">
                  <span>
                    {it.duration} · {it.stops} stops
                  </span>
                  <span>{it.rating}</span>
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
const Lazy = lazy(() => Promise.resolve({ default: ItinerariesContent }));
export default function ItinerariesPage() {
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
