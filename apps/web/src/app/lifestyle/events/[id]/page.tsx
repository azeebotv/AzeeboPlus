'use client';
import { Suspense, lazy, useEffect, useState, useCallback } from 'react';

export const metadata = {
  title: 'Event Details | Azeebo',
  description: 'View event details, RSVP, and get tickets for lifestyle events on Azeebo.',
  openGraph: {
    title: 'Event Details | Azeebo',
    description: 'View event details, RSVP, and get tickets for lifestyle events on Azeebo.',
  },
};
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams } from 'next/navigation';
import Link from 'next/link';
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
  endDate?: string;
  venue: string;
  city?: string;
  country?: string;
  category?: string;
  isVirtual?: boolean;
  virtualLink?: string;
  price?: number;
  capacity?: number;
  rsvpCount?: number;
  organizer?: string;
  tags?: string[];
}

interface Attendee {
  id: string;
  name: string;
  avatar: string;
}

function EventDetailPageContent(): React.JSX.Element {
  const params = useParams();
  const id = params.id as string;
  const queryClient = useQueryClient();
  const [rsvped, setRsvped] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  useEffect(() => {
    analytics.pageView('lifestyle-event-detail');
  }, []);

  const eventQuery = useQuery({
    queryKey: ['lifestyle-event', id],
    queryFn: async () => {
      const res = await api.request<Event>(`/api/v1/lifestyle/events/${id}`);
      if (res.success && res.data) return res.data;
      throw new Error(res.message || 'Failed to load event');
    },
    enabled: !!id,
    staleTime: 30000,
  });

  const attendeesQuery = useQuery({
    queryKey: ['lifestyle-event-attendees', id],
    queryFn: async () => {
      const res = await api.request<Attendee[]>(`/api/v1/lifestyle/events/${id}/attendees`);
      if (res.success && res.data) return res.data;
      throw new Error(res.message || 'Failed to load attendees');
    },
    enabled: !!id,
    staleTime: 60000,
  });

  const rsvpMutation = useMutation({
    mutationFn: async () => {
      const res = await api.request(`/api/v1/lifestyle/events/${id}/rsvp`, {
        method: rsvped ? 'DELETE' : 'POST',
      });
      if (!res.success) throw new Error(res.message || 'Failed to update RSVP');
      return res.data;
    },
    onSuccess: () => {
      setRsvped(!rsvped);
      queryClient.invalidateQueries({ queryKey: ['lifestyle-event', id] });
      queryClient.invalidateQueries({ queryKey: ['lifestyle-event-attendees', id] });
    },
  });

  const event: Event | undefined = eventQuery.data;
  const attendees: Attendee[] = attendeesQuery.data ?? [];
  const isLoading = eventQuery.isLoading || attendeesQuery.isLoading;
  const error = eventQuery.error?.message;

  const handleRsvp = useCallback(() => {
    rsvpMutation.mutate();
  }, [rsvpMutation, rsvped]);

  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: event?.title,
          text: event?.description,
          url: window.location.href,
        });
      } catch {
        // User cancelled
      }
    } else {
      setShowShareMenu(!showShareMenu);
    }
  }, [event, showShareMenu]);

  const copyToClipboard = useCallback(async () => {
    await navigator.clipboard.writeText(window.location.href);
    setShowShareMenu(false);
  }, []);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      full: date.toLocaleDateString('en-NG', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      time: date.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' }),
    };
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--brand-near-black)' }}>
      <AppHeader active="Lifestyle" />

      {isLoading ? (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <Skeleton height="400px" borderRadius="0" className="mb-6" />
          <Skeleton height="40px" width="60%" className="mb-4" />
          <Skeleton height="20px" width="40%" className="mb-6" />
          <Skeleton height="150px" />
        </div>
      ) : error ? (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <ErrorState
            title="Failed to load event"
            description={error}
            onButtonPress={() => eventQuery.refetch()}
          />
        </div>
      ) : event ? (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
          <ScrollReveal>
            <div className="relative h-[300px] sm:h-[400px] mb-6 rounded-xl overflow-hidden">
              <OptimizedImage
                src={event.thumbnail}
                alt={event.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1A0A0A] via-[#1A0A0A]/30 to-transparent" />
              <div className="absolute top-4 left-4 flex gap-2">
                {event.isVirtual && (
                  <span
                    className="px-3 py-1 rounded-full text-xs font-semibold"
                    style={{ backgroundColor: 'rgba(59,130,246,0.9)', color: 'var(--brand-white)' }}
                  >
                    Virtual Event
                  </span>
                )}
                {event.category && (
                  <span
                    className="px-3 py-1 rounded-full text-xs font-semibold"
                    style={{ backgroundColor: 'rgba(232,66,10,0.9)', color: 'var(--brand-white)' }}
                  >
                    {event.category}
                  </span>
                )}
              </div>
              <div className="absolute bottom-4 right-4 flex gap-2">
                <motion.button
                  type="button"
                  onClick={handleShare}
                  className="px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2"
                  style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'var(--brand-white)' }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                  </svg>
                  Share
                </motion.button>
              </div>
              <AnimatePresence>
                {showShareMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute bottom-16 right-4 p-2 rounded-lg"
                    style={{
                      backgroundColor: 'var(--brand-near-black)',
                      border: '1px solid rgba(255,255,255,0.1)',
                    }}
                  >
                    <button
                      type="button"
                      onClick={copyToClipboard}
                      className="w-full px-4 py-2 text-left text-sm text-white hover:bg-white/10 rounded transition-colors"
                    >
                      Copy Link
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <ScrollReveal>
                <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">{event.title}</h1>
              </ScrollReveal>

              <ScrollReveal delay={0.1}>
                <div className="flex flex-wrap items-center gap-4 mb-6 text-sm text-white/60">
                  <div className="flex items-center gap-2">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    <span>{formatDate(event.date).full}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span>{formatDate(event.date).time}</span>
                  </div>
                </div>
              </ScrollReveal>

              <ScrollReveal delay={0.2}>
                <div className="flex items-center gap-2 mb-6 text-sm text-white/60">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <span>
                    {event.venue}
                    {event.city ? `, ${event.city}` : ''}
                    {event.country ? `, ${event.country}` : ''}
                  </span>
                  {event.venue && (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.venue)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#E8420A] hover:underline ml-2"
                    >
                      View on Map
                    </a>
                  )}
                </div>
              </ScrollReveal>

              <ScrollReveal delay={0.3}>
                <div className="az-glass p-6 rounded-xl mb-6">
                  <h2 className="text-lg font-bold text-white mb-4">About This Event</h2>
                  <p className="text-white/70 leading-relaxed whitespace-pre-wrap">
                    {event.description}
                  </p>
                </div>
              </ScrollReveal>

              {event.tags && event.tags.length > 0 && (
                <ScrollReveal delay={0.4}>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {event.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: 'rgba(255,255,255,0.05)',
                          color: 'rgba(255,255,255,0.6)',
                        }}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </ScrollReveal>
              )}
            </div>

            <div className="lg:col-span-1">
              <ScrollReveal direction="right">
                <div className="sticky top-24 space-y-6">
                  <GlowCard className="p-6">
                    <div className="text-center mb-4">
                      <p className="text-3xl font-bold text-white mb-1">
                        {event.price != null
                          ? event.price === 0
                            ? 'Free'
                            : `₦${event.price.toLocaleString()}`
                          : 'Free'}
                      </p>
                      <p className="text-sm text-white/50">per person</p>
                    </div>
                    <motion.button
                      type="button"
                      onClick={handleRsvp}
                      disabled={rsvpMutation.isPending}
                      className="w-full py-3 rounded-full text-sm font-semibold text-white transition-all disabled:opacity-50"
                      style={{
                        background: rsvped
                          ? 'linear-gradient(135deg, #22C55E, #16A34A)'
                          : 'linear-gradient(135deg, #E8420A, #CC1C1C)',
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {rsvpMutation.isPending ? 'Processing...' : rsvped ? 'Going ✓' : 'RSVP Now'}
                    </motion.button>
                    {event.isVirtual && event.virtualLink && (
                      <motion.a
                        href={event.virtualLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full mt-3 py-3 rounded-full text-sm font-semibold text-center transition-all"
                        style={{
                          border: '1px solid rgba(255,255,255,0.2)',
                          color: 'var(--brand-white)',
                        }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Join Online
                      </motion.a>
                    )}
                  </GlowCard>

                  <GlowCard className="p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Event Details</h3>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: 'rgba(232,66,10,0.15)' }}
                        >
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#E8420A"
                            strokeWidth="2"
                          >
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs text-white/40">Date & Time</p>
                          <p className="text-sm font-medium text-white">
                            {formatDate(event.date).full}
                          </p>
                          <p className="text-xs text-white/50">{formatDate(event.date).time}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: 'rgba(232,66,10,0.15)' }}
                        >
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#E8420A"
                            strokeWidth="2"
                          >
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                            <circle cx="12" cy="10" r="3" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs text-white/40">Venue</p>
                          <p className="text-sm font-medium text-white">{event.venue}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: 'rgba(232,66,10,0.15)' }}
                        >
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#E8420A"
                            strokeWidth="2"
                          >
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs text-white/40">Attendees</p>
                          <p className="text-sm font-medium text-white">
                            {event.rsvpCount || attendees.length}
                            {event.capacity ? ` / ${event.capacity}` : ''} going
                          </p>
                        </div>
                      </div>
                      {event.organizer && (
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: 'rgba(232,66,10,0.15)' }}
                          >
                            <svg
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="#E8420A"
                              strokeWidth="2"
                            >
                              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-xs text-white/40">Organized by</p>
                            <p className="text-sm font-medium text-white">{event.organizer}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </GlowCard>

                  {attendees.length > 0 && (
                    <GlowCard className="p-6">
                      <h3 className="text-lg font-bold text-white mb-4">Attendees</h3>
                      <div className="flex -space-x-2 mb-3">
                        {attendees.slice(0, 5).map((attendee) => (
                          <OptimizedImage
                            key={attendee.id}
                            src={
                              attendee.avatar ||
                              `https://ui-avatars.com/api/?name=${attendee.name}&background=E8420A&color=fff`
                            }
                            alt={attendee.name}
                            width={32}
                            height={32}
                            className="w-8 h-8 rounded-full border-2 border-[#1A0A0A]"
                          />
                        ))}
                        {attendees.length > 5 && (
                          <span
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold"
                            style={{
                              backgroundColor: 'rgba(255,255,255,0.1)',
                              color: 'var(--brand-white)',
                            }}
                          >
                            +{attendees.length - 5}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-white/50">{attendees.length} people attending</p>
                    </GlowCard>
                  )}
                </div>
              </ScrollReveal>
            </div>
          </div>

          <div className="mt-8">
            <Link href="/lifestyle/events">
              <motion.button
                type="button"
                className="px-6 py-3 rounded-full text-sm font-semibold transition-all"
                style={{ border: '1px solid rgba(255,255,255,0.2)', color: 'var(--brand-white)' }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                ← Back to Events
              </motion.button>
            </Link>
          </div>
        </div>
      ) : null}

      <AppFooter />
    </div>
  );
}

const LazyEventDetailPage = lazy(() => Promise.resolve({ default: EventDetailPageContent }));

export default function EventDetailPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#1A0A0A]">
          <p className="text-white/50 text-lg">Loading...</p>
        </div>
      }
    >
      <LazyEventDetailPage />
    </Suspense>
  );
}
