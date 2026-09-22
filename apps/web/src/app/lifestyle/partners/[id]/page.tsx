'use client';

import { Suspense, lazy, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import { PageShell } from '@/components/layout/PageShell';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { GlowCard } from '@/components/motion/GlowCard';
import { Phone, MapPin, Star, Building2, ArrowLeft, ArrowRight, Percent, Calendar } from 'lucide-react';
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
      throw new Error('Partner not found');
    },
    enabled: !!id,
  });

  const p = query.data;

  return (
    <PageShell glowColor="rgba(232,66,10,0.15)">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-16 space-y-6">
        <div className="flex items-center justify-between">
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/home' },
              { label: 'Lifestyle', href: '/lifestyle' },
              { label: 'Partners', href: '/lifestyle/partners' },
              { label: p?.name || 'Partner Profile' },
            ]}
          />
          <Link
            href="/lifestyle/partners"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/50 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            All Partners
          </Link>
        </div>

        {query.isLoading ? (
          <div className="space-y-6 py-6">
            <Skeleton className="h-10 w-2/3 rounded-lg" />
            <Skeleton className="h-24 w-full rounded-2xl" />
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-20 w-full rounded-2xl" />
              ))}
            </div>
          </div>
        ) : query.error || !p ? (
          <div className="max-w-md mx-auto py-16">
            <ErrorState
              title="Partner Not Found"
              description={query.error?.message || 'The requested venue partner profile could not be loaded.'}
              onButtonPress={() => query.refetch()}
            />
          </div>
        ) : (
          <div className="space-y-8">
            <ScrollReveal>
              <div className="az-glass p-8 rounded-3xl border border-white/10 shadow-2xl space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs font-mono text-[var(--brand-orange)] flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5" />
                    {p.city} · {p.category}
                  </span>
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 text-amber-400 border border-amber-400/20 text-xs font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>{p.rating.toFixed(1)} Rating</span>
                  </div>
                </div>

                <div>
                  <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                    {p.name}
                  </h1>
                  <p className="text-sm sm:text-base text-white/70 leading-relaxed mt-2 max-w-2xl">
                    {p.description}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-6 text-xs text-white/60 pt-4 border-t border-white/5">
                  {p.address && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-white/40" />
                      {p.address}
                    </span>
                  )}
                  {p.phone && (
                    <a
                      href={`tel:${p.phone}`}
                      className="flex items-center gap-1.5 text-white/60 hover:text-[var(--brand-orange)] transition-colors"
                    >
                      <Phone className="w-4 h-4 text-white/40" />
                      {p.phone}
                    </a>
                  )}
                </div>
              </div>
            </ScrollReveal>

            {p.offers?.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Percent className="w-4 h-4 text-emerald-400" />
                  Active Privileges & Offers ({p.offers.length})
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {p.offers.map((o) => (
                    <ScrollReveal key={o.id}>
                      <Link href={`/lifestyle/offers/${o.id}`}>
                        <motion.div whileHover={{ y: -2 }}>
                          <GlowCard className="p-5 rounded-2xl border border-white/10 flex items-center justify-between group cursor-pointer">
                            <div className="space-y-1">
                              <h3 className="text-sm font-bold text-white group-hover:text-[var(--brand-orange)] transition-colors">
                                {o.title}
                              </h3>
                              <p className="text-xs text-white/40 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Valid until {new Date(o.validUntil).toLocaleDateString()}
                              </p>
                            </div>

                            <div className="flex items-center gap-3">
                              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                {o.discount}
                              </span>
                              <ArrowRight className="w-4 h-4 text-white/30 group-hover:text-[var(--brand-orange)] group-hover:translate-x-1 transition-all" />
                            </div>
                          </GlowCard>
                        </motion.div>
                      </Link>
                    </ScrollReveal>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </PageShell>
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
