'use client';
import { Suspense, lazy, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { api, ContentItem } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import { PageHero } from '@/components/layout/PageHero';
import { PageShell } from '@/components/layout/PageShell';
import { OptimizedImage } from '@/components/OptimizedImage';
import { Play } from 'lucide-react';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { GlowCard } from '@/components/motion/GlowCard';
import analytics from '@/lib/analytics';

function HighlightsPageContent(): React.JSX.Element {
  useEffect(() => {
    analytics.pageView('sports-highlights');
  }, []);

  const highlightsQuery = useQuery({
    queryKey: ['sports-highlights'],
    queryFn: async () => {
      const res = await api.content.getTrendingContent(20);
      if (res.success && res.data) {
        return Array.isArray(res.data) ? res.data : [];
      }
      throw new Error(res.message || 'Failed to load highlights');
    },
    staleTime: 60000,
  });

  const highlights: ContentItem[] = highlightsQuery.data ?? [];
  const isLoading = highlightsQuery.isLoading;
  const error = highlightsQuery.error?.message;

  return (
    <PageShell maxWidth="7xl" activeNav="Sports">
      <PageHero
        eyebrow="Sports"
        badge="Game Recaps & Clips"
        title="Match Highlights"
        description="Watch the best moments from recent matches and events"
        accentColor="var(--color-az-universe-sports)"
      />

      <section>
        <ScrollReveal>
          <h2 className="az-section-title mb-6 text-az-ink sm:mb-8">Featured Highlights</h2>
        </ScrollReveal>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="az-glass overflow-hidden">
                <Skeleton height="200px" borderRadius="0" />
                <div className="p-4 space-y-3">
                  <Skeleton height="20px" width="70%" />
                  <Skeleton height="16px" width="50%" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <ErrorState
            title="Failed to load highlights"
            description={error}
            onButtonPress={() => highlightsQuery.refetch()}
          />
        ) : highlights.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {highlights.map((highlight, index) => (
              <motion.div
                key={highlight.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                <Link href={`/watch/${highlight.id}`}>
                  <GlowCard universe="sports" className="overflow-hidden group">
                    <div className="relative">
                      <OptimizedImage
                        src={highlight.thumbnail}
                        alt={highlight.title}
                        width={400}
                        height={200}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 az-scrim" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex size-14 items-center justify-center rounded-full bg-az-ink/95 shadow-az-glow">
                          <Play
                            size={20}
                            className="fill-az-surface-root text-az-surface-root"
                            aria-hidden="true"
                          />
                        </div>
                      </div>
                      {highlight.duration && (
                        <span className="az-caption absolute bottom-2 right-2 rounded-az-control bg-az-surface-root/70 px-2 py-0.5 font-medium text-az-ink">
                          {Math.floor(highlight.duration / 60)}:
                          {(highlight.duration % 60).toString().padStart(2, '0')}
                        </span>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="az-body-strong mb-2 truncate text-az-ink">
                        {highlight.title}
                      </h3>
                      <p className="az-caption line-clamp-2 text-az-ink-muted">
                        {highlight.description}
                      </p>
                    </div>
                  </GlowCard>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="az-lead text-az-ink-muted">No highlights available</p>
          </div>
        )}
      </section>
    </PageShell>
  );
}

const LazyHighlightsPage = lazy(() => Promise.resolve({ default: HighlightsPageContent }));

export default function HighlightsPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-az-surface-root">
          <p className="az-lead text-az-ink-muted">Loading...</p>
        </div>
      }
    >
      <LazyHighlightsPage />
    </Suspense>
  );
}
