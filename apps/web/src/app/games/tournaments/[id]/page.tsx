'use client';
import { Suspense, lazy, useEffect, useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import PageShell from '@/components/layout/PageShell';
import { OptimizedImage } from '@/components/OptimizedImage';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { GlowCard } from '@/components/motion/GlowCard';
import { Calendar, Users, Trophy, Crown } from 'lucide-react';
import analytics from '@/lib/analytics';

interface Tournament {
  id: string;
  name: string;
  description: string;
  rules?: string;
  prizePool: number;
  prizeCurrency?: string;
  status: 'registration' | 'in_progress' | 'completed' | 'upcoming';
  startDate: string;
  endDate: string;
  participants?: number;
  maxParticipants?: number;
  gameTitle?: string;
  gameImage?: string;
}

interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatar: string;
  score: number;
  wins: number;
  losses: number;
}

/* Lifecycle statuses ride the semantic ramp; `completed` is the absence of a
   status rather than one, so it reads from the ink layer. */
const STATUS_STYLES: Record<
  string,
  { chipBg: string; chipText: string; bannerFrom: string; label: string }
> = {
  registration: {
    chipBg: 'bg-az-secondary-500/20',
    chipText: 'text-az-secondary-400',
    bannerFrom: 'from-az-secondary-500/20',
    label: 'Registration Open',
  },
  in_progress: {
    chipBg: 'bg-az-success-400/20',
    chipText: 'text-az-success-400',
    bannerFrom: 'from-az-success-400/20',
    label: 'In Progress',
  },
  completed: {
    chipBg: 'bg-az-ink-muted/20',
    chipText: 'text-az-ink-muted',
    bannerFrom: 'from-az-ink-muted/20',
    label: 'Completed',
  },
  upcoming: {
    chipBg: 'bg-az-warning-500/20',
    chipText: 'text-az-warning-400',
    bannerFrom: 'from-az-warning-500/20',
    label: 'Upcoming',
  },
};

