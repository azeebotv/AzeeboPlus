'use client';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { OptimizedImage } from '@/components/OptimizedImage';
import analytics from '@/lib/analytics';

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

  const statusColor = (status: string): string => {
    switch (status) {
      case 'live':
        return '#22c55e';
      case 'scheduled':
        return '#E8420A';
      case 'ended':
        return '#6b7280';
      case 'cancelled':
        return '#ef4444';
      default:
        return '#9A8A7A';
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--brand-near-black)' }}>
      <AppHeader active="Live" />

      <section
        className="relative py-16 sm:py-20"
        style={{ background: 'linear-gradient(135deg, #E8420A 0%, #7c2d12 100%)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1
            className="text-4xl sm:text-5xl font-bold text-white mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Live Events
          </motion.h1>
          <motion.p
            className="text-xl text-white/80 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            Pay-per-view concerts, comedy shows, sports events and more
          </motion.p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="flex items-center gap-4 mb-8">
          {['upcoming', 'live', 'ended', 'all'].map((f) => (
            <button
              key={f}
              type="button"
              aria-label={`Filter by ${f === 'upcoming' ? 'Upcoming' : f === 'live' ? 'Live Now' : f === 'ended' ? 'Ended' : 'All Events'}`}
              onClick={() => setFilter(f)}
              className="px-4 py-2 rounded-full text-sm font-medium transition-all"
              style={{
                backgroundColor: filter === f ? '#E8420A' : 'rgba(255,255,255,0.05)',
                color: filter === f ? '#fff' : '#9A8A7A',
              }}
            >
              {f === 'upcoming'
                ? 'Upcoming'
                : f === 'live'
                  ? 'Live Now'
                  : f === 'ended'
                    ? 'Ended'
                    : 'All Events'}
            </button>
          ))}
        </div>

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
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link href={`/live/${event.id}`} className="block">
                  <div className="az-glass overflow-hidden group cursor-pointer">
                    <div className="relative">
                      <OptimizedImage
                        src={event.thumbnail}
                        alt={event.title}
                        width={400}
                        height={200}
                        className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#1A0A0A]/80 to-transparent" />
                      <div className="absolute top-3 left-3 flex gap-2">
                        <span
                          className="px-3 py-1 rounded-full text-xs font-semibold"
                          style={{ backgroundColor: statusColor(event.status), color: 'var(--brand-white)' }}
                        >
                          {event.status === 'live'
                            ? '🔴 LIVE'
                            : event.status === 'scheduled'
                              ? 'Upcoming'
                              : event.status}
                        </span>
                        {event.status === 'scheduled' && (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-black/60 text-white">
                            {getTimeRemaining(event.scheduledAt)}
                          </span>
                        )}
                      </div>
                      <div className="absolute bottom-3 left-3 right-3">
                        <h3 className="text-lg font-bold text-white">{event.title}</h3>
                      </div>
                    </div>
                    <div className="p-4">
                      <p className="text-sm text-white/50 mb-3 line-clamp-2">{event.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold" style={{ color: '#E8420A' }}>
                          {formatPrice(event.ticketPrice, event.currency)}
                        </span>
                        {event.maxViewers && (
                          <span className="text-xs text-white/40">
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
          <div className="text-center py-20">
            <p className="text-4xl mb-4">🎥</p>
            <h2 className="text-xl font-bold text-white mb-2">No events found</h2>
            <p className="text-white/50">Check back later for upcoming live events</p>
          </div>
        )}
      </section>

      <AppFooter />
    </div>
  );
}

export default LiveEventsPageContent;
