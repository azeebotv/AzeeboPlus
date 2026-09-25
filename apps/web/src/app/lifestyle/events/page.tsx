'use client';

import { Suspense, lazy, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import { PageShell } from '@/components/layout/PageShell';
import { PageHero } from '@/components/layout/PageHero';
import { OptimizedImage } from '@/components/OptimizedImage';
import { GlowCard } from '@/components/motion/GlowCard';
import { Calendar, MapPin, Check, ArrowLeft, Sparkles, Clock, Globe } from 'lucide-react';
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
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

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

  const categories = ['All', ...Array.from(new Set(events.map((e) => e.category).filter(Boolean)))];

  const filteredEvents = events.filter((e) => {
    if (selectedCategory === 'All') return true;
    return e.category === selectedCategory;
  });

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
    <PageShell glowColor="rgba(232,66,10,0.15)">
      <PageHero
        badge="Live Experiences"
        title="Lifestyle Events & Galas"
        description="Exclusive red-carpet premieres, cultural festivals, tech-fashion summits, and intimate concerts across Africa."
      />

      <div className="max-w-7xl mx-auto py-4 -mt-4 px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Link
            href="/lifestyle"
            className="inline-flex items-center gap-2 text-xs font-semibold text-white/50 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Lifestyle Hub
          </Link>

          {categories.length > 1 && (
            <div className="flex flex-wrap items-center gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat as string)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                    selectedCategory === cat
                      ? 'bg-[var(--brand-orange)] text-white shadow-lg shadow-[var(--brand-orange)]/25 font-bold'
                      : 'az-glass text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="az-glass rounded-2xl overflow-hidden p-4 space-y-3">
                <Skeleton className="aspect-video w-full rounded-xl" />
                <Skeleton className="h-5 w-3/4 rounded-md" />
                <Skeleton className="h-4 w-1/2 rounded-md" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="max-w-md mx-auto py-12">
            <ErrorState
              title="Failed to load events"
              description={error}
              onButtonPress={() => eventsQuery.refetch()}
            />
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="az-glass p-16 text-center rounded-3xl border border-white/10 max-w-md mx-auto">
            <Sparkles className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">No Upcoming Events</h3>
            <p className="text-xs text-white/50">
              Check back soon for announcements on new galas, concerts, and premier experiences.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event, index) => {
              const isGoing = rsvped.has(event.id);
              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                >
                  <GlowCard universe="lifestyle" className="overflow-hidden rounded-2xl border border-white/10 flex flex-col h-full">
                    <div className="relative aspect-video bg-white/5">
                      <OptimizedImage
                        src={event.thumbnail}
                        alt={event.title}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      <div className="absolute top-2.5 right-2.5 flex gap-1.5">
                        {event.isVirtual && (
                          <span className="px-2 py-0.5 rounded-full bg-blue-500/80 backdrop-blur-sm text-white text-[10px] font-semibold flex items-center gap-1">
                            <Globe className="w-2.5 h-2.5" />
                            Virtual
                          </span>
                        )}
                        {event.category && (
                          <span className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-sm text-[var(--brand-orange)] border border-[var(--brand-orange)]/30 text-[10px] font-mono font-bold uppercase">
                            {event.category}
                          </span>
                        )}
                      </div>
                      <div className="absolute bottom-3 left-3 right-3">
                        <h3 className="text-base font-bold text-white line-clamp-1">{event.title}</h3>
                      </div>
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs text-white/60">
                          <Calendar className="w-3.5 h-3.5 text-[var(--brand-orange)]" />
                          <span>
                            {new Date(event.date).toLocaleDateString('en-NG', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                          <span className="text-white/30">•</span>
                          <Clock className="w-3.5 h-3.5 text-white/40" />
                          <span>
                            {new Date(event.date).toLocaleTimeString('en-NG', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-white/60">
                          <MapPin className="w-3.5 h-3.5 text-white/40" />
                          <span className="truncate">
                            {event.venue}
                            {event.city && `, ${event.city}`}
                          </span>
                        </div>
                        <p className="text-xs text-white/50 line-clamp-2 pt-1">{event.description}</p>
                      </div>

                      <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                        <div>
                          {event.price != null ? (
                            <span className="text-sm font-bold text-white">
                              {event.price === 0 ? 'Free' : `₦${event.price.toLocaleString()}`}
                            </span>
                          ) : (
                            <span className="text-xs text-white/40 font-mono">Invite Only</span>
                          )}
                        </div>
                        <motion.button
                          type="button"
                          onClick={() => handleRsvp(event.id)}
                          className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                            isGoing
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-[var(--brand-orange)] text-white hover:bg-[var(--brand-orange)]/90 shadow-md shadow-[var(--brand-orange)]/25'
                          }`}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {isGoing ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              Going
                            </>
                          ) : (
                            'RSVP'
                          )}
                        </motion.button>
                      </div>
                    </div>
                  </GlowCard>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </PageShell>
  );
}

const LazyEventsPage = lazy(() => Promise.resolve({ default: EventsPageContent }));

export default function EventsPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--brand-near-black)]">
          <p className="text-white/50 text-lg">Loading...</p>
        </div>
      }
    >
      <LazyEventsPage />
    </Suspense>
  );
}
