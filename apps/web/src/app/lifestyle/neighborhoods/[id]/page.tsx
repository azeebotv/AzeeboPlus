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

interface Neighborhood {
  id: string;
  name: string;
  city: string;
  description: string;
  places: { id: string; name: string; category: string; rating: number }[];
}

function NeighborhoodDetailContent() {
  const params = useParams();
  const id = params?.id as string;
  useEffect(() => {
    analytics.pageView('neighborhood-detail');
  }, []);
  const query = useQuery({
    queryKey: ['lifestyle', 'neighborhood', id],
    queryFn: async () => {
      const res = await api.request<Neighborhood>(`/api/v1/lifestyle/neighborhoods/${id}`);
      if (res.success && res.data) return res.data;
      throw new Error(res.message || 'Not found');
    },
    enabled: !!id,
  });
  const n = query.data;
  if (query.isLoading)
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--brand-near-black)' }}>
        <AppHeader />
        <div className="max-w-4xl mx-auto px-4 py-12">
          <Skeleton height="300px" borderRadius="16" />
        </div>
      </div>
    );
  if (query.error || !n)
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
          <p className="text-sm text-white/40 mb-2">{n.city}</p>
          <h1 className="text-3xl font-bold text-white mb-3">{n.name}</h1>
          <p className="text-white/60 mb-8">{n.description}</p>
          <h2 className="text-xl font-bold text-white mb-4">Places in {n.name}</h2>
          <div className="space-y-3">
            {n.places.map((p) => (
              <a
                key={p.id}
                href={`/lifestyle/places/${p.id}`}
                className="az-glass p-4 flex items-center justify-between cursor-pointer hover:ring-1 hover:ring-white/10 transition-all"
              >
                <div>
                  <p className="text-white font-semibold">{p.name}</p>
                  <p className="text-sm text-white/40">{p.category}</p>
                </div>
                <span className="text-sm text-white/60">{p.rating}</span>
              </a>
            ))}
          </div>
        </motion.div>
      </section>
      <AppFooter />
    </div>
  );
}
const Lazy = lazy(() => Promise.resolve({ default: NeighborhoodDetailContent }));
export default function NeighborhoodDetailPage() {
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
