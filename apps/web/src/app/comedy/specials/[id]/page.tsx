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
    <div className="min-h-screen" style={{ backgroundColor: 'var(--brand-near-black)' }}>
      <AppHeader active="Comedy" />

      {isLoading ? (
        <Skeleton height="500px" borderRadius="0" />
      ) : error ? (
        <div className="h-[500px] flex items-center justify-center">
          <ErrorState
            title="Failed to load special"
            description={error}
            onButtonPress={() => specialQuery.refetch()}
          />
        </div>
      ) : special ? (
        <section className="relative">
          <div className="relative h-[500px]">
            <OptimizedImage
              src={special.thumbnail}
              alt={special.title}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1A0A0A] via-[#1A0A0A]/60 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-8 max-w-7xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <span
                    className="px-3 py-1 rounded-full text-xs font-semibold"
                    style={{ backgroundColor: 'rgba(232,66,10,0.2)', color: '#E8420A' }}
                  >
                    Special
                  </span>
                  {special.duration && (
                    <span className="text-sm text-white/60">
                      {Math.floor(special.duration / 60)} min
                    </span>
                  )}
                </div>
                <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3">{special.title}</h1>
                {special.comedian && (
                  <Link
                    href={`/comedy/comedians/${special.comedian.id}`}
                    className="text-white/60 text-lg hover:text-[#E8420A] transition-colors"
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
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
          <ScrollReveal>
            <div className="flex items-center gap-4 mb-8">
              <Link href={`/watch/${special.id}`}>
                <motion.button
                  type="button"
                  className="px-8 py-3 rounded-full text-sm font-semibold text-white transition-all"
                  style={{ backgroundColor: 'var(--brand-orange)' }}
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
                    className="px-6 py-3 rounded-full text-sm font-semibold text-white transition-all"
                    style={{
                      border: '1px solid rgba(255,255,255,0.2)',
                      backgroundColor: 'rgba(255,255,255,0.08)',
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    View Comedian
                  </motion.button>
                </Link>
              )}
            </div>

            <p className="text-white/70 text-lg leading-relaxed">{special.description}</p>

            {special.releaseDate && (
              <p className="text-sm text-white/40 mt-4">Released: {special.releaseDate}</p>
            )}
          </ScrollReveal>

          {related.length > 0 && (
            <div className="mt-12">
              <ScrollReveal>
                <h2 className="text-2xl font-bold text-white mb-6">More Comedy</h2>
              </ScrollReveal>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {related.map((item) => (
                  <Link key={item.id} href={`/watch/${item.id}`}>
                    <GlowCard universe="comedy" className="overflow-hidden group">
                      <OptimizedImage
                        src={item.thumbnail}
                        alt={item.title}
                        width={400}
                        height={120}
                        className="w-full h-32 object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="p-3">
                        <h3 className="font-semibold text-white text-sm truncate">{item.title}</h3>
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

const LazySpecialDetail = lazy(() => Promise.resolve({ default: SpecialDetailContent }));

export default function SpecialDetailPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#1A0A0A]">
          <p className="text-white/50 text-lg">Loading...</p>
        </div>
      }
    >
      <LazySpecialDetail />
    </Suspense>
  );
}
