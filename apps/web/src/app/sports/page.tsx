'use client';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import Link from 'next/link';
import { api, ContentItem } from '@/lib/api';
import { useUniversesQuery } from '@/hooks/useUniverses';
import PageShell from '@/components/layout/PageShell';
import PageHero from '@/components/layout/PageHero';
import { OptimizedImage } from '@/components/OptimizedImage';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { StaggerGrid } from '@/components/motion/StaggerGrid';
import { GlowCard } from '@/components/motion/GlowCard';
import analytics from '@/lib/analytics';

function SportsPageContent(): React.JSX.Element {
  useEffect(() => {
    analytics.pageView('sports');
  }, []);

  const universesQuery = useUniversesQuery();

  const sportsUniverse = universesQuery.data?.find((u) => u.name?.toLowerCase() === 'sports');

  const {
    data: matches = [],
    isLoading,
    error,
    refetch,
  } = useQuery<ContentItem[], Error>({
    queryKey: ['sports-content', sportsUniverse?.id],
    queryFn: async () => {
      if (!sportsUniverse?.id) throw new Error('Sports universe not found');
      const result = await api.content.getContentByUniverse(sportsUniverse.id, 1, 20);
      if (result.success && result.data) {
        return Array.isArray(result.data) ? result.data : result.data.items || [];
      }
      throw new Error(result.message || 'Failed to load sports content.');
    },
    staleTime: 60000,
    enabled: !!sportsUniverse?.id,
  });

  const featured = matches[0] ?? null;

  return (
    <PageShell activeNav="Sports" maxWidth="7xl">
      <PageHero
        eyebrow="Live & Upcoming Sports"
        title={featured?.title ?? 'Sports'}
        subtitle={
          featured?.description ?? 'Live matches, classic replays and everything in between'
        }
        accentColor="var(--color-az-success-500)"
        glowColor="color-mix(in srgb, var(--brand-emerald) 14%, transparent)"
        actions={
          featured && (
            <>
              <span
                aria-hidden="true"
                className="az-chip hidden items-center justify-center px-4 py-3 text-az-flame sm:inline-flex"
              >
                <Trophy size={24} />
              </span>
              <Link href={`/watch/${featured.id}`}>
                <motion.button
                  type="button"
                  aria-label="Watch live sports content"
                  className="az-btn-primary az-btn-primary--inline"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Watch Live
                </motion.button>
              </Link>
              <Link
                href={`/sports/predictions`}
                className="az-body-strong inline-block rounded-az-pill border border-az-glass-border bg-az-glass-fill px-6 py-3 text-az-ink transition-all hover:border-az-glass-border-hover hover:bg-az-glass-fill-hover"
              >
                Make Prediction
              </Link>
            </>
          )
        }
      />

      {/* Content Grid */}
      <section className="pb-4">
        <ScrollReveal>
          <div className="mb-6 sm:mb-8">
            <h2 className="az-section-title text-az-ink">Featured Sports Content</h2>
            <p className="az-body mt-1 text-az-ink-muted">Don&apos;t miss the action</p>
          </div>
        </ScrollReveal>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="az-glass overflow-hidden">
                <Skeleton height="192px" borderRadius="0px" />
                <div className="space-y-3 p-4">
                  <Skeleton height="20px" width="75%" />
                  <Skeleton height="16px" width="50%" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <ErrorState
            title="Failed to load sports content"
            description={error.message}
            onButtonPress={() => refetch()}
          />
        ) : matches.length > 0 ? (
          <StaggerGrid className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {matches.map((match) => (
              <Link key={match.id} href={`/watch/${match.id}`}>
                <GlowCard universe="sports" className="overflow-hidden">
                  <div className="relative">
                    <OptimizedImage
                      src={match.thumbnail}
                      alt={match.title}
                      width={400}
                      height={192}
                      className="h-48 w-full object-cover"
                    />
                    <div className="absolute inset-0 az-scrim" aria-hidden="true" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <span className="az-overline mb-2 inline-block rounded-az-pill bg-az-success-500/15 px-2.5 py-0.5 text-az-success-400">
                        {match.contentType || 'Sport'}
                      </span>
                      <h3 className="az-title text-az-ink">{match.title}</h3>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="az-body mb-3 line-clamp-2 text-az-ink-muted">
                      {match.description}
                    </p>
                    <button
                      type="button"
                      aria-label={`Watch ${match.title}`}
                      className="az-btn-primary"
                    >
                      Watch Now
                    </button>
                  </div>
                </GlowCard>
              </Link>
            ))}
          </StaggerGrid>
        ) : (
          <div className="py-12 text-center">
            <p className="az-lead text-az-ink-muted">No sports content available yet</p>
          </div>
        )}
      </section>
    </PageShell>
  );
}

export default SportsPageContent;
