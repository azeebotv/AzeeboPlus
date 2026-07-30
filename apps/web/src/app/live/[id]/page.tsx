'use client';
import { Suspense, lazy, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { OptimizedImage } from '@/components/OptimizedImage';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import analytics from '@/lib/analytics';

interface LiveEventDetail {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  organizerId: string;
  scheduledAt: string;
  duration: number;
  status: string;
  ticketPrice: number;
  currency: string;
  maxViewers: number;
  currentViewers: number;
  streamUrl: string;
  replayUrl: string;
  chatEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  _count: { tickets: number };
}

function LiveEventDetailContent(): React.JSX.Element {
  const params = useParams();
  const id = params.id as string;

  useEffect(() => {
    analytics.pageView('live-event-detail');
  }, [id]);

  const eventQuery = useQuery({
    queryKey: ['live-event', id],
    queryFn: async () => {
      const res = await api.request<LiveEventDetail>(`/api/v1/live-events/${id}`);
      if (res.success && res.data) return res.data;
      throw new Error(res.message || 'Failed to load event');
    },
    staleTime: 15000,
  });

  const purchaseMutation = useMutation({
    mutationFn: async () => {
      const res = await api.request<{ id: string }>(`/api/v1/live-events/${id}/purchase`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
      if (!res.success) throw new Error(res.message || 'Purchase failed');
      return res.data;
    },
    onSuccess: () => {
      eventQuery.refetch();
    },
  });

  const event = eventQuery.data;
  const isLoading = eventQuery.isLoading;
  const error = eventQuery.error?.message;

  const formatDate = (iso: string): string =>
    new Date(iso).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const formatPrice = (price: number, currency: string): string => {
    if (price === 0) return 'Free';
    const symbols: Record<string, string> = { NGN: '₦', USD: '$', EUR: '€', GBP: '£' };
    return `${symbols[currency] || currency} ${price.toLocaleString()}`;
  };

  const getTimeStatus = (scheduledAt: string, status: string): string => {
    if (status === 'live') return '🔴 Live Now';
    if (status === 'ended') return 'Ended';
    if (status === 'cancelled') return 'Cancelled';
    const diff = new Date(scheduledAt).getTime() - Date.now();
    if (diff <= 0) return '🔴 Live Now';
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    if (days > 0) return `Starts in ${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `Starts in ${hours}h ${minutes}m`;
    return `Starts in ${minutes}m`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--brand-near-black)' }}>
        <AppHeader />
        <main style={{ padding: '100px 24px 60px', maxWidth: 800, margin: '0 auto' }}>
          <Skeleton height="400px" borderRadius="12" />
          <div className="mt-6 space-y-4">
            <Skeleton height="32px" width="60%" />
            <Skeleton height="20px" width="40%" />
            <Skeleton height="100px" />
          </div>
        </main>
        <AppFooter />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--brand-near-black)' }}>
        <AppHeader />
        <main style={{ padding: '100px 24px 60px', maxWidth: 600, margin: '0 auto' }}>
          <ErrorState
            title="Failed to load event"
            description={error || 'Event not found'}
            onButtonPress={() => eventQuery.refetch()}
          />
        </main>
        <AppFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--brand-near-black)' }}>
      <AppHeader />

      <main style={{ maxWidth: 800, margin: '0 auto', padding: '80px 24px 60px' }}>
        <ScrollReveal>
          <div className="relative rounded-xl overflow-hidden mb-8">
            <OptimizedImage
              src={event.thumbnail}
              alt={event.title}
              width={800}
              height={400}
              className="w-full h-64 sm:h-96 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1A0A0A] via-[#1A0A0A]/30 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4">
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">{event.title}</h1>
              <p className="text-lg" style={{ color: '#E8420A' }}>
                {getTimeStatus(event.scheduledAt, event.status)}
              </p>
            </div>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white mb-3">About This Event</h2>
              <p className="text-white/60 leading-relaxed">{event.description}</p>
            </div>

            <div className="flex flex-wrap gap-6">
              <div>
                <p className="text-sm text-white/40 mb-1">Date & Time</p>
                <p className="text-white font-medium">{formatDate(event.scheduledAt)}</p>
              </div>
              <div>
                <p className="text-sm text-white/40 mb-1">Duration</p>
                <p className="text-white font-medium">{event.duration} minutes</p>
              </div>
              {event.maxViewers && (
                <div>
                  <p className="text-sm text-white/40 mb-1">Capacity</p>
                  <p className="text-white font-medium">
                    {event._count.tickets}/{event.maxViewers}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-white/40 mb-1">Chat</p>
                <p className="text-white font-medium">
                  {event.chatEnabled ? 'Enabled' : 'Disabled'}
                </p>
              </div>
            </div>
          </div>

          <div
            className="rounded-xl p-6 h-fit sticky top-24"
            style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-default)' }}
          >
            <p className="text-3xl font-bold text-white mb-1">
              {formatPrice(event.ticketPrice, event.currency)}
            </p>
            <p className="text-sm text-white/40 mb-6">
              {event.ticketPrice === 0 ? 'Free entry' : 'Per person'}
            </p>

            {event.status === 'cancelled' ? (
              <div className="text-center py-4">
                <p className="text-red-400 font-medium">This event has been cancelled</p>
              </div>
            ) : event.status === 'ended' ? (
              <div className="text-center py-4">
                <p className="text-white/50">This event has ended</p>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => purchaseMutation.mutate()}
                disabled={purchaseMutation.isPending}
                className="w-full py-3 rounded-xl font-semibold text-white transition-all"
                style={{
                  backgroundColor: purchaseMutation.isPending ? '#666' : '#E8420A',
                }}
              >
                {purchaseMutation.isPending
                  ? 'Processing...'
                  : purchaseMutation.isSuccess
                    ? '✅ Ticket Purchased!'
                    : event.status === 'live'
                      ? 'Purchase & Watch'
                      : 'Get Ticket'}
              </button>
            )}

            {purchaseMutation.isError && (
              <p className="mt-3 text-sm text-red-400 text-center">
                {purchaseMutation.error instanceof Error
                  ? purchaseMutation.error.message
                  : 'Purchase failed'}
              </p>
            )}

            {purchaseMutation.isSuccess && event.streamUrl && (
              <motion.a
                href={event.streamUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block mt-3 text-center py-3 rounded-xl font-semibold text-white transition-all"
                style={{ backgroundColor: '#22c55e' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                Watch Now
              </motion.a>
            )}

            <div className="mt-6 space-y-3 text-sm text-white/40">
              <p>• Ticket grants access to live stream</p>
              <p>• Post-event replay available for ticket holders</p>
              <p>• No refunds for partial viewing</p>
              <p>• Payment debited from wallet balance</p>
            </div>
          </div>
        </div>
      </main>

      <AppFooter />
    </div>
  );
}

const LazyPage = lazy(() => Promise.resolve({ default: LiveEventDetailContent }));

export default function LiveEventDetailPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#1A0A0A]">
          <p className="text-white/50">Loading...</p>
        </div>
      }
    >
      <LazyPage />
    </Suspense>
  );
}
