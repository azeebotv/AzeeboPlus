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

interface PartnerDetail {
  id: string;
  name: string;
  category: string;
  city: string;
  description: string;
  rating: number;
  address: string;
  phone: string;
  offers: { id: string; title: string; discount: string; validUntil: string }[];
}

function PartnerDetailContent() {
  const params = useParams();
  const id = params?.id as string;
  useEffect(() => {
    analytics.pageView('partner-detail');
  }, []);
  const query = useQuery({
    queryKey: ['lifestyle', 'partner', id],
    queryFn: async () => {
      const res = await api.request<PartnerDetail>(`/api/v1/lifestyle/partners/${id}`);
      if (res.success && res.data) return res.data;
      throw new Error('Not found');
    },
    enabled: !!id,
  });
  const p = query.data;
  if (query.isLoading)
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--brand-near-black)' }}>
        <AppHeader />
        <div className="max-w-4xl mx-auto px-4 py-12">
          <Skeleton height="300px" borderRadius="16" />
        </div>
      </div>
    );
  if (query.error || !p)
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
            {p.city} · {p.category}
          </p>
          <h1 className="text-3xl font-bold text-white mb-3">{p.name}</h1>
          <p className="text-white/60 mb-6">{p.description}</p>
          <div className="flex gap-4 text-sm text-white/40 mb-8">
            <span>{p.rating}</span>
            <span>{p.address}</span>
            <span>Phone{p.phone}</span>
          </div>
          {p.offers.length > 0 && (
            <>
              <h2 className="text-xl font-bold text-white mb-4">Active Offers</h2>
              <div className="space-y-3">
                {p.offers.map((o) => (
                  <div key={o.id} className="az-glass p-4 flex items-center justify-between">
                    <div>
                      <p className="text-white font-semibold">{o.title}</p>
                      <p className="text-xs text-white/40">
                        Valid until {new Date(o.validUntil).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className="px-3 py-1 rounded-full text-sm font-bold"
                      style={{
                        backgroundColor: 'rgba(16,185,129,0.15)',
                        color: 'var(--brand-green)',
                      }}
                    >
                      {o.discount}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </motion.div>
      </section>
      <AppFooter />
    </div>
  );
}
const Lazy = lazy(() => Promise.resolve({ default: PartnerDetailContent }));
export default function PartnerDetailPage() {
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
