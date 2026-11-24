'use client';
import { Suspense, lazy, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api, ContentItem } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import PageShell from '@/components/layout/PageShell';
import { OptimizedImage } from '@/components/OptimizedImage';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { GlowCard } from '@/components/motion/GlowCard';
import analytics from '@/lib/analytics';

interface CrossoverDetail {
  id: string;
  title: string;
  description: string;
  content: string;
  thumbnail: string;
  slug: string;
  universes: string[];
  characters?: { name: string; universe: string }[];
  relatedContent?: ContentItem[];
}

function CrossoverDetailContent(): React.JSX.Element {
  const params = useParams();
  const slug = params.slug as string;

  useEffect(() => {
    analytics.pageView('vertical-crossover-detail');
  }, []);

  const crossoverQuery = useQuery({
    queryKey: ['vertical-crossover', slug],
    queryFn: async () => {
      if (!slug) throw new Error('Crossover slug is required');
      const res = await api.request<CrossoverDetail>(`/api/v1/vertical/crossovers/${slug}`);
      if (res.success && res.data) return res.data;
      throw new Error(res.message || 'Failed to load crossover');
    },
    enabled: !!slug,
    staleTime: 60000,
  });

  const crossover = crossoverQuery.data;
  const isLoading = crossoverQuery.isLoading;
  const error = crossoverQuery.error?.message;

  return (
    <PageShell activeNav="Vertical" maxWidth="2xl">
      {isLoading ? (
        <Skeleton height="500px" borderRadius="16px" />
      ) : error ? (
        <div className="h-[500px] flex items-center justify-center">
          <ErrorState
            title="Failed to load crossover"
            description={error}
            onButtonPress={() => crossoverQuery.refetch()}
          />
        </div>
      ) : crossover ? (
        <section className="relative">
          <div className="relative mb-6 h-[400px] overflow-hidden rounded-az-panel border border-az-glass-border sm:h-[500px]">
            <OptimizedImage
              src={crossover.thumbnail}
              alt={crossover.title}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 az-scrim--hero" aria-hidden="true" />
            <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="mb-4 flex items-center gap-2">
                  <span className="az-overline rounded-az-pill bg-az-scarlet/20 px-3 py-1 text-az-flame">
                    Crossover Event
                  </span>
                </div>
                <h1 className="az-heading mb-3 text-az-ink sm:az-display">{crossover.title}</h1>
                <div className="flex flex-wrap gap-2">
                  {crossover.universes.map((universe) => (
                    <span
                      key={universe}
                      className="az-caption rounded-az-pill bg-az-ink/10 px-2.5 py-0.5 text-az-ink"
                    >
                      {universe}
                    </span>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      ) : null}

      {crossover && (
        <section className="mx-auto max-w-4xl py-2 sm:py-4">
          <ScrollReveal>
            <p className="az-lead mb-8 leading-relaxed text-az-ink/70">{crossover.description}</p>
            <div className="az-lead leading-relaxed whitespace-pre-wrap text-az-ink/60">
              {crossover.content}
            </div>
          </ScrollReveal>

          {crossover.characters && crossover.characters.length > 0 && (
            <div className="mt-12">
              <ScrollReveal>
                <h2 className="az-section-title mb-6 text-az-ink">Featured Characters</h2>
              </ScrollReveal>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {crossover.characters.map((char) => (
                  <GlowCard key={char.name} universe="vertical">
                    <div className="p-4 text-center">
                      <div className="az-subtitle mx-auto mb-3 flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-az-flame to-az-scarlet text-az-ink">
                        {char.name.charAt(0)}
                      </div>
                      <h3 className="az-body-strong text-az-ink">{char.name}</h3>
                      <p className="az-caption mt-1 text-az-ink/40">{char.universe}</p>
                    </div>
                  </GlowCard>
                ))}
              </div>
            </div>
          )}

          {crossover.relatedContent && crossover.relatedContent.length > 0 && (
            <div className="mt-12">
              <ScrollReveal>
                <h2 className="az-section-title mb-6 text-az-ink">Related Content</h2>
              </ScrollReveal>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {crossover.relatedContent.map((item) => (
                  <Link key={item.id} href={`/watch/${item.id}`}>
                    <GlowCard universe="vertical" className="overflow-hidden">
                      <OptimizedImage
                        src={item.thumbnail}
                        alt={item.title}
                        width={400}
                        height={120}
                        className="h-32 w-full object-cover"
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

const LazyCrossoverDetail = lazy(() => Promise.resolve({ default: CrossoverDetailContent }));

export default function CrossoverDetailPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-az-surface-root">
          <p className="az-lead text-az-ink-muted">Loading...</p>
        </div>
      }
    >
      <LazyCrossoverDetail />
    </Suspense>
  );
}
