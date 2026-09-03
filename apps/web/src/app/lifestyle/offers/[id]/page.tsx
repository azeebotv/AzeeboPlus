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

interface OfferDetail {
  id: string;
  title: string;
  description: string;
  partnerName: string;
  partnerId: string;
  discount: string;
  validUntil: string;
  terms: string[];
}

function OfferDetailContent() {
  const params = useParams();
  const id = params?.id as string;
  useEffect(() => {
    analytics.pageView('offer-detail');
  }, []);
  const query = useQuery({
    queryKey: ['lifestyle', 'offer', id],
    queryFn: async () => {
      const res = await api.request<OfferDetail>(`/api/v1/lifestyle/offers/${id}`);
      if (res.success && res.data) return res.data;
      throw new Error('Not found');
    },
    enabled: !!id,
  });
  const o = query.data;
  if (query.isLoading)
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--brand-near-black)' }}>
        <AppHeader />
        <div className="max-w-4xl mx-auto px-4 py-12">
          <Skeleton height="300px" borderRadius="16" />
        </div>
      </div>
    );
  if (query.error || !o)
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="az-glass p-8"
        >
          <div className="text-center mb-8">
            <span
              className="px-4 py-2 rounded-full text-lg font-bold"
              style={{ backgroundColor: 'rgba(16,185,129,0.15)', color: 'var(--brand-green)' }}
            >
              {o.discount}
            </span>
            <h1 className="text-3xl font-bold text-white mt-4 mb-2">{o.title}</h1>
            <p className="text-white/60">{o.description}</p>
          </div>
          <div className="flex justify-center gap-8 mb-8 text-sm text-white/40">
            <span>{o.partnerName}</span>
            <span>
              CalendarValid until{' '}
              {new Date(o.validUntil).toLocaleDateString('en-NG', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>
          {o.terms.length > 0 && (
            <div
              className="p-4 rounded-xl mb-6"
              style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
            >
              <h3 className="text-sm font-semibold text-white mb-2">Terms & Conditions</h3>
              <ul className="space-y-1">
                {o.terms.map((t, i) => (
                  <li key={i} className="text-xs text-white/40">
                    • {t}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full az-btn-primary py-4 text-lg"
          >
            TicketClaim Offer
          </motion.button>
          <a
            href={`/lifestyle/partners/${o.partnerId}`}
            className="block text-center mt-3 text-sm text-white/40 hover:text-white/60 transition-colors"
          >
            View Partner →
          </a>
        </motion.div>
      </section>
      <AppFooter />
    </div>
  );
}
const Lazy = lazy(() => Promise.resolve({ default: OfferDetailContent }));
export default function OfferDetailPage() {
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
