'use client';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { Skeleton, ErrorState } from '@azeebo/ui/web';

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
    error,
  } = useQuery({
    queryKey: ['live', 'event', eventId],
    queryFn: async () => {
      const res = await apiFetch<LiveEvent>(`/v1/live/events/${eventId}`);
      return res.success ? res.data : null;
    },
  });

  if (error) {
    return (
      <>
        <AppHeader />
        <main className="min-h-screen bg-gray-950 text-white">
          <ErrorState description="Failed to load event. Please try again." />
        </main>
        <AppFooter />
      </>
    );
  }

  return (
    <>
      <AppHeader />
      <main className="min-h-screen bg-gray-950 text-white">
        {isLoading ? (
          <div className="max-w-6xl mx-auto px-4 py-12 space-y-6">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-[50vh] w-full rounded-xl" />
          </div>
        ) : event ? (
          <>
            <div className="relative h-[60vh] bg-gradient-to-b from-red-900/40 to-gray-950">
              {event.imageUrl && (
                <img
                  src={event.imageUrl}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover opacity-40"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/60 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 max-w-6xl mx-auto px-4 pb-12">
                <Link
                  href="/live"
                  className="text-red-400 hover:underline text-sm mb-4 inline-block"
                >
                  ← Live
                </Link>
                <div className="flex items-center gap-3 mb-2">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      event.status === 'live'
                        ? 'bg-red-600 animate-pulse'
                        : event.status === 'upcoming'
                          ? 'bg-blue-600'
                          : 'bg-gray-600'
                    }`}
                  >
                    {event.status === 'live'
                      ? '● LIVE NOW'
                      : event.status === 'upcoming'
                        ? 'Upcoming'
                        : 'Ended'}
                  </span>
                </div>
                <h1 className="text-4xl font-bold mb-2">{event.title}</h1>
                <p className="text-gray-300">
                  {event.venue}, {event.city} · {event.eventDate} {event.eventTime}
                </p>
              </div>
            </div>
            <div className="max-w-6xl mx-auto px-4 py-12">
              <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-8">
                  <section>
                    <p className="text-gray-300 leading-relaxed text-lg">{event.description}</p>
                  </section>
                  {event.status === 'live' && event.streamUrl && (
                    <section>
                      <h2 className="text-xl font-bold mb-4">Live Stream</h2>
                      <div className="bg-gray-900 rounded-xl aspect-video flex items-center justify-center">
                        <p className="text-gray-400">Stream player will load here</p>
                      </div>
                    </section>
                  )}
                  {event.status === 'ended' && event.replayUrl && (
                    <section>
                      <h2 className="text-xl font-bold mb-4">Replay</h2>
                      <div className="bg-gray-900 rounded-xl aspect-video flex items-center justify-center">
                        <p className="text-gray-400">Replay player will load here</p>
                      </div>
                    </section>
                  )}
                  {event.sponsors.length > 0 && (
                    <section>
                      <h2 className="text-xl font-bold mb-4">Sponsors</h2>
                      <div className="flex flex-wrap gap-3">
                        {event.sponsors.map((sponsor) => (
                          <div
                            key={sponsor.name}
                            className="bg-gray-900 rounded-lg px-4 py-2 text-sm"
                          >
                            {sponsor.name} <span className="text-gray-500">({sponsor.tier})</span>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                </div>
                <div className="space-y-4">
                  <div className="bg-gray-900 rounded-xl p-6 sticky top-24">
                    {event.status === 'upcoming' && event.countdown && (
                      <div className="text-center mb-4">
                        <p className="text-sm text-gray-400 mb-2">Starting in</p>
                        <div className="flex justify-center gap-3">
                          <div className="text-center">
                            <span className="text-2xl font-bold">{event.countdown.days}</span>
                            <p className="text-xs text-gray-500">days</p>
                          </div>
                          <div className="text-center">
                            <span className="text-2xl font-bold">{event.countdown.hours}</span>
                            <p className="text-xs text-gray-500">hrs</p>
                          </div>
                          <div className="text-center">
                            <span className="text-2xl font-bold">{event.countdown.minutes}</span>
                            <p className="text-xs text-gray-500">min</p>
                          </div>
                        </div>
                      </div>
                    )}
                    {event.hasDigitalAccess ? (
                      <Link
                        href={`/live/watch/${event.id}`}
                        className="block w-full bg-red-600 hover:bg-red-700 text-center px-6 py-3 rounded-lg font-semibold transition"
                      >
                        {event.status === 'live' ? 'Watch Now' : 'Watch Replay'}
                      </Link>
                    ) : event.ticketPrice ? (
                      <>
                        <p className="text-2xl font-bold text-center mb-1">
                          ₦{event.ticketPrice.toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-400 text-center mb-4">Digital Access</p>
                        {user ? (
                          <Link
                            href={`/live/ticket/${event.id}`}
                            className="block w-full bg-red-600 hover:bg-red-700 text-center px-6 py-3 rounded-lg font-semibold transition"
                          >
                            Get Access
                          </Link>
                        ) : (
                          <Link
                            href="/auth/login"
                            className="block w-full bg-red-600 hover:bg-red-700 text-center px-6 py-3 rounded-lg font-semibold transition"
                          >
                            Sign in to Purchase
                          </Link>
                        )}
                      </>
                    ) : (
                      <p className="text-center text-gray-400">Free event</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </main>
      <AppFooter />
    </>
  );
}
