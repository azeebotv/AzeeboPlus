'use client';

import { Suspense, lazy } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import { messageOf, requireData } from '@/lib/payload';
import { PageShell } from '@/components/layout/PageShell';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { OptimizedImage } from '@/components/OptimizedImage';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { GlowCard } from '@/components/motion/GlowCard';
import { Star, MapPin, Phone, Globe, Clock, CheckCircle2, ArrowLeft, Ticket } from 'lucide-react';

interface PlaceDetail {
  id: string;
  name: string;
  category: string;
  description: string;
  imageUrl?: string;
  address: string;
  phone?: string;
  website?: string;
  rating: number;
  reviewCount: number;
  isOpen: boolean;
  hours: string;
  priceRange: string;
  offers: { id: string; title: string; description: string; discount?: string }[];
  partnerVerified: boolean;
}

function PlaceDetailContent(): React.JSX.Element {
  const params = useParams();
  const placeId = params.id as string;

  const {
    data: place,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['9tlife', 'place', placeId],
    queryFn: async () => {
      const res = await apiFetch<PlaceDetail>(`/v1/lifestyle/places/${placeId}`);
      return requireData(res) ?? null;
    },
    staleTime: 30000,
    enabled: !!placeId,
  });

  return (
    <PageShell glowColor="color-mix(in srgb, var(--color-az-scarlet) 15%, transparent)">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-16 space-y-6">
        <div className="flex items-center justify-between">
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/home' },
              { label: 'Lifestyle', href: '/lifestyle' },
              { label: 'Tonight', href: '/lifestyle/tonight' },
              { label: place?.name || 'Venue Details' },
            ]}
          />
          <Link
            href="/lifestyle/tonight"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-az-ink/50 hover:text-az-ink transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Tonight
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-6 py-6">
            <Skeleton className="h-[360px] w-full rounded-3xl" />
            <Skeleton className="h-8 w-1/2 rounded-lg" />
            <Skeleton className="h-24 w-full rounded-2xl" />
          </div>
        ) : isError ? (
          <div className="max-w-md mx-auto py-16">
            <ErrorState
              title="Venue details unavailable"
              description={messageOf(error)}
              onButtonPress={() => refetch()}
            />
          </div>
        ) : !place ? (
          <div className="max-w-md mx-auto py-16">
            <ErrorState
              title="Venue Not Found"
              description="Unable to locate details for this venue."
              onButtonPress={() => refetch()}
            />
          </div>
        ) : (
          <div className="space-y-8">
            <ScrollReveal>
              <div className="relative aspect-[21/9] sm:h-[400px] w-full rounded-3xl overflow-hidden border border-az-glass-border bg-az-glass-fill shadow-2xl">
                {place.imageUrl ? (
                  <OptimizedImage
                    src={place.imageUrl}
                    alt={place.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[var(--color-az-flame)]/25 via-black to-black" />
                )}
                <div className="absolute inset-0 az-scrim--hero" />

                <div className="absolute top-4 right-4 flex items-center gap-2">
                  <span
                    className={`text-xs font-mono font-bold px-3 py-1 rounded-full backdrop-blur-md border ${
                      place.isOpen
                        ? 'bg-az-success-500/20 text-az-success-400 border-az-success-500/30'
                        : 'bg-az-error-500/20 text-az-error-400 border-az-error-500/30'
                    }`}
                  >
                    {place.isOpen ? 'Open Now' : 'Closed'}
                  </span>
                  {place.partnerVerified && (
                    <span className="bg-az-success-500/20 text-az-success-400 border border-az-success-500/30 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Verified Partner
                    </span>
                  )}
                </div>

                <div className="absolute bottom-6 left-6 right-6 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-mono text-[var(--color-az-flame)]">
                    <span>{place.category}</span>
                    <span className="text-az-ink/30">•</span>
                    <span className="text-az-ink/60">{place.priceRange}</span>
                  </div>
                  <h1 className="az-headline text-2xl sm:text-4xl font-extrabold text-az-ink">
                    {place.name}
                  </h1>
                  <div className="flex items-center gap-3 text-xs text-az-ink/60 pt-1">
                    <div className="flex items-center gap-1 text-az-warning-400 font-bold">
                      <Star className="w-4 h-4 fill-az-warning-400" />
                      <span>{place.rating.toFixed(1)}</span>
                    </div>
                    <span className="text-az-ink/30">•</span>
                    <span>{place.reviewCount} verified guest reviews</span>
                  </div>
                </div>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <ScrollReveal>
                  <div className="az-glass p-6 border border-az-glass-border space-y-3">
                    <h2 className="text-base font-bold text-az-ink">About the Venue</h2>
                    <p className="text-sm text-az-ink/70 leading-relaxed whitespace-pre-wrap">
                      {place.description}
                    </p>
                  </div>
                </ScrollReveal>

                {place.offers?.length > 0 && (
                  <ScrollReveal delay={0.1}>
                    <div className="space-y-3">
                      <h2 className="text-base font-bold text-az-ink flex items-center gap-2">
                        <Ticket className="w-4 h-4 text-[var(--color-az-flame)]" />
                        Exclusive Guest Privileges
                      </h2>
                      <div className="space-y-3">
                        {place.offers.map((offer) => (
                          <div
                            key={offer.id}
                            className="az-glass p-4 border border-az-glass-border flex items-center justify-between"
                          >
                            <div className="space-y-0.5">
                              <h3 className="text-sm font-bold text-az-ink">{offer.title}</h3>
                              <p className="text-xs text-az-ink/50">{offer.description}</p>
                            </div>
                            {offer.discount && (
                              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-az-success-500/20 text-az-success-400 border border-az-success-500/30">
                                {offer.discount}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </ScrollReveal>
                )}
              </div>

              <div className="lg:col-span-1 space-y-6">
                <ScrollReveal direction="right">
                  <GlowCard className="p-6 rounded-2xl border border-az-glass-border space-y-4">
                    <h3 className="text-sm font-bold text-az-ink">Location & Contact</h3>

                    <div className="space-y-3 text-xs">
                      <div className="flex items-start gap-2.5 text-az-ink/70">
                        <MapPin className="w-4 h-4 text-[var(--color-az-flame)] shrink-0 mt-0.5" />
                        <span>{place.address}</span>
                      </div>

                      {place.phone && (
                        <div className="flex items-center gap-2.5 text-az-ink/70">
                          <Phone className="w-4 h-4 text-[var(--color-az-flame)] shrink-0" />
                          <a
                            href={`tel:${place.phone}`}
                            className="hover:text-az-ink transition-colors"
                          >
                            {place.phone}
                          </a>
                        </div>
                      )}

                      {place.website && (
                        <div className="flex items-center gap-2.5 text-az-ink/70">
                          <Globe className="w-4 h-4 text-[var(--color-az-flame)] shrink-0" />
                          <a
                            href={place.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[var(--color-az-flame)] hover:underline truncate"
                          >
                            {place.website.replace(/^https?:\/\//, '')}
                          </a>
                        </div>
                      )}

                      {place.hours && (
                        <div className="flex items-center gap-2.5 text-az-ink/70">
                          <Clock className="w-4 h-4 text-[var(--color-az-flame)] shrink-0" />
                          <span>{place.hours}</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-az-ink/5 space-y-2">
                      <Link
                        href={`/lifestyle/itineraries`}
                        className="block w-full py-2.5 rounded-full text-xs font-bold text-center text-az-ink bg-[var(--color-az-flame)] hover:bg-[var(--color-az-flame)]/90 transition-all shadow-md shadow-[var(--color-az-flame)]/25"
                      >
                        Explore in City Itinerary
                      </Link>

                      {place.phone && (
                        <a
                          href={`tel:${place.phone}`}
                          className="block w-full py-2.5 text-xs font-semibold text-center az-glass text-az-ink/80 hover:text-az-ink hover:bg-az-glass-card border border-az-glass-border transition-all"
                        >
                          Call Venue Concierge
                        </a>
                      )}
                    </div>
                  </GlowCard>
                </ScrollReveal>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}

const Lazy = lazy(() => Promise.resolve({ default: PlaceDetailContent }));

export default function PlaceDetailPage(): React.JSX.Element {
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
