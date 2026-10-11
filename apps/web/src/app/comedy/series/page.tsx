'use client';
import { Suspense, lazy, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { api, ContentItem } from '@/lib/api';
import { useUniversesQuery } from '@/hooks/useUniverses';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import { PageHero } from '@/components/layout/PageHero';
import { PageShell } from '@/components/layout/PageShell';
import { OptimizedImage } from '@/components/OptimizedImage';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { GlowCard } from '@/components/motion/GlowCard';
import analytics from '@/lib/analytics';

function SeriesPageContent(): React.JSX.Element {
  useEffect(() => {
    analytics.pageView('comedy-series');
  }, []);

  const universesQuery = useUniversesQuery();

  const comedyUniverse = universesQuery.data?.find((u) => u.name?.toLowerCase() === 'comedy');

  const seriesQuery = useQuery({
    queryKey: ['comedy-series', comedyUniverse?.id],
    queryFn: async () => {
      if (!comedyUniverse?.id) throw new Error('Comedy universe not found');
      const res = await api.content.getContentByUniverse(comedyUniverse.id, 1, 30);
      if (res.success && res.data) {
        return Array.isArray(res.data) ? res.data : res.data.items || [];
      }
      throw new Error(res.message || 'Failed to load comedy series');
    },
    staleTime: 60000,
    enabled: !!comedyUniverse?.id,
  });

  const series: ContentItem[] = seriesQuery.data ?? [];
  const isLoading = seriesQuery.isLoading;
  const error = seriesQuery.error?.message;

  return (
    <PageShell activeNav="Comedy">
      <PageHero
        eyebrow="Comedy"
        title="Comedy Series"
        description="Binge-worthy comedy series from Africa's funniest creators"
        accentColor="var(--color-az-universe-comedy)"
      />

      <section className="py-4">
        <ScrollReveal>
          <h2 className="az-section-title mb-6 text-az-ink sm:mb-8">All Series</h2>
        </ScrollReveal>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="az-glass overflow-hidden">
                <Skeleton height="200px" borderRadius="0" />
                <div className="p-4 space-y-3">
                  <Skeleton height="20px" width="70%" />
                  <Skeleton height="16px" width="90%" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <ErrorState
            title="Failed to load series"
            description={error}
            onButtonPress={() => seriesQuery.refetch()}
          />
        ) : series.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {series.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                <Link href={`/watch/${item.id}`}>
                  <GlowCard universe="comedy" className="overflow-hidden group">
                    <div className="relative">
                      <OptimizedImage
                        src={item.thumbnail}
                        alt={item.title}
                        width={400}
                        height={200}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 az-scrim" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex size-14 items-center justify-center rounded-full bg-az-ink/90">
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="text-az-flame"
                            aria-hidden="true"
                          >
                            <polygon points="5,3 19,12 5,21" />
                          </svg>
                        </div>
                      </div>
                      {item.duration && (
                        <span className="az-caption absolute bottom-2 right-2 rounded-az-control bg-black/70 px-2 py-0.5 text-az-ink">
                          {Math.floor(item.duration / 60)}m
                        </span>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="az-body-strong mb-2 truncate text-az-ink">{item.title}</h3>
                      <p className="az-body line-clamp-2 text-az-ink-muted">{item.description}</p>
                    </div>
                  </GlowCard>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="az-lead text-az-ink-muted">No comedy series available</p>
          </div>
        )}
      </section>
    </PageShell>
  );
}

const LazySeriesPage = lazy(() => Promise.resolve({ default: SeriesPageContent }));

export default function SeriesPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[var(--color-az-surface-root)]">
          <p className="az-lead text-az-ink-muted">Loading...</p>
        </div>
      }
    >
      <LazySeriesPage />
    </Suspense>
  );
}
