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
import { MapPin, Clock, Star, Navigation, ArrowLeft, ArrowRight, Map as MapIcon } from 'lucide-react';
import analytics from '@/lib/analytics';

interface Itinerary {
  id: string;
  title: string;
  description: string;
  city: string;
  duration: string;
  stops: number;
  rating: number;
}

function ItinerariesContent() {
  const [selectedCity, setSelectedCity] = useState<string>('All');

  useEffect(() => {
    analytics.pageView('itineraries');
  }, []);

  const query = useQuery({
    queryKey: ['lifestyle', 'itineraries'],
    queryFn: async () => {
      const res = await api.request<Itinerary[]>('/api/v1/lifestyle/itineraries');
      if (res.success && res.data) return res.data;
      throw new Error(res.message || 'Failed to load itineraries');
    },
    staleTime: 60000,
  });

  const items: Itinerary[] = query.data ?? [];
  const cities = ['All', ...Array.from(new Set(items.map((it) => it.city).filter(Boolean)))];

  const filteredItems = items.filter((it) => {
    if (selectedCity === 'All') return true;
    return it.city === selectedCity;
  });

  return (
    <PageShell glowColor="rgba(232,66,10,0.15)">
      <PageHero
        badge="Curated Journeys"
        title="Urban Itineraries"
        description="Handcrafted multi-stop city tours, weekend escapes, and cultural pathways designed by local insiders."
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

          {cities.length > 1 && (
            <div className="flex flex-wrap items-center gap-2">
              {cities.map((city) => (
                <button
                  key={city}
                  type="button"
                  onClick={() => setSelectedCity(city)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                    selectedCity === city
                      ? 'bg-[var(--brand-orange)] text-white shadow-lg shadow-[var(--brand-orange)]/25 font-bold'
                      : 'az-glass text-white/60 hover:text-white hover:bg-white/10'
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
              <div key={i} className="az-glass rounded-2xl p-6 space-y-4">
                <Skeleton className="h-5 w-1/3 rounded-md" />
                <Skeleton className="h-7 w-3/4 rounded-md" />
                <Skeleton className="h-12 w-full rounded-md" />
                <Skeleton className="h-4 w-1/2 rounded-md" />
              </div>
            ))}
          </div>
        ) : query.error ? (
          <div className="max-w-md mx-auto py-12">
            <ErrorState
              title="Failed to load itineraries"
              description={query.error.message}
              onButtonPress={() => query.refetch()}
            />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="az-glass p-16 text-center rounded-3xl border border-white/10 max-w-md mx-auto">
            <MapIcon className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">No Itineraries Available</h3>
            <p className="text-xs text-white/50">
              Curated walking and driving itineraries will be published soon.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((it, i) => (
              <ScrollReveal key={it.id} delay={i * 0.05}>
                <Link href={`/lifestyle/itineraries/${it.id}`}>
                  <motion.div whileHover={{ y: -3 }} className="h-full">
                    <GlowCard universe="lifestyle" className="rounded-2xl p-6 border border-white/10 flex flex-col justify-between h-full group cursor-pointer">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono text-[var(--brand-orange)] flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {it.city}
                          </span>
                          <div className="flex items-center gap-1 text-xs text-amber-400 font-bold">
                            <Star className="w-3 h-3 fill-amber-400" />
                            <span>{it.rating}</span>
                          </div>
                        </div>
                        <h3 className="text-lg font-bold text-white group-hover:text-[var(--brand-orange)] transition-colors">
                          {it.title}
                        </h3>
                        <p className="text-xs text-white/50 line-clamp-2 leading-relaxed">
                          {it.description}
                        </p>
                      </div>

                      <div className="pt-4 mt-4 border-t border-white/5 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3 text-white/40">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {it.duration}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Navigation className="w-3 h-3" />
                            {it.stops} stops
                          </span>
                        </div>
                        <span className="font-semibold text-[var(--brand-orange)] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                          View Route <ArrowRight className="w-3.5 h-3.5" />
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

const Lazy = lazy(() => Promise.resolve({ default: ItinerariesContent }));

export default function ItinerariesPage() {
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
