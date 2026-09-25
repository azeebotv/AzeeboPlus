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

interface FixtureDetail {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  sport: string;
  date: string;
  venue?: string;
  status: 'upcoming' | 'live' | 'completed';
  homeTeam?: string;
  awayTeam?: string;
  homeScore?: number;
  awayScore?: number;
  predictions?: ContentItem[];
}

function FixtureDetailContent(): React.JSX.Element {
  const params = useParams();
  const fixtureId = params.id as string;

  useEffect(() => {
    analytics.pageView('sports-fixture-detail');
  }, []);

  const fixtureQuery = useQuery({
    queryKey: ['sports-fixture', fixtureId],
    queryFn: async () => {
      if (!fixtureId) throw new Error('Fixture ID is required');
      const res = await api.request<FixtureDetail>(`/api/v1/sports/fixtures/${fixtureId}`);
      if (res.success && res.data) return res.data;
      throw new Error(res.message || 'Failed to load fixture');
    },
    enabled: !!fixtureId,
    staleTime: 60000,
  });

  const fixture = fixtureQuery.data;
  const isLoading = fixtureQuery.isLoading;
  const error = fixtureQuery.error?.message;

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--brand-near-black)' }}>
      <AppHeader active="Sports" />

      {isLoading ? (
        <Skeleton height="500px" borderRadius="0" />
      ) : error ? (
        <div className="h-[500px] flex items-center justify-center">
          <ErrorState
            title="Failed to load fixture"
            description={error}
            onButtonPress={() => fixtureQuery.refetch()}
          />
        </div>
      ) : fixture ? (
        <section className="relative">
          <div className="relative h-[500px]">
            <OptimizedImage
              src={fixture.thumbnail}
              alt={fixture.title}
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
                    style={{
                      backgroundColor:
                        fixture.status === 'live'
                          ? 'rgba(34,197,94,0.9)'
                          : fixture.status === 'completed'
                            ? 'rgba(255,255,255,0.2)'
                            : 'rgba(232,66,10,0.2)',
                      color:
                        fixture.status === 'live'
                          ? 'white'
                          : fixture.status === 'completed'
                            ? 'white'
                            : 'var(--brand-orange)',
                    }}
                  >
                    {fixture.status === 'live'
                      ? '● LIVE'
                      : (fixture.status ?? 'unknown').toUpperCase()}
                  </span>
                  <span className="text-sm text-white/60">{fixture.sport}</span>
                </div>
                <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3">{fixture.title}</h1>
                {fixture.date && <p className="text-white/60 text-lg">{fixture.date}</p>}
              </motion.div>
            </div>
          </div>
        </section>
      ) : null}

      {fixture && (
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
          <ScrollReveal>
            <p className="text-white/70 text-lg leading-relaxed mb-8">{fixture.description}</p>

            {(fixture.homeTeam || fixture.awayTeam) && (
              <GlowCard universe="sports">
                <div className="p-6 flex items-center justify-between">
                  <div className="text-center flex-1">
                    <h3 className="text-xl font-bold text-white">{fixture.homeTeam}</h3>
                    {fixture.homeScore != null && (
                      <p className="text-3xl font-bold text-[#4ADE80] mt-2">{fixture.homeScore}</p>
                    )}
                  </div>
                  <div className="px-6">
                    <span className="text-2xl font-bold text-white/30">VS</span>
                  </div>
                  <div className="text-center flex-1">
                    <h3 className="text-xl font-bold text-white">{fixture.awayTeam}</h3>
                    {fixture.awayScore != null && (
                      <p className="text-3xl font-bold text-[#4ADE80] mt-2">{fixture.awayScore}</p>
                    )}
                  </div>
                </div>
              </GlowCard>
            )}

            {fixture.venue && (
              <div className="mt-6">
                <p className="text-sm text-white/40">Venue</p>
                <p className="text-white">{fixture.venue}</p>
              </div>
            )}

            <div className="mt-6 flex gap-4">
              {fixture.status === 'upcoming' && (
                <Link href={`/predictions?fixtureId=${fixture.id}`}>
                  <motion.button
                    type="button"
                    className="px-6 py-3 rounded-full text-sm font-semibold text-[var(--brand-near-black)] transition-all"
                    style={{ backgroundColor: 'var(--color-success-400)' }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Make Prediction
                  </motion.button>
                </Link>
              )}
              {fixture.status !== 'upcoming' && (
                <Link href={`/watch/${fixture.id}`}>
                  <motion.button
                    type="button"
                    className="px-6 py-3 rounded-full text-sm font-semibold text-white transition-all"
                    style={{ backgroundColor: 'var(--brand-orange)' }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Watch Highlights
                  </motion.button>
                </Link>
              )}
            </div>
          </ScrollReveal>

          {fixture.predictions && fixture.predictions.length > 0 && (
            <div className="mt-12">
              <ScrollReveal>
                <h2 className="text-2xl font-bold text-white mb-6">Related Predictions</h2>
              </ScrollReveal>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {fixture.predictions.map((pred) => (
                  <Link key={pred.id} href={`/watch/${pred.id}`}>
                    <GlowCard universe="sports" className="overflow-hidden">
                      <OptimizedImage
                        src={pred.thumbnail}
                        alt={pred.title}
                        width={400}
                        height={120}
                        className="w-full h-32 object-cover"
                      />
                      <div className="p-3">
                        <h3 className="font-semibold text-white text-sm truncate">{pred.title}</h3>
                      </div>
                    </GlowCard>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      <AppFooter />
    </div>
  );
}

const LazyFixtureDetail = lazy(() => Promise.resolve({ default: FixtureDetailContent }));

export default function FixtureDetailPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--brand-near-black)]">
          <p className="text-white/50 text-lg">Loading...</p>
        </div>
      }
    >
      <LazyFixtureDetail />
    </Suspense>
  );
}
