'use client';
import { Suspense, lazy, useEffect } from 'react';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import { PageShell } from '@/components/layout/PageShell';
import { OptimizedImage } from '@/components/OptimizedImage';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { GlowCard } from '@/components/motion/GlowCard';
import analytics from '@/lib/analytics';

interface Premiere {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  premiereDate: string;
  genre?: string;
  cast?: string[];
  isExclusive?: boolean;
}

function PremieresPageContent(): React.JSX.Element {
  useEffect(() => {
    analytics.pageView('movies-premieres');
  }, []);

  const premieresQuery = useQuery({
    queryKey: ['movie-premieres'],
    queryFn: async () => {
      const res = await api.request<Premiere[]>('/api/v1/movies/premieres');
      if (res.success && res.data) return res.data;
      throw new Error(res.message || 'Failed to load premieres');
    },
    staleTime: 60000,
  });

  const premieres: Premiere[] = premieresQuery.data ?? [];
  const isLoading = premieresQuery.isLoading;
  const error = premieresQuery.error?.message;
  const featured = premieres[0] ?? null;

  return (
    <PageShell maxWidth="full" activeNav="Movies">
      {/* Featured Premiere — the film's own artwork is this page's hero */}
      {isLoading ? (
        <section className="relative">
          <Skeleton height="500px" borderRadius="0" />
        </section>
      ) : featured ? (
        <section className="relative">
          <div className="relative h-[400px] sm:h-[500px]">
            <OptimizedImage
              src={featured.thumbnail}
              alt={featured.title}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 az-scrim--hero" />
            <div className="absolute bottom-0 left-0 right-0 mx-auto max-w-7xl p-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="mb-4 flex items-center gap-2">
                  <span className="az-caption rounded-az-pill bg-az-warning-500 px-3 py-1 font-semibold text-az-surface-root">
                    Coming Soon
                  </span>
                  {featured.isExclusive && (
                    <span className="az-caption rounded-az-pill bg-az-flame px-3 py-1 font-semibold text-az-ink">
                      Azeebo+ Exclusive
                    </span>
                  )}
                </div>
                <h1 className="az-headline mb-3 text-4xl text-az-ink sm:text-5xl">
                  {featured.title}
                </h1>
                <p className="az-lead mb-4 max-w-2xl text-az-ink/60">{featured.description}</p>
                {featured.genre && <p className="az-body mb-4 text-az-ink/40">{featured.genre}</p>}
                <div className="flex items-center gap-4">
                  <motion.button
                    type="button"
                    className="az-btn-primary az-btn-primary--inline"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Set Reminder
                  </motion.button>
                  <span className="az-body text-az-ink/60">
                    Premieres{' '}
                    {new Date(featured.premiereDate).toLocaleDateString('en-NG', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      ) : null}

      {/* Upcoming Premieres */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <ScrollReveal>
          <h2 className="az-section-title mb-6 text-az-ink sm:mb-8">Upcoming Premieres</h2>
        </ScrollReveal>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="az-glass overflow-hidden">
                <Skeleton height="240px" borderRadius="0" className="sm:h-[240px]" />
                <div className="space-y-3 p-4">
                  <Skeleton height="20px" width="70%" />
                  <Skeleton height="16px" width="50%" />
                  <Skeleton height="36px" borderRadius="0" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <ErrorState
            title="Failed to load premieres"
            description={error}
            onButtonPress={() => premieresQuery.refetch()}
          />
        ) : premieres.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {premieres.map((premiere, index) => {
              const daysUntil = Math.ceil(
                (new Date(premiere.premiereDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
              );

              return (
                <motion.div
                  key={premiere.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <GlowCard universe="movies" className="overflow-hidden">
                    <div className="relative">
                      <OptimizedImage
                        src={premiere.thumbnail}
                        alt={premiere.title}
                        width={400}
                        height={192}
                        className="h-48 w-full object-cover"
                      />
                      <div className="absolute inset-0 az-scrim" />
                      {daysUntil > 0 && (
                        <div className="absolute right-2 top-2">
                          <span className="az-caption rounded-az-pill bg-az-warning-500/90 px-2.5 py-1 font-semibold text-az-surface-root">
                            {daysUntil} days
                          </span>
                        </div>
                      )}
                      <div className="absolute bottom-4 left-4 right-4">
                        {premiere.genre && (
                          <span className="az-caption mb-2 inline-block rounded-az-pill bg-az-scarlet/20 px-2.5 py-0.5 text-az-flame">
                            {premiere.genre}
                          </span>
                        )}
                        <h3 className="az-title text-az-ink">{premiere.title}</h3>
                      </div>
                    </div>
                    <div className="p-4">
                      <p className="az-body mb-3 line-clamp-2 text-az-ink-muted">
                        {premiere.description}
                      </p>
                      <div className="az-caption mb-3 flex items-center justify-between text-az-ink/40">
                        <span>
                          {new Date(premiere.premiereDate).toLocaleDateString('en-NG', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                        {premiere.isExclusive && <span className="text-az-flame">Exclusive</span>}
                      </div>
                      <motion.button
                        type="button"
                        className="az-btn-primary"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Remind Me
                      </motion.button>
                    </div>
                  </GlowCard>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className="az-lead text-az-ink/50">No upcoming premieres</p>
          </div>
        )}
      </section>
    </PageShell>
  );
}

const LazyPremieresPage = lazy(() => Promise.resolve({ default: PremieresPageContent }));

export default function PremieresPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-az-surface-root">
          <p className="az-lead text-az-ink-muted">Loading...</p>
        </div>
      }
    >
      <LazyPremieresPage />
    </Suspense>
  );
}
