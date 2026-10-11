'use client';
import { Suspense, lazy, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import { PageShell } from '@/components/layout/PageShell';
import { PageHero } from '@/components/layout/PageHero';
import { OptimizedImage } from '@/components/OptimizedImage';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { StaggerGrid } from '@/components/motion/StaggerGrid';
import analytics from '@/lib/analytics';

interface Comedian {
  id: string;
  name: string;
  avatar: string;
  bio?: string;
  contentCount?: number;
  specialCount?: number;
}

function ComediansPageContent(): React.JSX.Element {
  useEffect(() => {
    analytics.pageView('comedy-comedians');
  }, []);

  const comediansQuery = useQuery({
    queryKey: ['comedy-comedians'],
    queryFn: async () => {
      const res = await api.request<Comedian[]>('/api/v1/comedy/comedians');
      if (res.success && res.data) return res.data;
      throw new Error(res.message || 'Failed to load comedians');
    },
    staleTime: 300000,
  });

  const comedians: Comedian[] = comediansQuery.data ?? [];
  const isLoading = comediansQuery.isLoading;
  const error = comediansQuery.error?.message;

  return (
    <PageShell activeNav="Comedy">
      <PageHero
        eyebrow="Comedy"
        title="Comedians"
        subtitle="Discover Africa's funniest comedians and their latest content"
      />

      {/* Comedians Grid */}
      <section className="py-10 sm:py-12">
        <ScrollReveal>
          <h2 className="az-section-title mb-6 text-az-ink sm:mb-8">All Comedians</h2>
        </ScrollReveal>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="az-glass overflow-hidden text-center">
                <div className="p-6">
                  <Skeleton
                    width="80px"
                    height="80px"
                    borderRadius="50%"
                    className="mx-auto mb-3"
                  />
                  <Skeleton height="20px" width="60%" className="mx-auto mb-2" />
                  <Skeleton height="14px" width="40%" className="mx-auto" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <ErrorState
            title="Failed to load comedians"
            description={error}
            onButtonPress={() => comediansQuery.refetch()}
          />
        ) : comedians.length > 0 ? (
          <StaggerGrid className="grid grid-cols-2 gap-5 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4">
            {comedians.map((comedian) => (
              <Link key={comedian.id} href={`/comedy/comedians/${comedian.id}`}>
                <motion.div
                  className="az-glass cursor-pointer overflow-hidden text-center transition-all hover:scale-[1.02]"
                  whileHover={{ y: -4 }}
                >
                  <div className="p-6">
                    <div className="mx-auto mb-4 flex size-20 items-center justify-center overflow-hidden rounded-full bg-az-flame/20 sm:size-24">
                      {comedian.avatar ? (
                        <OptimizedImage
                          src={comedian.avatar}
                          alt={comedian.name}
                          width={96}
                          height={96}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="az-heading text-az-flame">{comedian.name.charAt(0)}</span>
                      )}
                    </div>
                    <h3 className="az-body-strong mb-1 text-az-ink">{comedian.name}</h3>
                    {comedian.bio && (
                      <p className="az-caption mb-2 line-clamp-2 text-az-ink-muted">
                        {comedian.bio}
                      </p>
                    )}
                    <div className="az-micro-label flex items-center justify-center gap-3 text-az-ink-muted">
                      {comedian.specialCount != null && (
                        <span>{comedian.specialCount} specials</span>
                      )}
                      {comedian.contentCount != null && <span>{comedian.contentCount} clips</span>}
                    </div>
                  </div>
                </motion.div>
              </Link>
            ))}
          </StaggerGrid>
        ) : (
          <div className="py-12 text-center">
            <p className="az-lead text-az-ink-muted">No comedians available yet</p>
          </div>
        )}
      </section>
    </PageShell>
  );
}

const LazyComediansPage = lazy(() => Promise.resolve({ default: ComediansPageContent }));

export default function ComediansPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-az-surface-root">
          <p className="az-lead text-az-ink-muted">Loading...</p>
        </div>
      }
    >
      <LazyComediansPage />
    </Suspense>
  );
}
