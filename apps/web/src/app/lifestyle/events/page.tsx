'use client';
import { Suspense, lazy, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { OptimizedImage } from '@/components/OptimizedImage';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { GlowCard } from '@/components/motion/GlowCard';
import analytics from '@/lib/analytics';

interface Event {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  date: string;
  venue: string;
  city?: string;
  category?: string;
  isVirtual?: boolean;
  price?: number;
  capacity?: number;
  rsvpCount?: number;
}

function EventsPageContent(): React.JSX.Element {
  const [rsvped, setRsvped] = useState<Set<string>>(new Set());

  useEffect(() => {
    analytics.pageView('lifestyle-events');
  }, []);

  const eventsQuery = useQuery({
    queryKey: ['lifestyle-events'],
    queryFn: async () => {
      const res = await api.request<Event[]>('/api/v1/lifestyle/events');
      if (res.success && res.data) return res.data;
      throw new Error(res.message || 'Failed to load events');
    },
    staleTime: 30000,
  });

  const events: Event[] = eventsQuery.data ?? [];
  const isLoading = eventsQuery.isLoading;
  const error = eventsQuery.error?.message;

  const handleRsvp = (eventId: string) => {
    setRsvped((prev) => {
      const next = new Set(prev);
      if (next.has(eventId)) {
        next.delete(eventId);
      } else {
        next.add(eventId);
      }
      return next;
    });
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#1A0A0A' }}>
      <AppHeader active="Lifestyle" />

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
            Lifestyle Events
          </motion.h1>
          <motion.p
            className="text-xl text-white/80 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            Discover exciting events, experiences, and happenings across Africa
          </motion.p>
        </div>
      </section>

      {/* Events Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <ScrollReveal>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6 sm:mb-8">
            Upcoming Events
          </h2>
        </ScrollReveal>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="az-glass overflow-hidden">
                <Skeleton height="200px" borderRadius="0" />
                <div className="p-4 space-y-3">
                  <Skeleton height="20px" width="70%" />
                  <Skeleton height="16px" width="50%" />
                  <Skeleton height="36px" borderRadius="0" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <ErrorState
            title="Failed to load events"
            description={error}
            onButtonPress={() => eventsQuery.refetch()}
          />
        ) : events.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <GlowCard universe="lifestyle" className="overflow-hidden">
                  <div className="relative">
                    <OptimizedImage
                      src={event.thumbnail}
                      alt={event.title}
                      width={400}
                      height={160}
                      className="w-full h-40 object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1A0A0A]/80 to-transparent" />
                    <div className="absolute top-2 right-2 flex gap-2">
                      {event.isVirtual && (
                        <span
                          className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                          style={{ backgroundColor: 'rgba(59,130,246,0.9)', color: '#fff' }}
                        >
                          Virtual
                        </span>
                      )}
                      {event.category && (
                        <span
                          className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                          style={{ backgroundColor: 'rgba(232,66,10,0.9)', color: '#fff' }}
                        >
                          {event.category}
                        </span>
                      )}
                    </div>
                    <div className="absolute bottom-3 left-3">
                      <h3 className="text-lg font-bold text-white">{event.title}</h3>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-2 text-xs text-white/50 mb-2">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      {new Date(event.date).toLocaleDateString('en-NG', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                      {' at '}
                      {new Date(event.date).toLocaleTimeString('en-NG', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-white/50 mb-3">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      {event.venue}
                      {event.city && `, ${event.city}`}
                    </div>
                    <p className="text-sm text-white/50 mb-4 line-clamp-2">{event.description}</p>
                    <div className="flex items-center justify-between">
                      {event.price != null ? (
                        <span className="text-sm font-bold text-white">
                          {event.price === 0 ? 'Free' : `₦${event.price.toLocaleString()}`}
                        </span>
                      ) : (
                        <span />
                      )}
                      <motion.button
                        type="button"
                        onClick={() => handleRsvp(event.id)}
                        className="px-4 py-2 rounded-full text-xs font-semibold transition-all"
                        style={{
                          backgroundColor: rsvped.has(event.id) ? '#4ADE80' : '#E8420A',
                          color: rsvped.has(event.id) ? '#0D3B2E' : '#fff',
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {rsvped.has(event.id) ? 'Going ✓' : 'RSVP'}
                      </motion.button>
                    </div>
                  </div>
                </GlowCard>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-lg text-white/50">No events available</p>
          </div>
        )}
      </section>

      <AppFooter />
    </div>
  );
}

const LazyEventsPage = lazy(() => Promise.resolve({ default: EventsPageContent }));

export default function EventsPage(): React.JSX.Element {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#1A0A0A]"><p className="text-white/50 text-lg">Loading...</p></div>}>
      <LazyEventsPage />
    </Suspense>
  );
}
