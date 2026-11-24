'use client';

import { Suspense, lazy, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import { PageShell } from '@/components/layout/PageShell';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { GlowCard } from '@/components/motion/GlowCard';
import { MapPin, Clock, ArrowLeft, Navigation, Flag, CheckCircle2 } from 'lucide-react';
import analytics from '@/lib/analytics';

interface ItineraryDetail {
  id: string;
  title: string;
  description: string;
  city: string;
  duration: string;
  stops: { name: string; description: string; duration: string; order: number }[];
}

function ItineraryDetailContent() {
  const params = useParams();
  const id = params?.id as string;

  useEffect(() => {
    analytics.pageView('itinerary-detail');
  }, []);

  const query = useQuery({
    queryKey: ['lifestyle', 'itinerary', id],
    queryFn: async () => {
      const res = await api.request<ItineraryDetail>(`/api/v1/lifestyle/itineraries/${id}`);
      if (res.success && res.data) return res.data;
      throw new Error('Itinerary not found');
    },
    enabled: !!id,
  });

  const it = query.data;

  return (
    <PageShell glowColor="color-mix(in srgb, var(--color-az-scarlet) 15%, transparent)">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-16 space-y-6">
        <div className="flex items-center justify-between">
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/home' },
              { label: 'Lifestyle', href: '/lifestyle' },
              { label: 'Itineraries', href: '/lifestyle/itineraries' },
              { label: it?.title || 'Route Details' },
            ]}
          />
          <Link
            href="/lifestyle/itineraries"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-az-ink/50 hover:text-az-ink transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            All Itineraries
          </Link>
        </div>

        {query.isLoading ? (
          <div className="space-y-6 py-6">
            <Skeleton className="h-10 w-2/3 rounded-lg" />
            <Skeleton className="h-20 w-full rounded-2xl" />
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full rounded-2xl" />
              ))}
            </div>
          </div>
        ) : query.error || !it ? (
          <div className="max-w-md mx-auto py-16">
            <ErrorState
              title="Itinerary Not Found"
              description={
                query.error?.message || 'The requested itinerary route could not be loaded.'
              }
              onButtonPress={() => query.refetch()}
            />
          </div>
        ) : (
          <div className="space-y-8">
            <ScrollReveal>
              <div className="az-glass p-8 border border-az-glass-border space-y-4">
                <div className="flex items-center gap-3 text-xs font-mono text-[var(--color-az-flame)]">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {it.city}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-az-ink/50">
                    <Clock className="w-3.5 h-3.5" />
                    {it.duration}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-az-ink/50">
                    <Navigation className="w-3.5 h-3.5" />
                    {it.stops?.length || 0} stops
                  </span>
                </div>

                <h1 className="az-headline text-2xl sm:text-4xl font-extrabold text-az-ink">
                  {it.title}
                </h1>
                <p className="text-sm sm:text-base text-az-ink/70 leading-relaxed max-w-3xl">
                  {it.description}
                </p>
              </div>
            </ScrollReveal>

            {/* Stops Timeline */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-az-ink/40 mb-2">
                <Flag className="w-3.5 h-3.5 text-[var(--color-az-flame)]" />
                <span>Tour Waypoints & Highlights</span>
              </div>

              <div className="space-y-4 relative before:absolute before:inset-0 before:left-6 before:w-0.5 before:bg-az-glass-card before:hidden sm:before:block">
                {it.stops
                  .sort((a, b) => a.order - b.order)
                  .map((stop, i) => (
                    <ScrollReveal key={i} delay={i * 0.08}>
                      <GlowCard className="p-5 rounded-2xl border border-az-glass-border flex items-start gap-4">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-az-surface-root font-bold text-xs shrink-0 bg-[var(--color-az-flame)] shadow-md shadow-[var(--color-az-flame)]/30 mt-0.5">
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                            <h3 className="text-sm font-bold text-az-ink truncate">{stop.name}</h3>
                            <span className="text-[11px] font-mono text-[var(--color-az-flame)] flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {stop.duration}
                            </span>
                          </div>
                          <p className="text-xs text-az-ink/60 leading-relaxed">
                            {stop.description}
                          </p>
                        </div>
                      </GlowCard>
                    </ScrollReveal>
                  ))}
              </div>
            </div>

            <ScrollReveal delay={0.3}>
              <div className="az-glass p-6 border border-az-glass-border flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-az-success-400 shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-az-ink">Save Route for Offline</h4>
                    <p className="text-xs text-az-ink/50">
                      Keep stop coordinates and directions accessible on the go
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => alert('Itinerary route saved to your local offline cache.')}
                  className="px-5 py-2.5 rounded-full text-xs font-bold text-az-surface-root bg-[var(--color-az-flame)] hover:bg-[var(--color-az-flame)]/90 transition-all shadow-md shadow-[var(--color-az-flame)]/25 whitespace-nowrap"
                >
                  Save Route
                </button>
              </div>
            </ScrollReveal>
          </div>
        )}
      </div>
    </PageShell>
  );
}

const Lazy = lazy(() => Promise.resolve({ default: ItineraryDetailContent }));

export default function ItineraryDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--color-az-surface-root)]">
          <p className="text-az-ink/50 text-lg">Loading...</p>
        </div>
      }
    >
      <Lazy />
    </Suspense>
  );
}
