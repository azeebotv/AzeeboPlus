'use client';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import PageShell from '@/components/layout/PageShell';
import PageHero from '@/components/layout/PageHero';
import { OptimizedImage } from '@/components/OptimizedImage';
import analytics from '@/lib/analytics';
import { EmptyState } from '@/components/ui/EmptyState';

interface LiveEventSummary {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  scheduledAt: string;
  duration: number;
  status: string;
  ticketPrice: number;
  currency: string;
  maxViewers: number;
  currentViewers: number;
  _count: { tickets: number };
}

function LiveEventsPageContent(): React.JSX.Element {
  const [filter, setFilter] = useState<string>('upcoming');

  useEffect(() => {
    analytics.pageView('live-events');
  }, []);

  const eventsQuery = useQuery({
    queryKey: ['live-events', filter],
    queryFn: async () => {
      const statusParam = filter === 'all' ? '' : `?status=${filter}`;
      const res = await api.request<{
        items: LiveEventSummary[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>(`/api/v1/live-events${statusParam}`);
      if (res.success && res.data) return res.data;
      throw new Error(res.message || 'Failed to load events');
    },
    staleTime: 15000,
  });

  const events = eventsQuery.data?.items ?? [];
  const isLoading = eventsQuery.isLoading;
  const error = eventsQuery.error?.message;

  const getTimeRemaining = (scheduledAt: string): string => {
    const diff = new Date(scheduledAt).getTime() - Date.now();
    if (diff <= 0) return 'Now Live';
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    if (days > 0) return `${days}d ${hours}h`;
    const minutes = Math.floor((diff % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  };

  const formatPrice = (price: number, currency: string): string => {
    if (price === 0) return 'Free';
    const symbols: Record<string, string> = { NGN: '₦', USD: '$', EUR: '€', GBP: '£' };
    return `${symbols[currency] || currency} ${price.toLocaleString()}`;
  };

  /* Status badges keep the semantic colour of the event state; the pill fill
     comes from the token ramp instead of a per-status CSS variable. */
  const statusPillClass = (status: string): string => {
    switch (status) {
      case 'live':
        return 'bg-az-success-500 text-az-surface-root';
      case 'scheduled':
        return 'bg-az-flame text-az-surface-root';
      case 'ended':
        return 'bg-az-ink/20 text-az-ink-muted';
      case 'cancelled':
        return 'bg-az-error-500 text-az-surface-root';
      default:
        return 'bg-az-ink/20 text-az-ink-muted';
    }
  };

  const filters = (['upcoming', 'live', 'ended', 'all'] as const).map((f) => {
    const selected = filter === f;
    return (
      <button
        key={f}
        type="button"
        aria-pressed={selected}
        aria-label={`Filter by ${f === 'upcoming' ? 'Upcoming' : f === 'live' ? 'Live Now' : f === 'ended' ? 'Ended' : 'All Events'}`}
        onClick={() => setFilter(f)}
        className={`az-body-strong shrink-0 whitespace-nowrap rounded-az-pill border px-4 py-2 transition-all ${
          selected
            ? 'border-az-flame bg-az-scarlet/20 text-az-ink'
            : 'border-az-glass-border bg-az-glass-fill text-az-ink-muted hover:border-az-glass-border-hover'
        }`}
      >
        {f === 'upcoming'
          ? 'Upcoming'
          : f === 'live'
            ? 'Live Now'
            : f === 'ended'
              ? 'Ended'
              : 'All Events'}
      </button>
    );
  });

  return (
    <PageShell activeNav="Live" maxWidth="7xl">
      <PageHero
        eyebrow="Live"
        title="Live Events"
        subtitle="Pay-per-view concerts, comedy shows, sports events and more"
        actions={<div className="flex items-center gap-2 overflow-x-auto">{filters}</div>}
      />

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link href={`/live/${event.id}`} className="block">
                <div className="az-glass cursor-pointer overflow-hidden group">
                  <div className="relative">
                    <OptimizedImage
                      src={event.thumbnail}
                      alt={event.title}
                      width={400}
                      height={200}
                      className="h-48 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 az-scrim" aria-hidden="true" />
                    <div className="absolute top-3 left-3 flex gap-2">
                      <span
                        className={`rounded-az-pill px-3 py-1 text-xs font-semibold ${statusPillClass(
                          event.status
                        )}`}
                      >
                        {event.status === 'live'
                          ? 'Circle LIVE'
                          : event.status === 'scheduled'
                            ? 'Upcoming'
                            : event.status}
                      </span>
                      {event.status === 'scheduled' && (
                        <span className="rounded-az-pill bg-black/60 px-3 py-1 text-xs font-semibold text-az-ink">
                          {getTimeRemaining(event.scheduledAt)}
                        </span>
                      )}
                    </div>
                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className="az-title text-az-ink">{event.title}</h3>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="az-body mb-3 line-clamp-2 text-az-ink-muted">
                      {event.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="az-title text-az-flame">
                        {formatPrice(event.ticketPrice, event.currency)}
                      </span>
                      {event.maxViewers && (
                        <span className="az-caption text-az-ink-muted">
                          {event._count.tickets}/{event.maxViewers} sold
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon="Video"
          title="No events found"
          description="Check back later for upcoming live events"
          dark
        />
      )}
    </PageShell>
  );
}

export default LiveEventsPageContent;
