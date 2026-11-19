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

interface Crossover {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  storyworlds: string[];
  episodeCount?: number;
}

function CrossoversPageContent(): React.JSX.Element {
  useEffect(() => {
    analytics.pageView('vertical-crossovers');
  }, []);

  const crossoversQuery = useQuery({
    queryKey: ['crossovers'],
    queryFn: async () => {
      const res = await api.request<Crossover[]>('/api/v1/vertical/crossovers');
      if (res.success && res.data) return res.data;
      throw new Error(res.message || 'Failed to load crossovers');
    },
    staleTime: 60000,
  });

  const crossovers: Crossover[] = crossoversQuery.data ?? [];
  const isLoading = crossoversQuery.isLoading;
  const error = crossoversQuery.error?.message;

  return (
    <PageShell activeNav="Vertical">
      {/* Hero */}
      <PageHero
        eyebrow="Vertical Universe"
        title="Crossovers"
        subtitle="When storyworlds collide — characters and narratives from different universes meet"
      />

      {/* Crossovers Grid */}
      <section className="py-2 sm:py-4">
        <ScrollReveal>
          <h2 className="az-section-title mb-6 text-az-ink sm:mb-8">Crossover Episodes</h2>
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
            title="Failed to load crossovers"
            description={error}
            onButtonPress={() => crossoversQuery.refetch()}
          />
        ) : crossovers.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {crossovers.map((crossover, index) => (
              <motion.div
                key={crossover.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Link href={`/watch/${crossover.id}`}>
                  <GlowCard universe="vertical" className="overflow-hidden">
                    <div className="relative">
                      <OptimizedImage
                        src={crossover.thumbnail}
                        alt={crossover.title}
                        width={400}
                        height={160}
                        className="h-40 w-full object-cover"
                      />
                      <div className="absolute inset-0 az-scrim" />
                      <div className="absolute top-2 left-2">
                        <span className="az-overline rounded-az-pill bg-az-flame px-2.5 py-1 text-az-surface-root">
                          CROSSOVER
                        </span>
                      </div>
                      <div className="absolute bottom-3 left-3 right-3">
                        <h3 className="az-subtitle text-az-ink">{crossover.title}</h3>
                      </div>
                    </div>
                    <div className="p-4">
                      <p className="az-caption mb-3 line-clamp-2 text-az-ink/50">
                        {crossover.description}
                      </p>
                      {crossover.storyworlds.length > 0 && (
                        <div className="mb-3 flex flex-wrap gap-1.5">
                          {crossover.storyworlds.map((sw) => (
                            <span
                              key={sw}
                              className="az-micro-label rounded-az-pill bg-az-ink/10 px-2 py-0.5 text-az-ink/60"
                            >
                              {sw}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="az-caption flex items-center justify-between text-az-ink/40">
                        {crossover.episodeCount != null && (
                          <span>{crossover.episodeCount} episodes</span>
                        )}
                        <span className="az-body-strong text-az-flame">Watch Now →</span>
                      </div>
                    </div>
                  </GlowCard>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className="az-lead text-az-ink/50">No crossover episodes available</p>
          </div>
        )}
      </section>
    </PageShell>
  );
}

const LazyCrossoversPage = lazy(() => Promise.resolve({ default: CrossoversPageContent }));

export default function CrossoversPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-az-surface-root">
          <p className="az-lead text-az-ink-muted">Loading...</p>
        </div>
      }
    >
      <LazyCrossoversPage />
    </Suspense>
  );
}
