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
    <div className="min-h-screen" style={{ backgroundColor: 'var(--brand-near-black)' }}>
      <AppHeader active="Vertical" />

      {isLoading ? (
        <Skeleton height="500px" borderRadius="0" />
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
          <div className="relative h-[500px]">
            <OptimizedImage
              src={storyworld.thumbnail}
              alt={storyworld.title}
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
                  {storyworld.isComplete && (
                    <span
                      className="px-3 py-1 rounded-full text-xs font-semibold"
                      style={{
                        backgroundColor: 'rgba(34,197,94,0.9)',
                        color: 'var(--brand-white)',
                      }}
                    >
                      Complete
                    </span>
                  )}
                  {storyworld.genre && (
                    <span
                      className="px-3 py-1 rounded-full text-xs font-semibold"
                      style={{
                        backgroundColor: 'rgba(232,66,10,0.2)',
                        color: 'var(--brand-orange)',
                      }}
                    >
                      {storyworld.genre}
                    </span>
                  )}
                </div>
                <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3">
                  {storyworld.title}
                </h1>
                <p className="text-white/60 text-lg max-w-3xl">{storyworld.description}</p>
              </motion.div>
            </div>
          </div>
        </section>
      ) : null}

      {storyworld && (
        <>
          {storyworld.characters && storyworld.characters.length > 0 && (
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
              <ScrollReveal>
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6">Characters</h2>
              </ScrollReveal>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
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
                          <div
                            className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center font-bold text-xl text-white"
                            style={{ background: 'linear-gradient(135deg, #E8420A, #CC1C1C)' }}
                          >
                            {char.avatar?.charAt(0) || char.name.charAt(0)}
                          </div>
                          <h3 className="font-semibold text-white text-sm truncate">{char.name}</h3>
                        </div>
                      </GlowCard>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {storyworld.episodes && storyworld.episodes.length > 0 && (
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
              <ScrollReveal>
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6">Episodes</h2>
              </ScrollReveal>
              <div className="space-y-3">
                {storyworld.episodes.map((episode, index) => (
                  <Link key={episode.id} href={`/watch/${episode.id}`}>
                    <motion.div
                      className="az-glass p-4 flex gap-4 cursor-pointer transition-all hover:scale-[1.01]"
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
                          className="w-[120px] h-[68px] object-cover rounded flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white text-sm truncate">
                          {episode.title}
                        </h3>
                        <p className="text-xs text-white/50 mt-1 line-clamp-1">
                          {episode.description}
                        </p>
                      </div>
                      <div className="flex items-center">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: 'rgba(232,66,10,0.2)' }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="#E8420A">
                            <polygon points="5,3 19,12 5,21" />
                          </svg>
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      <AppFooter />
    </div>
  );
}

const LazyStoryworldDetail = lazy(() => Promise.resolve({ default: StoryworldDetailContent }));

export default function StoryworldDetailPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--brand-near-black)]">
          <p className="text-white/50 text-lg">Loading...</p>
        </div>
      }
    >
      <LazyStoryworldDetail />
    </Suspense>
  );
}
