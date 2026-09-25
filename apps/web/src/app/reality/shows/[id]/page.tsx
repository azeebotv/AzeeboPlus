'use client';
import { Suspense, lazy, useEffect } from 'react';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api, ContentItem } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { OptimizedImage } from '@/components/OptimizedImage';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { GlowCard } from '@/components/motion/GlowCard';
import analytics from '@/lib/analytics';

interface Contestant {
  id: string;
  name: string;
  avatar: string;
  votes: number;
  status: 'safe' | 'danger' | 'eliminated';
}

interface Episode {
  id: string;
  title: string;
  description: string;
  episodeNumber: number;
  thumbnail?: string;
  duration?: number;
  createdAt: string;
}

function ShowDetailContent(): React.JSX.Element {
  const params = useParams();
  const showId = params.id as string;
  useEffect(() => {
    analytics.pageView('reality-show-detail');
  }, []);

  const showQuery = useQuery({
    queryKey: ['reality-show', showId],
    queryFn: async () => {
      if (!showId) throw new Error('Show ID is required');
      const res = await api.request<ContentItem>(`/api/v1/content/${showId}`);
      if (res.success && res.data) return res.data;
      throw new Error(res.message || 'Failed to load show');
    },
    enabled: !!showId,
    staleTime: 60000,
  });

  const episodesQuery = useQuery({
    queryKey: ['reality-episodes', showId],
    queryFn: async () => {
      if (!showId) throw new Error('Show ID is required');
      const res = await api.request<Episode[]>(`/api/v1/reality/shows/${showId}/episodes`);
      if (res.success && res.data) return res.data;
      throw new Error(res.message || 'Failed to load episodes');
    },
    enabled: !!showId,
    staleTime: 30000,
  });

  const contestantsQuery = useQuery({
    queryKey: ['reality-contestants', showId],
    queryFn: async () => {
      if (!showId) throw new Error('Show ID is required');
      const res = await api.reality.getContestants(showId);
      if (res.success && res.data) return res.data;
      throw new Error(res.message || 'Failed to load contestants');
    },
    enabled: !!showId,
    staleTime: 30000,
  });

  const show = showQuery.data;
  const episodes: Episode[] = episodesQuery.data ?? [];
  const contestants: Contestant[] = contestantsQuery.data ?? [];
  const maxVotes = Math.max(0, ...contestants.map((c) => c.votes));

  const isLoading = showQuery.isLoading || episodesQuery.isLoading || contestantsQuery.isLoading;
  const error =
    showQuery.error?.message || episodesQuery.error?.message || contestantsQuery.error?.message;

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--brand-near-black)' }}>
      <AppHeader active="Reality" />

      {/* Hero Banner */}
      <section className="relative">
        {isLoading ? (
          <Skeleton height="500px" borderRadius="0" />
        ) : error ? (
          <div className="h-[500px] flex items-center justify-center">
            <ErrorState
              title="Failed to load show"
              description={error}
              onButtonPress={() => showQuery.refetch()}
            />
          </div>
        ) : show ? (
          <div className="relative h-[500px]">
            <OptimizedImage
              src={show.thumbnail}
              alt={show.title}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--brand-near-black)] via-[var(--brand-near-black)]/60 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-8 max-w-7xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <span
                    className="px-3 py-1 rounded-full text-xs font-semibold"
                    style={{ backgroundColor: 'rgba(232,66,10,0.2)', color: 'var(--brand-orange)' }}
                  >
                    Reality Show
                  </span>
                  <span className="text-white/40 text-sm">{episodes.length} episodes</span>
                </div>
                <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3">{show.title}</h1>
                <p className="text-white/60 text-lg mb-6 max-w-3xl">{show.description}</p>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                  <Link href={`/watch/${show.id}`}>
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
                  <Link href={`/reality/results?showId=${show.id}`}>
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
                      Vote Leaderboard
                    </motion.button>
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>
        ) : null}
      </section>

      {/* Episodes List */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <ScrollReveal>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6 sm:mb-8">Episodes</h2>
        </ScrollReveal>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="az-glass p-4 flex gap-4">
                <Skeleton width="120px" height="68px" borderRadius="0" />
                <div className="flex-1 space-y-2">
                  <Skeleton height="20px" width="60%" />
                  <Skeleton height="16px" width="80%" />
                </div>
              </div>
            ))}
          </div>
        ) : episodes.length > 0 ? (
          <div className="space-y-3">
            {episodes.map((episode, index) => (
              <Link key={episode.id} href={`/watch/${episode.id}`}>
                <motion.div
                  className="az-glass p-4 flex gap-4 cursor-pointer transition-all hover:scale-[1.01]"
                  whileHover={{ x: 4 }}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                >
                  {episode.thumbnail && (
                    <OptimizedImage
                      src={episode.thumbnail}
                      alt={episode.title}
                      width={120}
                      height={68}
                      className="w-[120px] h-[68px] object-cover rounded flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-[var(--brand-orange)] font-semibold">
                        E{episode.episodeNumber}
                      </span>
                      {episode.duration && (
                        <span className="text-xs text-white/40">
                          {Math.floor(episode.duration / 60)}m
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-white text-sm truncate">{episode.title}</h3>
                    <p className="text-xs text-white/50 mt-1 line-clamp-1">{episode.description}</p>
                  </div>
                  <div className="flex items-center">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: 'rgba(232,66,10,0.2)' }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="#E8420A">
                        <polygon points="5,3 19,12 5,21" />
                      </svg>
                    </div>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-white/50 text-lg">No episodes available yet</p>
          </div>
        )}
      </section>

      {/* Contestants Grid */}
      {contestants.length > 0 && (
        <section className="py-10 sm:py-12" style={{ backgroundColor: 'var(--bg-primary)' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollReveal>
              <div className="flex items-center justify-between mb-6 sm:mb-8">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white">Contestants</h2>
                  <p className="text-sm sm:text-base mt-1 text-white/50">
                    Vote for your favorite contestants
                  </p>
                </div>
                <Link
                  href={`/reality/results?showId=${showId}`}
                  className="text-sm font-medium text-[var(--brand-orange)] hover:text-[var(--brand-red)] transition-colors"
                >
                  View Leaderboard
                </Link>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {contestants.map((contestant, index) => (
                <motion.div
                  key={contestant.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                >
                  <GlowCard universe="reality" className="overflow-hidden text-center">
                    <div className="p-5">
                      <div
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-full mx-auto mb-3 flex items-center justify-center font-bold text-xl sm:text-2xl text-white"
                        style={{ background: 'linear-gradient(135deg, #E8420A, #CC1C1C)' }}
                      >
                        {contestant.avatar?.charAt(0) || contestant.name.charAt(0)}
                      </div>
                      <h3 className="font-bold text-white text-sm sm:text-base mb-1 truncate">
                        {contestant.name}
                      </h3>
                      <p className="text-xs text-white/50 mb-3">
                        {contestant.votes.toLocaleString()} votes
                      </p>
                      <div
                        className="h-1.5 rounded-full overflow-hidden"
                        style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                      >
                        <motion.div
                          className="h-full rounded-full"
                          initial={{ width: 0 }}
                          whileInView={{ width: `${(contestant.votes / (maxVotes || 1)) * 100}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.8, delay: index * 0.1 }}
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
                      <span
                        className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-semibold capitalize"
                        style={{
                          backgroundColor:
                            contestant.status === 'safe'
                              ? 'rgba(34,197,94,0.2)'
                              : contestant.status === 'danger'
                                ? 'rgba(239,68,68,0.2)'
                                : 'rgba(255,255,255,0.1)',
                          color:
                            contestant.status === 'safe'
                              ? 'var(--color-success-500)'
                              : contestant.status === 'danger'
                                ? 'var(--color-error-500)'
                                : 'rgba(255,255,255,0.5)',
                        }}
                      >
                        {contestant.status}
                      </span>
                    </div>
                  </GlowCard>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Vote CTA */}
      <section className="py-10 sm:py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            className="rounded-2xl p-8 sm:p-12"
            style={{ background: 'linear-gradient(135deg, #E8420A, #CC1C1C)' }}
            whileHover={{ scale: 1.01 }}
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              Support Your Favorite
            </h2>
            <p className="text-white/80 mb-6 max-w-lg mx-auto">
              Every vote counts! Cast your vote and help your favorite contestant stay in the
              competition.
            </p>
            <motion.button
              type="button"
              className="px-8 py-3 rounded-full text-sm font-semibold transition-all"
              style={{ backgroundColor: 'white', color: 'var(--brand-orange)' }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Vote Now
            </motion.button>
          </motion.div>
        </div>
      </section>

      <AppFooter />
    </div>
  );
}

const LazyShowDetail = lazy(() => Promise.resolve({ default: ShowDetailContent }));

export default function ShowDetailPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--brand-near-black)]">
          <p className="text-white/50 text-lg">Loading...</p>
        </div>
      }
    >
      <LazyShowDetail />
    </Suspense>
  );
}
