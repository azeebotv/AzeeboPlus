'use client';

import { useEffect, useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import { PageShell } from '@/components/layout/PageShell';
import { OptimizedImage } from '@/components/OptimizedImage';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { GlowCard } from '@/components/motion/GlowCard';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import {
  Calendar,
  Clock,
  MapPin,
  Check,
  Share2,
  Copy,
  Users,
  ExternalLink,
  ArrowLeft,
  Building,
  Globe,
} from 'lucide-react';
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

export default function EventDetailClient({ id }: { id: string }): React.JSX.Element {
  const queryClient = useQueryClient();
  const [rsvped, setRsvped] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copied, setCopied] = useState(false);

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
  }, [rsvpMutation]);

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
      setShowShareMenu((prev) => !prev);
    }
  }, [event]);

  const copyToClipboard = useCallback(async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      setShowShareMenu(false);
    }, 1500);
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
    <PageShell glowColor="color-mix(in srgb, var(--color-az-scarlet) 15%, transparent)">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-12 space-y-6">
        <div className="flex items-center justify-between">
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/home' },
              { label: 'Lifestyle', href: '/lifestyle' },
              { label: 'Events', href: '/lifestyle/events' },
              { label: event?.title || 'Event Details' },
            ]}
          />
          <Link
            href="/lifestyle/events"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-az-ink/50 hover:text-az-ink transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            All Events
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-6 py-6">
            <Skeleton className="h-[360px] w-full rounded-3xl" />
            <Skeleton className="h-8 w-2/3 rounded-lg" />
            <Skeleton className="h-5 w-1/3 rounded-lg" />
            <Skeleton className="h-32 w-full rounded-2xl" />
          </div>
        ) : error ? (
          <div className="max-w-md mx-auto py-16">
            <ErrorState
              title="Failed to load event"
              description={error}
              onButtonPress={() => eventQuery.refetch()}
            />
          </div>
        ) : event ? (
          <div className="space-y-8">
            <ScrollReveal>
              <div className="relative aspect-[21/9] sm:h-[400px] w-full rounded-3xl overflow-hidden border border-az-glass-border bg-az-glass-fill shadow-2xl">
                <OptimizedImage
                  src={event.thumbnail}
                  alt={event.title}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 az-scrim--hero" />
                <div className="absolute top-4 left-4 flex gap-2">
                  {event.isVirtual && (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-az-secondary-500/80 backdrop-blur-sm text-az-ink flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5" />
                      Virtual Event
                    </span>
                  )}
                  {event.category && (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-black/60 backdrop-blur-sm text-[var(--color-az-flame)] border border-[var(--color-az-flame)]/30 font-mono uppercase">
                      {event.category}
                    </span>
                  )}
                </div>
                <div className="absolute bottom-4 right-4 flex gap-2">
                  <motion.button
                    type="button"
                    onClick={handleShare}
                    className="px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 bg-az-glass-card hover:bg-az-ink/20 backdrop-blur-md text-az-ink transition-all border border-az-ink/15"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    Share
                  </motion.button>
                </div>
                <AnimatePresence>
                  {showShareMenu && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 10 }}
                      className="absolute bottom-16 right-4 p-2 az-glass border z-20"
                    >
                      <button
                        type="button"
                        onClick={copyToClipboard}
                        className="px-4 py-2 text-xs font-medium text-az-ink hover:bg-az-glass-card rounded-lg transition-colors flex items-center gap-2"
                      >
                        {copied ? (
                          <Check className="w-3.5 h-3.5 text-az-success-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        {copied ? 'Copied to Clipboard!' : 'Copy Event Link'}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <ScrollReveal>
                  <h1 className="az-headline text-2xl sm:text-4xl font-extrabold text-az-ink">
                    {event.title}
                  </h1>
                </ScrollReveal>

                <ScrollReveal delay={0.05}>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-az-ink/60">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-[var(--color-az-flame)]" />
                      <span>{formatDate(event.date).full}</span>
                    </div>
                    <span className="text-az-ink/20">•</span>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-[var(--color-az-flame)]" />
                      <span>{formatDate(event.date).time}</span>
                    </div>
                  </div>
                </ScrollReveal>

                <ScrollReveal delay={0.1}>
                  <div className="flex items-center gap-2 text-xs text-az-ink/60">
                    <MapPin className="w-4 h-4 text-az-ink/40" />
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
                        className="text-[var(--color-az-flame)] hover:underline inline-flex items-center gap-1 ml-2 font-medium"
                      >
                        View Map <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </ScrollReveal>

                <ScrollReveal delay={0.15}>
                  <div className="az-glass p-6 border border-az-glass-border space-y-3">
                    <h2 className="text-base font-bold text-az-ink">About This Event</h2>
                    <p className="text-sm text-az-ink/70 leading-relaxed whitespace-pre-wrap">
                      {event.description}
                    </p>
                  </div>
                </ScrollReveal>

                {event.tags && event.tags.length > 0 && (
                  <ScrollReveal delay={0.2}>
                    <div className="flex flex-wrap gap-2">
                      {event.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-3 py-1 text-xs font-mono font-medium az-glass text-az-ink/60 border border-az-glass-border"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </ScrollReveal>
                )}
              </div>

              <div className="lg:col-span-1 space-y-6">
                <ScrollReveal direction="right">
                  <div className="sticky top-24 space-y-6">
                    <GlowCard className="p-6 rounded-2xl border border-az-glass-border space-y-5">
                      <div className="text-center">
                        <p className="az-headline text-3xl font-extrabold text-az-ink">
                          {event.price != null
                            ? event.price === 0
                              ? 'Free Admission'
                              : `₦${event.price.toLocaleString()}`
                            : 'Free Admission'}
                        </p>
                        <p className="text-xs text-az-ink/40 mt-1">Confirmed RSVP entry pass</p>
                      </div>

                      <motion.button
                        type="button"
                        onClick={handleRsvp}
                        disabled={rsvpMutation.isPending}
                        className={`w-full py-3 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                          rsvped
                            ? 'bg-az-success-500/20 text-az-success-400 border border-az-success-500/30'
                            : 'bg-[var(--color-az-flame)] text-az-ink hover:bg-[var(--color-az-flame)]/90 shadow-lg shadow-[var(--color-az-flame)]/25'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {rsvpMutation.isPending ? (
                          'Updating status...'
                        ) : rsvped ? (
                          <>
                            <Check className="w-4 h-4" />
                            Confirmed Going
                          </>
                        ) : (
                          'RSVP Now'
                        )}
                      </motion.button>

                      {event.isVirtual && event.virtualLink && (
                        <a
                          href={event.virtualLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block w-full py-2.5 text-xs font-semibold text-center az-glass text-az-ink hover:bg-az-glass-card border border-az-glass-border transition-all"
                        >
                          Join Broadcast Stream
                        </a>
                      )}
                    </GlowCard>

                    <GlowCard className="p-6 rounded-2xl border border-az-glass-border space-y-4">
                      <h3 className="text-sm font-bold text-az-ink">Event Log</h3>
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[var(--color-az-flame)]/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Calendar className="w-4 h-4 text-[var(--color-az-flame)]" />
                          </div>
                          <div>
                            <p className="text-[10px] font-mono uppercase text-az-ink/40">
                              Date & Time
                            </p>
                            <p className="text-xs font-semibold text-az-ink">
                              {formatDate(event.date).full}
                            </p>
                            <p className="text-xs text-az-ink/50">{formatDate(event.date).time}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[var(--color-az-flame)]/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <MapPin className="w-4 h-4 text-[var(--color-az-flame)]" />
                          </div>
                          <div>
                            <p className="text-[10px] font-mono uppercase text-az-ink/40">Venue</p>
                            <p className="text-xs font-semibold text-az-ink">{event.venue}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[var(--color-az-flame)]/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Users className="w-4 h-4 text-[var(--color-az-flame)]" />
                          </div>
                          <div>
                            <p className="text-[10px] font-mono uppercase text-az-ink/40">
                              Guest Capacity
                            </p>
                            <p className="text-xs font-semibold text-az-ink">
                              {event.rsvpCount || attendees.length}
                              {event.capacity ? ` / ${event.capacity}` : ''} attending
                            </p>
                          </div>
                        </div>

                        {event.organizer && (
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[var(--color-az-flame)]/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <Building className="w-4 h-4 text-[var(--color-az-flame)]" />
                            </div>
                            <div>
                              <p className="text-[10px] font-mono uppercase text-az-ink/40">
                                Host / Organizer
                              </p>
                              <p className="text-xs font-semibold text-az-ink">{event.organizer}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </GlowCard>

                    {attendees.length > 0 && (
                      <GlowCard className="p-6 rounded-2xl border border-az-glass-border space-y-3">
                        <h3 className="text-sm font-bold text-az-ink">Guests Attending</h3>
                        <div className="flex -space-x-2">
                          {attendees.slice(0, 5).map((attendee) => (
                            <div
                              key={attendee.id}
                              className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-[var(--color-az-surface-root)] bg-az-glass-card"
                            >
                              <OptimizedImage
                                src={
                                  attendee.avatar ||
                                  `https://ui-avatars.com/api/?name=${attendee.name}&background=E8420A&color=fff`
                                }
                                alt={attendee.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ))}
                          {attendees.length > 5 && (
                            <span className="w-8 h-8 flex items-center justify-center text-[10px] font-semibold az-glass text-az-ink">
                              +{attendees.length - 5}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-az-ink/50">
                          {attendees.length} people confirmed attendance
                        </p>
                      </GlowCard>
                    )}
                  </div>
                </ScrollReveal>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </PageShell>
  );
}
