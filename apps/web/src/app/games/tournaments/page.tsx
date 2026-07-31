'use client';
import { Suspense, lazy, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { GlowCard } from '@/components/motion/GlowCard';
import analytics from '@/lib/analytics';

interface Tournament {
  id: string;
  name: string;
  description: string;
  prizePool: number;
  prizeCurrency?: string;
  status: 'registration' | 'in_progress' | 'completed' | 'upcoming';
  startDate: string;
  endDate: string;
  participants?: number;
  maxParticipants?: number;
  gameTitle?: string;
}

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  registration: {
    bg: 'rgba(59,130,246,0.2)',
    text: 'var(--color-secondary-400)',
    label: 'Registration Open',
  },
  in_progress: {
    bg: 'rgba(74,222,128,0.2)',
    text: 'var(--color-success-400)',
    label: 'In Progress',
  },
  completed: { bg: 'rgba(156,163,175,0.2)', text: '#9CA3AF', label: 'Completed' },
  upcoming: { bg: 'rgba(245,158,11,0.2)', text: 'var(--color-warning-500)', label: 'Upcoming' },
};

function TournamentsPageContent(): React.JSX.Element {
  useEffect(() => {
    analytics.pageView('games-tournaments');
  }, []);

  const tournamentsQuery = useQuery({
    queryKey: ['game-tournaments'],
    queryFn: async () => {
      const res = await api.request<Tournament[]>('/api/v1/games/tournaments');
      if (res.success && res.data) return res.data;
      throw new Error(res.message || 'Failed to load tournaments');
    },
    staleTime: 30000,
  });

  const tournaments: Tournament[] = tournamentsQuery.data ?? [];
  const isLoading = tournamentsQuery.isLoading;
  const error = tournamentsQuery.error?.message;

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--brand-near-black)' }}>
      <AppHeader active="Games" />

      {/* Hero */}
      <section
        className="relative py-16 sm:py-20"
        style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #1A0A0A 100%)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1
            className="text-4xl sm:text-5xl font-bold text-white mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Tournaments
          </motion.h1>
          <motion.p
            className="text-xl text-white/80 max-w-2xl mx-auto mb-6"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            Compete in gaming tournaments for prizes and glory
          </motion.p>
          <motion.div
            className="flex items-center justify-center gap-6 text-sm text-white/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <span>
              {tournaments.filter((t) => t.status === 'registration').length} open for registration
            </span>
            <span>{tournaments.filter((t) => t.status === 'in_progress').length} in progress</span>
          </motion.div>
        </div>
      </section>

      {/* Tournaments Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <ScrollReveal>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6 sm:mb-8">
            All Tournaments
          </h2>
        </ScrollReveal>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="az-glass overflow-hidden">
                <Skeleton height="180px" borderRadius="0" />
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
            title="Failed to load tournaments"
            description={error}
            onButtonPress={() => tournamentsQuery.refetch()}
          />
        ) : tournaments.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {tournaments.map((tournament, index) => {
              const statusStyle = STATUS_STYLES[tournament.status] || STATUS_STYLES.upcoming;

              return (
                <motion.div
                  key={tournament.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <GlowCard universe="games" className="overflow-hidden">
                    <div
                      className="h-44 relative"
                      style={{
                        background: `linear-gradient(135deg, ${statusStyle.bg}, #1A0A0A)`,
                      }}
                    >
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-6xl opacity-20">🏆</span>
                      </div>
                      <div className="absolute top-3 right-3">
                        <span
                          className="px-2.5 py-1 rounded-full text-xs font-semibold"
                          style={{ backgroundColor: statusStyle.bg, color: statusStyle.text }}
                        >
                          {statusStyle.label}
                        </span>
                      </div>
                      <div className="absolute bottom-3 left-3">
                        <p className="text-white text-xl font-bold">
                          {tournament.prizePool.toLocaleString()}{' '}
                          {tournament.prizeCurrency || 'pts'}
                        </p>
                        <p className="text-white/60 text-xs">Prize Pool</p>
                      </div>
                    </div>

                    <div className="p-5">
                      <h3 className="font-bold text-white text-lg mb-1">{tournament.name}</h3>
                      {tournament.gameTitle && (
                        <p className="text-xs text-white/40 mb-2">{tournament.gameTitle}</p>
                      )}
                      <p className="text-sm text-white/50 mb-4 line-clamp-2">
                        {tournament.description}
                      </p>

                      <div className="flex items-center justify-between text-xs text-white/40 mb-4">
                        <span>
                          {new Date(tournament.startDate).toLocaleDateString('en-NG', {
                            month: 'short',
                            day: 'numeric',
                          })}
                          {' - '}
                          {new Date(tournament.endDate).toLocaleDateString('en-NG', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                        {tournament.participants != null && (
                          <span>
                            {tournament.participants}
                            {tournament.maxParticipants
                              ? `/${tournament.maxParticipants}`
                              : ''}{' '}
                            players
                          </span>
                        )}
                      </div>

                      <Link href={`/games/tournaments/${tournament.id}`}>
                        <motion.button
                          type="button"
                          className="az-btn-primary w-full"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          disabled={tournament.status === 'completed'}
                        >
                          {tournament.status === 'registration'
                            ? 'Register Now'
                            : tournament.status === 'in_progress'
                              ? 'View Bracket'
                              : tournament.status === 'upcoming'
                                ? 'Set Reminder'
                                : 'View Results'}
                        </motion.button>
                      </Link>
                    </div>
                  </GlowCard>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-lg text-white/50">No tournaments available</p>
          </div>
        )}
      </section>

      <AppFooter />
    </div>
  );
}

const LazyTournamentsPage = lazy(() => Promise.resolve({ default: TournamentsPageContent }));

export default function TournamentsPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#1A0A0A]">
          <p className="text-white/50 text-lg">Loading...</p>
        </div>
      }
    >
      <LazyTournamentsPage />
    </Suspense>
  );
}
