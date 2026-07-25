'use client';
import { Suspense, lazy, useEffect, useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { OptimizedImage } from '@/components/OptimizedImage';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { GlowCard } from '@/components/motion/GlowCard';
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

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  registration: { bg: 'rgba(59,130,246,0.2)', text: '#60A5FA', label: 'Registration Open' },
  in_progress: { bg: 'rgba(74,222,128,0.2)', text: '#4ADE80', label: 'In Progress' },
  completed: { bg: 'rgba(156,163,175,0.2)', text: '#9CA3AF', label: 'Completed' },
  upcoming: { bg: 'rgba(245,158,11,0.2)', text: '#F59E0B', label: 'Upcoming' },
};

function TournamentDetailPageContent(): React.JSX.Element {
  const params = useParams();
  const id = params.id as string;
  const queryClient = useQueryClient();
  const [registered, setRegistered] = useState(false);
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'rules'>('leaderboard');

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
      const res = await api.request(`/api/v1/games/tournaments/${id}/register`, {
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

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return { bg: 'rgba(255,215,0,0.2)', color: '#FFD700' };
      case 2:
        return { bg: 'rgba(192,192,192,0.2)', color: '#C0C0C0' };
      case 3:
        return { bg: 'rgba(205,127,50,0.2)', color: '#CD7F32' };
      default:
        return { bg: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)' };
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#1A0A0A' }}>
      <AppHeader active="Games" />

      {isLoading ? (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <Skeleton height="300px" borderRadius="0" className="mb-6" />
          <Skeleton height="40px" width="60%" className="mb-4" />
          <Skeleton height="20px" width="40%" className="mb-6" />
          <Skeleton height="200px" />
        </div>
      ) : error ? (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <ErrorState
            title="Failed to load tournament"
            description={error}
            onButtonPress={() => tournamentQuery.refetch()}
          />
        </div>
      ) : tournament ? (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
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
                  className="w-full h-full"
                  style={{
                    background: `linear-gradient(135deg, ${STATUS_STYLES[tournament.status]?.bg || 'rgba(255,255,255,0.1)'}, #1A0A0A)`,
                  }}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-8xl opacity-20">🏆</span>
                  </div>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#1A0A0A] via-[#1A0A0A]/30 to-transparent" />
              <div className="absolute top-4 left-4">
                <span
                  className="px-3 py-1 rounded-full text-xs font-semibold"
                  style={{
                    backgroundColor: STATUS_STYLES[tournament.status]?.bg,
                    color: STATUS_STYLES[tournament.status]?.text,
                  }}
                >
                  {STATUS_STYLES[tournament.status]?.label}
                </span>
              </div>
              <div className="absolute bottom-4 right-4 text-right">
                <p className="text-4xl font-bold text-white">
                  {tournament.prizePool.toLocaleString()} {tournament.prizeCurrency || 'pts'}
                </p>
                <p className="text-sm text-white/60">Prize Pool</p>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">{tournament.name}</h1>
            {tournament.gameTitle && (
              <p className="text-lg text-[#E8420A] mb-4">{tournament.gameTitle}</p>
            )}
          </ScrollReveal>

          <ScrollReveal delay={0.15}>
            <div className="flex flex-wrap items-center gap-4 mb-6 text-sm text-white/60">
              <div className="flex items-center gap-2">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <span>
                  {formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                <span>
                  {tournament.participants || 0}
                  {tournament.maxParticipants ? `/${tournament.maxParticipants}` : ''} players
                </span>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.2}>
            <div className="az-glass p-6 rounded-xl mb-6">
              <p className="text-white/70 leading-relaxed">{tournament.description}</p>
            </div>
          </ScrollReveal>

          {tournament.status === 'registration' && (
            <ScrollReveal delay={0.25}>
              <div className="mb-6">
                <motion.button
                  type="button"
                  onClick={handleRegister}
                  disabled={registerMutation.isPending}
                  className="w-full sm:w-auto px-8 py-4 rounded-full text-lg font-semibold text-white transition-all disabled:opacity-50"
                  style={{
                    background: registered
                      ? 'linear-gradient(135deg, #22C55E, #16A34A)'
                      : 'linear-gradient(135deg, #E8420A, #CC1C1C)',
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {registerMutation.isPending
                    ? 'Processing...'
                    : registered
                      ? 'Registered ✓'
                      : 'Register Now'}
                </motion.button>
              </div>
            </ScrollReveal>
          )}

          <div className="flex gap-2 mb-6">
            {(['leaderboard', 'rules'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className="px-4 py-2 rounded-full text-sm font-semibold transition-all capitalize"
                style={{
                  backgroundColor:
                    activeTab === tab ? 'rgba(232,66,10,0.2)' : 'rgba(255,255,255,0.05)',
                  color: activeTab === tab ? '#E8420A' : 'rgba(255,255,255,0.6)',
                  border:
                    activeTab === tab ? '1px solid rgba(232,66,10,0.3)' : '1px solid transparent',
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeTab === 'leaderboard' && (
            <ScrollReveal>
              <GlowCard className="p-6">
                <h2 className="text-xl font-bold text-white mb-4">Leaderboard</h2>
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
                          className="flex items-center gap-3 p-3 rounded-lg"
                          style={{ backgroundColor: rankStyle.bg }}
                        >
                          <span
                            className="w-10 h-10 rounded-lg flex items-center justify-center font-bold"
                            style={{ color: rankStyle.color }}
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
                            <p className="font-semibold text-white truncate">{entry.username}</p>
                            <p className="text-xs text-white/50">
                              {entry.wins}W - {entry.losses}L
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-white">{entry.score.toLocaleString()}</p>
                            <p className="text-xs text-white/50">pts</p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-center text-white/50 py-8">No rankings available yet</p>
                )}
              </GlowCard>
            </ScrollReveal>
          )}

          {activeTab === 'rules' && (
            <ScrollReveal>
              <GlowCard className="p-6">
                <h2 className="text-xl font-bold text-white mb-4">Tournament Rules</h2>
                {tournament.rules ? (
                  <div className="text-white/70 leading-relaxed whitespace-pre-wrap">
                    {tournament.rules}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <span className="text-[#E8420A]">•</span>
                      <p className="text-white/70">
                        All participants must register before the tournament starts
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-[#E8420A]">•</span>
                      <p className="text-white/70">
                        Fair play is mandatory - any cheating will result in disqualification
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-[#E8420A]">•</span>
                      <p className="text-white/70">
                        Matches will be played according to the standard game rules
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-[#E8420A]">•</span>
                      <p className="text-white/70">
                        Prizes will be distributed within 48 hours of tournament completion
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-[#E8420A]">•</span>
                      <p className="text-white/70">Organizer decisions are final</p>
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
                className="px-6 py-3 rounded-full text-sm font-semibold transition-all"
                style={{ border: '1px solid rgba(255,255,255,0.2)', color: '#fff' }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                ← Back to Tournaments
              </motion.button>
            </Link>
          </div>
        </div>
      ) : null}

      <AppFooter />
    </div>
  );
}

const LazyTournamentDetailPage = lazy(() =>
  Promise.resolve({ default: TournamentDetailPageContent })
);

export default function TournamentDetailPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#1A0A0A]">
          <p className="text-white/50 text-lg">Loading...</p>
        </div>
      }
    >
      <LazyTournamentDetailPage />
    </Suspense>
  );
}
