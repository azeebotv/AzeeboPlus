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

interface StoryworldDetail {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  slug: string;
  genre?: string;
  isComplete?: boolean;
  episodeCount?: number;
  characters?: { id: string; name: string; avatar: string }[];
  episodes?: ContentItem[];
}

function StoryworldDetailContent(): React.JSX.Element {
  const params = useParams();
  const slug = params.slug as string;

  useEffect(() => {
    analytics.pageView('vertical-storyworld-detail');
  }, []);

  const storyworldQuery = useQuery({
    queryKey: ['vertical-storyworld', slug],
    queryFn: async () => {
      if (!slug) throw new Error('Storyworld slug is required');
      const res = await api.request<StoryworldDetail>(`/api/v1/vertical/storyworlds/${slug}`);
      if (res.success && res.data) return res.data;
      throw new Error(res.message || 'Failed to load storyworld');
    },
    enabled: !!slug,
    staleTime: 60000,
  });

  const storyworld = storyworldQuery.data;
  const isLoading = storyworldQuery.isLoading;
  const error = storyworldQuery.error?.message;

  return (
    <PageShell activeNav="Vertical" maxWidth="2xl">
      {isLoading ? (
        <Skeleton height="500px" borderRadius="16px" />
      ) : error ? (
        <div className="h-[500px] flex items-center justify-center">
          <ErrorState
            title="Failed to load storyworld"
            description={error}
            onButtonPress={() => storyworldQuery.refetch()}
          />
        </div>
      ) : storyworld ? (
        <section className="relative">
          <div className="relative mb-6 h-[400px] overflow-hidden rounded-az-panel border border-az-glass-border sm:h-[500px]">
            <OptimizedImage
              src={storyworld.thumbnail}
              alt={storyworld.title}
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
                  {storyworld.isComplete && (
                    <span className="az-overline rounded-az-pill bg-az-success-500/90 px-3 py-1 text-az-ink">
                      Complete
                    </span>
                  )}
                  {storyworld.genre && (
                    <span className="az-overline rounded-az-pill bg-az-scarlet/20 px-3 py-1 text-az-flame">
                      {storyworld.genre}
                    </span>
                  )}
                </div>
                <h1 className="az-heading mb-3 text-az-ink sm:az-display">{storyworld.title}</h1>
                <p className="az-lead max-w-3xl text-az-ink/60">{storyworld.description}</p>
              </motion.div>
            </div>
          </div>
        </section>
      ) : null}

      {storyworld && (
        <>
          {storyworld.characters && storyworld.characters.length > 0 && (
            <section className="py-6 sm:py-8">
              <ScrollReveal>
                <h2 className="az-section-title mb-6 text-az-ink">Characters</h2>
              </ScrollReveal>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                {storyworld.characters.map((char, index) => (
                  <motion.div
                    key={char.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link href={`/vertical/characters/${char.id}`}>
                      <GlowCard universe="vertical" className="text-center">
                        <div className="p-4">
                          <div className="az-subtitle mx-auto mb-3 flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-az-flame to-az-scarlet text-az-ink">
                            {char.avatar?.charAt(0) || char.name.charAt(0)}
                          </div>
                          <h3 className="az-body-strong truncate text-az-ink">{char.name}</h3>
                        </div>
                      </GlowCard>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {storyworld.episodes && storyworld.episodes.length > 0 && (
            <section className="py-6 sm:py-8">
              <ScrollReveal>
                <h2 className="az-section-title mb-6 text-az-ink">Episodes</h2>
              </ScrollReveal>
              <div className="space-y-3">
                {storyworld.episodes.map((episode, index) => (
                  <Link key={episode.id} href={`/watch/${episode.id}`}>
                    <motion.div
                      className="az-glass flex cursor-pointer gap-4 p-4"
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.05 }}
                    >
                      {episode.thumbnail && (
                        <OptimizedImage
                          src={episode.thumbnail}
                          alt={episode.title}
                          width={120}
                          height={68}
                          className="h-[68px] w-[120px] flex-shrink-0 rounded-az-control object-cover"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="az-body-strong truncate text-az-ink">{episode.title}</h3>
                        <p className="az-caption mt-1 line-clamp-1 text-az-ink/50">
                          {episode.description}
                        </p>
                      </div>
                      <div className="flex items-center">
                        <span className="flex size-8 items-center justify-center rounded-full bg-az-scarlet/20 text-az-flame">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                            <polygon points="5,3 19,12 5,21" />
                          </svg>
                        </span>
                      </div>
                    </motion.div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </PageShell>
  );
}

const LazyStoryworldDetail = lazy(() => Promise.resolve({ default: StoryworldDetailContent }));

export default function StoryworldDetailPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-az-surface-root">
          <p className="az-lead text-az-ink-muted">Loading...</p>
        </div>
      }
    >
      <LazyStoryworldDetail />
    </Suspense>
  );
}
