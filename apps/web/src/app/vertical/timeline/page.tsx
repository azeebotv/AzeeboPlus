'use client';
import { Suspense, lazy, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import PageShell from '@/components/layout/PageShell';
import PageHero from '@/components/layout/PageHero';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { GlowCard } from '@/components/motion/GlowCard';
import analytics from '@/lib/analytics';

interface TimelineEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  universe?: string;
  thumbnail?: string;
  slug: string;
}

function TimelinePageContent(): React.JSX.Element {
  useEffect(() => {
    analytics.pageView('vertical-timeline');
  }, []);

  const eventsQuery = useQuery({
    queryKey: ['vertical-timeline'],
    queryFn: async () => {
      const res = await api.request<TimelineEvent[]>('/api/v1/vertical/timeline');
      if (res.success && res.data) return res.data;
      throw new Error(res.message || 'Failed to load timeline events');
    },
    staleTime: 60000,
  });

  const events: TimelineEvent[] = eventsQuery.data ?? [];
  const isLoading = eventsQuery.isLoading;
  const error = eventsQuery.error?.message;

  return (
    <PageShell activeNav="Vertical" maxWidth="md">
      <PageHero
        eyebrow="Vertical Universe"
        title="Timeline"
        subtitle="Trace the chronology of your favorite universes and characters"
      />

      <section className="py-2 sm:py-4">
        <ScrollReveal>
          <h2 className="az-section-title mb-8 text-az-ink">Event History</h2>
        </ScrollReveal>

        {isLoading ? (
          <div className="space-y-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="az-glass p-6">
                <Skeleton height="24px" width="40%" />
                <Skeleton height="16px" width="80%" className="mt-3" />
                <Skeleton height="16px" width="60%" className="mt-2" />
              </div>
            ))}
          </div>
        ) : error ? (
          <ErrorState
            title="Failed to load timeline"
            description={error}
            onButtonPress={() => eventsQuery.refetch()}
          />
        ) : events.length > 0 ? (
          <div className="relative">
            <div
              className="absolute left-4 top-0 bottom-0 w-px bg-az-scarlet/30 sm:left-8"
              aria-hidden="true"
            />
            <div className="space-y-8">
              {events.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="relative pl-12 sm:pl-20"
                >
                  <div
                    className="absolute left-2 top-6 size-4 rounded-full border-2 border-az-surface-root bg-az-flame shadow-az-glow sm:left-6"
                    aria-hidden="true"
                  />
                  <GlowCard universe="vertical">
                    <div className="p-5">
                      <span className="az-overline text-az-flame">{event.date}</span>
                      {event.universe && (
                        <span className="az-caption ml-2 text-az-ink/40">· {event.universe}</span>
                      )}
                      <h3 className="az-subtitle mt-2 text-az-ink">{event.title}</h3>
                      <p className="az-body mt-2 text-az-ink/50">{event.description}</p>
                      <Link
                        href={`/vertical/lore/${event.slug}`}
                        className="az-body-strong mt-3 inline-block text-az-flame hover:underline"
                      >
                        Read more →
                      </Link>
                    </div>
                  </GlowCard>
                </motion.div>
              ))}
            </div>
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className="az-lead text-az-ink/50">No timeline events available</p>
          </div>
        )}
      </section>
    </PageShell>
  );
}

const LazyTimelinePage = lazy(() => Promise.resolve({ default: TimelinePageContent }));

export default function TimelinePage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-az-surface-root">
          <p className="az-lead text-az-ink-muted">Loading...</p>
        </div>
      }
    >
      <LazyTimelinePage />
    </Suspense>
  );
}
