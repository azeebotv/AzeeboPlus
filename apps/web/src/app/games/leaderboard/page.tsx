'use client';
import { Suspense, lazy, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { GlowCard } from '@/components/motion/GlowCard';
import { OptimizedImage } from '@/components/OptimizedImage';
import { Trophy, Medal, Award } from 'lucide-react';
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

const RANK_STYLES: Record<number, { bg: string; text: string }> = {
  1: { bg: 'rgba(234,179,8,0.2)', text: '#FBBF24' },
  2: { bg: 'rgba(156,163,175,0.2)', text: '#E2E8F0' },
  3: { bg: 'rgba(217,119,6,0.2)', text: '#F59E0B' },
};

function RankIcon({ rank }: { rank: number }): React.JSX.Element {
  if (rank === 1) return <Trophy className="w-8 h-8 text-amber-400 mx-auto" />;
  if (rank === 2) return <Medal className="w-8 h-8 text-slate-300 mx-auto" />;
  return <Award className="w-8 h-8 text-amber-600 mx-auto" />;
}

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

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--brand-near-black)' }}>
      <AppHeader active="Games" logoVariant="light" />

      {/* Hero */}
      <section
        className="relative py-16 sm:py-20 overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, rgba(234,179,8,0.12) 0%, rgba(11,9,14,0.95) 100%)',
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 50% 0%, rgba(234,179,8,0.18), transparent 70%)',
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1
            className="text-4xl sm:text-5xl font-bold text-white mb-4 flex items-center justify-center gap-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Trophy className="w-10 h-10 text-amber-400" />
            <span>Leaderboard</span>
          </motion.h1>
          <motion.p
            className="text-xl text-white/80 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            Top players across all games
          </motion.p>
        </div>
      </section>

      {/* Time Frame Tabs */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-hide">
          {(Object.keys(TIME_FRAME_LABELS) as TimeFrame[]).map((tf) => (
            <motion.button
              key={tf}
              type="button"
              onClick={() => setTimeFrame(tf)}
              className="whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all"
              style={{
                backgroundColor:
                  timeFrame === tf ? 'var(--brand-orange)' : 'rgba(255,255,255,0.05)',
                color: timeFrame === tf ? 'white' : 'rgba(255,255,255,0.6)',
                border: `1px solid ${timeFrame === tf ? 'var(--brand-orange)' : 'rgba(255,255,255,0.1)'}`,
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {TIME_FRAME_LABELS[tf]}
            </motion.button>
          ))}
        </div>
      </section>

      {/* Top 3 Podium */}
      {!isLoading && top3.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {top3.map((entry, index) => {
              const rankStyle = RANK_STYLES[entry.rank] || RANK_STYLES[1];
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
                    <div className="mb-3">
                      <RankIcon rank={entry.rank} />
                    </div>
                    <div
                      className="w-16 h-16 mx-auto mb-3 rounded-full overflow-hidden"
                      style={{ border: `2px solid ${rankStyle.text}` }}
                    >
                      {entry.avatar ? (
                        <OptimizedImage
                          src={entry.avatar}
                          alt={entry.username}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center"
                          style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                        >
                          <span className="text-xl font-bold text-white/60">
                            {entry.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1">{entry.username}</h3>
                    <p className="text-2xl font-bold mb-3" style={{ color: rankStyle.text }}>
                      {entry.score.toLocaleString()} pts
                    </p>
                    <div className="flex items-center justify-center gap-4 text-xs text-white/40">
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
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-12">
        <ScrollReveal>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6 sm:mb-8">Rankings</h2>
        </ScrollReveal>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="az-glass p-4 rounded-xl flex items-center gap-4">
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
            {rest.map((entry, index) => {
              const rankStyle = RANK_STYLES[entry.rank];

              return (
                <motion.div
                  key={entry.userId}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.03 }}
                  className="az-glass p-4 rounded-xl flex items-center gap-4"
                  style={{ border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <span
                    className="w-10 text-center font-bold text-lg"
                    style={{ color: rankStyle?.text || 'rgba(255,255,255,0.4)' }}
                  >
                    #{entry.rank}
                  </span>
                  <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                    {entry.avatar ? (
                      <OptimizedImage
                        src={entry.avatar}
                        alt={entry.username}
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center"
                        style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                      >
                        <span className="text-sm font-bold text-white/60">
                          {entry.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold truncate">{entry.username}</p>
                    <p className="text-xs text-white/40">
                      {entry.gamesPlayed} games · {entry.winRate}% win
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold" style={{ color: 'var(--brand-orange)' }}>
                      {entry.score.toLocaleString()}
                    </p>
                    <p className="text-xs text-white/40">pts</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-lg text-white/50">No leaderboard data for this period</p>
          </div>
        )}
      </section>

      {/* Play Link */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="az-glass p-6 rounded-xl text-center">
          <p className="text-white/50 mb-3">Want to climb the ranks?</p>
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
      </section>

      <AppFooter logoVariant="light" />
    </div>
  );
}

const LazyLeaderboardPage = lazy(() => Promise.resolve({ default: LeaderboardPageContent }));

export default function LeaderboardPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--brand-near-black)]">
          <p className="text-white/50 text-lg">Loading...</p>
        </div>
      }
    >
      <LazyLeaderboardPage />
    </Suspense>
  );
}
