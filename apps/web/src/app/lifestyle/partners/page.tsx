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
import { Handshake, MapPin, Star, ArrowLeft, ArrowRight, Building2, Tag } from 'lucide-react';
import analytics from '@/lib/analytics';

interface Partner {
  id: string;
  name: string;
  category: string;
  city: string;
  rating: number;
  offerCount: number;
}

function PartnersContent() {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  useEffect(() => {
    analytics.pageView('partners');
  }, []);

  const query = useQuery({
    queryKey: ['lifestyle', 'partners'],
    queryFn: async () => {
      const res = await api.request<Partner[]>('/api/v1/lifestyle/partners');
      if (res.success && res.data) return res.data;
      throw new Error(res.message || 'Failed to load partners');
    },
    staleTime: 60000,
  });

  const items: Partner[] = query.data ?? [];
  const categories = ['All', ...Array.from(new Set(items.map((p) => p.category).filter(Boolean)))];

  const filteredItems = items.filter((p) => {
    if (selectedCategory === 'All') return true;
    return p.category === selectedCategory;
  });

  return (
    <PageShell glowColor="rgba(232,66,10,0.15)">
      <PageHero
        badge="Hospitality & Venue Network"
        title="Partner Venues & Brands"
        description="Connect with elite dining spots, boutique hotels, private lounges, and lifestyle brand partners across Africa."
      />

      <div className="max-w-7xl mx-auto py-4 -mt-4 px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Link
            href="/lifestyle"
            className="inline-flex items-center gap-2 text-xs font-semibold text-white/50 hover:text-white transition-colors"
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
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                    selectedCategory === cat
                      ? 'bg-[var(--brand-orange)] text-white shadow-lg shadow-[var(--brand-orange)]/25 font-bold'
                      : 'az-glass text-white/60 hover:text-white hover:bg-white/10'
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
              <div key={i} className="az-glass rounded-2xl p-6 space-y-3">
                <Skeleton className="h-6 w-1/2 rounded-md" />
                <Skeleton className="h-4 w-1/3 rounded-md" />
                <Skeleton className="h-4 w-2/3 rounded-md" />
              </div>
            ))}
          </div>
        ) : query.error ? (
          <div className="max-w-md mx-auto py-12">
            <ErrorState
              title="Failed to load partners"
              description={query.error.message}
              onButtonPress={() => query.refetch()}
            />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="az-glass p-16 text-center rounded-3xl border border-white/10 max-w-md mx-auto">
            <Handshake className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">No Partners Listed</h3>
            <p className="text-xs text-white/50">
              New partner venue profiles will be published shortly.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((p, i) => (
              <ScrollReveal key={p.id} delay={i * 0.05}>
                <Link href={`/lifestyle/partners/${p.id}`}>
                  <motion.div whileHover={{ y: -3 }} className="h-full">
                    <GlowCard universe="lifestyle" className="p-6 rounded-2xl border border-white/10 flex flex-col justify-between h-full group cursor-pointer">
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono text-[var(--brand-orange)] flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            {p.category}
                          </span>
                          <div className="flex items-center gap-1 text-xs text-amber-400 font-bold">
                            <Star className="w-3 h-3 fill-amber-400" />
                            <span>{p.rating.toFixed(1)}</span>
                          </div>
                        </div>

                        <h3 className="text-lg font-bold text-white group-hover:text-[var(--brand-orange)] transition-colors">
                          {p.name}
                        </h3>

                        <p className="text-xs text-white/50 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-white/40" />
                          {p.city}
                        </p>
                      </div>

                      <div className="pt-4 mt-4 border-t border-white/5 flex items-center justify-between text-xs">
                        <span className="text-white/40 font-mono flex items-center gap-1">
                          <Tag className="w-3 h-3 text-[var(--brand-orange)]" />
                          {p.offerCount} {p.offerCount === 1 ? 'offer' : 'offers'} active
                        </span>
                        <span className="font-semibold text-[var(--brand-orange)] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                          Partner Profile <ArrowRight className="w-3.5 h-3.5" />
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

const Lazy = lazy(() => Promise.resolve({ default: PartnersContent }));

export default function PartnersPage() {
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
