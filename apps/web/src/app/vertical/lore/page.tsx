'use client';
import { Suspense, lazy, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import PageShell from '@/components/layout/PageShell';
import PageHero from '@/components/layout/PageHero';
import { OptimizedImage } from '@/components/OptimizedImage';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { GlowCard } from '@/components/motion/GlowCard';
import analytics from '@/lib/analytics';

interface LoreEntry {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  slug: string;
  category?: string;
}

function LorePageContent(): React.JSX.Element {
  useEffect(() => {
    analytics.pageView('vertical-lore');
  }, []);

  const loreQuery = useQuery({
    queryKey: ['vertical-lore'],
    queryFn: async () => {
      const res = await api.request<LoreEntry[]>('/api/v1/vertical/lore');
      if (res.success && res.data) return res.data;
      throw new Error(res.message || 'Failed to load lore entries');
    },
    staleTime: 60000,
  });

  const lore: LoreEntry[] = loreQuery.data ?? [];
  const isLoading = loreQuery.isLoading;
  const error = loreQuery.error?.message;

  return (
    <PageShell activeNav="Vertical">
      <PageHero
        eyebrow="Vertical Universe"
        title="Lore Explorer"
        subtitle="Discover the rich backstories, lore, and mythology behind your favorite shows"
      />

      <section className="py-2 sm:py-4">
        <ScrollReveal>
          <h2 className="az-section-title mb-6 text-az-ink sm:mb-8">Lore Entries</h2>
        </ScrollReveal>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="az-glass overflow-hidden">
                <Skeleton height="200px" borderRadius="0" />
                <div className="space-y-3 p-4">
                  <Skeleton height="20px" width="70%" />
                  <Skeleton height="16px" width="90%" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <ErrorState
            title="Failed to load lore"
            description={error}
            onButtonPress={() => loreQuery.refetch()}
          />
        ) : lore.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {lore.map((entry, index) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Link href={`/vertical/lore/${entry.slug}`}>
                  <GlowCard universe="vertical" className="overflow-hidden">
                    <div className="relative">
                      <OptimizedImage
                        src={entry.thumbnail}
                        alt={entry.title}
                        width={400}
                        height={160}
                        className="h-40 w-full object-cover"
                      />
                      <div className="absolute inset-0 az-scrim" />
                      {entry.category && (
                        <span className="az-caption absolute top-2 right-2 rounded-az-pill bg-az-scarlet/90 px-2.5 py-0.5 text-az-ink">
                          {entry.category}
                        </span>
                      )}
                      <div className="absolute bottom-3 left-3 right-3">
                        <h3 className="az-subtitle text-az-ink">{entry.title}</h3>
                      </div>
                    </div>
                    <div className="p-4">
                      <p className="az-caption line-clamp-3 text-az-ink/50">{entry.description}</p>
                      <span className="az-body-strong mt-3 inline-block text-az-flame">
                        Explore →
                      </span>
                    </div>
                  </GlowCard>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className="az-lead text-az-ink/50">No lore entries available</p>
          </div>
        )}
      </section>
    </PageShell>
  );
}

const LazyLorePage = lazy(() => Promise.resolve({ default: LorePageContent }));

export default function LorePage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-az-surface-root">
          <p className="az-lead text-az-ink-muted">Loading...</p>
        </div>
      }
    >
      <LazyLorePage />
    </Suspense>
  );
}
