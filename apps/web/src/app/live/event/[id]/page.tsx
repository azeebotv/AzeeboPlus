'use client';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { PageShell } from '@/components/layout/PageShell';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import { messageOf, requireData } from '@/lib/payload';

/* Event state pills — token class pairs, never raw palette colours. */
const STATUS_TONES = {
  live: 'bg-az-scarlet text-az-ink animate-pulse',
  upcoming: 'bg-az-warning-500/20 text-az-warning-500',
  ended: 'bg-az-ink/10 text-az-ink-muted',
} as const;

interface LiveEvent {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  venue: string;
  city: string;
  eventDate: string;
  eventTime: string;
  status: 'upcoming' | 'live' | 'ended';
  streamUrl?: string;
  replayUrl?: string;
  ticketPrice?: number;
  currency: string;
  hasTicket: boolean;
  hasDigitalAccess: boolean;
  sponsors: { name: string; tier: string }[];
  countdown?: { days: number; hours: number; minutes: number };
}

export default function LiveEventDetailPage(): React.JSX.Element {
  const params = useParams();
  const eventId = params.id as string;
  const { user } = useAuth();

  const {
    data: event,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['live', 'event', eventId],
    queryFn: async () => {
      const res = await apiFetch<LiveEvent>(`/api/v1/live-events/${eventId}`);
      return requireData(res) ?? null;
    },
  });

  if (isError) {
    return (
      <PageShell maxWidth="2xl">
        <ErrorState
          title="Event unavailable"
          description={messageOf(error)}
          onButtonPress={() => refetch()}
        />
      </PageShell>
    );
  }

  return (
    <PageShell maxWidth="full">
      {isLoading ? (
        <div className="mx-auto max-w-6xl space-y-6 px-4 py-12">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-[50vh] w-full rounded-az-panel" />
        </div>
      ) : event ? (
        <>
          <div className="relative h-[60vh] bg-gradient-to-b from-az-scarlet/40 to-az-surface-root">
            {event.imageUrl && (
              <img
                src={event.imageUrl}
                alt=""
                className="absolute inset-0 w-full h-full object-cover opacity-40"
              />
            )}
            <div className="absolute inset-0 az-scrim--hero" />
            <div className="absolute bottom-0 left-0 right-0 mx-auto max-w-6xl px-4 pb-12">
              <Link
                href="/live"
                className="az-body-strong mb-4 inline-block text-az-flame hover:underline"
              >
                ← Live
              </Link>
              <div className="mb-2 flex items-center gap-3">
                <span
                  className={`az-body rounded-az-pill px-3 py-1 font-semibold ${
                    STATUS_TONES[event.status] ?? STATUS_TONES.ended
                  }`}
                >
                  {event.status === 'live'
                    ? '● LIVE NOW'
                    : event.status === 'upcoming'
                      ? 'Upcoming'
                      : 'Ended'}
                </span>
              </div>
              <h1 className="az-headline mb-2 text-4xl text-az-ink">{event.title}</h1>
              <p className="az-body text-az-ink-muted">
                {event.venue}, {event.city} · {event.eventDate} {event.eventTime}
              </p>
            </div>
          </div>
          <div className="mx-auto max-w-6xl px-4 py-12">
            <div className="grid gap-8 md:grid-cols-3">
              <div className="space-y-8 md:col-span-2">
                <section>
                  <p className="az-lead leading-relaxed text-az-ink-muted">{event.description}</p>
                </section>
                {event.status === 'live' && event.streamUrl && (
                  <section>
                    <h2 className="az-title mb-4 text-az-ink">Live Stream</h2>
                    <div className="flex aspect-video items-center justify-center rounded-az-panel border border-az-glass-border bg-az-surface-panel">
                      <p className="az-body text-az-ink-muted">Stream player will load here</p>
                    </div>
                  </section>
                )}
                {event.status === 'ended' && event.replayUrl && (
                  <section>
                    <h2 className="az-title mb-4 text-az-ink">Replay</h2>
                    <div className="flex aspect-video items-center justify-center rounded-az-panel border border-az-glass-border bg-az-surface-panel">
                      <p className="az-body text-az-ink-muted">Replay player will load here</p>
                    </div>
                  </section>
                )}
                {event.sponsors.length > 0 && (
                  <section>
                    <h2 className="az-title mb-4 text-az-ink">Sponsors</h2>
                    <div className="flex flex-wrap gap-3">
                      {event.sponsors.map((sponsor) => (
                        <div key={sponsor.name} className="az-chip az-body px-4 py-2 text-az-ink">
                          {sponsor.name} <span className="text-az-ink-muted">({sponsor.tier})</span>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>
              <div className="space-y-4">
                <div className="az-glass sticky top-24 p-6">
                  {event.status === 'upcoming' && event.countdown && (
                    <div className="mb-4 text-center">
                      <p className="az-body mb-2 text-az-ink-muted">Starting in</p>
                      <div className="flex justify-center gap-3">
                        <div className="text-center">
                          <span className="az-section-title text-az-ink">
                            {event.countdown.days}
                          </span>
                          <p className="az-caption text-az-ink-muted">days</p>
                        </div>
                        <div className="text-center">
                          <span className="az-section-title text-az-ink">
                            {event.countdown.hours}
                          </span>
                          <p className="az-caption text-az-ink-muted">hrs</p>
                        </div>
                        <div className="text-center">
                          <span className="az-section-title text-az-ink">
                            {event.countdown.minutes}
                          </span>
                          <p className="az-caption text-az-ink-muted">min</p>
                        </div>
                      </div>
                    </div>
                  )}
                  {event.hasDigitalAccess ? (
                    <Link
                      href={`/live/watch/${event.id}`}
                      className="az-btn-primary block text-center"
                    >
                      {event.status === 'live' ? 'Watch Now' : 'Watch Replay'}
                    </Link>
                  ) : event.ticketPrice ? (
                    <>
                      <p className="az-section-title mb-1 text-center text-az-ink">
                        ₦{event.ticketPrice.toLocaleString()}
                      </p>
                      <p className="az-body mb-4 text-center text-az-ink-muted">Digital Access</p>
                      {user ? (
                        <Link
                          href={`/live/ticket/${event.id}`}
                          className="az-btn-primary block text-center"
                        >
                          Get Access
                        </Link>
                      ) : (
                        <Link href="/auth/login" className="az-btn-primary block text-center">
                          Sign in to Purchase
                        </Link>
                      )}
                    </>
                  ) : (
                    <p className="az-body text-center text-az-ink-muted">Free event</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </PageShell>
  );
}
