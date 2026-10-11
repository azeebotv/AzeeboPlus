'use client';
import { Suspense, lazy, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import Link from 'next/link';
import { api, ContentItem } from '@/lib/api';
import { useUniversesQuery } from '@/hooks/useUniverses';
import PageShell from '@/components/layout/PageShell';
import PageHero from '@/components/layout/PageHero';
import { OptimizedImage } from '@/components/OptimizedImage';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { StaggerGrid } from '@/components/motion/StaggerGrid';
import { GlowCard } from '@/components/motion/GlowCard';
import analytics from '@/lib/analytics';

function GamesPageContent(): React.JSX.Element {
  useEffect(() => {
    analytics.pageView('games');
  }, []);

  const universesQuery = useUniversesQuery();

  const gamesUniverse = universesQuery.data?.find((u) => u.name?.toLowerCase() === 'games');

  const {
    data: games = [],
    isLoading,
    error,
    refetch,
  } = useQuery<ContentItem[], Error>({
    queryKey: ['games-content', gamesUniverse?.id],
    queryFn: async () => {
      if (!gamesUniverse?.id) throw new Error('Games universe not found');
      const result = await api.content.getContentByUniverse(gamesUniverse.id, 1, 20);
      if (result.success && result.data) {
        return Array.isArray(result.data) ? result.data : result.data.items || [];
      }
      throw new Error(result.message || 'Failed to load games.');
    },
    staleTime: 60000,
  });

  return (
    <PageShell activeNav="Games" maxWidth="7xl">
      {/* Featured game spotlight */}
      <section className="relative">
        {isLoading ? (
          <Skeleton height="400px" className="sm:h-[500px]" borderRadius="16px" />
        ) : error ? (
          <div className="h-[400px] sm:h-[500px] flex items-center justify-center">
            <motion.div
              className="text-center"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
            >
              <ErrorState
                title="Failed to load games"
                description={error.message}
                onButtonPress={() => refetch()}
              />
            </motion.div>
          </div>
        ) : games.length > 0 ? (
          <PageHero
            eyebrow="Games Universe"
            badge={games[0].contentType || 'Game'}
            title={games[0].title}
            subtitle={games[0].description}
            accentColor="var(--color-az-secondary-500)"
            glowColor="color-mix(in srgb, var(--color-az-secondary-500) 25%, transparent)"
            actions={
              <>
                <span className="az-overline rounded-az-pill bg-az-flame px-3 py-1 text-az-ink">
                  Premium
                </span>
                <Link href={`/watch/${games[0].id}`}>
                  <motion.button
                    type="button"
                    className="az-btn-primary az-btn-primary--inline"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Play Now
                  </motion.button>
                </Link>
                <Link href="/rankings">
                  <motion.button
                    type="button"
                    className="az-body-strong rounded-az-pill border border-az-ink/20 bg-az-ink/10 px-6 py-3 text-az-ink transition-all"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Leaderboard
                  </motion.button>
                </Link>
              </>
            }
          />
        ) : (
          <div className="h-[400px] sm:h-[500px] flex items-center justify-center">
            <p className="az-lead text-az-ink/60 sm:text-lg">No games available</p>
          </div>
        )}
      </section>

      {/* Games Grid */}
      <section className="py-2 sm:py-4">
        <ScrollReveal>
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <div>
              <h2 className="az-section-title text-az-ink">Featured Games</h2>
              <p className="az-body mt-1 text-az-ink-muted">Play and earn rewards</p>
            </div>
          </div>
        </ScrollReveal>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={`game-skeleton-${i}`} className="az-glass overflow-hidden">
                <Skeleton height="208px" className="sm:h-[240px]" borderRadius="0px" />
                <div className="p-4 space-y-3">
                  <Skeleton height="20px" width="75%" />
                  <Skeleton height="16px" width="50%" />
                </div>
              </div>
            ))}
          </div>
        ) : games.length > 0 ? (
          <StaggerGrid className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {games.map((game) => (
              <Link key={game.id} href={`/watch/${game.id}`}>
                <GlowCard universe="games" className="overflow-hidden">
                  <div className="relative">
                    <OptimizedImage
                      src={game.thumbnail}
                      alt={game.title}
                      width={400}
                      height={192}
                      className="w-full h-44 sm:h-48 object-cover"
                    />
                    <span className="az-overline absolute top-2 right-2 rounded-az-pill bg-az-flame px-2.5 py-0.5 text-az-ink">
                      Premium
                    </span>
                    <div className="absolute inset-0 az-scrim" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <span className="az-caption mb-2 inline-block rounded-az-pill bg-az-secondary-500/20 px-2.5 py-0.5 text-az-secondary-400">
                        {game.contentType || 'Game'}
                      </span>
                      <h3 className="az-title text-az-ink">{game.title}</h3>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="az-body mb-3 line-clamp-2 text-az-ink-muted">
                      {game.description}
                    </p>
                    <motion.button
                      type="button"
                      className="az-btn-primary"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Play Now
                    </motion.button>
                  </div>
                </GlowCard>
              </Link>
            ))}
          </StaggerGrid>
        ) : (
          <div className="text-center py-10 sm:py-12">
            <p className="az-lead text-az-ink-muted sm:text-lg">No games available yet</p>
          </div>
        )}
      </section>
    </PageShell>
  );
}

const LazyGamesPage = lazy(() => Promise.resolve({ default: GamesPageContent }));

export default function GamesPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-az-surface-root">
          <p className="az-lead text-az-ink-muted">Loading...</p>
        </div>
      }
    >
      <LazyGamesPage />
    </Suspense>
  );
}
