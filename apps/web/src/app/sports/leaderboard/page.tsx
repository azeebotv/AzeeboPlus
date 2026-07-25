'use client';
import { Suspense, lazy, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { GlowCard } from '@/components/motion/GlowCard';
import analytics from '@/lib/analytics';

interface LeaderboardEntry {
  id: string;
  rank: number;
  name: string;
  avatar?: string;
  points: number;
  wins: number;
  losses: number;
  streak: number;
}

function LeaderboardPageContent(): React.JSX.Element {
  useEffect(() => {
    analytics.pageView('sports-leaderboard');
  }, []);

  const leaderboardQuery = useQuery({
    queryKey: ['sports-leaderboard'],
    queryFn: async () => {
      const res = await api.request<LeaderboardEntry[]>('/api/v1/sports/leaderboard');
      if (res.success && res.data) return res.data;
      throw new Error(res.message || 'Failed to load leaderboard');
    },
    staleTime: 60000,
  });

  const leaderboard: LeaderboardEntry[] = leaderboardQuery.data ?? [];
  const isLoading = leaderboardQuery.isLoading;
  const error = leaderboardQuery.error?.message;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#1A0A0A' }}>
      <AppHeader active="Sports" />

      <section
        className="relative py-16 sm:py-20"
        style={{ background: 'linear-gradient(135deg, #0D3B2E, #E8420A)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1
            className="text-4xl sm:text-5xl font-bold text-white mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Leaderboard
          </motion.h1>
          <motion.p
            className="text-xl text-white/80 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            See who&apos;s leading the predictions game this season
          </motion.p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <ScrollReveal>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6 sm:mb-8">Top Predictors</h2>
        </ScrollReveal>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="az-glass p-4 flex items-center gap-4">
                <Skeleton width="40px" height="40px" borderRadius="0" />
                <Skeleton height="20px" width="200px" />
                <Skeleton height="16px" width="80px" className="ml-auto" />
              </div>
            ))}
          </div>
        ) : error ? (
          <ErrorState
            title="Failed to load leaderboard"
            description={error}
            onButtonPress={() => leaderboardQuery.refetch()}
          />
        ) : leaderboard.length > 0 ? (
          <div className="space-y-3">
            {leaderboard.map((entry, index) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                <GlowCard universe="sports">
                  <div className="p-4 flex items-center gap-4">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                      style={{
                        background:
                          index === 0
                            ? 'linear-gradient(135deg, #FFD700, #FFA500)'
                            : index === 1
                              ? 'linear-gradient(135deg, #C0C0C0, #A0A0A0)'
                              : index === 2
                                ? 'linear-gradient(135deg, #CD7F32, #A0522D)'
                                : 'rgba(255,255,255,0.1)',
                        color: index < 3 ? '#1A0A0A' : '#fff',
                      }}
                    >
                      {entry.rank}
                    </div>

                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #0D3B2E, #E8420A)' }}
                    >
                      {entry.avatar?.charAt(0) || entry.name.charAt(0)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white text-sm truncate">{entry.name}</h3>
                      <div className="flex items-center gap-3 text-xs text-white/50 mt-0.5">
                        <span>{entry.wins}W</span>
                        <span>{entry.losses}L</span>
                        {entry.streak > 0 && (
                          <span className="text-[#4ADE80]">{entry.streak} streak</span>
                        )}
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className="text-lg font-bold text-white">
                        {entry.points.toLocaleString()}
                      </p>
                      <p className="text-xs text-white/40">points</p>
                    </div>
                  </div>
                </GlowCard>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-lg text-white/50">No leaderboard data available</p>
          </div>
        )}
      </section>

      <AppFooter />
    </div>
  );
}

const LazyLeaderboardPage = lazy(() => Promise.resolve({ default: LeaderboardPageContent }));

export default function LeaderboardPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#1A0A0A]">
          <p className="text-white/50 text-lg">Loading...</p>
        </div>
      }
    >
      <LazyLeaderboardPage />
    </Suspense>
  );
}
