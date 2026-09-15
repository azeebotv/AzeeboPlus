'use client';
import { Suspense, lazy, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
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
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <AppHeader active="Sports" logoVariant="light" />

      {/* Hero */}
      <section
        className="relative py-16 sm:py-20 overflow-hidden"
        style={{
          background:
            'radial-gradient(ellipse at top, rgba(232,66,10,0.2) 0%, var(--bg-secondary) 60%, var(--bg-primary) 100%)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase mb-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Schedules & Scores
          </span>
          <motion.h1
            className="text-4xl sm:text-5xl font-bold text-white mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Fixtures & Results
          </motion.h1>
          <motion.p
            className="text-xl text-white/80 max-w-2xl mx-auto mb-8"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            Track all upcoming matches and recent results
          </motion.p>

          {/* Sport Filter */}
          <div className="flex flex-wrap justify-center gap-2">
            {SPORTS.map((sport) => {
              const active = selectedSport === sport;
              return (
                <button
                  key={sport}
                  type="button"
                  onClick={() => setSelectedSport(sport)}
                  className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                    active
                      ? 'text-white shadow-lg shadow-orange-500/20'
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`}
                  style={{
                    backgroundColor: active
                      ? 'var(--brand-orange, #E8420A)'
                      : 'rgba(255,255,255,0.08)',
                    border: `1px solid ${active ? 'var(--brand-orange, #E8420A)' : 'rgba(255,255,255,0.12)'}`,
                  }}
                >
                  {sport}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Fixtures Table */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <ScrollReveal>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6 sm:mb-8">
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
            <div className="hidden sm:grid grid-cols-12 gap-4 px-4 py-2 text-xs text-white/40 font-semibold uppercase">
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
                  className="az-glass p-4 grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 items-center"
                  style={{
                    border:
                      fixture.status === 'live' ? '1px solid rgba(74,222,128,0.3)' : undefined,
                  }}
                >
                  <div className="sm:col-span-2">
                    <span className="text-xs text-white/50">
                      {new Date(fixture.date).toLocaleDateString('en-NG', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                    <span className="text-xs text-white/50 block sm:hidden">
                      {new Date(fixture.date).toLocaleTimeString('en-NG', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div className="sm:col-span-1">
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                      style={{
                        backgroundColor: 'rgba(13,59,46,0.3)',
                        color: 'var(--color-success-400)',
                      }}
                    >
                      {fixture.sport}
                    </span>
                  </div>
                  <div className="sm:col-span-4 font-semibold text-white text-sm">
                    {fixture.homeTeam}
                  </div>
                  <div className="sm:col-span-2 text-center">
                    {fixture.homeScore != null && fixture.awayScore != null ? (
                      <span className="text-lg font-bold text-white">
                        {fixture.homeScore} - {fixture.awayScore}
                      </span>
                    ) : (
                      <span className="text-xs text-white/40">
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
                        className="ml-2 inline-block w-2 h-2 rounded-full animate-pulse"
                        style={{ backgroundColor: 'var(--color-success-400)' }}
                      />
                    )}
                  </div>
                  <div className="sm:col-span-3 font-semibold text-white text-sm">
                    {fixture.awayTeam}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-lg text-white/50">No fixtures available</p>
          </div>
        )}
      </section>

      <AppFooter logoVariant="light" />
    </div>
  );
}

const LazyFixturesPage = lazy(() => Promise.resolve({ default: FixturesPageContent }));

export default function FixturesPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--brand-near-black)]">
          <p className="text-white/50 text-lg">Loading...</p>
        </div>
      }
    >
      <LazyFixturesPage />
    </Suspense>
  );
}
