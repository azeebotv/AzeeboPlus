'use client';
import { Suspense, lazy, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import PageShell from '@/components/layout/PageShell';
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
    if (status === 'live') return 'Circle Live Now';
    if (status === 'ended') return 'Ended';
    if (status === 'cancelled') return 'Cancelled';
    const diff = new Date(scheduledAt).getTime() - Date.now();
    if (diff <= 0) return 'Circle Live Now';
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    if (days > 0) return `Starts in ${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `Starts in ${hours}h ${minutes}m`;
    return `Starts in ${minutes}m`;
  };

  if (isLoading) {
    return (
      <PageShell maxWidth="lg">
        <Skeleton height="400px" borderRadius="12" />
        <div className="mt-6 space-y-4">
          <Skeleton height="32px" width="60%" />
          <Skeleton height="20px" width="40%" />
          <Skeleton height="100px" />
        </div>
      </PageShell>
    );
  }

  if (error || !event) {
    return (
      <PageShell maxWidth="md">
        <ErrorState
          title="Failed to load event"
          description={error || 'Event not found'}
          onButtonPress={() => eventQuery.refetch()}
        />
      </PageShell>
    );
  }

  return (
    <PageShell maxWidth="lg">
      <ScrollReveal>
        <div className="relative mb-8 overflow-hidden rounded-az-card">
          <OptimizedImage
            src={event.thumbnail}
            alt={event.title}
            width={800}
            height={400}
            className="h-64 w-full object-cover sm:h-96"
          />
          <div className="absolute inset-0 az-scrim--hero" aria-hidden="true" />
          <div className="absolute bottom-4 left-4 right-4">
            <h1 className="az-heading mb-2 text-az-ink">{event.title}</h1>
            <p className="az-lead text-az-flame">
              {getTimeStatus(event.scheduledAt, event.status)}
            </p>
          </div>
        </div>
      </ScrollReveal>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div>
            <h2 className="az-title mb-3 text-az-ink">About This Event</h2>
            <p className="az-body leading-relaxed text-az-ink/60">{event.description}</p>
          </div>

          <div className="flex flex-wrap gap-6">
            <div>
              <p className="az-caption mb-1 text-az-ink-muted">Date &amp; Time</p>
              <p className="az-body-strong text-az-ink">{formatDate(event.scheduledAt)}</p>
            </div>
            <div>
              <p className="az-caption mb-1 text-az-ink-muted">Duration</p>
              <p className="az-body-strong text-az-ink">{event.duration} minutes</p>
            </div>
            {event.maxViewers && (
              <div>
                <p className="az-caption mb-1 text-az-ink-muted">Capacity</p>
                <p className="az-body-strong text-az-ink">
                  {event._count.tickets}/{event.maxViewers}
                </p>
              </div>
            )}
            <div>
              <p className="az-caption mb-1 text-az-ink-muted">Chat</p>
              <p className="az-body-strong text-az-ink">
                {event.chatEnabled ? 'Enabled' : 'Disabled'}
              </p>
            </div>
          </div>
        </div>

        <div className="sticky top-24 h-fit rounded-az-card border border-az-glass-border bg-az-ink/5 p-6">
          <p className="az-heading mb-1 text-az-ink">
            {formatPrice(event.ticketPrice, event.currency)}
          </p>
          <p className="az-caption mb-6 text-az-ink-muted">
            {event.ticketPrice === 0 ? 'Free entry' : 'Per person'}
          </p>

          {event.status === 'cancelled' ? (
            <div className="py-4 text-center">
              <p className="az-body-strong text-az-error-400">This event has been cancelled</p>
            </div>
          ) : event.status === 'ended' ? (
            <div className="py-4 text-center">
              <p className="az-body text-az-ink-muted">This event has ended</p>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => purchaseMutation.mutate()}
              disabled={purchaseMutation.isPending}
              className={`w-full rounded-az-control py-3 az-body-strong text-az-ink transition-all ${
                purchaseMutation.isPending ? 'bg-az-ink/20' : 'bg-az-flame'
              }`}
            >
              {purchaseMutation.isPending
                ? 'Processing...'
                : purchaseMutation.isSuccess
                  ? 'CheckCircle Ticket Purchased!'
                  : event.status === 'live'
                    ? 'Purchase & Watch'
                    : 'Get Ticket'}
            </button>
          )}

          {purchaseMutation.isError && (
            <p className="az-caption mt-3 text-center text-az-error-400">
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
              className="az-body-strong mt-3 block rounded-az-control bg-az-success-500 py-3 text-center text-az-ink transition-all"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              Watch Now
            </motion.a>
          )}

          <div className="az-caption mt-6 space-y-3 text-az-ink-muted">
            <p>• Ticket grants access to live stream</p>
            <p>• Post-event replay available for ticket holders</p>
            <p>• No refunds for partial viewing</p>
            <p>• Payment debited from wallet balance</p>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

const LazyPage = lazy(() => Promise.resolve({ default: LiveEventDetailContent }));

export default function LiveEventDetailPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-az-surface-root">
          <p className="az-lead text-az-ink-muted">Loading...</p>
        </div>
      }
    >
      <LazyPage />
    </Suspense>
  );
}
