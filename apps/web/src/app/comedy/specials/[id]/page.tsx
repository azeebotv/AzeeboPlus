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

interface SpecialDetail {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  duration?: number;
  comedian?: { id: string; name: string; avatar?: string };
  releaseDate?: string;
  relatedContent?: ContentItem[];
}

function SpecialDetailContent(): React.JSX.Element {
  const params = useParams();
  const specialId = params.id as string;

  useEffect(() => {
    analytics.pageView('comedy-special-detail');
  }, []);

  const specialQuery = useQuery({
    queryKey: ['comedy-special', specialId],
    queryFn: async () => {
      if (!specialId) throw new Error('Special ID is required');
      const res = await api.content.getContentById(specialId);
      if (res.success && res.data) return res.data as SpecialDetail;
      throw new Error(res.message || 'Failed to load special');
    },
    enabled: !!specialId,
    staleTime: 60000,
  });

  const relatedQuery = useQuery({
    queryKey: ['comedy-special-related', specialId],
    queryFn: async () => {
      if (!specialId) throw new Error('Special ID is required');
      const res = await api.content.getRelatedContent(specialId, 4);
      if (res.success && res.data) return res.data;
      return [];
    },
    enabled: !!specialId,
    staleTime: 60000,
  });

  const special = specialQuery.data;
  const related: ContentItem[] = relatedQuery.data ?? [];
  const isLoading = specialQuery.isLoading;
  const error = specialQuery.error?.message;

  return (
    <PageShell activeNav="Comedy" maxWidth="lg">
      {isLoading ? (
        <Skeleton height="500px" borderRadius="16px" />
      ) : error ? (
        <div className="flex h-[500px] items-center justify-center">
          <ErrorState
            title="Failed to load special"
            description={error}
            onButtonPress={() => specialQuery.refetch()}
          />
        </div>
      ) : special ? (
        <section className="py-4">
          <div className="relative h-[400px] overflow-hidden rounded-az-feature sm:h-[500px]">
            <OptimizedImage
              src={special.thumbnail}
              alt={special.title}
              fill
              className="object-cover"
              priority
            />
            <div className="az-scrim--hero absolute inset-0" />
            <div className="absolute bottom-0 left-0 right-0 p-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="mb-4 flex items-center gap-2">
                  <span className="az-micro-label inline-block rounded-az-pill bg-az-scarlet/20 px-3 py-1 text-az-flame">
                    Special
                  </span>
                  {special.duration && (
                    <span className="az-caption text-az-ink-muted">
                      {Math.floor(special.duration / 60)} min
                    </span>
                  )}
                </div>
                <h1 className="az-headline mb-3 text-4xl text-az-ink sm:text-5xl">
                  {special.title}
                </h1>
                {special.comedian && (
                  <Link
                    href={`/comedy/comedians/${special.comedian.id}`}
                    className="az-subtitle text-az-ink-muted transition-colors hover:text-az-flame"
                  >
                    {special.comedian.name}
                  </Link>
                )}
              </motion.div>
            </div>
          </div>
        </section>
      ) : null}

      {special && (
        <section className="py-10 sm:py-12">
          <ScrollReveal>
            <div className="mb-8 flex items-center gap-4">
              <Link href={`/watch/${special.id}`}>
                <motion.button
                  type="button"
                  className="az-btn-primary az-btn-primary--inline"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Watch Now
                </motion.button>
              </Link>
              {special.comedian && (
                <Link href={`/comedy/comedians/${special.comedian.id}`}>
                  <motion.button
                    type="button"
                    className="az-body-strong rounded-az-pill border border-az-ink/20 bg-az-ink/5 px-6 py-3 text-az-ink transition-all hover:bg-az-ink/10"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    View Comedian
                  </motion.button>
                </Link>
              )}
            </div>

            <p className="az-lead leading-relaxed text-az-ink-muted">{special.description}</p>

            {special.releaseDate && (
              <p className="az-caption mt-4 text-az-ink-muted">Released: {special.releaseDate}</p>
            )}
          </ScrollReveal>

          {related.length > 0 && (
            <div className="mt-12">
              <ScrollReveal>
                <h2 className="az-section-title mb-6 text-az-ink">More Comedy</h2>
              </ScrollReveal>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {related.map((item) => (
                  <Link key={item.id} href={`/watch/${item.id}`}>
                    <GlowCard universe="comedy" className="group overflow-hidden">
                      <OptimizedImage
                        src={item.thumbnail}
                        alt={item.title}
                        width={400}
                        height={120}
                        className="h-32 w-full object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="p-3">
                        <h3 className="az-body-strong truncate text-az-ink">{item.title}</h3>
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

const LazySpecialDetail = lazy(() => Promise.resolve({ default: SpecialDetailContent }));

export default function SpecialDetailPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-az-surface-root">
          <p className="az-lead text-az-ink-muted">Loading...</p>
        </div>
      }
    >
      <LazySpecialDetail />
    </Suspense>
  );
}
