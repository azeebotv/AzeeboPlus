'use client';
import { useEffect } from 'react';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { api, ContentItem } from '../../lib/api';
import { useUniversesQuery } from '@/hooks/useUniverses';
import { Skeleton } from '@azeebo/ui/web';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { OptimizedImage } from '@/components/OptimizedImage';
import { AmbientGlow } from '@/components/motion/AmbientGlow';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { StaggerGrid } from '@/components/motion/StaggerGrid';
import { GlowCard } from '@/components/motion/GlowCard';
import analytics from '@/lib/analytics';

interface Contestant {
  id: string;
  name: string;
  avatar: string;
  votes: number;
  status: 'safe' | 'danger' | 'eliminated';
}

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

function RealityPageContent(): React.JSX.Element {
  useEffect(() => {
    analytics.pageView('reality');
  }, []);

  const universesQuery = useUniversesQuery();

  const realityUniverse = universesQuery.data?.find((u) => u.name?.toLowerCase() === 'reality');

  const showsQuery = useQuery({
    queryKey: ['reality-shows', realityUniverse?.id],
    queryFn: async () => {
      if (!realityUniverse?.id) throw new Error('Reality universe not found');
      const res = await api.content.getContentByUniverse(realityUniverse.id, 12, 50);
      if (res.success && res.data) {
        const items = Array.isArray(res.data)
          ? res.data
          : (res.data as { items?: ContentItem[] })?.items || [];
        return items || [];
      }
      throw new Error(res.message || 'Failed to load reality shows');
    },
    enabled: !!realityUniverse?.id,
    staleTime: 60000,
  });

  const shows = showsQuery.data ?? [];
  const selectedShow = shows[0] ?? null;

  const contestantsQuery = useQuery({
    queryKey: ['reality-contestants', selectedShow?.id],
    queryFn: async () => {
      if (!selectedShow?.id) throw new Error('No show selected');
      const res = await api.reality.getContestants(selectedShow.id);
      if (res.success && res.data) return res.data;
      throw new Error(res.message || 'Failed to load contestants');
    },
    enabled: !!selectedShow?.id,
    staleTime: 30000,
  });

  const contestants: Contestant[] = contestantsQuery.data ?? [];
  const safeContestants = contestants || [];
  const maxVotes = Math.max(0, ...safeContestants.map((c) => c.votes));

  const isLoading = universesQuery.isLoading || showsQuery.isLoading;

  return (
    <div
      className="min-h-screen relative overflow-x-hidden"
      style={{ background: 'var(--hp-bg)', color: 'var(--text-primary)' }}
    >
      <AppHeader active="Reality" logoVariant="light" />

      {/* Hero Section */}
      <section className="relative">
        {isLoading ? (
          <Skeleton height="400px" className="sm:h-[500px] rounded-none" />
        ) : selectedShow ? (
          <div className="relative h-[400px] sm:h-[500px]">
            <OptimizedImage
              src={selectedShow.thumbnail || '/images/posters/poster_34.jpg'}
              alt={selectedShow.title}
              className="w-full h-full object-cover"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(to top, rgba(11,9,14,1) 0%, rgba(11,9,14,0.6) 40%, rgba(11,9,14,0.2) 100%)',
              }}
            />
            <AmbientGlow color="rgba(232,66,10,0.25)" size={550} className="bottom-0 right-0" />

            <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8 max-w-7xl mx-auto">
              <motion.h2
                className="text-3xl sm:text-4xl font-bold text-white mb-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                {selectedShow.title}
              </motion.h2>
              <motion.p
                className="text-white/60 text-base sm:text-lg mb-5 sm:mb-6 max-w-2xl"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                {selectedShow.description}
              </motion.p>
              <motion.div
                className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                <Link href={`/watch/${selectedShow.id}`}>
                  <motion.button
                    type="button"
                    className="az-btn-primary"
                    style={{ width: 'auto', paddingInline: '2rem' }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Watch Live
                  </motion.button>
                </Link>
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
                  Vote Now
                </motion.button>
              </motion.div>
            </div>
          </div>
        ) : null}
      </section>

      {/* Shows Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <ScrollReveal>
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white">Reality Shows</h2>
              <p className="text-sm sm:text-base mt-1 text-white/50">
                Watch and vote for your favorite contestants
              </p>
            </div>
          </div>
        </ScrollReveal>

        <StaggerGrid className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {shows.map((show) => (
            <Link key={show.id} href={`/watch/${show.id}`}>
              <GlowCard universe="reality" className="overflow-hidden">
                <div className="relative">
                  <OptimizedImage
                    src={show.thumbnail}
                    alt={show.title}
                    className="w-full h-44 sm:h-48 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[var(--brand-near-black)]/80 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <span
                      className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium mb-2"
                      style={{
                        backgroundColor: 'rgba(232,66,10,0.2)',
                        color: 'var(--brand-orange)',
                      }}
                    >
                      {show.contentType || 'Reality'}
                    </span>
                    <h3 className="text-lg sm:text-xl font-bold text-white">{show.title}</h3>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-sm text-white/50 mb-3 line-clamp-2">{show.description}</p>
                  <div className="flex items-center justify-between text-sm text-white/40">
                    <span>{show.duration || 0} min</span>
                    <span>{new Date(show.createdAt).toLocaleDateString()}</span>
                  </div>
                  <motion.button
                    type="button"
                    className="az-btn-primary w-full mt-4"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Watch Now
                  </motion.button>
                </div>
              </GlowCard>
            </Link>
          ))}
        </StaggerGrid>
      </section>

      {/* Leaderboard */}
      {safeContestants.length > 0 && (
        <section className="py-10 sm:py-12" style={{ backgroundColor: 'var(--bg-primary)' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollReveal>
              <div className="flex items-center justify-between mb-6 sm:mb-8">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white">Vote Leaderboard</h2>
                  <p className="text-sm sm:text-base mt-1 text-white/50">
                    See who&apos;s leading the competition
                  </p>
                </div>
                <Link
                  href="/reality/results"
                  className="text-sm font-medium text-[var(--brand-orange)] hover:text-[var(--brand-red)] transition-colors"
                >
                  View All
                </Link>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
              <ScrollReveal direction="left">
                <div className="az-glass p-5 sm:p-6">
                  <h3 className="text-base sm:text-lg font-bold mb-4 text-white">
                    {selectedShow?.title || 'Show'} - Current Vote Count
                  </h3>
                  <motion.div
                    className="space-y-4"
                    variants={staggerContainer}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                  >
                    {safeContestants.map((contestant, index) => (
                      <motion.div
                        key={contestant.id}
                        className="flex items-center gap-3 sm:gap-4"
                        variants={staggerItem}
                      >
                        <div className="flex items-center gap-2 sm:gap-3">
                          <span
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold text-white"
                            style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                          >
                            {index + 1}
                          </span>
                          <div
                            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-white text-xs sm:text-sm"
                            style={{ background: 'linear-gradient(135deg, #E8420A, #CC1C1C)' }}
                          >
                            {contestant.avatar?.charAt(0) || contestant.name.charAt(0)}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-white text-sm truncate">
                              {contestant.name}
                            </span>
                            <span className="text-xs sm:text-sm text-white/50 flex-shrink-0 ml-2">
                              {contestant.votes.toLocaleString()} votes
                            </span>
                          </div>
                          <div
                            className="h-1.5 sm:h-2 rounded-full overflow-hidden"
                            style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                          >
                            <motion.div
                              className="h-full rounded-full"
                              initial={{ width: 0 }}
                              whileInView={{
                                width: `${(contestant.votes / (maxVotes || 1)) * 100}%`,
                              }}
                              viewport={{ once: true }}
                              transition={{ duration: 0.8, delay: index * 0.1, ease: 'easeOut' }}
                              style={{
                                background:
                                  contestant.status === 'safe'
                                    ? 'linear-gradient(90deg, #22C55E, #4ADE80)'
                                    : contestant.status === 'danger'
                                      ? 'linear-gradient(90deg, #EF4444, #F87171)'
                                      : 'rgba(255,255,255,0.3)',
                              }}
                            />
                          </div>
                        </div>
                        {contestant.status === 'danger' && (
                          <span
                            className="px-2 py-0.5 sm:px-2.5 sm:py-0.5 rounded-full text-[10px] sm:text-xs font-semibold flex-shrink-0"
                            style={{
                              backgroundColor: 'rgba(239,68,68,0.2)',
                              color: 'var(--color-error-500)',
                            }}
                          >
                            Danger
                          </span>
                        )}
                        {contestant.status === 'eliminated' && (
                          <span
                            className="px-2 py-0.5 sm:px-2.5 sm:py-0.5 rounded-full text-[10px] sm:text-xs font-semibold flex-shrink-0"
                            style={{
                              backgroundColor: 'rgba(255,255,255,0.1)',
                              color: 'rgba(255,255,255,0.5)',
                            }}
                          >
                            Eliminated
                          </span>
                        )}
                      </motion.div>
                    ))}
                  </motion.div>
                  <motion.button
                    type="button"
                    className="az-btn-primary w-full mt-6"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Vote Now
                  </motion.button>
                </div>
              </ScrollReveal>

              <ScrollReveal direction="right">
                <div className="space-y-5 sm:space-y-6">
                  <motion.div
                    className="rounded-xl p-5 sm:p-6 text-white"
                    style={{ background: 'linear-gradient(135deg, #E8420A, #CC1C1C)' }}
                    whileHover={{ scale: 1.01 }}
                    transition={{ duration: 0.2 }}
                  >
                    <h3 className="text-lg sm:text-xl font-bold mb-2">Vote & Win Rewards!</h3>
                    <p className="text-white/80 text-sm sm:text-base mb-4">
                      Every vote you cast earns you reward points that can be redeemed for exclusive
                      content and prizes.
                    </p>
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="text-2xl sm:text-3xl font-bold">
                          {(selectedShow as unknown as { pointsEarned?: number })?.pointsEarned ??
                            0}
                        </p>
                        <p className="text-xs sm:text-sm text-white/70">Points Earned</p>
                      </div>
                      <div
                        className="w-px h-10 sm:h-12"
                        style={{ backgroundColor: 'rgba(255,255,255,0.3)' }}
                      />
                      <div className="text-center">
                        <p className="text-2xl sm:text-3xl font-bold">
                          {(selectedShow as unknown as { votesToday?: number })?.votesToday ?? 0}
                        </p>
                        <p className="text-xs sm:text-sm text-white/70">Votes Today</p>
                      </div>
                    </div>
                  </motion.div>

                  <GlowCard className="overflow-hidden">
                    <div
                      className="p-4"
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}
                    >
                      <h3 className="font-bold text-white text-sm sm:text-base">Vote Tips</h3>
                    </div>
                    <div className="p-4 space-y-3">
                      {[
                        {
                          title: 'Supervote Power',
                          desc: 'Use supervotes to multiply your impact',
                          icon: (
                            <svg
                              className="w-5 h-5 text-[var(--brand-orange)]"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
                              />
                            </svg>
                          ),
                        },
                        {
                          title: 'Daily Rewards',
                          desc: 'Vote daily to earn bonus points',
                          icon: (
                            <svg
                              className="w-5 h-5 text-amber-400"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H4.5a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
                              />
                            </svg>
                          ),
                        },
                        {
                          title: 'Leaderboard Bonus',
                          desc: 'Top voters get exclusive perks',
                          icon: (
                            <svg
                              className="w-5 h-5 text-yellow-400"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.504-1.125-1.125-1.125h-.871a3.375 3.375 0 00-3.375-3.375H12m4.5 7.875H12M9 18.75V15.375c0-.621.504-1.125 1.125-1.125h.871M12 7.5A3.75 3.75 0 008.25 3.75h7.5A3.75 3.75 0 0012 7.5z"
                              />
                            </svg>
                          ),
                        },
                      ].map((tip) => (
                        <div key={tip.title} className="flex items-start gap-3">
                          <span className="flex-shrink-0 mt-0.5">{tip.icon}</span>
                          <div>
                            <p className="font-medium text-xs sm:text-sm text-white">{tip.title}</p>
                            <p className="text-[10px] sm:text-xs text-white/50">{tip.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </GlowCard>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>
      )}

      <AppFooter logoVariant="light" />
    </div>
  );
}

export default RealityPageContent;
