'use client';
import { Suspense, lazy, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import PageShell from '@/components/layout/PageShell';
import PageHero from '@/components/layout/PageHero';
import { OptimizedImage } from '@/components/OptimizedImage';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { GlowCard } from '@/components/motion/GlowCard';
import analytics from '@/lib/analytics';

interface Storyworld {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  episodeCount?: number;
  genre?: string;
  isComplete?: boolean;
}

function StoryworldsPageContent(): React.JSX.Element {
  useEffect(() => {
    analytics.pageView('vertical-storyworlds');
  }, []);

  const storyworldsQuery = useQuery({
    queryKey: ['storyworlds'],
    queryFn: async () => {
      const res = await api.request<Storyworld[]>('/api/v1/vertical/storyworlds');
      if (res.success && res.data) return res.data;
      throw new Error(res.message || 'Failed to load storyworlds');
    },
    staleTime: 60000,
  });

  const storyworlds: Storyworld[] = storyworldsQuery.data ?? [];
  const isLoading = storyworldsQuery.isLoading;
  const error = storyworldsQuery.error?.message;

  return (
    <PageShell activeNav="Vertical">
      {/* Hero */}
      <PageHero
        eyebrow="Vertical Universe"
        title="Storyworlds"
        subtitle="Dive into immersive story universes with interconnected characters and plotlines"
      />

      {/* Storyworlds Grid */}
      <section className="py-2 sm:py-4">
        <ScrollReveal>
          <h2 className="az-section-title mb-6 text-az-ink sm:mb-8">Explore Storyworlds</h2>
        </ScrollReveal>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="az-glass overflow-hidden">
                <Skeleton height="200px" borderRadius="0" />
                <div className="space-y-3 p-4">
                  <Skeleton height="20px" width="70%" />
                  <Skeleton height="16px" width="90%" />
                  <Skeleton height="36px" borderRadius="0" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <ErrorState
            title="Failed to load storyworlds"
            description={error}
            onButtonPress={() => storyworldsQuery.refetch()}
          />
        ) : storyworlds.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {storyworlds.map((world, index) => (
              <motion.div
                key={world.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Link href={`/vertical/storyworlds/${world.id}`}>
                  <GlowCard universe="vertical" className="overflow-hidden">
                    <div className="relative">
                      <OptimizedImage
                        src={world.thumbnail}
                        alt={world.title}
                        width={400}
                        height={160}
                        className="h-40 w-full object-cover"
                      />
                      <div className="absolute inset-0 az-scrim" />
                      <div className="absolute top-2 right-2 flex gap-2">
                        {world.isComplete && (
                          <span className="az-micro-label rounded-az-pill bg-az-success-500/90 px-2 py-0.5 text-az-ink">
                            Complete
                          </span>
                        )}
                        {world.genre && (
                          <span className="az-micro-label rounded-az-pill bg-az-scarlet/90 px-2 py-0.5 text-az-ink">
                            {world.genre}
                          </span>
                        )}
                      </div>
                      <div className="absolute bottom-3 left-3 right-3">
                        <h3 className="az-subtitle text-az-ink">{world.title}</h3>
                      </div>
                    </div>
                    <div className="p-4">
                      <p className="az-caption mb-3 line-clamp-3 text-az-ink/50">
                        {world.description}
                      </p>
                      <div className="az-caption flex items-center justify-between text-az-ink/40">
                        {world.episodeCount != null && <span>{world.episodeCount} episodes</span>}
                        <span className="az-body-strong text-az-flame">Explore →</span>
                      </div>
                    </div>
                  </GlowCard>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className="az-lead text-az-ink/50">No storyworlds available</p>
          </div>
        )}
      </section>
    </PageShell>
  );
}

const LazyStoryworldsPage = lazy(() => Promise.resolve({ default: StoryworldsPageContent }));

export default function StoryworldsPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-az-surface-root">
          <p className="az-lead text-az-ink-muted">Loading...</p>
        </div>
      }
    >
      <LazyStoryworldsPage />
    </Suspense>
  );
}
