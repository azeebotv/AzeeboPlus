'use client';

import { Suspense, lazy, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import { PageShell } from '@/components/layout/PageShell';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { Tag, Calendar, ArrowLeft, Ticket, Building2, Check, ExternalLink, ShieldCheck } from 'lucide-react';
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
  const [claimed, setClaimed] = useState(false);

  useEffect(() => {
    analytics.pageView('offer-detail');
  }, []);

  const query = useQuery({
    queryKey: ['lifestyle', 'offer', id],
    queryFn: async () => {
      const res = await api.request<OfferDetail>(`/api/v1/lifestyle/offers/${id}`);
      if (res.success && res.data) return res.data;
      throw new Error('Offer not found');
    },
    enabled: !!id,
  });

  const o = query.data;

  return (
    <PageShell glowColor="rgba(232,66,10,0.15)">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-16 space-y-6">
        <div className="flex items-center justify-between">
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/home' },
              { label: 'Lifestyle', href: '/lifestyle' },
              { label: 'Offers', href: '/lifestyle/offers' },
              { label: o?.title || 'Offer Details' },
            ]}
          />
          <Link
            href="/lifestyle/offers"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/50 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            All Offers
          </Link>
        </div>

        {query.isLoading ? (
          <div className="space-y-6 py-6">
            <Skeleton className="h-12 w-1/3 rounded-full mx-auto" />
            <Skeleton className="h-10 w-2/3 rounded-lg mx-auto" />
            <Skeleton className="h-48 w-full rounded-2xl" />
          </div>
        ) : query.error || !o ? (
          <div className="max-w-md mx-auto py-16">
            <ErrorState
              title="Offer Not Found"
              description={query.error?.message || 'The requested voucher or privilege could not be located.'}
              onButtonPress={() => query.refetch()}
            />
          </div>
        ) : (
          <ScrollReveal>
            <div className="az-glass p-8 sm:p-10 rounded-3xl border border-white/10 shadow-2xl space-y-8 text-center">
              <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-lg font-mono font-extrabold mx-auto">
                <Tag className="w-5 h-5" />
                <span>{o.discount}</span>
              </div>

              <div className="space-y-3">
                <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                  {o.title}
                </h1>
                <p className="text-sm sm:text-base text-white/70 leading-relaxed max-w-xl mx-auto">
                  {o.description}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-white/50 border-y border-white/5 py-4">
                <span className="flex items-center gap-1.5 font-semibold text-white">
                  <Building2 className="w-4 h-4 text-[var(--brand-orange)]" />
                  {o.partnerName}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-white/40" />
                  Valid until{' '}
                  {new Date(o.validUntil).toLocaleDateString('en-NG', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>

              {o.terms?.length > 0 && (
                <div className="text-left bg-white/5 p-5 rounded-2xl border border-white/5 space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white/60 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[var(--brand-orange)]" />
                    Terms & Redemption Guidelines
                  </h3>
                  <ul className="space-y-1.5 text-xs text-white/50">
                    {o.terms.map((t, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-[var(--brand-orange)] mt-0.5">•</span>
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="space-y-3 pt-2">
                <motion.button
                  type="button"
                  onClick={() => setClaimed(true)}
                  disabled={claimed}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full py-4 rounded-full text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-lg ${
                    claimed
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-[var(--brand-orange)] text-white hover:bg-[var(--brand-orange)]/90 shadow-[var(--brand-orange)]/25'
                  }`}
                >
                  {claimed ? (
                    <>
                      <Check className="w-4 h-4" />
                      Privilege Claimed & Added to Wallet
                    </>
                  ) : (
                    <>
                      <Ticket className="w-4 h-4" />
                      Claim Offer Voucher
                    </>
                  )}
                </motion.button>

                {o.partnerId && (
                  <Link
                    href={`/lifestyle/partners/${o.partnerId}`}
                    className="inline-flex items-center gap-1.5 text-xs text-white/40 hover:text-white transition-colors pt-2"
                  >
                    View Partner Profile <ExternalLink className="w-3 h-3" />
                  </Link>
                )}
              </div>
            </div>
          </ScrollReveal>
        )}
      </div>
    </PageShell>
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
