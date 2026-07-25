'use client';
import { Suspense, lazy, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
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
    <div className="min-h-screen" style={{ backgroundColor: '#1A0A0A' }}>
      <AppHeader active="Games" />

      {isLoading ? (
        <>
          <Skeleton height="400px" borderRadius="0" className="sm:h-[500px]" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <Skeleton height="32px" width="200px" className="mb-4" />
            <Skeleton height="20px" width="300px" className="mb-8" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
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
        <div
          className="flex items-center justify-center"
          style={{ minHeight: 'calc(100vh - 200px)' }}
        >
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
            <div className="relative h-[400px] sm:h-[500px]">
              <OptimizedImage
                src={game.banner || game.thumbnail}
                alt={game.title}
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1A0A0A] via-[#1A0A0A]/50 to-transparent" />
              <AmbientGlow color="rgba(139,92,246,0.25)" size={500} className="bottom-0 right-0" />

              <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8 max-w-7xl mx-auto">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className="px-3 py-1 rounded-full text-xs font-semibold"
                      style={{ backgroundColor: 'rgba(139,92,246,0.2)', color: '#A78BFA' }}
                    >
                      {game.category}
                    </span>
                    <span
                      className="px-3 py-1 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        color: 'rgba(255,255,255,0.6)',
                      }}
                    >
                      {game.difficulty}
                    </span>
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">{game.title}</h1>
                  <div className="flex items-center gap-4 text-sm text-white/60 mb-4">
                    <span>
                      ⭐ {game.rating.toFixed(1)} ({game.totalRatings} ratings)
                    </span>
                    <span>·</span>
                    <span>{game.estimatedTime}</span>
                    <span>·</span>
                    <span>{game.currentPlayers} playing now</span>
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <Link href={`/watch/${game.id}`}>
                      <motion.button
                        type="button"
                        className="az-btn-primary"
                        style={{ width: 'auto', paddingInline: '2rem' }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Play Now
                      </motion.button>
                    </Link>
                    <Link href="/games/leaderboard">
                      <motion.button
                        type="button"
                        className="px-6 py-3 rounded-full text-sm font-semibold text-white transition-all"
                        style={{
                          border: '1px solid rgba(255,255,255,0.2)',
                          backgroundColor: 'rgba(255,255,255,0.08)',
                        }}
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
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <ScrollReveal>
                  <h2 className="text-2xl font-bold text-white mb-4">About This Game</h2>
                </ScrollReveal>
                <p className="text-white/70 leading-relaxed mb-8">{game.description}</p>

                {game.features.length > 0 && (
                  <>
                    <ScrollReveal>
                      <h3 className="text-xl font-bold text-white mb-4">Features</h3>
                    </ScrollReveal>
                    <ul className="space-y-3 mb-8">
                      {game.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <span style={{ color: '#22C55E' }}>✓</span>
                          <span className="text-white/70">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}

                {game.howToPlay.length > 0 && (
                  <>
                    <ScrollReveal>
                      <h3 className="text-xl font-bold text-white mb-4">How to Play</h3>
                    </ScrollReveal>
                    <ol className="space-y-3 mb-8">
                      {game.howToPlay.map((step, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <span
                            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                            style={{ backgroundColor: '#E8420A', color: '#fff' }}
                          >
                            {index + 1}
                          </span>
                          <span className="text-white/70">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </>
                )}
              </div>

              {/* Sidebar */}
              <div>
                <GlowCard universe="games" className="p-6 sticky top-24">
                  <h3 className="text-lg font-bold text-white mb-4">Game Info</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-white/50">Category</span>
                      <span className="text-white font-medium">{game.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/50">Difficulty</span>
                      <span className="text-white font-medium">{game.difficulty}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/50">Est. Time</span>
                      <span className="text-white font-medium">{game.estimatedTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/50">Max Players</span>
                      <span className="text-white font-medium">{game.maxPlayers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/50">Rating</span>
                      <span className="text-white font-medium">⭐ {game.rating.toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/50">Now Playing</span>
                      <span className="text-white font-medium">{game.currentPlayers}</span>
                    </div>
                  </div>
                  <div
                    className="mt-6 pt-6"
                    style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    <Link href={`/watch/${game.id}`}>
                      <motion.button
                        type="button"
                        className="az-btn-primary w-full"
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
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
              <ScrollReveal>
                <h2 className="text-2xl font-bold text-white mb-6">Related Games</h2>
              </ScrollReveal>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {game.relatedGames.map((related) => (
                  <Link key={related.id} href={`/games/${related.id}`}>
                    <div className="az-glass overflow-hidden rounded-xl">
                      <OptimizedImage
                        src={related.thumbnail}
                        alt={related.title}
                        width={300}
                        height={150}
                        className="w-full h-32 object-cover"
                      />
                      <div className="p-3">
                        <h4 className="text-sm font-semibold text-white truncate">
                          {related.title}
                        </h4>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </>
      ) : null}

      <AppFooter />
    </div>
  );
}

const LazyGameDetailPage = lazy(() => Promise.resolve({ default: GameDetailPageContent }));

export default function GameDetailPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#1A0A0A]">
          <p className="text-white/50 text-lg">Loading...</p>
        </div>
      }
    >
      <LazyGameDetailPage />
    </Suspense>
  );
}
