'use client';
import { Suspense, lazy, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import PageShell from '@/components/layout/PageShell';
import PageHero from '@/components/layout/PageHero';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { GlowCard } from '@/components/motion/GlowCard';
import { Gamepad2, Star, Trophy, Flame, Gem, BarChart3, Award, Sparkles } from 'lucide-react';
import analytics from '@/lib/analytics';

function getStatIcon(name: string): React.JSX.Element {
  switch (name) {
    case 'Gamepad2':
      return <Gamepad2 className="w-6 h-6 text-az-success-400 mx-auto" />;
    case 'Star':
      return <Star className="w-6 h-6 text-az-warning-400 mx-auto" />;
    case 'Trophy':
      return <Trophy className="w-6 h-6 text-az-warning-400 mx-auto" />;
    case 'Flame':
      return <Flame className="w-6 h-6 text-az-flame mx-auto" />;
    case 'Gem':
      return <Gem className="w-6 h-6 text-az-category-violet-light mx-auto" />;
    case 'BarChart3':
      return <BarChart3 className="w-6 h-6 text-az-secondary-400 mx-auto" />;
    default:
      return <Sparkles className="w-6 h-6 text-az-ink/60 mx-auto" />;
  }
}

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

/* Rarity is a categorical reward ramp (like the leaderboard podium metals),
   not a semantic status: grey is the ink layer, violet a registered category
   hue, and only the blue/gold rungs borrow a state token because they are
   hex-identical to it. */
const RARITY_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  common: {
    bg: 'bg-az-ink-muted/15',
    text: 'text-az-ink-muted',
    border: 'border-az-ink-muted/30',
  },
  rare: {
    bg: 'bg-az-secondary-500/15',
    text: 'text-az-secondary-400',
    border: 'border-az-secondary-500/30',
  },
  epic: {
    bg: 'bg-az-category-violet/15',
    text: 'text-az-category-violet-light',
    border: 'border-az-category-violet/30',
  },
  legendary: {
    bg: 'bg-az-warning-500/15',
    text: 'text-az-warning-400',
    border: 'border-az-warning-500/30',
  },
};

const RESULT_STYLES: Record<string, { bg: string; text: string }> = {
  win: {
    bg: 'bg-az-success-500/15',
    text: 'text-az-success-500',
  },
  loss: {
    bg: 'bg-az-error-500/15',
    text: 'text-az-error-500',
  },
  draw: { bg: 'bg-az-ink-muted/15', text: 'text-az-ink-muted' },
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
        { label: 'Total Games', value: stats.totalGamesPlayed, icon: 'Gamepad2' },
        { label: 'Total Score', value: stats.totalScore.toLocaleString(), icon: 'Star' },
        { label: 'Win Rate', value: `${stats.winRate}%`, icon: 'Trophy' },
        { label: 'Current Streak', value: stats.currentStreak, icon: 'Flame' },
        { label: 'Best Streak', value: stats.longestStreak, icon: 'Gem' },
        {
          label: 'Global Rank',
          value: `#${stats.rank}`,
          subtext: `of ${stats.totalPlayers.toLocaleString()}`,
          icon: 'BarChart3',
        },
      ]
    : [];

  return (
    <PageShell
      activeNav="Games"
      maxWidth="7xl"
      glowColor="color-mix(in srgb, var(--color-az-success-500) 18%, transparent)"
    >
      {/* Hero */}
      <PageHero
        eyebrow="Games Universe"
        title="Player Stats"
        subtitle="Your gaming performance overview"
        glowColor="color-mix(in srgb, var(--color-az-success-500) 18%, transparent)"
        actions={
          <span
            aria-hidden="true"
            className="az-chip hidden items-center justify-center px-4 py-3 text-az-success-400 sm:inline-flex"
          >
            <BarChart3 size={24} />
          </span>
        }
      />

      <div>
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="az-glass p-5">
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
                    <div className="mb-2">{getStatIcon(stat.icon)}</div>
                    <p className="az-title text-az-ink">{stat.value}</p>
                    <p className="az-caption mt-1 text-az-ink-muted">{stat.label}</p>
                    {stat.subtext && (
                      <p className="az-micro-label mt-0.5 text-az-ink/30">{stat.subtext}</p>
                    )}
                  </GlowCard>
                </motion.div>
              ))}
            </div>

            {/* Achievements */}
            {stats.achievements.length > 0 && (
              <ScrollReveal>
                <h2 className="az-section-title mb-6 text-az-ink">Achievements</h2>
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
                      className={`flex items-center gap-4 rounded-az-feature border bg-az-glass-card p-4 ${rarity.border}`}
                    >
                      <div
                        className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${rarity.bg}`}
                      >
                        <Award className={`h-6 w-6 ${rarity.text}`} aria-hidden />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="az-body-strong truncate text-az-ink">{achievement.name}</h3>
                        <p className="az-caption truncate text-az-ink/50">
                          {achievement.description}
                        </p>
                        <p className="az-caption mt-1 text-az-ink/30">
                          {new Date(achievement.unlockedAt).toLocaleDateString('en-NG', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                      <span
                        className={`az-caption flex-shrink-0 rounded-az-pill px-2 py-0.5 capitalize ${rarity.bg} ${rarity.text}`}
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
                <h2 className="az-section-title mb-6 text-az-ink">Recent Games</h2>
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
                      className="flex items-center gap-4 rounded-az-feature border border-az-ink/10 bg-az-glass-card p-4"
                    >
                      <span
                        className={`az-overline flex-shrink-0 rounded-full px-2.5 py-1 ${resultStyle.bg} ${resultStyle.text}`}
                      >
                        {game.result}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="az-body-strong truncate text-az-ink">{game.gameType}</p>
                        <p className="az-caption text-az-ink/40">
                          {new Date(game.playedAt).toLocaleDateString('en-NG', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                          {game.opponent && ` vs ${game.opponent}`}
                        </p>
                      </div>
                      <p className="az-subtitle flex-shrink-0 text-az-ink">
                        {game.score.toLocaleString()} pts
                      </p>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <div className="py-20 text-center">
            <Trophy size={40} className="mx-auto mb-4 text-az-flame" aria-hidden />
            <h2 className="az-subtitle mb-2 text-az-ink">No stats yet</h2>
            <p className="az-body mb-6 text-az-ink-muted">Play some games to see your stats</p>
            <Link href="/games/trivia">
              <motion.button
                type="button"
                className="az-btn-primary az-btn-primary--inline"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Play Trivia
              </motion.button>
            </Link>
          </div>
        )}
      </div>
    </PageShell>
  );
}

const LazyStatsPage = lazy(() => Promise.resolve({ default: StatsPageContent }));

export default function StatsPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-az-surface-root">
          <p className="az-lead text-az-ink-muted">Loading...</p>
        </div>
      }
    >
      <LazyStatsPage />
    </Suspense>
  );
}
