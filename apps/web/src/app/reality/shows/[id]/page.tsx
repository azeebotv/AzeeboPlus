'use client';
import { Suspense, lazy, useEffect } from 'react';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Play } from 'lucide-react';
import { api, ContentItem } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import { PageShell } from '@/components/layout/PageShell';
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

/* Outcome colours live in the token ramp, so each status maps to classes
   instead of a hand-written inline gradient. */
const BAR_TONES: Record<Contestant['status'], string> = {
  safe: 'bg-gradient-to-r from-az-success-500 to-az-success-400',
  danger: 'bg-gradient-to-r from-az-error-500 to-az-error-400',
  eliminated: 'bg-az-ink/30',
};

const STATUS_TONES: Record<Contestant['status'], string> = {
  safe: 'bg-az-success-500/20 text-az-success-400',
  danger: 'bg-az-error-500/20 text-az-error-400',
  eliminated: 'bg-az-ink/10 text-az-ink-muted',
};

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
    <PageShell maxWidth="full" activeNav="Reality">
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
            <div className="absolute inset-0 az-scrim--hero" />
            <div className="absolute bottom-0 left-0 right-0 p-8 max-w-7xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <span className="az-overline rounded-az-pill bg-az-scarlet/20 px-3 py-1 text-az-flame">
                    Reality Show
                  </span>
                  <span className="az-caption text-az-ink/40">{episodes.length} episodes</span>
                </div>
                <h1 className="az-heading mb-3 text-az-ink sm:az-display">{show.title}</h1>
                <p className="az-lead mb-6 max-w-3xl text-az-ink/60">{show.description}</p>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                  <Link href={`/watch/${show.id}`}>
                    <motion.button
                      type="button"
                      className="az-btn-primary az-btn-primary--inline"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Watch Live
                    </motion.button>
                  </Link>
                  <Link href={`/reality/results?showId=${show.id}`}>
                    <motion.button
                      type="button"
                      className="az-chip az-body-strong px-6 py-3 text-az-ink transition-all"
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
          <h2 className="az-section-title mb-6 text-az-ink sm:mb-8">Episodes</h2>
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
                      <span className="az-overline text-az-flame">E{episode.episodeNumber}</span>
                      {episode.duration && (
                        <span className="az-caption text-az-ink/40">
                          {Math.floor(episode.duration / 60)}m
                        </span>
                      )}
                    </div>
                    <h3 className="az-body-strong truncate text-az-ink">{episode.title}</h3>
                    <p className="az-caption mt-1 line-clamp-1 text-az-ink-muted">
                      {episode.description}
                    </p>
                  </div>
                  <div className="flex items-center">
                    <div className="flex size-8 items-center justify-center rounded-full bg-az-scarlet/20">
                      <Play size={12} className="text-az-flame" aria-hidden="true" />
                    </div>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="az-lead text-az-ink-muted">No episodes available yet</p>
          </div>
        )}
      </section>

      {/* Contestants Grid */}
      {contestants.length > 0 && (
        <section className="border-y border-az-glass-border bg-az-surface-raised py-10 sm:py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollReveal>
              <div className="flex items-center justify-between mb-6 sm:mb-8">
                <div>
                  <h2 className="az-section-title text-az-ink">Contestants</h2>
                  <p className="az-body mt-1 text-az-ink-muted sm:az-lead">
                    Vote for your favorite contestants
                  </p>
                </div>
                <Link
                  href={`/reality/results?showId=${showId}`}
                  className="az-body-strong text-az-flame transition-colors hover:text-az-scarlet"
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
                      <div className="az-title mx-auto mb-3 flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-az-flame to-az-scarlet text-az-ink sm:size-20 sm:az-section-title">
                        {contestant.avatar?.charAt(0) || contestant.name.charAt(0)}
                      </div>
                      <h3 className="az-body-strong mb-1 truncate text-az-ink sm:az-lead">
                        {contestant.name}
                      </h3>
                      <p className="az-caption mb-3 text-az-ink-muted">
                        {contestant.votes.toLocaleString()} votes
                      </p>
                      <div className="h-1.5 overflow-hidden rounded-az-pill bg-az-ink/10">
                        <motion.div
                          className={`h-full rounded-az-pill ${BAR_TONES[contestant.status]}`}
                          initial={{ width: 0 }}
                          whileInView={{ width: `${(contestant.votes / (maxVotes || 1)) * 100}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.8, delay: index * 0.1 }}
                        />
                      </div>
                      <span
                        className={`az-micro-label mt-2 inline-block rounded-az-pill px-2.5 py-0.5 ${STATUS_TONES[contestant.status]}`}
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
            className="rounded-az-feature bg-gradient-to-br from-az-flame to-az-scarlet p-8 text-az-ink sm:p-12"
            whileHover={{ scale: 1.01 }}
          >
            <h2 className="az-section-title mb-3 text-az-ink">Support Your Favorite</h2>
            <p className="az-body mb-6 max-w-lg mx-auto text-az-ink/80 sm:az-lead">
              Every vote counts! Cast your vote and help your favorite contestant stay in the
              competition.
            </p>
            <motion.button
              type="button"
              className="az-body-strong rounded-az-pill bg-az-ink px-8 py-3 text-az-flame transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Vote Now
            </motion.button>
          </motion.div>
        </div>
      </section>
    </PageShell>
  );
}

const LazyShowDetail = lazy(() => Promise.resolve({ default: ShowDetailContent }));

export default function ShowDetailPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-az-surface-root">
          <p className="az-lead text-az-ink-muted">Loading...</p>
        </div>
      }
    >
      <LazyShowDetail />
    </Suspense>
  );
}
