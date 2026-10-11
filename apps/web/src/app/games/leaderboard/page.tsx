'use client';
import { Suspense, lazy, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import PageShell from '@/components/layout/PageShell';
import PageHero from '@/components/layout/PageHero';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { GlowCard } from '@/components/motion/GlowCard';
import { OptimizedImage } from '@/components/OptimizedImage';
import { Award, Medal, Trophy, type LucideIcon } from 'lucide-react';
import analytics from '@/lib/analytics';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatar?: string;
  score: number;
  gamesPlayed: number;
  winRate: number;
  streak: number;
}

type TimeFrame = 'daily' | 'weekly' | 'monthly' | 'all-time';

const TIME_FRAME_LABELS: Record<TimeFrame, string> = {
  daily: 'Today',
  weekly: 'This Week',
  monthly: 'This Month',
  'all-time': 'All Time',
};

/* Podium places are reward ranks, not statuses, so they keep the categorical
   metallic ramp the tipping tiers use instead of the semantic colour set. */
const MEDALS: Record<number, { ring: string; tone: string; icon: LucideIcon }> = {
  1: { ring: 'border-[var(--brand-gold)]', tone: 'text-[var(--brand-gold)]', icon: Trophy },
  2: {
    ring: 'border-[var(--color-az-accent-silver)]',
    tone: 'text-[var(--color-az-accent-silver)]',
    icon: Medal,
  },
  3: {
    ring: 'border-[var(--color-az-accent-bronze)]',
    tone: 'text-[var(--color-az-accent-bronze)]',
    icon: Award,
  },
};