function TournamentDetailPageContent(): React.JSX.Element {
  const params = useParams();
  const id = params.id as string;
  const queryClient = useQueryClient();
  const [registered, setRegistered] = useState(false);
  const [activeTab, setActiveTab] = useState<'bracket' | 'leaderboard' | 'rules'>('bracket');

  useEffect(() => {
    analytics.pageView('games-tournament-detail');
  }, []);

  const tournamentQuery = useQuery({
    queryKey: ['game-tournament', id],
    queryFn: async () => {
      const res = await api.request<Tournament>(`/api/v1/games/tournaments/${id}`);
      if (res.success && res.data) return res.data;
      throw new Error(res.message || 'Failed to load tournament');
    },
    enabled: !!id,
    staleTime: 30000,
  });

  const leaderboardQuery = useQuery({
    queryKey: ['game-tournament-leaderboard', id],
    queryFn: async () => {
      const res = await api.request<LeaderboardEntry[]>(
        `/api/v1/games/tournaments/${id}/leaderboard`
      );
      if (res.success && res.data) return res.data;
      throw new Error(res.message || 'Failed to load leaderboard');
    },
    enabled: !!id,
    staleTime: 15000,
  });

  const registerMutation = useMutation({
    mutationFn: async () => {
      const res = await api.request(`/api/v1/games/tournaments/${id}/enter`, {
        method: registered ? 'DELETE' : 'POST',
      });
      if (!res.success) throw new Error(res.message || 'Failed to update registration');
      return res.data;
    },
    onSuccess: () => {
      setRegistered(!registered);
      queryClient.invalidateQueries({ queryKey: ['game-tournament', id] });
      queryClient.invalidateQueries({ queryKey: ['game-tournament-leaderboard', id] });
    },
  });

  const tournament: Tournament | undefined = tournamentQuery.data;
  const leaderboard: LeaderboardEntry[] = leaderboardQuery.data ?? [];
  const isLoading = tournamentQuery.isLoading || leaderboardQuery.isLoading;
  const error = tournamentQuery.error?.message;

  const handleRegister = useCallback(() => {
    registerMutation.mutate();
  }, [registerMutation, registered]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-NG', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  /* Podium places are reward ranks, not statuses, so they keep the categorical
     metallic ramp the leaderboard podium uses instead of the semantic set. */
  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return { bg: 'bg-az-accent-gold/20', text: 'text-az-accent-gold' };
      case 2:
        return {
          bg: 'bg-[var(--color-az-accent-silver)]/20',
          text: 'text-[var(--color-az-accent-silver)]',
        };
      case 3:
        return {
          bg: 'bg-[var(--color-az-accent-bronze)]/20',
          text: 'text-[var(--color-az-accent-bronze)]',
        };
      default:
        return { bg: 'bg-az-ink/5', text: 'text-az-ink/60' };
    }
  };

  return (
    <PageShell activeNav="Games" maxWidth="xl">
      {isLoading ? (
        <>
          <Skeleton height="300px" borderRadius="0" className="mb-6" />
          <Skeleton height="40px" width="60%" className="mb-4" />
          <Skeleton height="20px" width="40%" className="mb-6" />
          <Skeleton height="200px" />
        </>
      ) : error ? (
        <ErrorState
          title="Failed to load tournament"
          description={error}
          onButtonPress={() => tournamentQuery.refetch()}
        />
      ) : tournament ? (
        <>
          <ScrollReveal>
            <div className="relative h-[250px] sm:h-[350px] mb-6 rounded-xl overflow-hidden">
              {tournament.gameImage ? (
                <OptimizedImage
                  src={tournament.gameImage}
                  alt={tournament.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className={`h-full w-full bg-gradient-to-br to-[var(--bg-primary)] ${
                    STATUS_STYLES[tournament.status]?.bannerFrom ?? 'from-az-ink/10'
                  }`}
                  aria-hidden="true"
                />
              )}
              <div className="absolute inset-0 az-scrim--hero" />
              <div className="absolute top-4 left-4">
                <span
                  className={`az-overline rounded-full px-3 py-1 ${
                    STATUS_STYLES[tournament.status]?.chipBg ?? 'bg-az-ink/10'
                  } ${STATUS_STYLES[tournament.status]?.chipText ?? 'text-az-ink-muted'}`}
                >
                  {STATUS_STYLES[tournament.status]?.label}
                </span>
              </div>
              <div className="absolute bottom-4 right-4 text-right">
                <p className="az-heading text-az-ink">
                  {tournament.prizePool.toLocaleString()} {tournament.prizeCurrency || 'pts'}
                </p>
                <p className="az-caption text-az-ink/60">Prize Pool</p>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <h1 className="az-headline text-3xl sm:text-4xl text-az-ink mb-2">{tournament.name}</h1>
            {tournament.gameTitle && (
              <p className="az-subtitle mb-4 text-az-flame">{tournament.gameTitle}</p>
            )}
          </ScrollReveal>

          <ScrollReveal delay={0.15}>
            <div className="az-body mb-6 flex flex-wrap items-center gap-4 text-az-ink/60">
              <div className="flex items-center gap-2">
                <Calendar size={16} aria-hidden />
                <span>
                  {formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Users size={16} aria-hidden />
                <span>
                  {tournament.participants || 0}
                  {tournament.maxParticipants ? `/${tournament.maxParticipants}` : ''} players
                </span>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.2}>
            <div className="az-glass mb-6 p-6">
              <p className="az-lead leading-relaxed text-az-ink/70">{tournament.description}</p>
            </div>
          </ScrollReveal>

          {tournament.status === 'registration' && (
            <ScrollReveal delay={0.25}>
              <div className="mb-6">
                <motion.button
                  type="button"
                  onClick={handleRegister}
                  disabled={registerMutation.isPending}
                  aria-pressed={registered}
                  className={`w-full rounded-full px-8 py-4 text-lg font-semibold text-az-ink transition-all disabled:opacity-50 sm:w-auto bg-gradient-to-br ${
                    registered
                      ? 'from-az-success-500 to-az-success-600'
                      : 'from-az-flame to-az-scarlet'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {registerMutation.isPending
                    ? 'Processing...'
                    : registered
                      ? 'Registered Check'
                      : 'Register Now'}
                </motion.button>
              </div>
            </ScrollReveal>
          )}

          <div className="flex gap-2 mb-6">
            {(['bracket', 'leaderboard', 'rules'] as const).map((tab) => {
              const selected = activeTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  aria-pressed={selected}
                  className={`az-body-strong rounded-az-pill border px-5 py-2 capitalize transition-all ${
                    selected
                      ? 'border-az-flame bg-az-flame/15 text-white font-bold shadow-sm'
                      : 'border-az-glass-border bg-az-surface-root text-az-ink-muted hover:text-az-ink'
                  }`}
                >
                  {tab === 'bracket' ? 'Tournament Bracket' : tab}
                </button>
              );
            })}
          </div>

          {activeTab === 'bracket' && (
            <ScrollReveal>
              <div className="rounded-az-card border border-az-glass-border bg-az-glass-card p-6 overflow-x-auto">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="az-subtitle text-az-ink font-bold flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-az-warning-400" />
                      Championship Elimination Tree
                    </h2>
                    <p className="az-caption text-az-ink-muted">
                      Single Elimination • Best of 3 Matches
                    </p>
                  </div>
                  <span className="rounded-az-pill border border-az-success-500/40 bg-az-success-500/10 px-3 py-1 text-xs font-bold text-az-success-300">
                    Grand Finals Live
                  </span>
                </div>

                {/* Multi-round Bracket Grid */}
                <div className="min-w-[700px] grid grid-cols-3 gap-6 items-center">
                  {/* Round 1: Quarterfinals */}
                  <div className="space-y-6">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-az-ink-muted text-center border-b border-az-glass-border pb-2">
                      Quarterfinals
                    </h3>
                    {[
                      { p1: 'Lagos Tigers', s1: 2, p2: 'Abuja Apex', s2: 0, win: 1 },
                      { p1: 'Delta Knights', s1: 1, p2: 'Enugu Phantoms', s2: 2, win: 2 },
                      { p1: 'Kano Kings', s1: 2, p2: 'Ibadan Storm', s2: 1, win: 1 },
                      { p1: 'PH Vipers', s1: 0, p2: 'Benin Titans', s2: 2, win: 2 },
                    ].map((m, idx) => (
                      <div
                        key={idx}
                        className="rounded-az-control border border-az-glass-border bg-az-surface-root p-3 text-xs space-y-1.5 shadow-sm"
                      >
                        <div
                          className={`flex items-center justify-between p-1.5 rounded ${
                            m.win === 1
                              ? 'font-bold text-white bg-az-surface-panel'
                              : 'text-az-ink-muted'
                          }`}
                        >
                          <span className="truncate">{m.p1}</span>
                          <span className={m.win === 1 ? 'text-az-success-400 font-extrabold' : ''}>
                            {m.s1}
                          </span>
                        </div>
                        <div
                          className={`flex items-center justify-between p-1.5 rounded ${
                            m.win === 2
                              ? 'font-bold text-white bg-az-surface-panel'
                              : 'text-az-ink-muted'
                          }`}
                        >
                          <span className="truncate">{m.p2}</span>
                          <span className={m.win === 2 ? 'text-az-success-400 font-extrabold' : ''}>
                            {m.s2}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Round 2: Semifinals */}
                  <div className="space-y-16">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-az-flame text-center border-b border-az-glass-border pb-2">
                      Semifinals
                    </h3>
                    {[
                      { p1: 'Lagos Tigers', s1: 2, p2: 'Enugu Phantoms', s2: 1, win: 1 },
                      { p1: 'Kano Kings', s1: 1, p2: 'Benin Titans', s2: 2, win: 2 },
                    ].map((m, idx) => (
                      <div
                        key={idx}
                        className="rounded-az-control border border-az-flame/30 bg-az-surface-root p-3.5 text-xs space-y-2 shadow-md relative"
                      >
                        <div
                          className={`flex items-center justify-between p-1.5 rounded ${
                            m.win === 1
                              ? 'font-bold text-white bg-az-surface-panel'
                              : 'text-az-ink-muted'
                          }`}
                        >
                          <span className="truncate">{m.p1}</span>
                          <span className={m.win === 1 ? 'text-az-success-400 font-extrabold' : ''}>
                            {m.s1}
                          </span>
                        </div>
                        <div
                          className={`flex items-center justify-between p-1.5 rounded ${
                            m.win === 2
                              ? 'font-bold text-white bg-az-surface-panel'
                              : 'text-az-ink-muted'
                          }`}
                        >
                          <span className="truncate">{m.p2}</span>
                          <span className={m.win === 2 ? 'text-az-success-400 font-extrabold' : ''}>
                            {m.s2}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Round 3: Grand Championship Final */}
                  <div className="space-y-6">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-az-warning-300 text-center border-b border-az-glass-border pb-2 flex items-center justify-center gap-1">
                      <Crown className="h-3.5 w-3.5" />
                      Grand Championship
                    </h3>
                    <div className="rounded-az-control border-2 border-az-warning-400/50 bg-gradient-to-b from-az-surface-panel to-az-surface-root p-4 text-xs space-y-3 shadow-xl">
                      <div className="flex items-center justify-between text-[10px] font-bold uppercase text-az-warning-400">
                        <span>Championship Match</span>
                        <span className="animate-pulse">● Live Stream</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded font-bold text-white bg-az-surface-panel border border-az-warning-400/30">
                        <span className="flex items-center gap-1.5">
                          <Crown className="h-3.5 w-3.5 text-az-warning-400" />
                          Lagos Tigers
                        </span>
                        <span className="text-az-warning-300 font-black text-sm">2</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded text-az-ink-muted">
                        <span>Benin Titans</span>
                        <span className="font-bold text-sm">1</span>
                      </div>
                      <div className="pt-2 text-center border-t border-az-glass-border">
                        <span className="text-[11px] font-semibold text-az-success-300">
                          Match Point: Lagos Tigers on Trophy Point
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          )}

          {activeTab === 'leaderboard' && (
            <ScrollReveal>
              <GlowCard className="p-6">
                <h2 className="az-title mb-4 text-az-ink">Leaderboard</h2>
                {leaderboardQuery.isLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <Skeleton width="40px" height="40px" borderRadius="8px" />
                        <Skeleton width="120px" height="20px" />
                        <Skeleton className="ml-auto" width="60px" height="20px" />
                      </div>
                    ))}
                  </div>
                ) : leaderboard.length > 0 ? (
                  <div className="space-y-3">
                    {leaderboard.map((entry) => {
                      const rankStyle = getRankStyle(entry.rank);
                      return (
                        <motion.div
                          key={entry.userId}
                          initial={{ opacity: 0, x: -10 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          className={`flex items-center gap-3 rounded-lg p-3 ${rankStyle.bg}`}
                        >
                          <span
                            className={`flex h-10 w-10 items-center justify-center rounded-lg font-bold ${rankStyle.text}`}
                          >
                            #{entry.rank}
                          </span>
                          <OptimizedImage
                            src={
                              entry.avatar ||
                              `https://ui-avatars.com/api/?name=${entry.username}&background=E8420A&color=fff`
                            }
                            alt={entry.username}
                            width={40}
                            height={40}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="az-body-strong truncate text-az-ink">{entry.username}</p>
                            <p className="az-caption text-az-ink/50">
                              {entry.wins}W - {entry.losses}L
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="az-body-strong text-az-ink">
                              {entry.score.toLocaleString()}
                            </p>
                            <p className="az-caption text-az-ink/50">pts</p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="az-body py-8 text-center text-az-ink-muted">
                    No rankings available yet
                  </p>
                )}
              </GlowCard>
            </ScrollReveal>
          )}

          {activeTab === 'rules' && (
            <ScrollReveal>
              <GlowCard className="p-6">
                <h2 className="az-title mb-4 text-az-ink">Tournament Rules</h2>
                {tournament.rules ? (
                  <div className="az-lead leading-relaxed whitespace-pre-wrap text-az-ink/70">
                    {tournament.rules}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <span className="text-az-flame" aria-hidden="true">
                        •
                      </span>
                      <p className="text-az-ink/70">
                        All participants must register before the tournament starts
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-az-flame" aria-hidden="true">
                        •
                      </span>
                      <p className="text-az-ink/70">
                        Fair play is mandatory - any cheating will result in disqualification
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-az-flame" aria-hidden="true">
                        •
                      </span>
                      <p className="text-az-ink/70">
                        Matches will be played according to the standard game rules
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-az-flame" aria-hidden="true">
                        •
                      </span>
                      <p className="text-az-ink/70">
                        Prizes will be distributed within 48 hours of tournament completion
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-az-flame" aria-hidden="true">
                        •
                      </span>
                      <p className="text-az-ink/70">Organizer decisions are final</p>
                    </div>
                  </div>
                )}
              </GlowCard>
            </ScrollReveal>
          )}

          <div className="mt-8">
            <Link href="/games/tournaments">
              <motion.button
                type="button"
                className="az-body-strong rounded-az-pill border border-az-ink/20 px-6 py-3 text-az-ink transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                ← Back to Tournaments
              </motion.button>
            </Link>
          </div>
        </>
      ) : null}
    </PageShell>
  );
}

const LazyTournamentDetailPage = lazy(() =>
  Promise.resolve({ default: TournamentDetailPageContent })
);

export default function TournamentDetailPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-az-surface-root">
          <p className="az-lead text-az-ink-muted">Loading...</p>
        </div>
      }
    >
      <LazyTournamentDetailPage />
    </Suspense>
  );
}
