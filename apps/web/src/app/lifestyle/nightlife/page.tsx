'use client';

import { Suspense, lazy, useEffect } from 'react';
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
import { Moon, ArrowRight, ArrowLeft } from 'lucide-react';
import analytics from '@/lib/analytics';

function NightlifePageContent(): React.JSX.Element {
  useEffect(() => {
    analytics.pageView('lifestyle-nightlife');
  }, []);

  const universesQuery = useUniversesQuery();
  const lifestyleUniverse = universesQuery.data?.find((u) => u.name?.toLowerCase() === 'lifestyle');

  const {
    data: venues = [],
    isLoading,
    error,
    refetch,
  } = useQuery<ContentItem[], Error>({
    queryKey: ['nightlife-content', lifestyleUniverse?.id],
    queryFn: async () => {
      if (!lifestyleUniverse?.id) throw new Error('Lifestyle universe not found');
      const result = await api.content.getContentByUniverse(lifestyleUniverse.id, 1, 20);
      if (result.success && result.data) {
        return Array.isArray(result.data) ? result.data : result.data.items || [];
      }
      throw new Error(result.message || 'Failed to load nightlife venues.');
    },
    staleTime: 60000,
    enabled: !!lifestyleUniverse?.id,
  });

  return (
    <PageShell glowColor="color-mix(in srgb, var(--color-az-scarlet) 15%, transparent)">
      <PageHero
        badge="After Dark"
        title="Nightlife & VIP Lounges"
        description="Exclusive club tours, rooftop lounges, and curated after-hours events across Africa's vibrant entertainment capitals."
      />

      <div className="max-w-7xl mx-auto py-4 -mt-4 px-4 sm:px-6 lg:px-8 space-y-6">
        <Link
          href="/lifestyle"
          className="inline-flex items-center gap-2 text-xs font-semibold text-az-ink/50 hover:text-az-ink transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Lifestyle Hub
        </Link>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="az-glass overflow-hidden p-4 space-y-3">
                <Skeleton className="aspect-video w-full rounded-xl" />
                <Skeleton className="h-5 w-3/4 rounded-md" />
                <Skeleton className="h-4 w-1/2 rounded-md" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="max-w-md mx-auto py-12">
            <ErrorState
              title="Failed to load nightlife"
              description={error.message}
              onButtonPress={() => refetch()}
            />
          </div>
        ) : venues.length === 0 ? (
          <div className="az-glass p-16 text-center border border-az-glass-border">
            <Moon className="w-12 h-12 text-az-ink/30 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-az-ink mb-2">No Nightlife Venues Cataloged</h3>
            <p className="text-xs text-az-ink/50">Exclusive nightlife guides are being curated.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {venues.map((item) => (
              <ScrollReveal key={item.id}>
                <Link href={`/watch/${item.id}`}>
                  <motion.article
                    whileHover={{ y: -3 }}
                    className="az-glass overflow-hidden border border-az-glass-border transition-all flex flex-col group cursor-pointer"
                  >
                    <div className="relative aspect-video bg-az-glass-fill">
                      <OptimizedImage
                        src={item.thumbnail}
                        alt={item.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-sm text-[var(--color-az-flame)] border border-[var(--color-az-flame)]/30 text-[10px] font-mono font-bold uppercase">
                        Nightlife
                      </div>
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <h3 className="text-sm font-bold text-az-ink group-hover:text-[var(--color-az-flame)] transition-colors truncate">
                          {item.title}
                        </h3>
                        <p className="text-xs text-az-ink/50 line-clamp-2 mt-1">
                          {item.description}
                        </p>
                      </div>
                      <div className="pt-2 border-t border-az-ink/5 flex items-center justify-between text-xs font-semibold text-[var(--color-az-flame)]">
                        <span>Explore Venue</span>
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

const LazyNightlife = lazy(() => Promise.resolve({ default: NightlifePageContent }));

export default function NightlifePage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--color-az-surface-root)]">
          <p className="text-az-ink/50 text-lg">Loading...</p>
        </div>
      }
    >
      <LazyNightlife />
    </Suspense>
  );
}
