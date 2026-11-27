'use client';

import { Suspense, lazy, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import { PageShell } from '@/components/layout/PageShell';
import { PageHero } from '@/components/layout/PageHero';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { GlowCard } from '@/components/motion/GlowCard';
import { Tag, Calendar, ArrowLeft, ArrowRight, Percent } from 'lucide-react';
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
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  useEffect(() => {
    analytics.pageView('offers');
  }, []);

  const query = useQuery({
    queryKey: ['lifestyle', 'offers'],
    queryFn: async () => {
      const res = await api.request<Offer[]>('/api/v1/lifestyle/offers');
      if (res.success && res.data) return res.data;
      throw new Error(res.message || 'Failed to load offers');
    },
    staleTime: 60000,
  });

  const items: Offer[] = query.data ?? [];
  const categories = ['All', ...Array.from(new Set(items.map((o) => o.category).filter(Boolean)))];

  const filteredItems = items.filter((o) => {
    if (selectedCategory === 'All') return true;
    return o.category === selectedCategory;
  });

  return (
    <PageShell glowColor="color-mix(in srgb, var(--color-az-scarlet) 15%, transparent)">
      <PageHero
        badge="VIP Privileges"
        title="Exclusive Partner Offers"
        description="Curated discounts, complimentary tastings, and members-only perks from our premier hospitality and lifestyle partners."
      />

      <div className="max-w-7xl mx-auto py-4 -mt-4 px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Link
            href="/lifestyle"
            className="inline-flex items-center gap-2 text-xs font-semibold text-az-ink/50 hover:text-az-ink transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Lifestyle Hub
          </Link>

          {categories.length > 1 && (
            <div className="flex flex-wrap items-center gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 text-xs font-medium transition-all ${
                    selectedCategory === cat
                      ? 'text-az-ink font-bold'
                      : 'az-glass text-az-ink/60 hover:text-az-ink hover:bg-az-glass-card'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {query.isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="az-glass p-6 space-y-3">
                <Skeleton className="h-6 w-1/4 rounded-full" />
                <Skeleton className="h-6 w-3/4 rounded-md" />
                <Skeleton className="h-10 w-full rounded-md" />
                <Skeleton className="h-4 w-1/2 rounded-md" />
              </div>
            ))}
          </div>
        ) : query.error ? (
          <div className="max-w-md mx-auto py-12">
            <ErrorState
              title="Failed to load offers"
              description={query.error.message}
              onButtonPress={() => query.refetch()}
            />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="az-glass p-16 text-center border border-az-glass-border max-w-md mx-auto">
            <Tag className="w-12 h-12 text-az-ink/20 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-az-ink mb-2">No Active Offers</h3>
            <p className="text-xs text-az-ink/50">
              New partner privileges and discounts will be announced soon.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((o, i) => (
              <ScrollReveal key={o.id} delay={i * 0.05}>
                <Link href={`/lifestyle/offers/${o.id}`}>
                  <motion.div whileHover={{ y: -3 }} className="h-full">
                    <GlowCard
                      universe="lifestyle"
                      className="p-6 rounded-2xl border border-az-glass-border flex flex-col justify-between h-full group cursor-pointer"
                    >
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold font-mono bg-az-success-500/20 text-az-success-400 border border-az-success-500/30 flex items-center gap-1">
                            <Percent className="w-3 h-3" />
                            {o.discount}
                          </span>
                          <span className="text-[10px] font-mono text-az-ink/40 uppercase tracking-wider">
                            {o.category}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-az-ink group-hover:text-[var(--color-az-flame)] transition-colors">
                          {o.title}
                        </h3>
                        <p className="text-xs text-az-ink/50 line-clamp-2 leading-relaxed">
                          {o.description}
                        </p>
                      </div>

                      <div className="pt-4 mt-4 border-t border-az-ink/5 flex items-center justify-between text-xs">
                        <div className="space-y-0.5">
                          <p className="font-semibold text-az-ink/80">{o.partnerName}</p>
                          <p className="text-[11px] text-az-ink/40 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Valid until {new Date(o.validUntil).toLocaleDateString()}
                          </p>
                        </div>
                        <span className="text-[var(--color-az-flame)] font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                          Claim <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </GlowCard>
                  </motion.div>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}

const Lazy = lazy(() => Promise.resolve({ default: OffersContent }));

export default function OffersPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--color-az-surface-root)]">
          <p className="text-az-ink/50 text-lg">Loading...</p>
        </div>
      }
    >
      <Lazy />
    </Suspense>
  );
}
