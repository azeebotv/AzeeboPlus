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
    <div className="min-h-screen" style={{ backgroundColor: 'var(--brand-near-black)' }}>
      <AppHeader active="Sports" />

      {/* Hero */}
      <section
        className="relative py-16 sm:py-20"
        style={{ background: 'linear-gradient(135deg, #0D3B2E, #1A0A0A)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1
            className="text-4xl sm:text-5xl font-bold text-white mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Fan Contests
          </motion.h1>
          <motion.p
            className="text-xl text-white/80 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            Compete with fellow fans and win exclusive prizes
          </motion.p>
        </div>
      </section>

      {/* Active Contests */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <ScrollReveal>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6 sm:mb-8">
            Active Contests
          </h2>
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
                      <div className="absolute inset-0 bg-gradient-to-t from-[var(--brand-near-black)]/80 to-transparent" />
                    </div>
                  )}
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <span
                        className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                        style={{
                          backgroundColor: 'rgba(74,222,128,0.2)',
                          color: 'var(--color-success-400)',
                        }}
                      >
                        Active
                      </span>
                      <span className="text-xs text-white/40">
                        {contest.entries.toLocaleString()} entries
                      </span>
                    </div>

                    <h3 className="font-bold text-white text-lg mb-2">{contest.title}</h3>
                    <p className="text-sm text-white/50 mb-4 line-clamp-2">{contest.description}</p>

                    {/* Prize */}
                    <div
                      className="rounded-lg p-3 mb-4"
                      style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-white/40">Prize Pool</span>
                        <span className="text-sm font-bold text-[#4ADE80]">{contest.prize}</span>
                      </div>
                      {contest.prizeAmount && (
                        <p className="text-xs text-white/40 mt-1">
                          Worth {contest.prizeAmount.toLocaleString()} points
                        </p>
                      )}
                    </div>

                    {/* Deadline & Progress */}
                    <div className="flex items-center justify-between text-xs text-white/40 mb-4">
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
                      className="az-btn-primary w-full"
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
            <p className="text-lg text-white/50">No active contests</p>
          </div>
        )}
      </section>

      {/* Upcoming Contests */}
      {upcomingContests.length > 0 && (
        <section className="py-10 sm:py-12" style={{ backgroundColor: 'var(--bg-primary)' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollReveal>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6 sm:mb-8">
                Upcoming Contests
              </h2>
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
                        <span
                          className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                          style={{
                            backgroundColor: 'rgba(255,255,255,0.1)',
                            color: 'rgba(255,255,255,0.5)',
                          }}
                        >
                          Upcoming
                        </span>
                      </div>
                      <h3 className="font-bold text-white text-lg mb-2">{contest.title}</h3>
                      <p className="text-sm text-white/50 mb-4">{contest.description}</p>
                      <p className="text-xs text-white/40">
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

      <AppFooter />
    </div>
  );
}

const LazyFanContestsPage = lazy(() => Promise.resolve({ default: FanContestsPageContent }));

export default function FanContestsPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--brand-near-black)]">
          <p className="text-white/50 text-lg">Loading...</p>
        </div>
      }
    >
      <LazyFanContestsPage />
    </Suspense>
  );
}
