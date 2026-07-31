'use client';
import { Suspense, lazy, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { GlowCard } from '@/components/motion/GlowCard';
import analytics from '@/lib/analytics';

interface PlayerStats {
  totalGamesPlayed: number;
  totalScore: number;
  averageScore: number;
  winRate: number;
  currentStreak: number;
  longestStreak: number;
  rank: number;
  totalPlayers: number;
  achievements: Achievement[];
  recentGames: RecentGame[];
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface RecentGame {
  id: string;
  gameType: string;
  score: number;
  result: 'win' | 'loss' | 'draw';
  playedAt: string;
  opponent?: string;
}

const RARITY_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  common: { bg: 'rgba(156,163,175,0.15)', text: '#9CA3AF', border: 'rgba(156,163,175,0.3)' },
  rare: {
    bg: 'rgba(59,130,246,0.15)',
    text: 'var(--color-secondary-400)',
    border: 'rgba(59,130,246,0.3)',
  },
  epic: { bg: 'rgba(168,85,247,0.15)', text: '#C084FC', border: 'rgba(168,85,247,0.3)' },
  legendary: {
    bg: 'rgba(234,179,8,0.15)',
    text: 'var(--color-warning-400)',
    border: 'rgba(234,179,8,0.3)',
  },
};

const RESULT_STYLES: Record<string, { bg: string; text: string }> = {
  win: { bg: 'rgba(34,197,94,0.15)', text: 'var(--color-success-500)' },
  loss: { bg: 'rgba(239,68,68,0.15)', text: 'var(--color-error-500)' },
  draw: { bg: 'rgba(156,163,175,0.15)', text: '#9CA3AF' },
};

function StatsPageContent(): React.JSX.Element {
  useEffect(() => {
    analytics.pageView('games-stats');
  }, []);

  const statsQuery = useQuery({
    queryKey: ['player-stats'],
    queryFn: async () => {
      const res = await apiFetch<PlayerStats>('/api/v1/games/stats');
      if (res.success && res.data) return res.data;
      throw new Error(res.message || 'Failed to load player stats');
    },
    staleTime: 60000,
  });

  const stats = statsQuery.data ?? null;
  const isLoading = statsQuery.isLoading;
  const error = statsQuery.error?.message;

  const statCards = stats
    ? [
        { label: 'Total Games', value: stats.totalGamesPlayed, icon: '🎮' },
        { label: 'Total Score', value: stats.totalScore.toLocaleString(), icon: '⭐' },
        { label: 'Win Rate', value: `${stats.winRate}%`, icon: '🏆' },
        { label: 'Current Streak', value: stats.currentStreak, icon: '🔥' },
        { label: 'Best Streak', value: stats.longestStreak, icon: '💎' },
        {
          label: 'Global Rank',
          value: `#${stats.rank}`,
          subtext: `of ${stats.totalPlayers.toLocaleString()}`,
          icon: '📊',
        },
      ]
    : [];

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--brand-near-black)' }}>
      <AppHeader active="Games" />

      {/* Hero */}
      <section
        className="relative py-16 sm:py-20"
        style={{ background: 'linear-gradient(135deg, #22C55E 0%, #1A0A0A 100%)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1
            className="text-4xl sm:text-5xl font-bold text-white mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            📊 Player Stats
          </motion.h1>
          <motion.p
            className="text-xl text-white/80 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            Your gaming performance overview
          </motion.p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="az-glass p-5 rounded-xl">
                <Skeleton height="20px" width="40px" className="mb-3" />
                <Skeleton height="28px" width="80px" />
                <Skeleton height="14px" width="60px" className="mt-2" />
              </div>
            ))}
          </div>
        ) : error ? (
          <ErrorState
            title="Failed to load stats"
            description={error}
            onButtonPress={() => statsQuery.refetch()}
          />
        ) : stats ? (
          <>
            {/* Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
              {statCards.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08 }}
                >
                  <GlowCard universe="games" className="p-5 text-center">
                    <span className="text-2xl mb-2 block">{stat.icon}</span>
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                    <p className="text-xs text-white/50 mt-1">{stat.label}</p>
                    {stat.subtext && <p className="text-xs text-white/30 mt-0.5">{stat.subtext}</p>}
                  </GlowCard>
                </motion.div>
              ))}
            </div>

            {/* Achievements */}
            {stats.achievements.length > 0 && (
              <ScrollReveal>
                <h2 className="text-2xl font-bold text-white mb-6">Achievements</h2>
              </ScrollReveal>
            )}
            {stats.achievements.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
                {stats.achievements.map((achievement, index) => {
                  const rarity = RARITY_STYLES[achievement.rarity] || RARITY_STYLES.common;

                  return (
                    <motion.div
                      key={achievement.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.05 }}
                      className="az-glass p-4 rounded-xl flex items-center gap-4"
                      style={{ border: `1px solid ${rarity.border}` }}
                    >
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                        style={{ backgroundColor: rarity.bg }}
                      >
                        {achievement.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-semibold truncate">{achievement.name}</h3>
                        <p className="text-xs text-white/50 truncate">{achievement.description}</p>
                        <p className="text-xs text-white/30 mt-1">
                          {new Date(achievement.unlockedAt).toLocaleDateString('en-NG', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full capitalize flex-shrink-0"
                        style={{ backgroundColor: rarity.bg, color: rarity.text }}
                      >
                        {achievement.rarity}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Recent Games */}
            {stats.recentGames.length > 0 && (
              <ScrollReveal>
                <h2 className="text-2xl font-bold text-white mb-6">Recent Games</h2>
              </ScrollReveal>
            )}
            {stats.recentGames.length > 0 && (
              <div className="space-y-3">
                {stats.recentGames.map((game, index) => {
                  const resultStyle = RESULT_STYLES[game.result] || RESULT_STYLES.draw;

                  return (
                    <motion.div
                      key={game.id}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.05 }}
                      className="az-glass p-4 rounded-xl flex items-center gap-4"
                      style={{ border: '1px solid rgba(255,255,255,0.06)' }}
                    >
                      <span
                        className="px-2.5 py-1 rounded-full text-xs font-semibold uppercase flex-shrink-0"
                        style={{ backgroundColor: resultStyle.bg, color: resultStyle.text }}
                      >
                        {game.result}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">{game.gameType}</p>
                        <p className="text-xs text-white/40">
                          {new Date(game.playedAt).toLocaleDateString('en-NG', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                          {game.opponent && ` vs ${game.opponent}`}
                        </p>
                      </div>
                      <p className="font-bold text-white flex-shrink-0">
                        {game.score.toLocaleString()} pts
                      </p>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20">
            <p className="text-4xl mb-4">🎮</p>
            <h2 className="text-xl font-bold text-white mb-2">No stats yet</h2>
            <p className="text-white/50 mb-6">Play some games to see your stats</p>
            <Link href="/games/trivia">
              <motion.button
                type="button"
                className="az-btn-primary px-8"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Play Trivia
              </motion.button>
            </Link>
          </div>
        )}
      </div>

      <AppFooter />
    </div>
  );
}

const LazyStatsPage = lazy(() => Promise.resolve({ default: StatsPageContent }));

export default function StatsPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#1A0A0A]">
          <p className="text-white/50 text-lg">Loading...</p>
        </div>
      }
    >
      <LazyStatsPage />
    </Suspense>
  );
}
