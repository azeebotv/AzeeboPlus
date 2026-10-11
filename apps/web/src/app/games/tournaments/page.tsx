'use client';
import { Suspense, lazy, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import PageShell from '@/components/layout/PageShell';
import PageHero from '@/components/layout/PageHero';
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

/* Lifecycle statuses ride the semantic ramp; `completed` grey has no az token
   ramp entry, so it uses a `var(--brand-grey)` arbitrary utility. */
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
    chipBg: 'bg-[var(--brand-grey)]/20',
    chipText: 'text-[var(--brand-grey)]',
    bannerFrom: 'from-[var(--brand-grey)]/20',
    label: 'Completed',
  },
  upcoming: {
    chipBg: 'bg-az-warning-500/20',
    chipText: 'text-az-warning-400',
    bannerFrom: 'from-az-warning-500/20',
    label: 'Upcoming',
  },
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
    <PageShell
      activeNav="Games"
      maxWidth="7xl"
      glowColor="color-mix(in srgb, var(--color-az-secondary-500) 22%, transparent)"
    >
      <PageHero
        eyebrow="Games Universe"
        title="Tournaments"
        subtitle="Compete in gaming tournaments for prizes and glory"
        actions={
          <div className="flex items-center gap-6">
            <span className="az-body text-az-ink/60">
              {tournaments.filter((t) => t.status === 'registration').length} open for registration
            </span>
            <span className="az-body text-az-ink/60">
              {tournaments.filter((t) => t.status === 'in_progress').length} in progress
            </span>
          </div>
        }
      />

      {/* Tournaments Grid */}
      <section className="py-2 sm:py-4">
        <ScrollReveal>
          <h2 className="az-section-title mb-6 text-az-ink sm:mb-8">All Tournaments</h2>
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
                      className={`relative h-44 bg-gradient-to-br to-[var(--bg-primary)] ${statusStyle.bannerFrom}`}
                    >
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-6xl opacity-20"></span>
                      </div>
                      <div className="absolute top-3 right-3">
                        <span
                          className={`az-overline rounded-az-pill px-2.5 py-1 ${statusStyle.chipBg} ${statusStyle.chipText}`}
                        >
                          {statusStyle.label}
                        </span>
                      </div>
                      <div className="absolute bottom-3 left-3">
                        <p className="az-title text-az-ink">
                          {tournament.prizePool.toLocaleString()}{' '}
                          {tournament.prizeCurrency || 'pts'}
                        </p>
                        <p className="az-caption text-az-ink/60">Prize Pool</p>
                      </div>
                    </div>

                    <div className="p-5">
                      <h3 className="az-subtitle mb-1 text-az-ink">{tournament.name}</h3>
                      {tournament.gameTitle && (
                        <p className="az-caption mb-2 text-az-ink/40">{tournament.gameTitle}</p>
                      )}
                      <p className="az-body mb-4 line-clamp-2 text-az-ink/50">
                        {tournament.description}
                      </p>

                      <div className="az-caption mb-4 flex items-center justify-between text-az-ink/40">
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
                          className="az-btn-primary"
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
          <div className="py-12 text-center">
            <p className="az-lead text-az-ink-muted">No tournaments available</p>
          </div>
        )}
      </section>
    </PageShell>
  );
}

const LazyTournamentsPage = lazy(() => Promise.resolve({ default: TournamentsPageContent }));

export default function TournamentsPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-az-surface-root">
          <p className="az-lead text-az-ink-muted">Loading...</p>
        </div>
      }
    >
      <LazyTournamentsPage />
    </Suspense>
  );
}
