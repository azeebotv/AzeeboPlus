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
    <PageShell activeNav="Vertical" maxWidth="2xl">
      {isLoading ? (
        <Skeleton height="500px" borderRadius="16px" />
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
          <div className="relative mb-6 h-[400px] overflow-hidden rounded-az-panel border border-az-glass-border sm:h-[500px]">
            <OptimizedImage
              src={lore.thumbnail}
              alt={lore.title}
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
                  <Link href="/vertical/lore" className="az-caption text-az-flame hover:underline">
                    Lore Explorer
                  </Link>
                  {lore.category && (
                    <>
                      <span className="az-caption text-az-ink/30">/</span>
                      <span className="az-caption text-az-ink/60">{lore.category}</span>
                    </>
                  )}
                </div>
                <h1 className="az-heading mb-3 text-az-ink sm:az-display">{lore.title}</h1>
                {lore.universe && <p className="az-lead text-az-ink/60">{lore.universe}</p>}
              </motion.div>
            </div>
          </div>
        </section>
      ) : null}

      {lore && (
        <section className="mx-auto max-w-4xl py-2 sm:py-4">
          <ScrollReveal>
            <div className="max-w-none">
              <p className="az-lead leading-relaxed text-az-ink/70">{lore.description}</p>
              <div className="az-lead mt-8 leading-relaxed whitespace-pre-wrap text-az-ink/60">
                {lore.content}
              </div>
            </div>
          </ScrollReveal>

          {lore.relatedContent && lore.relatedContent.length > 0 && (
            <div className="mt-12">
              <ScrollReveal>
                <h2 className="az-section-title mb-6 text-az-ink">Related Content</h2>
              </ScrollReveal>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {lore.relatedContent.map((item) => (
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

const LazyLoreDetail = lazy(() => Promise.resolve({ default: LoreDetailContent }));

export default function LoreDetailPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-az-surface-root">
          <p className="az-lead text-az-ink-muted">Loading...</p>
        </div>
      }
    >
      <LazyLoreDetail />
    </Suspense>
  );
}
