'use client';

import { Suspense, lazy, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { api, ContentItem } from '@/lib/api';
import { useUniversesQuery } from '@/hooks/useUniverses';
import { PageShell } from '@/components/layout/PageShell';
import { PageHero } from '@/components/layout/PageHero';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import { OptimizedImage } from '@/components/OptimizedImage';
import { Building2, MapPin, ArrowLeft, ArrowRight, Compass } from 'lucide-react';
import analytics from '@/lib/analytics';

const CITIES = ['All Cities', 'Lagos', 'Nairobi', 'Accra', 'Johannesburg', 'Dar es Salaam'] as const;

function CityGuidePageContent(): React.JSX.Element {
  const [selectedCity, setSelectedCity] = useState<string>('All Cities');

  useEffect(() => {
    analytics.pageView('lifestyle-city-guide');
  }, []);

  const universesQuery = useUniversesQuery();
  const lifestyleUniverse = universesQuery.data?.find((u) => u.name?.toLowerCase() === 'lifestyle');

  const {
    data: guides = [],
    isLoading,
    error,
    refetch,
  } = useQuery<ContentItem[], Error>({
    queryKey: ['city-guide-content', lifestyleUniverse?.id],
    queryFn: async () => {
      if (!lifestyleUniverse?.id) throw new Error('Lifestyle universe not found');
      const result = await api.content.getContentByUniverse(lifestyleUniverse.id, 1, 20);
      if (result.success && result.data) {
        return Array.isArray(result.data) ? result.data : result.data.items || [];
      }
      throw new Error(result.message || 'Failed to load city guides.');
    },
    staleTime: 60000,
    enabled: !!lifestyleUniverse?.id,
  });

  const filteredGuides = guides.filter((guide) => {
    if (selectedCity === 'All Cities') return true;
    return (
      guide.title.toLowerCase().includes(selectedCity.toLowerCase()) ||
      (guide.description && guide.description.toLowerCase().includes(selectedCity.toLowerCase()))
    );
  });

  return (
    <PageShell glowColor="rgba(232,66,10,0.15)">
      <PageHero
        badge="Urban Exploration"
        title="African City Guide"
        description="Discover premier culinary gems, luxury stays, rooftop lounges, and cultural landmarks across Africa's vibrant metropolises."
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

          {/* City Selection Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {CITIES.map((city) => {
              const isActive = selectedCity === city;
              return (
                <button
                  key={city}
                  type="button"
                  onClick={() => setSelectedCity(city)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-[var(--brand-orange)] text-white shadow-lg shadow-[var(--brand-orange)]/25 font-bold'
                      : 'az-glass text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {city !== 'All Cities' && <MapPin className="w-3 h-3" />}
                  {city}
                </button>
              );
            })}
          </div>
        </div>

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
              title="Failed to load city guides"
              description={error.message}
              onButtonPress={() => refetch()}
            />
          </div>
        ) : filteredGuides.length === 0 ? (
          <div className="az-glass p-16 text-center rounded-3xl border border-white/10">
            <Building2 className="w-12 h-12 text-white/30 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">No City Guides Found</h3>
            <p className="text-xs text-white/50 max-w-sm mx-auto">
              {selectedCity === 'All Cities'
                ? 'Curated destination guides are currently being prepared by our editorial team.'
                : `We haven't cataloged guides for ${selectedCity} yet. Try another city or view All Cities.`}
            </p>
            {selectedCity !== 'All Cities' && (
              <button
                type="button"
                onClick={() => setSelectedCity('All Cities')}
                className="mt-4 px-4 py-2 rounded-full text-xs font-semibold bg-white/10 text-white hover:bg-white/20 transition-all"
              >
                Reset Filter
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGuides.map((guide) => (
              <ScrollReveal key={guide.id}>
                <Link href={`/watch/${guide.id}`}>
                  <motion.article
                    whileHover={{ y: -3 }}
                    className="az-glass rounded-2xl overflow-hidden border border-white/10 hover:border-[var(--brand-orange)]/40 transition-all flex flex-col group cursor-pointer"
                  >
                    <div className="relative aspect-video bg-white/5">
                      <OptimizedImage
                        src={guide.thumbnail}
                        alt={guide.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-sm text-white border border-white/10 text-[10px] font-mono flex items-center gap-1">
                        <Compass className="w-3 h-3 text-[var(--brand-orange)]" />
                        Guide
                      </div>
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <h3 className="text-sm font-bold text-white group-hover:text-[var(--brand-orange)] transition-colors truncate">
                          {guide.title}
                        </h3>
                        <p className="text-xs text-white/50 line-clamp-2 mt-1">
                          {guide.description}
                        </p>
                      </div>
                      <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs font-semibold text-[var(--brand-orange)]">
                        <span>Explore Spot</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </motion.article>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}

const LazyCityGuidePage = lazy(() => Promise.resolve({ default: CityGuidePageContent }));

export default function CityGuidePage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--brand-near-black)]">
          <p className="text-white/50 text-lg">Loading...</p>
        </div>
      }
    >
      <LazyCityGuidePage />
    </Suspense>
  );
}
