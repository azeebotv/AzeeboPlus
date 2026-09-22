'use client';

import { Suspense, lazy } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
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
    error,
    refetch,
  } = useQuery({
    queryKey: ['9tlife', 'place', placeId],
    queryFn: async () => {
      const res = await apiFetch<PlaceDetail>(`/v1/lifestyle/places/${placeId}`);
      return res.success ? res.data : null;
    },
    staleTime: 30000,
    enabled: !!placeId,
  });

  return (
    <PageShell glowColor="rgba(232,66,10,0.15)">
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
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/50 hover:text-white transition-colors"
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
        ) : error || !place ? (
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
              <div className="relative aspect-[21/9] sm:h-[400px] w-full rounded-3xl overflow-hidden border border-white/10 bg-white/5 shadow-2xl">
                {place.imageUrl ? (
                  <OptimizedImage
                    src={place.imageUrl}
                    alt={place.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[var(--brand-orange)]/25 via-black to-black" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--brand-near-black)] via-black/40 to-transparent" />

                <div className="absolute top-4 right-4 flex items-center gap-2">
                  <span
                    className={`text-xs font-mono font-bold px-3 py-1 rounded-full backdrop-blur-md border ${
                      place.isOpen
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                    }`}
                  >
                    {place.isOpen ? 'Open Now' : 'Closed'}
                  </span>
                  {place.partnerVerified && (
                    <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Verified Partner
                    </span>
                  )}
                </div>

                <div className="absolute bottom-6 left-6 right-6 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-mono text-[var(--brand-orange)]">
                    <span>{place.category}</span>
                    <span className="text-white/30">•</span>
                    <span className="text-white/60">{place.priceRange}</span>
                  </div>
                  <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                    {place.name}
                  </h1>
                  <div className="flex items-center gap-3 text-xs text-white/60 pt-1">
                    <div className="flex items-center gap-1 text-amber-400 font-bold">
                      <Star className="w-4 h-4 fill-amber-400" />
                      <span>{place.rating.toFixed(1)}</span>
                    </div>
                    <span className="text-white/30">•</span>
                    <span>{place.reviewCount} verified guest reviews</span>
                  </div>
                </div>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <ScrollReveal>
                  <div className="az-glass p-6 rounded-2xl border border-white/10 space-y-3">
                    <h2 className="text-base font-bold text-white">About the Venue</h2>
                    <p className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap">
                      {place.description}
                    </p>
                  </div>
                </ScrollReveal>

                {place.offers?.length > 0 && (
                  <ScrollReveal delay={0.1}>
                    <div className="space-y-3">
                      <h2 className="text-base font-bold text-white flex items-center gap-2">
                        <Ticket className="w-4 h-4 text-[var(--brand-orange)]" />
                        Exclusive Guest Privileges
                      </h2>
                      <div className="space-y-3">
                        {place.offers.map((offer) => (
                          <div
                            key={offer.id}
                            className="az-glass p-4 rounded-2xl border border-white/10 flex items-center justify-between"
                          >
                            <div className="space-y-0.5">
                              <h3 className="text-sm font-bold text-white">{offer.title}</h3>
                              <p className="text-xs text-white/50">{offer.description}</p>
                            </div>
                            {offer.discount && (
                              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
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
                  <GlowCard className="p-6 rounded-2xl border border-white/10 space-y-4">
                    <h3 className="text-sm font-bold text-white">Location & Contact</h3>

                    <div className="space-y-3 text-xs">
                      <div className="flex items-start gap-2.5 text-white/70">
                        <MapPin className="w-4 h-4 text-[var(--brand-orange)] shrink-0 mt-0.5" />
                        <span>{place.address}</span>
                      </div>

                      {place.phone && (
                        <div className="flex items-center gap-2.5 text-white/70">
                          <Phone className="w-4 h-4 text-[var(--brand-orange)] shrink-0" />
                          <a href={`tel:${place.phone}`} className="hover:text-white transition-colors">
                            {place.phone}
                          </a>
                        </div>
                      )}

                      {place.website && (
                        <div className="flex items-center gap-2.5 text-white/70">
                          <Globe className="w-4 h-4 text-[var(--brand-orange)] shrink-0" />
                          <a
                            href={place.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[var(--brand-orange)] hover:underline truncate"
                          >
                            {place.website.replace(/^https?:\/\//, '')}
                          </a>
                        </div>
                      )}

                      {place.hours && (
                        <div className="flex items-center gap-2.5 text-white/70">
                          <Clock className="w-4 h-4 text-[var(--brand-orange)] shrink-0" />
                          <span>{place.hours}</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-white/5 space-y-2">
                      <Link
                        href={`/lifestyle/itineraries`}
                        className="block w-full py-2.5 rounded-full text-xs font-bold text-center text-white bg-[var(--brand-orange)] hover:bg-[var(--brand-orange)]/90 transition-all shadow-md shadow-[var(--brand-orange)]/25"
                      >
                        Explore in City Itinerary
                      </Link>

                      {place.phone && (
                        <a
                          href={`tel:${place.phone}`}
                          className="block w-full py-2.5 rounded-full text-xs font-semibold text-center az-glass text-white/80 hover:text-white hover:bg-white/10 border border-white/10 transition-all"
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
        <div className="min-h-screen flex items-center justify-center bg-[var(--brand-near-black)]">
          <p className="text-white/50 text-lg">Loading...</p>
        </div>
      }
    >
      <Lazy />
    </Suspense>
  );
}
