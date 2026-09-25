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
    <div className="min-h-screen" style={{ backgroundColor: 'var(--brand-near-black)' }}>
      <AppHeader active="Vertical" />

      {isLoading ? (
        <Skeleton height="500px" borderRadius="0" />
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
          <div className="relative h-[500px]">
            <OptimizedImage
              src={crossover.thumbnail}
              alt={crossover.title}
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
                  <span
                    className="px-3 py-1 rounded-full text-xs font-semibold"
                    style={{ backgroundColor: 'rgba(232,66,10,0.2)', color: 'var(--brand-orange)' }}
                  >
                    Crossover Event
                  </span>
                </div>
                <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3">
                  {crossover.title}
                </h1>
                <div className="flex flex-wrap gap-2">
                  {crossover.universes.map((universe) => (
                    <span
                      key={universe}
                      className="px-2.5 py-0.5 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        color: 'var(--brand-white)',
                      }}
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
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
          <ScrollReveal>
            <p className="text-white/70 text-lg leading-relaxed mb-8">{crossover.description}</p>
            <div className="text-white/60 leading-relaxed whitespace-pre-wrap">
              {crossover.content}
            </div>
          </ScrollReveal>

          {crossover.characters && crossover.characters.length > 0 && (
            <div className="mt-12">
              <ScrollReveal>
                <h2 className="text-2xl font-bold text-white mb-6">Featured Characters</h2>
              </ScrollReveal>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {crossover.characters.map((char) => (
                  <GlowCard key={char.name} universe="vertical">
                    <div className="p-4 text-center">
                      <div
                        className="w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center font-bold text-lg text-white"
                        style={{ background: 'linear-gradient(135deg, #E8420A, #CC1C1C)' }}
                      >
                        {char.name.charAt(0)}
                      </div>
                      <h3 className="font-semibold text-white text-sm">{char.name}</h3>
                      <p className="text-xs text-white/40 mt-1">{char.universe}</p>
                    </div>
                  </GlowCard>
                ))}
              </div>
            </div>
          )}

          {crossover.relatedContent && crossover.relatedContent.length > 0 && (
            <div className="mt-12">
              <ScrollReveal>
                <h2 className="text-2xl font-bold text-white mb-6">Related Content</h2>
              </ScrollReveal>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {crossover.relatedContent.map((item) => (
                  <Link key={item.id} href={`/watch/${item.id}`}>
                    <GlowCard universe="vertical" className="overflow-hidden">
                      <OptimizedImage
                        src={item.thumbnail}
                        alt={item.title}
                        width={400}
                        height={120}
                        className="w-full h-32 object-cover"
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

const LazyCrossoverDetail = lazy(() => Promise.resolve({ default: CrossoverDetailContent }));

export default function CrossoverDetailPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--brand-near-black)]">
          <p className="text-white/50 text-lg">Loading...</p>
        </div>
      }
    >
      <LazyCrossoverDetail />
    </Suspense>
  );
}
