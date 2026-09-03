'use client';
import { Suspense, lazy, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import analytics from '@/lib/analytics';

interface ItineraryDetail {
  id: string;
  title: string;
  description: string;
  city: string;
  duration: string;
  stops: { name: string; description: string; duration: string; order: number }[];
}

function ItineraryDetailContent() {
  const params = useParams();
  const id = params?.id as string;
  useEffect(() => {
    analytics.pageView('itinerary-detail');
  }, []);
  const query = useQuery({
    queryKey: ['lifestyle', 'itinerary', id],
    queryFn: async () => {
      const res = await api.request<ItineraryDetail>(`/api/v1/lifestyle/itineraries/${id}`);
      if (res.success && res.data) return res.data;
      throw new Error('Not found');
    },
    enabled: !!id,
  });
  const it = query.data;
  if (query.isLoading)
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--brand-near-black)' }}>
        <AppHeader />
        <div className="max-w-4xl mx-auto px-4 py-12">
          <Skeleton height="400px" borderRadius="16" />
        </div>
      </div>
    );
  if (query.error || !it)
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--brand-near-black)' }}>
        <AppHeader />
        <div className="max-w-4xl mx-auto px-4 py-12">
          <ErrorState title="Not found" />
        </div>
      </div>
    );
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--brand-near-black)' }}>
      <AppHeader active="9TLIFE" />
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-sm text-white/40 mb-1">
            {it.city} · {it.duration}
          </p>
          <h1 className="text-3xl font-bold text-white mb-3">{it.title}</h1>
          <p className="text-white/60 mb-8">{it.description}</p>
          <div className="space-y-4">
            {it.stops
              .sort((a, b) => a.order - b.order)
              .map((stop, i) => (
                <div key={i} className="az-glass p-5 flex gap-4">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                    style={{ backgroundColor: 'var(--brand-orange)' }}
                  >
                    {i + 1}
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-1">{stop.name}</h3>
                    <p className="text-sm text-white/50 mb-1">{stop.description}</p>
                    <p className="text-xs text-white/30">{stop.duration}</p>
                  </div>
                </div>
              ))}
          </div>
        </motion.div>
      </section>
      <AppFooter />
    </div>
  );
}
const Lazy = lazy(() => Promise.resolve({ default: ItineraryDetailContent }));
export default function ItineraryDetailPage() {
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
