'use client';
import { Suspense, lazy, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { OptimizedImage } from '@/components/OptimizedImage';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { GlowCard } from '@/components/motion/GlowCard';
import analytics from '@/lib/analytics';

interface Storyworld {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  episodeCount?: number;
  genre?: string;
  isComplete?: boolean;
}

function StoryworldsPageContent(): React.JSX.Element {
  useEffect(() => {
    analytics.pageView('vertical-storyworlds');
  }, []);

  const storyworldsQuery = useQuery({
    queryKey: ['storyworlds'],
    queryFn: async () => {
      const res = await api.request<Storyworld[]>('/api/v1/vertical/storyworlds');
      if (res.success && res.data) return res.data;
      throw new Error(res.message || 'Failed to load storyworlds');
    },
    staleTime: 60000,
  });

  const storyworlds: Storyworld[] = storyworldsQuery.data ?? [];
  const isLoading = storyworldsQuery.isLoading;
  const error = storyworldsQuery.error?.message;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#1A0A0A' }}>
      <AppHeader active="Vertical" />

      {/* Hero */}
      <section
        className="relative py-16 sm:py-20"
        style={{ background: 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1
            className="text-4xl sm:text-5xl font-bold text-white mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Storyworlds
          </motion.h1>
          <motion.p
            className="text-xl text-white/80 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            Dive into immersive story universes with interconnected characters and plotlines
          </motion.p>
        </div>
      </section>

      {/* Storyworlds Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <ScrollReveal>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6 sm:mb-8">
            Explore Storyworlds
          </h2>
        </ScrollReveal>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="az-glass overflow-hidden">
                <Skeleton height="200px" borderRadius="0" />
                <div className="p-4 space-y-3">
                  <Skeleton height="20px" width="70%" />
                  <Skeleton height="16px" width="90%" />
                  <Skeleton height="36px" borderRadius="0" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <ErrorState
            title="Failed to load storyworlds"
            description={error}
            onButtonPress={() => storyworldsQuery.refetch()}
          />
        ) : storyworlds.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {storyworlds.map((world, index) => (
              <motion.div
                key={world.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Link href={`/vertical/storyworlds/${world.id}`}>
                  <GlowCard universe="vertical" className="overflow-hidden">
                    <div className="relative">
                      <OptimizedImage
                        src={world.thumbnail}
                        alt={world.title}
                        width={400}
                        height={160}
                        className="w-full h-40 object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#1A0A0A]/80 to-transparent" />
                      <div className="absolute top-2 right-2 flex gap-2">
                        {world.isComplete && (
                          <span
                            className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                            style={{ backgroundColor: 'rgba(34,197,94,0.9)', color: '#fff' }}
                          >
                            Complete
                          </span>
                        )}
                        {world.genre && (
                          <span
                            className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                            style={{ backgroundColor: 'rgba(232,66,10,0.9)', color: '#fff' }}
                          >
                            {world.genre}
                          </span>
                        )}
                      </div>
                      <div className="absolute bottom-3 left-3 right-3">
                        <h3 className="text-lg font-bold text-white">{world.title}</h3>
                      </div>
                    </div>
                    <div className="p-4">
                      <p className="text-sm text-white/50 mb-3 line-clamp-3">{world.description}</p>
                      <div className="flex items-center justify-between text-xs text-white/40">
                        {world.episodeCount != null && (
                          <span>{world.episodeCount} episodes</span>
                        )}
                        <span className="text-[#E8420A] font-medium">Explore →</span>
                      </div>
                    </div>
                  </GlowCard>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-lg text-white/50">No storyworlds available</p>
          </div>
        )}
      </section>

      <AppFooter />
    </div>
  );
}

const LazyStoryworldsPage = lazy(() => Promise.resolve({ default: StoryworldsPageContent }));

export default function StoryworldsPage(): React.JSX.Element {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#1A0A0A]"><p className="text-white/50 text-lg">Loading...</p></div>}>
      <LazyStoryworldsPage />
    </Suspense>
  );
}
