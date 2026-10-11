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
import { Building2, MapPin, ArrowLeft, ArrowRight, Compass } from 'lucide-react';
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
  const [selectedCity, setSelectedCity] = useState<string>('All');

  useEffect(() => {
    analytics.pageView('neighborhoods');
  }, []);

  const query = useQuery({
    queryKey: ['lifestyle', 'neighborhoods'],
    queryFn: async () => {
      const res = await api.request<Neighborhood[]>('/api/v1/lifestyle/neighborhoods');
      if (res.success && res.data) return res.data;
      throw new Error(res.message || 'Failed to load neighborhoods');
    },
    staleTime: 60000,
  });

  const items: Neighborhood[] = query.data ?? [];
  const cities = ['All', ...Array.from(new Set(items.map((n) => n.city).filter(Boolean)))];

  const filteredItems = items.filter((n) => {
    if (selectedCity === 'All') return true;
    return n.city === selectedCity;
  });

  return (
    <PageShell glowColor="color-mix(in srgb, var(--color-az-scarlet) 15%, transparent)">
      <PageHero
        badge="District Guide"
        title="Iconic Neighborhoods"
        description="Immerse yourself in the distinct vibe, architecture, culture, and premier spots of Africa's most storied districts."
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

          {cities.length > 1 && (
            <div className="flex flex-wrap items-center gap-2">
              {cities.map((city) => (
                <button
                  key={city}
                  type="button"
                  onClick={() => setSelectedCity(city)}
                  className={`px-3.5 py-1.5 text-xs font-medium transition-all ${
                    selectedCity === city
                      ? 'text-az-ink font-bold'
                      : 'az-glass text-az-ink/60 hover:text-az-ink hover:bg-az-glass-card'
                  }`}
                >
                  {city}
                </button>
              ))}
            </div>
          )}
        </div>

        {query.isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="az-glass overflow-hidden p-4 space-y-3">
                <Skeleton className="h-44 w-full rounded-xl" />
                <Skeleton className="h-5 w-3/4 rounded-md" />
                <Skeleton className="h-4 w-1/2 rounded-md" />
              </div>
            ))}
          </div>
        ) : query.error ? (
          <div className="max-w-md mx-auto py-12">
            <ErrorState
              title="Failed to load neighborhoods"
              description={query.error.message}
              onButtonPress={() => query.refetch()}
            />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="az-glass p-16 text-center border border-az-glass-border max-w-md mx-auto">
            <Building2 className="w-12 h-12 text-az-ink/20 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-az-ink mb-2">No Neighborhoods Listed</h3>
            <p className="text-xs text-az-ink/50">
              District spotlights for this area will be featured shortly.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((n, i) => (
              <ScrollReveal key={n.id} delay={i * 0.05}>
                <Link href={`/lifestyle/neighborhoods/${n.id}`}>
                  <motion.div whileHover={{ y: -3 }} className="h-full">
                    <GlowCard
                      universe="lifestyle"
                      className="overflow-hidden rounded-2xl border border-az-glass-border flex flex-col h-full group cursor-pointer"
                    >
                      <div className="relative h-44 bg-gradient-to-br from-[var(--color-az-flame)]/25 via-purple-950/30 to-[var(--color-az-surface-root)] flex items-center justify-center overflow-hidden">
                        <Building2 className="w-14 h-14 text-az-ink/20 group-hover:scale-110 group-hover:text-[var(--color-az-flame)]/40 transition-all duration-300" />
                        <div className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-sm text-[var(--color-az-flame)] border border-[var(--color-az-flame)]/30 text-[10px] font-mono font-bold">
                          {n.placeCount} Venues
                        </div>
                        <div className="absolute bottom-2.5 left-3">
                          <span className="text-xs font-mono text-az-ink/70 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-[var(--color-az-flame)]" />
                            {n.city}
                          </span>
                        </div>
                      </div>
                      <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                        <div>
                          <h3 className="text-lg font-bold text-az-ink group-hover:text-[var(--color-az-flame)] transition-colors">
                            {n.name}
                          </h3>
                          <p className="text-xs text-az-ink/50 line-clamp-2 mt-1 leading-relaxed">
                            {n.description}
                          </p>
                        </div>
                        <div className="pt-2 border-t border-az-ink/5 flex items-center justify-between text-xs font-semibold text-[var(--color-az-flame)]">
                          <span className="flex items-center gap-1">
                            <Compass className="w-3.5 h-3.5" />
                            Explore District
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                        </div>
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

const Lazy = lazy(() => Promise.resolve({ default: NeighborhoodsContent }));

export default function NeighborhoodsPage() {
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
