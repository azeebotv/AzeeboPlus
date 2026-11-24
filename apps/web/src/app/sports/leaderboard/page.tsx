'use client';
import { Suspense, lazy, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import { PageHero } from '@/components/layout/PageHero';
import { PageShell } from '@/components/layout/PageShell';
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

/* Podium fills for the top three ranks, drawn from the token ramps. */
const RANK_TONES = [
  'bg-gradient-to-br from-az-warning-400 to-az-warning-500 text-az-surface-root',
  'bg-gradient-to-br from-az-ink-dim to-az-ink-muted text-az-surface-root',
  'bg-gradient-to-br from-az-flame to-az-scarlet text-az-ink',
];
const RANK_TONE_DEFAULT = 'bg-az-ink/10 text-az-ink';

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
    <PageShell maxWidth="lg" activeNav="Sports">
      <PageHero
        eyebrow="Sports"
        badge="Season Standings"
        title="Sports Leaderboard"
        description="See who's leading the predictions game this season"
        accentColor="var(--color-az-universe-sports)"
      />

      <section>
        <ScrollReveal>
          <h2 className="az-section-title mb-6 text-az-ink sm:mb-8">Top Predictors</h2>
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
                  <div className="flex items-center gap-4 p-4">
                    <div
                      className={`flex size-10 flex-shrink-0 items-center justify-center rounded-full az-body-strong ${
                        RANK_TONES[index] ?? RANK_TONE_DEFAULT
                      }`}
                    >
                      {entry.rank}
                    </div>

                    <div className="flex size-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-az-flame to-az-scarlet az-body-strong text-az-ink">
                      {entry.avatar?.charAt(0) || entry.name.charAt(0)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="az-body-strong truncate text-az-ink">{entry.name}</h3>
                      <div className="az-caption mt-0.5 flex items-center gap-3 text-az-ink-muted">
                        <span>{entry.wins}W</span>
                        <span>{entry.losses}L</span>
                        {entry.streak > 0 && (
                          <span className="text-az-success-400">{entry.streak} streak</span>
                        )}
                      </div>
                    </div>

                    <div className="flex-shrink-0 text-right">
                      <p className="az-subtitle text-az-ink">{entry.points.toLocaleString()}</p>
                      <p className="az-caption text-az-ink-muted">points</p>
                    </div>
                  </div>
                </GlowCard>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="az-lead text-az-ink-muted">No leaderboard data available</p>
          </div>
        )}
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
