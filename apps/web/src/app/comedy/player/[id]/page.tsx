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
    <div className="min-h-screen" style={{ backgroundColor: '#1A0A0A' }}>
      <AppHeader active="Comedy" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
              className="relative rounded-xl overflow-hidden mb-6"
              style={{ backgroundColor: '#000', aspectRatio: '16/9' }}
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
                    <div
                      className="w-20 h-20 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: 'rgba(232,66,10,0.9)' }}
                    >
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="#fff">
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
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">{clip.title}</h1>
              <div className="flex items-center gap-4 text-sm text-white/50 mb-4">
                {clip.views != null && <span>{clip.views.toLocaleString()} views</span>}
                {clip.duration && (
                  <span>{Math.floor(clip.duration / 60)}:{(clip.duration % 60).toString().padStart(2, '0')}</span>
                )}
              </div>
              <p className="text-white/60 leading-relaxed">{clip.description}</p>
            </motion.div>

            {/* Related Clips */}
            {related.length > 0 && (
              <div className="mt-10">
                <ScrollReveal>
                  <h2 className="text-xl font-bold text-white mb-5">More Comedy Clips</h2>
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
                          <div className="absolute inset-0 bg-gradient-to-t from-[#1A0A0A]/80 to-transparent" />
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center"
                              style={{ backgroundColor: 'rgba(255,255,255,0.9)' }}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="#E8420A">
                                <polygon points="5,3 19,12 5,21" />
                              </svg>
                            </div>
                          </div>
                        </div>
                        <div className="p-3">
                          <h3 className="font-semibold text-white text-sm truncate">{item.title}</h3>
                          <p className="text-xs text-white/40 mt-1">
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

      <AppFooter />
    </div>
  );
}

const LazyClipPlayer = lazy(() => Promise.resolve({ default: ClipPlayerContent }));

export default function ClipPlayerPage(): React.JSX.Element {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#1A0A0A]"><p className="text-white/50 text-lg">Loading...</p></div>}>
      <LazyClipPlayer />
    </Suspense>
  );
}
