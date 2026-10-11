'use client';
import { Suspense, lazy, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import PageShell from '@/components/layout/PageShell';
import { OptimizedImage } from '@/components/OptimizedImage';
import { AmbientGlow } from '@/components/motion/AmbientGlow';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { GlowCard } from '@/components/motion/GlowCard';
import analytics from '@/lib/analytics';

interface GameDetail {
  id: string;
  slug: string;
  title: string;
  description: string;
  thumbnail: string;
  banner?: string;
  category: string;
  difficulty: string;
  estimatedTime: string;
  maxPlayers: number;
  currentPlayers: number;
  rating: number;
  totalRatings: number;
  features: string[];
  howToPlay: string[];
  relatedGames: { id: string; title: string; thumbnail: string }[];
}

function GameDetailPageContent(): React.JSX.Element {
  const params = useParams();
  const slug = params.slug as string;

  useEffect(() => {
    analytics.pageView('games-detail', { slug });
  }, [slug]);

  const gameQuery = useQuery({
    queryKey: ['game-detail', slug],
    queryFn: async () => {
      const res = await apiFetch<GameDetail>(`/api/v1/games/${slug}`);
      if (res.success && res.data) return res.data;
      throw new Error(res.message || 'Failed to load game details');
    },
    staleTime: 60000,
    enabled: !!slug,
  });

  const game = gameQuery.data ?? null;
  const isLoading = gameQuery.isLoading;
  const error = gameQuery.error?.message;

  return (
    <PageShell activeNav="Games" maxWidth="7xl">
      {isLoading ? (
        <>
          <Skeleton height="400px" borderRadius="16px" className="sm:h-[500px]" />
          <div className="py-10">
            <Skeleton height="32px" width="200px" className="mb-4" />
            <Skeleton height="20px" width="300px" className="mb-8" />
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              <div className="space-y-4 lg:col-span-2">
                <Skeleton height="16px" width="100%" />
                <Skeleton height="16px" width="90%" />
                <Skeleton height="16px" width="80%" />
              </div>
              <div>
                <Skeleton height="200px" borderRadius="0.5rem" />
              </div>
            </div>
          </div>
        </>
      ) : error ? (
        <div className="flex min-h-[calc(100vh-200px)] items-center justify-center">
          <ErrorState
            title="Failed to load game"
            description={error}
            onButtonPress={() => gameQuery.refetch()}
          />
        </div>
      ) : game ? (
        <>
          {/* Banner */}
          <section className="relative">
            <div className="relative h-[400px] overflow-hidden rounded-az-panel sm:h-[500px]">
              <OptimizedImage
                src={game.banner || game.thumbnail}
                alt={game.title}
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 az-scrim--hero" />
              <AmbientGlow
                color="color-mix(in srgb, var(--brand-purple) 25%, transparent)"
                size={500}
                className="bottom-0 right-0"
              />

              <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="mb-3 flex items-center gap-2">
                    <span className="az-overline rounded-az-pill bg-[var(--brand-purple)]/20 px-3 py-1 text-[var(--brand-purple)]">
                      {game.category}
                    </span>
                    <span className="az-caption rounded-az-pill bg-az-ink/10 px-3 py-1 text-az-ink/60">
                      {game.difficulty}
                    </span>
                  </div>
                  <h1 className="az-heading mb-2 text-az-ink sm:az-display">{game.title}</h1>
                  <div className="az-body mb-4 flex items-center gap-4 text-az-ink/60">
                    <span>
                      {game.rating.toFixed(1)} ({game.totalRatings} ratings)
                    </span>
                    <span>·</span>
                    <span>{game.estimatedTime}</span>
                    <span>·</span>
                    <span>{game.currentPlayers} playing now</span>
                  </div>
                  <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                    <Link href={`/watch/${game.id}`}>
                      <motion.button
                        type="button"
                        className="az-btn-primary az-btn-primary--inline"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Play Now
                      </motion.button>
                    </Link>
                    <Link href="/games/leaderboard">
                      <motion.button
                        type="button"
                        className="az-body-strong rounded-az-pill border border-az-ink/20 bg-az-ink/10 px-6 py-3 text-az-ink transition-all"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Leaderboard
                      </motion.button>
                    </Link>
                  </div>
                </motion.div>
              </div>
            </div>
          </section>

          {/* Content */}
          <section className="py-10 sm:py-12">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <ScrollReveal>
                  <h2 className="az-section-title mb-4 text-az-ink">About This Game</h2>
                </ScrollReveal>
                <p className="az-lead mb-8 leading-relaxed text-az-ink/70">{game.description}</p>

                {game.features.length > 0 && (
                  <>
                    <ScrollReveal>
                      <h3 className="az-title mb-4 text-az-ink">Features</h3>
                    </ScrollReveal>
                    <ul className="mb-8 space-y-3">
                      {game.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-3">
                          {/* Placeholder slot — currently empty (no icon glyph shipped);
                              kept in the DOM so the list layout matches production. */}
                          <span className="text-az-success-500" aria-hidden="true"></span>
                          <span className="az-body text-az-ink/70">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}

                {game.howToPlay.length > 0 && (
                  <>
                    <ScrollReveal>
                      <h3 className="az-title mb-4 text-az-ink">How to Play</h3>
                    </ScrollReveal>
                    <ol className="mb-8 space-y-3">
                      {game.howToPlay.map((step, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <span className="az-overline flex size-6 flex-shrink-0 items-center justify-center rounded-full bg-az-flame text-az-ink">
                            {index + 1}
                          </span>
                          <span className="az-body text-az-ink/70">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </>
                )}
              </div>

              {/* Sidebar */}
              <div>
                <GlowCard universe="games" className="sticky top-24 p-6">
                  <h3 className="az-title mb-4 text-az-ink">Game Info</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="az-body text-az-ink/50">Category</span>
                      <span className="az-body-strong text-az-ink">{game.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="az-body text-az-ink/50">Difficulty</span>
                      <span className="az-body-strong text-az-ink">{game.difficulty}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="az-body text-az-ink/50">Est. Time</span>
                      <span className="az-body-strong text-az-ink">{game.estimatedTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="az-body text-az-ink/50">Max Players</span>
                      <span className="az-body-strong text-az-ink">{game.maxPlayers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="az-body text-az-ink/50">Rating</span>
                      <span className="az-body-strong text-az-ink">{game.rating.toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="az-body text-az-ink/50">Now Playing</span>
                      <span className="az-body-strong text-az-ink">{game.currentPlayers}</span>
                    </div>
                  </div>
                  <div className="mt-6 border-t border-az-ink/10 pt-6">
                    <Link href={`/watch/${game.id}`}>
                      <motion.button
                        type="button"
                        className="az-btn-primary"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Play Now
                      </motion.button>
                    </Link>
                  </div>
                </GlowCard>
              </div>
            </div>
          </section>

          {/* Related Games */}
          {game.relatedGames.length > 0 && (
            <section className="py-10">
              <ScrollReveal>
                <h2 className="az-section-title mb-6 text-az-ink">Related Games</h2>
              </ScrollReveal>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {game.relatedGames.map((related) => (
                  <Link key={related.id} href={`/games/${related.id}`}>
                    <div className="az-glass overflow-hidden">
                      <OptimizedImage
                        src={related.thumbnail}
                        alt={related.title}
                        width={300}
                        height={150}
                        className="h-32 w-full object-cover"
                      />
                      <div className="p-3">
                        <h4 className="az-body-strong truncate text-az-ink">{related.title}</h4>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </>
      ) : null}
    </PageShell>
  );
}

const LazyGameDetailPage = lazy(() => Promise.resolve({ default: GameDetailPageContent }));

export default function GameDetailPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-az-surface-root">
          <p className="az-lead text-az-ink-muted">Loading...</p>
        </div>
      }
    >
      <LazyGameDetailPage />
    </Suspense>
  );
}
