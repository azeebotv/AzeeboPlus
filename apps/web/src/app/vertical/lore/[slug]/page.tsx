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

interface LoreDetail {
  id: string;
  title: string;
  description: string;
  content: string;
  thumbnail: string;
  slug: string;
  category?: string;
  universe?: string;
  relatedContent?: ContentItem[];
}

function LoreDetailContent(): React.JSX.Element {
  const params = useParams();
  const slug = params.slug as string;

  useEffect(() => {
    analytics.pageView('vertical-lore-detail');
  }, []);

  const loreQuery = useQuery({
    queryKey: ['vertical-lore', slug],
    queryFn: async () => {
      if (!slug) throw new Error('Lore slug is required');
      const res = await api.request<LoreDetail>(`/api/v1/vertical/lore/${slug}`);
      if (res.success && res.data) return res.data;
      throw new Error(res.message || 'Failed to load lore entry');
    },
    enabled: !!slug,
    staleTime: 60000,
  });

  const lore = loreQuery.data;
  const isLoading = loreQuery.isLoading;
  const error = loreQuery.error?.message;

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--brand-near-black)' }}>
      <AppHeader active="Vertical" />

      {isLoading ? (
        <Skeleton height="500px" borderRadius="0" />
      ) : error ? (
        <div className="h-[500px] flex items-center justify-center">
          <ErrorState
            title="Failed to load lore"
            description={error}
            onButtonPress={() => loreQuery.refetch()}
          />
        </div>
      ) : lore ? (
        <section className="relative">
          <div className="relative h-[500px]">
            <OptimizedImage
              src={lore.thumbnail}
              alt={lore.title}
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
                  <Link
                    href="/vertical/lore"
                    className="text-sm text-[var(--brand-orange)] hover:underline"
                  >
                    Lore Explorer
                  </Link>
                  {lore.category && (
                    <>
                      <span className="text-white/30">/</span>
                      <span className="text-sm text-white/60">{lore.category}</span>
                    </>
                  )}
                </div>
                <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3">{lore.title}</h1>
                {lore.universe && <p className="text-white/60 text-lg">{lore.universe}</p>}
              </motion.div>
            </div>
          </div>
        </section>
      ) : null}

      {lore && (
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
          <ScrollReveal>
            <div className="prose prose-invert max-w-none">
              <p className="text-white/70 text-lg leading-relaxed">{lore.description}</p>
              <div className="mt-8 text-white/60 leading-relaxed whitespace-pre-wrap">
                {lore.content}
              </div>
            </div>
          </ScrollReveal>

          {lore.relatedContent && lore.relatedContent.length > 0 && (
            <div className="mt-12">
              <ScrollReveal>
                <h2 className="text-2xl font-bold text-white mb-6">Related Content</h2>
              </ScrollReveal>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {lore.relatedContent.map((item) => (
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

const LazyLoreDetail = lazy(() => Promise.resolve({ default: LoreDetailContent }));

export default function LoreDetailPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--brand-near-black)]">
          <p className="text-white/50 text-lg">Loading...</p>
        </div>
      }
    >
      <LazyLoreDetail />
    </Suspense>
  );
}
