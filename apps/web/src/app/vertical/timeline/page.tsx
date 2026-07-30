'use client';
import { Suspense, lazy, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
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
    <div className="min-h-screen" style={{ backgroundColor: 'var(--brand-near-black)' }}>
      <AppHeader active="Vertical" />

      <section
        className="relative py-16 sm:py-20"
        style={{ background: 'linear-gradient(135deg, var(--brand-orange) 0%, var(--brand-red) 100%)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1
            className="text-4xl sm:text-5xl font-bold text-white mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Timeline
          </motion.h1>
          <motion.p
            className="text-xl text-white/80 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            Trace the chronology of your favorite universes and characters
          </motion.p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <ScrollReveal>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-8">Event History</h2>
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
              className="absolute left-4 sm:left-8 top-0 bottom-0 w-px"
              style={{ backgroundColor: 'rgba(232,66,10,0.3)' }}
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
                    className="absolute left-2 sm:left-6 top-6 w-4 h-4 rounded-full border-2"
                    style={{
                      backgroundColor: 'var(--brand-orange)',
                      borderColor: '#1A0A0A',
                      boxShadow: '0 0 10px rgba(232,66,10,0.5)',
                    }}
                  />
                  <GlowCard universe="vertical">
                    <div className="p-5">
                      <span className="text-xs text-[#E8420A] font-semibold">{event.date}</span>
                      {event.universe && (
                        <span className="text-xs text-white/40 ml-2">· {event.universe}</span>
                      )}
                      <h3 className="text-lg font-bold text-white mt-2">{event.title}</h3>
                      <p className="text-sm text-white/50 mt-2">{event.description}</p>
                      <Link
                        href={`/vertical/lore/${event.slug}`}
                        className="inline-block mt-3 text-sm text-[#E8420A] hover:underline"
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
          <div className="text-center py-12">
            <p className="text-lg text-white/50">No timeline events available</p>
          </div>
        )}
      </section>

      <AppFooter />
    </div>
  );
}

const LazyTimelinePage = lazy(() => Promise.resolve({ default: TimelinePageContent }));

export const metadata = {
  title: 'Timeline | Azeebo',
  description: 'Trace the chronology of your favorite universes and characters.',
  openGraph: {
    title: 'Timeline | Azeebo',
    description: 'Trace the chronology of your favorite universes and characters.',
  },
};

export default function TimelinePage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#1A0A0A]">
          <p className="text-white/50 text-lg">Loading...</p>
        </div>
      }
    >
      <LazyTimelinePage />
    </Suspense>
  );
}
