'use client';
import { Suspense, lazy, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import PageShell from '@/components/layout/PageShell';
import PageHero from '@/components/layout/PageHero';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { GlowCard } from '@/components/motion/GlowCard';
import { OptimizedImage } from '@/components/OptimizedImage';
import analytics from '@/lib/analytics';

interface FanContest {
  id: string;
  title: string;
  description: string;
  prize: string;
  prizeAmount?: number;
  deadline: string;
  entries: number;
  maxEntries?: number;
  status: 'active' | 'upcoming' | 'ended';
  image?: string;
}

function FanContestsPageContent(): React.JSX.Element {
  useEffect(() => {
    analytics.pageView('sports-fan-contests');
  }, []);

  const contestsQuery = useQuery({
    queryKey: ['fan-contests'],
    queryFn: async () => {
      const res = await api.request<FanContest[]>('/api/v1/sports/fan-contests');
      if (res.success && res.data) return res.data;
      throw new Error(res.message || 'Failed to load fan contests');
    },
    staleTime: 30000,
  });

  const contests: FanContest[] = contestsQuery.data ?? [];
  const isLoading = contestsQuery.isLoading;
  const error = contestsQuery.error?.message;

  const activeContests = contests.filter((c) => c.status === 'active');
  const upcomingContests = contests.filter((c) => c.status === 'upcoming');

  return (
    <PageShell activeNav="Sports" maxWidth="7xl">
      <PageHero
        eyebrow="Community Tournaments"
        eyebrowColor="var(--color-az-success-400)"
        title="Fan Contests"
        subtitle="Compete with fellow fans and win exclusive prizes"
        glowColor="color-mix(in srgb, var(--color-az-success-500) 16%, transparent)"
      />

      {/* Active Contests */}
      <section className="py-10 sm:py-12">
        <ScrollReveal>
          <h2 className="az-section-title text-az-ink mb-6 sm:mb-8">Active Contests</h2>
        </ScrollReveal>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="az-glass overflow-hidden">
                <Skeleton height="160px" borderRadius="0" />
                <div className="p-4 space-y-3">
                  <Skeleton height="20px" width="70%" />
                  <Skeleton height="16px" width="50%" />
                  <Skeleton height="36px" borderRadius="0" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <ErrorState
            title="Failed to load contests"
            description={error}
            onButtonPress={() => contestsQuery.refetch()}
          />
        ) : activeContests.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeContests.map((contest, index) => (
              <motion.div
                key={contest.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <GlowCard universe="sports" className="overflow-hidden">
                  {contest.image && (
                    <div className="relative h-40">
                      <OptimizedImage
                        src={contest.image}
                        alt={contest.title}
                        fill
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 az-scrim" aria-hidden="true" />
                    </div>
                  )}
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="rounded-az-pill bg-az-success-500/15 px-2.5 py-0.5 text-xs font-semibold text-az-success-400">
                        Active
                      </span>
                      <span className="text-xs text-az-ink/40">
                        {contest.entries.toLocaleString()} entries
                      </span>
                    </div>

                    <h3 className="az-subtitle text-az-ink mb-2">{contest.title}</h3>
                    <p className="az-caption mb-4 line-clamp-2 text-az-ink/50">
                      {contest.description}
                    </p>

                    {/* Prize */}
                    <div className="rounded-az-control bg-az-ink/5 p-3 mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-az-ink/40">Prize Pool</span>
                        <span className="az-body-strong text-az-success-400">{contest.prize}</span>
                      </div>
                      {contest.prizeAmount && (
                        <p className="text-xs text-az-ink/40 mt-1">
                          Worth {contest.prizeAmount.toLocaleString()} points
                        </p>
                      )}
                    </div>

                    {/* Deadline & Progress */}
                    <div className="flex items-center justify-between text-xs text-az-ink/40 mb-4">
                      <span>
                        Ends:{' '}
                        {new Date(contest.deadline).toLocaleDateString('en-NG', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                      {contest.maxEntries && (
                        <span>
                          {contest.entries}/{contest.maxEntries} entries
                        </span>
                      )}
                    </div>

                    <motion.button
                      type="button"
                      className="az-btn-primary"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Enter Contest
                    </motion.button>
                  </div>
                </GlowCard>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="az-lead text-az-ink/50">No active contests</p>
          </div>
        )}
      </section>

      {/* Upcoming Contests */}
      {upcomingContests.length > 0 && (
        <section className="py-10 sm:py-12">
          <div>
            <ScrollReveal>
              <h2 className="az-section-title text-az-ink mb-6 sm:mb-8">Upcoming Contests</h2>
            </ScrollReveal>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingContests.map((contest, index) => (
                <motion.div
                  key={contest.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <GlowCard universe="sports" className="overflow-hidden">
                    <div className="p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="rounded-az-pill bg-az-ink/10 px-2.5 py-0.5 text-xs font-semibold text-az-ink/50">
                          Upcoming
                        </span>
                      </div>
                      <h3 className="az-subtitle text-az-ink mb-2">{contest.title}</h3>
                      <p className="az-caption mb-4 text-az-ink/50">{contest.description}</p>
                      <p className="text-xs text-az-ink/40">
                        Starts:{' '}
                        {new Date(contest.deadline).toLocaleDateString('en-NG', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </GlowCard>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}
    </PageShell>
  );
}

const LazyFanContestsPage = lazy(() => Promise.resolve({ default: FanContestsPageContent }));

export default function FanContestsPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-az-surface-root">
          <p className="text-az-ink/50 text-lg">Loading...</p>
        </div>
      }
    >
      <LazyFanContestsPage />
    </Suspense>
  );
}