function LeaderboardPageContent(): React.JSX.Element {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('weekly');

  useEffect(() => {
    analytics.pageView('games-leaderboard');
  }, []);

  const leaderboardQuery = useQuery({
    queryKey: ['leaderboard', 'games', timeFrame],
    queryFn: async () => {
      const res = await apiFetch<LeaderboardEntry[]>(
        `/api/v1/games/leaderboard?timeFrame=${timeFrame}&limit=50`
      );
      if (res.success && res.data) return res.data;
      throw new Error(res.message || 'Failed to load leaderboard');
    },
    staleTime: 60000,
  });

  const entries: LeaderboardEntry[] = leaderboardQuery.data ?? [];
  const isLoading = leaderboardQuery.isLoading;
  const error = leaderboardQuery.error?.message;
  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);

  const tabs = (Object.keys(TIME_FRAME_LABELS) as TimeFrame[]).map((tf) => {
    const selected = timeFrame === tf;
    return (
      <motion.button
        key={tf}
        type="button"
        onClick={() => setTimeFrame(tf)}
        aria-pressed={selected}
        className={`az-body-strong shrink-0 whitespace-nowrap rounded-az-pill border px-4 py-2 transition-all ${
          selected
            ? 'border-az-flame bg-az-scarlet/20 text-az-ink'
            : 'border-az-glass-border bg-az-glass-fill text-az-ink-muted hover:border-az-glass-border-hover'
        }`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {TIME_FRAME_LABELS[tf]}
      </motion.button>
    );
  });

  return (
    <PageShell activeNav="Games" maxWidth="7xl">
      <PageHero
        eyebrow="Games"
        title="Leaderboard"
        subtitle="Top players across all games"
        actions={<div className="flex items-center gap-2 overflow-x-auto">{tabs}</div>}
        glowColor="color-mix(in srgb, var(--color-az-warning-500) 18%, transparent)"
      />

      {/* Top 3 Podium */}
      {!isLoading && top3.length > 0 && (
        <section className="pb-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {top3.map((entry, index) => {
              const medal = MEDALS[entry.rank] ?? MEDALS[1];
              const RankIcon = medal.icon;
              const isSecond = entry.rank === 2;

              return (
                <motion.div
                  key={entry.userId}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.15 }}
                  className={isSecond ? 'sm:order-first' : ''}
                >
                  <GlowCard universe="games" className="p-6 text-center">
                    <RankIcon size={32} className={`mx-auto mb-3 ${medal.tone}`} aria-hidden />
                    <div
                      className={`mx-auto mb-3 size-16 overflow-hidden rounded-full border-2 ${medal.ring}`}
                    >
                      {entry.avatar ? (
                        <OptimizedImage
                          src={entry.avatar}
                          alt={entry.username}
                          width={64}
                          height={64}
                          className="size-full object-cover"
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center bg-az-ink/10">
                          <span className="az-title font-bold text-az-ink/60">
                            {entry.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    <h3 className="az-title mb-1 text-az-ink">{entry.username}</h3>
                    <p className={`az-subtitle mb-3 ${medal.tone}`}>
                      {entry.score.toLocaleString()} pts
                    </p>
                    <div className="az-caption flex items-center justify-center gap-4 text-az-ink/40">
                      <span>{entry.gamesPlayed} games</span>
                      <span>{entry.winRate}% win</span>
                      <span>{entry.streak} streak</span>
                    </div>
                  </GlowCard>
                </motion.div>
              );
            })}
          </div>
        </section>
      )}

      {/* Full Leaderboard */}
      <section className="py-6 sm:py-8">
        <ScrollReveal>
          <h2 className="az-section-title mb-6 text-az-ink sm:mb-8">Rankings</h2>
        </ScrollReveal>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="az-glass flex items-center gap-4 p-4">
                <Skeleton height="24px" width="40px" borderRadius="0.25rem" />
                <Skeleton height="40px" width="40px" borderRadius="50%" />
                <div className="flex-1 space-y-2">
                  <Skeleton height="16px" width="120px" />
                  <Skeleton height="12px" width="80px" />
                </div>
                <Skeleton height="16px" width="60px" />
              </div>
            ))}
          </div>
        ) : error ? (
          <ErrorState
            title="Failed to load leaderboard"
            description={error}
            onButtonPress={() => leaderboardQuery.refetch()}
          />
        ) : rest.length > 0 ? (
          <div className="space-y-3">
            {rest.map((entry, index) => (
              <motion.div
                key={entry.userId}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.03 }}
                className="az-glass flex items-center gap-4 p-4"
              >
                <span className="az-title w-10 shrink-0 text-center text-az-ink/40">
                  #{entry.rank}
                </span>
                <div className="size-10 shrink-0 overflow-hidden rounded-full">
                  {entry.avatar ? (
                    <OptimizedImage
                      src={entry.avatar}
                      alt={entry.username}
                      width={40}
                      height={40}
                      className="size-full object-cover"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center bg-az-ink/10">
                      <span className="az-body-strong text-az-ink/60">
                        {entry.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="az-body-strong truncate text-az-ink">{entry.username}</p>
                  <p className="az-caption text-az-ink/40">
                    {entry.gamesPlayed} games · {entry.winRate}% win
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="az-body-strong text-az-flame">{entry.score.toLocaleString()}</p>
                  <p className="az-caption text-az-ink/40">pts</p>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="az-glass p-12 text-center">
            <Trophy size={40} className="mx-auto mb-4 text-az-flame" aria-hidden />
            <p className="az-subtitle mb-1 text-az-ink">No rankings yet</p>
            <p className="az-body text-az-ink-muted">
              No leaderboard data for this period — play a game to get on the board.
            </p>
          </div>
        )}
      </section>

      {/* Play Link */}
      <section className="pb-4">
        <div className="az-glass p-6 text-center">
          <p className="az-body mb-3 text-az-ink-muted">Want to climb the ranks?</p>
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
      </section>
    </PageShell>
  );
}

const LazyLeaderboardPage = lazy(() => Promise.resolve({ default: LeaderboardPageContent }));

export default function LeaderboardPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-az-surface-root">
          <p className="az-lead text-az-ink-muted">Loading...</p>
        </div>
      }
    >
      <LazyLeaderboardPage />
    </Suspense>
  );
}
