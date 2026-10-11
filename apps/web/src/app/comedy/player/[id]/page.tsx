'use client';
import { Suspense, lazy, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api, ContentItem } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import { PageHero } from '@/components/layout/PageHero';
import { PageShell } from '@/components/layout/PageShell';
import { OptimizedImage } from '@/components/OptimizedImage';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { GlowCard } from '@/components/motion/GlowCard';
import analytics from '@/lib/analytics';

function ClipPlayerContent(): React.JSX.Element {
  const params = useParams();
  const clipId = params.id as string;

  useEffect(() => {
    analytics.pageView('comedy-clip-player');
  }, []);

  const clipQuery = useQuery({
    queryKey: ['comedy-clip', clipId],
    queryFn: async () => {
      if (!clipId) throw new Error('Clip ID is required');
      const res = await api.content.getContentById(clipId);
      if (res.success && res.data) return res.data;
      throw new Error(res.message || 'Failed to load clip');
    },
    enabled: !!clipId,
    staleTime: 60000,
  });

  const relatedQuery = useQuery({
    queryKey: ['comedy-clip-related', clipId],
    queryFn: async () => {
      if (!clipId) throw new Error('Clip ID is required');
      const res = await api.content.getRelatedContent(clipId, 6);
      if (res.success && res.data) return res.data;
      return [];
    },
    enabled: !!clipId,
    staleTime: 60000,
  });

  const clip = clipQuery.data;
  const related: ContentItem[] = relatedQuery.data ?? [];
  const isLoading = clipQuery.isLoading;
  const error = clipQuery.error?.message;

  return (
    <PageShell activeNav="Comedy" maxWidth="2xl">
      <div className="py-2">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton height="500px" borderRadius="0" />
            <Skeleton height="32px" width="60%" />
            <Skeleton height="20px" width="40%" />
          </div>
        ) : error ? (
          <ErrorState
            title="Failed to load clip"
            description={error}
            onButtonPress={() => clipQuery.refetch()}
          />
        ) : clip ? (
          <>
            {/* Video Player Area */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative mb-6 aspect-video overflow-hidden rounded-az-card bg-black"
            >
              {clip.mediaUrl || clip.mediaAsset?.originalUrl ? (
                <video
                  src={clip.mediaAsset?.originalUrl || clip.mediaUrl}
                  poster={clip.thumbnail}
                  controls
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <OptimizedImage
                    src={clip.thumbnail}
                    alt={clip.title}
                    fill
                    className="object-cover opacity-50"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex size-20 items-center justify-center rounded-full bg-az-scarlet/90">
                      <svg
                        width="32"
                        height="32"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="text-az-ink"
                        aria-hidden="true"
                      >
                        <polygon points="5,3 19,12 5,21" />
                      </svg>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Clip Info */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <PageHero
                eyebrow="Comedy"
                title={clip.title}
                accentColor="var(--color-az-universe-comedy)"
                className="mb-2"
              />
              <div className="az-caption flex items-center gap-4 text-az-ink-muted">
                {clip.views != null && <span>{clip.views.toLocaleString()} views</span>}
                {clip.duration && (
                  <span>
                    {Math.floor(clip.duration / 60)}:
                    {(clip.duration % 60).toString().padStart(2, '0')}
                  </span>
                )}
              </div>
              <p className="az-body mt-4 leading-relaxed text-az-ink-muted">{clip.description}</p>
            </motion.div>

            {/* Related Clips */}
            {related.length > 0 && (
              <div className="mt-10">
                <ScrollReveal>
                  <h2 className="az-title mb-5 text-az-ink">More Comedy Clips</h2>
                </ScrollReveal>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {related.map((item) => (
                    <Link key={item.id} href={`/comedy/player/${item.id}`}>
                      <GlowCard universe="comedy" className="overflow-hidden group">
                        <div className="relative">
                          <OptimizedImage
                            src={item.thumbnail}
                            alt={item.title}
                            width={400}
                            height={120}
                            className="w-full h-32 object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 az-scrim" />
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="flex size-10 items-center justify-center rounded-full bg-az-ink/90">
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                className="text-az-flame"
                                aria-hidden="true"
                              >
                                <polygon points="5,3 19,12 5,21" />
                              </svg>
                            </div>
                          </div>
                        </div>
                        <div className="p-3">
                          <h3 className="az-body-strong truncate text-az-ink">{item.title}</h3>
                          <p className="az-caption mt-1 text-az-ink-dim">
                            {item.views != null && `${item.views.toLocaleString()} views`}
                          </p>
                        </div>
                      </GlowCard>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : null}
      </div>
    </PageShell>
  );
}

const LazyClipPlayer = lazy(() => Promise.resolve({ default: ClipPlayerContent }));

export default function ClipPlayerPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[var(--color-az-surface-root)]">
          <p className="az-lead text-az-ink-muted">Loading...</p>
        </div>
      }
    >
      <LazyClipPlayer />
    </Suspense>
  );
}
