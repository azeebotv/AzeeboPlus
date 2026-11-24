'use client';
import { Suspense, lazy, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import PageShell from '@/components/layout/PageShell';
import PageHero from '@/components/layout/PageHero';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import analytics from '@/lib/analytics';

interface Fixture {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore?: number;
  awayScore?: number;
  date: string;
  sport: string;
  venue?: string;
  status: 'upcoming' | 'live' | 'finished';
}

const SPORTS = ['All', 'Football', 'Basketball', 'Tennis', 'Cricket'];

function FixturesPageContent(): React.JSX.Element {
  const [selectedSport, setSelectedSport] = useState('All');
  useEffect(() => {
    analytics.pageView('sports-fixtures');
  }, []);

  const fixturesQuery = useQuery({
    queryKey: ['sports-fixtures'],
    queryFn: async () => {
      const res = await api.request<Fixture[]>('/api/v1/sports/fixtures');
      if (res.success && res.data) return res.data;
      throw new Error(res.message || 'Failed to load fixtures');
    },
    staleTime: 60000,
  });

  const fixtures: Fixture[] = fixturesQuery.data ?? [];
  const filtered =
    selectedSport === 'All' ? fixtures : fixtures.filter((f) => f.sport === selectedSport);

  const isLoading = fixturesQuery.isLoading;
  const error = fixturesQuery.error?.message;

  return (
    <PageShell activeNav="Sports" maxWidth="7xl">
      <PageHero
        eyebrow="Schedules & Scores"
        eyebrowColor="var(--color-az-success-400)"
        title="Fixtures & Results"
        subtitle="Track all upcoming matches and recent results"
        glowColor="color-mix(in srgb, var(--color-az-success-500) 16%, transparent)"
        actions={
          <div className="flex flex-wrap gap-2">
            {SPORTS.map((sport) => {
              const active = selectedSport === sport;
              return (
                <button
                  key={sport}
                  type="button"
                  onClick={() => setSelectedSport(sport)}
                  aria-pressed={active}
                  className={`az-body-strong shrink-0 whitespace-nowrap rounded-az-pill border px-5 py-2 transition-all ${
                    active
                      ? 'border-az-flame bg-az-scarlet/20 text-az-ink'
                      : 'border-az-glass-border bg-az-glass-fill text-az-ink-muted hover:border-az-glass-border-hover'
                  }`}
                >
                  {sport}
                </button>
              );
            })}
          </div>
        }
      />

      {/* Fixtures Table */}
      <section className="max-w-5xl mx-auto py-10 sm:py-12">
        <ScrollReveal>
          <h2 className="az-section-title text-az-ink mb-6 sm:mb-8">
            {selectedSport === 'All' ? 'All Fixtures' : selectedSport}
          </h2>
        </ScrollReveal>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="az-glass p-4 flex items-center gap-4">
                <Skeleton width="80px" height="40px" borderRadius="0" />
                <div className="flex-1 space-y-2">
                  <Skeleton height="18px" width="60%" />
                  <Skeleton height="14px" width="40%" />
                </div>
                <Skeleton width="60px" height="28px" borderRadius="0" />
              </div>
            ))}
          </div>
        ) : error ? (
          <ErrorState
            title="Failed to load fixtures"
            description={error}
            onButtonPress={() => fixturesQuery.refetch()}
          />
        ) : filtered.length > 0 ? (
          <div className="space-y-3">
            {/* Header */}
            <div className="hidden sm:grid grid-cols-12 gap-4 px-4 py-2 text-xs text-az-ink/40 font-semibold uppercase">
              <div className="col-span-2">Date</div>
              <div className="col-span-1">Sport</div>
              <div className="col-span-4">Home</div>
              <div className="col-span-2 text-center">Score</div>
              <div className="col-span-3">Away</div>
            </div>
            {filtered.map((fixture, index) => (
              <motion.div
                key={fixture.id}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.03 }}
              >
                <div
                  className={`az-glass p-4 grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 items-center ${
                    fixture.status === 'live' ? 'outline-2 outline-az-success-400/30' : ''
                  }`}
                >
                  <div className="sm:col-span-2">
                    <span className="az-caption text-az-ink/50">
                      {new Date(fixture.date).toLocaleDateString('en-NG', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                    <span className="az-caption block sm:hidden text-az-ink/50">
                      {new Date(fixture.date).toLocaleTimeString('en-NG', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div className="sm:col-span-1">
                    <span className="az-micro-label rounded-az-pill bg-az-success-500/15 px-2 py-0.5 text-az-success-400">
                      {fixture.sport}
                    </span>
                  </div>
                  <div className="sm:col-span-4 az-body-strong text-az-ink">{fixture.homeTeam}</div>
                  <div className="sm:col-span-2 text-center">
                    {fixture.homeScore != null && fixture.awayScore != null ? (
                      <span className="text-lg font-bold text-az-ink">
                        {fixture.homeScore} - {fixture.awayScore}
                      </span>
                    ) : (
                      <span className="az-caption text-az-ink/40">
                        {fixture.date
                          ? new Date(fixture.date).toLocaleTimeString('en-NG', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'TBD'}
                      </span>
                    )}
                    {fixture.status === 'live' && (
                      <span
                        className="ml-2 inline-block w-2 h-2 rounded-full animate-pulse bg-az-success-400"
                        aria-hidden="true"
                      />
                    )}
                  </div>
                  <div className="sm:col-span-3 az-body-strong text-az-ink">{fixture.awayTeam}</div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="az-lead text-az-ink/50">No fixtures available</p>
          </div>
        )}
      </section>
    </PageShell>
  );
}

const LazyFixturesPage = lazy(() => Promise.resolve({ default: FixturesPageContent }));

export default function FixturesPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-az-surface-root">
          <p className="text-az-ink/50 text-lg">Loading...</p>
        </div>
      }
    >
      <LazyFixturesPage />
    </Suspense>
  );
}
