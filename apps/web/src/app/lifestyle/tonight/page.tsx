'use client';

import { Suspense, lazy, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { PageShell } from '@/components/layout/PageShell';
import { PageHero } from '@/components/layout/PageHero';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import { OptimizedImage } from '@/components/OptimizedImage';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { GlowCard } from '@/components/motion/GlowCard';
import { Star, MapPin, ArrowLeft, ArrowRight, Sparkles, Moon } from 'lucide-react';
import analytics from '@/lib/analytics';

interface Place {
  id: string;
  name: string;
  category: string;
  imageUrl?: string;
  rating: number;
  distance: string;
  isOpen: boolean;
  priceRange: string;
}

function TonightPageContent(): React.JSX.Element {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  useEffect(() => {
    analytics.pageView('lifestyle-tonight');
  }, []);

  const {
    data: places,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['9tlife', 'tonight'],
    queryFn: async () => {
      const res = await apiFetch<Place[]>('/v1/lifestyle/tonight');
      return res.success ? res.data : null;
    },
    staleTime: 30000,
  });

  const allPlaces = places || [];
  const uniqueCategories = ['All', ...Array.from(new Set(allPlaces.map((p) => p.category).filter(Boolean)))];

  const filteredPlaces = allPlaces.filter((p) => {
    if (selectedCategory === 'All') return true;
    return p.category === selectedCategory;
  });

  return (
    <PageShell glowColor="rgba(232,66,10,0.15)">
      <PageHero
        badge="After Dark"
        title="Tonight in the City"
        description="Curated high-energy clubs, rooftop lounges, speakeasies, and late-night culinary destinations buzzing tonight."
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

          <div className="flex items-center gap-2">
            <Link
              href="/lifestyle/tonight"
              className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-[var(--brand-orange)] text-white shadow-lg shadow-[var(--brand-orange)]/25 flex items-center gap-1.5"
            >
              <Moon className="w-3 h-3" />
              Tonight
            </Link>
            <Link
              href="/lifestyle/nightlife"
              className="px-3.5 py-1.5 rounded-full text-xs font-medium az-glass text-white/60 hover:text-white hover:bg-white/10 transition-all"
            >
              VIP Nightlife
            </Link>
          </div>
        </div>

        {uniqueCategories.length > 1 && (
          <div className="flex flex-wrap items-center gap-2">
            {uniqueCategories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                  selectedCategory === cat
                    ? 'bg-white/20 text-white border border-white/30 font-bold'
                    : 'az-glass text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="az-glass rounded-2xl overflow-hidden p-4 space-y-3">
                <Skeleton className="aspect-video w-full rounded-xl" />
                <Skeleton className="h-5 w-3/4 rounded-md" />
                <Skeleton className="h-4 w-1/2 rounded-md" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="max-w-md mx-auto py-12">
            <ErrorState
              title="Failed to load tonight's picks"
              description="Unable to retrieve current live venue schedules."
              onButtonPress={() => refetch()}
            />
          </div>
        ) : filteredPlaces.length === 0 ? (
          <div className="az-glass p-16 text-center rounded-3xl border border-white/10 max-w-md mx-auto">
            <Sparkles className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">No Venues Found</h3>
            <p className="text-xs text-white/50">
              No spots currently active in this category for tonight. Check back soon or view all venues.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPlaces.map((place, idx) => (
              <ScrollReveal key={place.id} delay={idx * 0.05}>
                <Link href={`/lifestyle/places/${place.id}`}>
                  <motion.div whileHover={{ y: -3 }} className="h-full">
                    <GlowCard universe="lifestyle" className="overflow-hidden rounded-2xl border border-white/10 flex flex-col h-full group cursor-pointer">
                      <div className="relative aspect-video bg-white/5">
                        {place.imageUrl ? (
                          <OptimizedImage
                            src={place.imageUrl}
                            alt={place.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-[var(--brand-orange)]/20 via-black to-black" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                        <div className="absolute top-2.5 right-2.5">
                          <span
                            className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full backdrop-blur-md border ${
                              place.isOpen
                                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                            }`}
                          >
                            {place.isOpen ? 'Open Now' : 'Closed'}
                          </span>
                        </div>
                        <div className="absolute bottom-3 left-3 right-3">
                          <h3 className="text-base font-bold text-white group-hover:text-[var(--brand-orange)] transition-colors truncate">
                            {place.name}
                          </h3>
                        </div>
                      </div>

                      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-white/40 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {place.distance}
                            </span>
                            <span className="text-white/40 font-mono">{place.priceRange}</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-amber-400 font-bold">
                            <Star className="w-3.5 h-3.5 fill-amber-400" />
                            <span>{place.rating.toFixed(1)}</span>
                            <span className="text-[10px] text-white/30 font-normal ml-1">rating</span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs font-semibold text-[var(--brand-orange)]">
                          <span>View Tonight&apos;s Pass</span>
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

const LazyTonightPage = lazy(() => Promise.resolve({ default: TonightPageContent }));

export default function TonightPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--brand-near-black)]">
          <p className="text-white/50 text-lg">Loading...</p>
        </div>
      }
    >
      <LazyTonightPage />
    </Suspense>
  );
}
