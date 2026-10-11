'use client';
import { Suspense, lazy, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api, ContentItem } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import { PageShell } from '@/components/layout/PageShell';
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

/* Fixture state pills — token class pairs instead of an inline color-mix style. */
const STATUS_TONES: Record<FixtureDetail['status'], string> = {
  live: 'bg-az-success-500/90 text-az-ink',
  completed: 'bg-az-ink/20 text-az-ink',
  upcoming: 'bg-az-scarlet/20 text-az-flame',
};

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
    <PageShell maxWidth="full" activeNav="Sports">
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
            <div className="absolute inset-0 az-scrim--hero" />
            <div className="absolute bottom-0 left-0 right-0 mx-auto max-w-7xl p-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="mb-4 flex items-center gap-2">
                  <span
                    className={`az-caption rounded-az-pill px-3 py-1 font-semibold ${
                      STATUS_TONES[fixture.status] ?? STATUS_TONES.upcoming
                    }`}
                  >
                    {fixture.status === 'live'
                      ? '● LIVE'
                      : (fixture.status ?? 'unknown').toUpperCase()}
                  </span>
                  <span className="az-caption text-az-ink-muted">{fixture.sport}</span>
                </div>
                <h1 className="az-headline mb-3 text-4xl text-az-ink sm:text-5xl">
                  {fixture.title}
                </h1>
                {fixture.date && <p className="az-lead text-az-ink-muted">{fixture.date}</p>}
              </motion.div>
            </div>
          </div>
        </section>
      ) : null}

      {fixture && (
        <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <ScrollReveal>
            <p className="az-lead mb-8 leading-relaxed text-az-ink/70">{fixture.description}</p>

            {(fixture.homeTeam || fixture.awayTeam) && (
              <GlowCard universe="sports">
                <div className="flex items-center justify-between p-6">
                  <div className="flex-1 text-center">
                    <h3 className="az-title text-az-ink">{fixture.homeTeam}</h3>
                    {fixture.homeScore != null && (
                      <p className="az-heading mt-2 text-az-success-400">{fixture.homeScore}</p>
                    )}
                  </div>
                  <div className="px-6">
                    <span className="az-title text-az-ink/30">VS</span>
                  </div>
                  <div className="flex-1 text-center">
                    <h3 className="az-title text-az-ink">{fixture.awayTeam}</h3>
                    {fixture.awayScore != null && (
                      <p className="az-heading mt-2 text-az-success-400">{fixture.awayScore}</p>
                    )}
                  </div>
                </div>
              </GlowCard>
            )}

            {fixture.venue && (
              <div className="mt-6">
                <p className="az-caption text-az-ink-muted">Venue</p>
                <p className="az-body text-az-ink">{fixture.venue}</p>
              </div>
            )}

            <div className="mt-6 flex gap-4">
              {fixture.status === 'upcoming' && (
                <Link href={`/predictions?fixtureId=${fixture.id}`}>
                  <motion.button
                    type="button"
                    className="az-body-strong rounded-az-pill bg-az-success-400 px-6 py-3 text-az-surface-root transition-all"
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
                    className="az-btn-primary az-btn-primary--inline"
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
                <h2 className="az-section-title mb-6 text-az-ink">Related Predictions</h2>
              </ScrollReveal>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {fixture.predictions.map((pred) => (
                  <Link key={pred.id} href={`/watch/${pred.id}`}>
                    <GlowCard universe="sports" className="overflow-hidden">
                      <OptimizedImage
                        src={pred.thumbnail}
                        alt={pred.title}
                        width={400}
                        height={120}
                        className="h-32 w-full object-cover"
                      />
                      <div className="p-3">
                        <h3 className="az-body-strong truncate text-az-ink">{pred.title}</h3>
                      </div>
                    </GlowCard>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>
      )}
    </PageShell>
  );
}

const LazyFixtureDetail = lazy(() => Promise.resolve({ default: FixtureDetailContent }));

export default function FixtureDetailPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-az-surface-root">
          <p className="az-lead text-az-ink-muted">Loading...</p>
        </div>
      }
    >
      <LazyFixtureDetail />
    </Suspense>
  );
}
