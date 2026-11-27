'use client';
import { useEffect, useState, useTransition } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Gift, Trophy, Zap } from 'lucide-react';
import Link from 'next/link';
import { api, ContentItem } from '../../lib/api';
import { useUniversesQuery } from '@/hooks/useUniverses';
import { Skeleton } from '@azeebo/ui/web';
import { PageShell } from '@/components/layout/PageShell';
import { OptimizedImage } from '@/components/OptimizedImage';
import { AmbientGlow } from '@/components/motion/AmbientGlow';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { StaggerGrid } from '@/components/motion/StaggerGrid';
import { GlowCard } from '@/components/motion/GlowCard';
import analytics from '@/lib/analytics';

interface Contestant {
  id: string;
  name: string;
  avatar?: string;
  /** API embeds the raw row; votes live under _count.votes. */
  votes?: number;
  _count?: { votes?: number; predictions?: number };
  status?: 'safe' | 'danger' | 'eliminated';
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

const VOTE_TIPS = [
  {
    title: 'Supervote Power',
    desc: 'Use supervotes to multiply your impact',
    icon: Zap,
    tone: 'text-az-flame',
  },
  {
    title: 'Daily Rewards',
    desc: 'Vote daily to earn bonus points',
    icon: Gift,
    tone: 'text-az-warning-400',
  },
  {
    title: 'Leaderboard Bonus',
    desc: 'Top voters get exclusive perks',
    icon: Trophy,
    tone: 'text-az-warning-400',
  },
];

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
      const res = await api.content.getContentByUniverse(realityUniverse.id, 1, 12);
      if (res.success && res.data) {
        const items = Array.isArray(res.data)
          ? res.data
          : (res.data as { items?: ContentItem[] })?.items || [];
        return items || [];
      }
      return [];
    },
    enabled: !!realityUniverse?.id,
    staleTime: 60000,
  });

  const shows = showsQuery.data ?? [];
  const selectedShow = shows[0] ?? null;

  const contestantsQuery = useQuery({
    queryKey: ['reality-contestants', selectedShow?.id],
    queryFn: async () => {
      if (!selectedShow?.id) return [];
      const res = await api.reality.getContestants(selectedShow.id);
      if (res.success && res.data) {
        // The endpoint wraps the list: { contestants: [...] } — and older
        // builds returned a bare array. Unwrap either shape; a raw object
        // falling through used to crash `.map` into the error boundary.
        const payload = res.data as unknown;
        const list = Array.isArray(payload)
          ? payload
          : Array.isArray((payload as { contestants?: Contestant[] } | null)?.contestants)
            ? (payload as { contestants: Contestant[] }).contestants
            : [];
        return list;
      }
      return [];
    },
    enabled: !!selectedShow?.id,
    staleTime: 30000,
  });

  const contestants: Contestant[] = contestantsQuery.data ?? [];
  const safeContestants = Array.isArray(contestants) ? contestants : [];
  const maxVotes = Math.max(
    0,
    ...safeContestants.map((c) => Number(c.votes ?? c._count?.votes) || 0)
  );

  const isLoading = universesQuery.isLoading || showsQuery.isLoading;

  const queryClient = useQueryClient();
  const [votingId, setVotingId] = useState<string | null>(null);
  const [isVoting, startVoting] = useTransition();
  const [voteNotice, setVoteNotice] = useState<string | null>(null);

  const scrollToVoting = () => {
    document.getElementById('voting')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleVote = (contestantId: string) => {
    if (!selectedShow?.id || isVoting) return;
    setVotingId(contestantId);
    startVoting(async () => {
      const res = await api.reality.castVote(selectedShow.id, contestantId);
      setVoteNotice(res.success ? 'Vote submitted!' : (res.message ?? 'Vote failed'));
      if (res.success) {
        await queryClient.invalidateQueries({ queryKey: ['reality-contestants', selectedShow.id] });
      }
      setTimeout(() => setVoteNotice(null), 4000);
      setVotingId(null);
    });
  };

  return (
    <PageShell maxWidth="full" activeNav="Reality">
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
            <div className="absolute inset-0 az-scrim--hero" />
            <AmbientGlow
              color="color-mix(in srgb, var(--color-az-scarlet) 25%, transparent)"
              size={550}
              className="bottom-0 right-0"
            />

            <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8 max-w-7xl mx-auto">
              <motion.h2
                className="az-heading sm:az-display mb-2 text-az-ink"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                {selectedShow.title}
              </motion.h2>
              <motion.p
                className="az-lead mb-5 max-w-2xl text-az-ink/60 sm:mb-6"
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
                    className="az-btn-primary az-btn-primary--inline"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Watch Live
                  </motion.button>
                </Link>
                <motion.button
                  type="button"
                  onClick={scrollToVoting}
                  className="az-chip az-body-strong px-6 py-3 text-az-ink transition-all"
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
      <section id="voting" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <ScrollReveal>
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <div>
              <h2 className="az-section-title text-az-ink">Reality Shows</h2>
              <p className="az-body mt-1 text-az-ink-muted">
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
                  <div className="absolute inset-0 az-scrim" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <span className="az-overline mb-2 inline-block rounded-az-pill bg-az-scarlet/20 px-2.5 py-0.5 text-az-flame">
                      {show.contentType || 'Reality'}
                    </span>
                    <h3 className="az-title text-az-ink">{show.title}</h3>
                  </div>
                </div>
                <div className="p-4">
                  <p className="az-body mb-3 line-clamp-2 text-az-ink-muted">{show.description}</p>
                  <div className="az-caption flex items-center justify-between text-az-ink/40">
                    <span>{show.duration || 0} min</span>
                    <span>{new Date(show.createdAt).toLocaleDateString()}</span>
                  </div>
                  <motion.button
                    type="button"
                    className="az-btn-primary mt-4"
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
        <section className="border-y border-az-glass-border bg-az-surface-raised py-10 sm:py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollReveal>
              <div className="flex items-center justify-between mb-6 sm:mb-8">
                <div>
                  <h2 className="az-section-title text-az-ink">Vote Leaderboard</h2>
                  <p className="az-body mt-1 text-az-ink-muted">
                    See who&apos;s leading the competition
                  </p>
                </div>
                <Link
                  href="/reality/results"
                  className="az-body-strong text-az-flame transition-colors hover:text-az-scarlet"
                >
                  View All
                </Link>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
              <ScrollReveal direction="left">
                <div className="az-glass p-5 sm:p-6">
                  <h3 className="az-title mb-4 text-az-ink">
                    {selectedShow?.title || 'Show'} - Current Vote Count
                  </h3>
                  <motion.div
                    className="space-y-4"
                    variants={staggerContainer}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                  >
                    {safeContestants.map((contestant, index) => {
                      const votes = contestant.votes ?? contestant._count?.votes ?? 0;
                      const barTone =
                        contestant.status === 'safe'
                          ? 'bg-gradient-to-r from-az-success-500 to-az-success-400'
                          : contestant.status === 'danger'
                            ? 'bg-gradient-to-r from-az-error-500 to-az-error-400'
                            : 'bg-az-ink/30';
                      return (
                        <motion.div
                          key={contestant.id}
                          className="flex items-center gap-3 sm:gap-4"
                          variants={staggerItem}
                        >
                          <div className="flex items-center gap-2 sm:gap-3">
                            <span className="az-caption flex size-7 shrink-0 items-center justify-center rounded-full bg-az-ink/10 font-bold text-az-ink sm:size-8">
                              {index + 1}
                            </span>
                            <div className="az-caption flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-az-flame to-az-scarlet font-bold text-az-ink sm:size-10">
                              {contestant.avatar?.charAt(0) || contestant.name?.charAt(0) || '?'}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                              <span className="az-body-strong truncate text-az-ink">
                                {contestant.name}
                              </span>
                              <span className="az-caption ml-2 shrink-0 text-az-ink-muted">
                                {votes.toLocaleString()} votes
                              </span>
                            </div>
                            <div className="h-1.5 overflow-hidden rounded-az-pill bg-az-ink/10 sm:h-2">
                              <motion.div
                                className={`h-full rounded-az-pill ${barTone}`}
                                initial={{ width: 0 }}
                                whileInView={{
                                  width: `${(votes / (maxVotes || 1)) * 100}%`,
                                }}
                                viewport={{ once: true }}
                                transition={{
                                  duration: 0.8,
                                  delay: index * 0.1,
                                  ease: 'easeOut',
                                }}
                              />
                            </div>
                          </div>
                          {contestant.status === 'danger' && (
                            <span className="az-micro-label shrink-0 rounded-az-pill bg-az-error-500/20 px-2 py-0.5 font-semibold text-az-error-500 sm:px-2.5">
                              Danger
                            </span>
                          )}
                          {contestant.status !== 'eliminated' && selectedShow?.id && (
                            <button
                              type="button"
                              onClick={() => handleVote(contestant.id)}
                              disabled={isVoting && votingId === contestant.id}
                              className="az-btn-primary az-btn-primary--sm az-btn-primary--inline shrink-0"
                            >
                              {isVoting && votingId === contestant.id ? 'Voting…' : 'Vote'}
                            </button>
                          )}
                          {contestant.status === 'eliminated' && (
                            <span className="az-micro-label shrink-0 rounded-az-pill bg-az-ink/10 px-2 py-0.5 font-semibold text-az-ink/50 sm:px-2.5">
                              Eliminated
                            </span>
                          )}
                        </motion.div>
                      );
                    })}
                  </motion.div>
                  {voteNotice && (
                    <p role="status" className="az-body mt-3 text-center text-az-flame">
                      {voteNotice}
                    </p>
                  )}
                </div>
              </ScrollReveal>

              <ScrollReveal direction="right">
                <div className="space-y-5 sm:space-y-6">
                  <motion.div
                    className="rounded-az-panel bg-gradient-to-br from-az-flame to-az-scarlet p-5 text-az-ink sm:p-6"
                    whileHover={{ scale: 1.01 }}
                    transition={{ duration: 0.2 }}
                  >
                    <h3 className="az-title mb-2">Vote &amp; Win Rewards!</h3>
                    <p className="az-body mb-4 text-az-ink/80 sm:az-lead">
                      Every vote you cast earns you reward points that can be redeemed for exclusive
                      content and prizes.
                    </p>
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="az-section-title">
                          {(selectedShow as unknown as { pointsEarned?: number })?.pointsEarned ??
                            0}
                        </p>
                        <p className="az-caption text-az-ink/70">Points Earned</p>
                      </div>
                      <div className="h-10 w-px shrink-0 bg-az-ink/30 sm:h-12" />
                      <div className="text-center">
                        <p className="az-section-title">
                          {(selectedShow as unknown as { votesToday?: number })?.votesToday ?? 0}
                        </p>
                        <p className="az-caption text-az-ink/70">Votes Today</p>
                      </div>
                    </div>
                  </motion.div>

                  <GlowCard className="overflow-hidden">
                    <div className="border-b border-az-glass-border p-4">
                      <h3 className="az-body-strong text-az-ink">Vote Tips</h3>
                    </div>
                    <div className="p-4 space-y-3">
                      {VOTE_TIPS.map((tip) => {
                        const Icon = tip.icon;
                        return (
                          <div key={tip.title} className="flex items-start gap-3">
                            <Icon size={20} className={`mt-0.5 shrink-0 ${tip.tone}`} />
                            <div>
                              <p className="az-body-strong text-az-ink">{tip.title}</p>
                              <p className="az-caption text-az-ink-muted">{tip.desc}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </GlowCard>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>
      )}
    </PageShell>
  );
}

export default RealityPageContent;
