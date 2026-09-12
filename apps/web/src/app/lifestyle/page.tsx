'use client';
import { useEffect } from 'react';

import { useQuery } from '@tanstack/react-query';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import Link from 'next/link';
import { api, ContentItem } from '@/lib/api';
import { useUniversesQuery } from '@/hooks/useUniverses';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { OptimizedImage } from '@/components/OptimizedImage';
import analytics from '@/lib/analytics';
import { Star, Smartphone, Moon, MessageCircle, Building2 } from 'lucide-react';

function LifestylePageContent(): React.JSX.Element {
  useEffect(() => {
    analytics.pageView('lifestyle');
  }, []);

  const universesQuery = useUniversesQuery();

  const lifestyleUniverse = universesQuery.data?.find((u) => u.name?.toLowerCase() === 'lifestyle');

  const {
    data: events = [],
    isLoading,
    error,
    refetch,
  } = useQuery<ContentItem[], Error>({
    queryKey: ['lifestyle-content', lifestyleUniverse?.id],
    queryFn: async () => {
      if (!lifestyleUniverse?.id) throw new Error('Lifestyle universe not found');
      const result = await api.content.getContentByUniverse(lifestyleUniverse.id, 1, 20);
      if (result.success && result.data) {
        return Array.isArray(result.data) ? result.data : result.data.items || [];
      }
      throw new Error(result.message || 'Failed to load lifestyle content.');
    },
    staleTime: 60000,
    enabled: !!lifestyleUniverse?.id,
  });

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--brand-near-black, #0b090e)' }}>
      <AppHeader active="Lifestyle" logoVariant="light" />

      {/* Hero Section */}
      <section className="relative">
        {isLoading ? (
          <Skeleton height="500px" borderRadius="0px" />
        ) : error ? (
          <div className="h-[500px] flex items-center justify-center">
            <ErrorState
              title="Failed to load lifestyle content"
              description={error.message}
              onButtonPress={() => refetch()}
            />
          </div>
        ) : events.length > 0 ? (
          <div className="relative h-[500px]">
            <OptimizedImage
              src={events[0].thumbnail}
              alt={events[0].title}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0b090e] via-[#0b090e]/60 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-8 max-w-7xl mx-auto">
              <span
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mb-4"
                style={{ backgroundColor: 'rgba(232,66,10,0.2)', color: 'var(--brand-orange)' }}
              >
                Lifestyle
              </span>
              <h2 className="text-4xl font-bold text-white mb-2">{events[0].title}</h2>
              <p className="text-white/60 text-lg mb-6 max-w-2xl">{events[0].description}</p>
              <div className="flex items-center gap-4">
                <Link
                  href={`/watch/${events[0].id}`}
                  className="az-btn-primary"
                  style={{
                    width: 'auto',
                    paddingInline: '2rem',
                    display: 'inline-block',
                    textAlign: 'center',
                  }}
                >
                  Get Tickets
                </Link>
                <Link
                  href={`/watch/${events[0].id}`}
                  className="px-6 py-3 rounded-full text-sm font-semibold text-white transition-all"
                  style={{
                    border: '1px solid rgba(255,255,255,0.2)',
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    display: 'inline-block',
                  }}
                >
                  View Details
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-[500px] flex items-center justify-center">
            <p className="text-lg text-white/60">No events available</p>
          </div>
        )}
      </section>

      {/* Sub-Section Navigation */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-xl font-bold text-white mb-4">Explore Lifestyle</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            { label: 'Celebrities', href: '/lifestyle/celebrities', icon: Star },
            { label: 'Influencers', href: '/lifestyle/influencers', icon: Smartphone },
            { label: 'Nightlife', href: '/lifestyle/nightlife', icon: Moon },
            { label: 'Social', href: '/lifestyle/social', icon: MessageCircle },
            { label: 'City Guide', href: '/lifestyle/city-guide', icon: Building2 },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className="az-glass p-5 text-center cursor-pointer transition-all hover:scale-[1.03] hover:border-orange-500/40"
                  style={{ boxShadow: '0 0 15px rgba(232,66,10,0.08)' }}
                >
                  <div className="w-10 h-10 rounded-full bg-orange-500/10 text-[var(--brand-orange)] flex items-center justify-center mx-auto mb-3">
                    <Icon size={20} />
                  </div>
                  <span className="text-sm font-semibold text-white">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Events Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">Upcoming Events</h2>
            <p className="text-base mt-1 text-white/50">
              Discover exciting lifestyle events across Africa
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="az-glass overflow-hidden">
                <Skeleton height="240px" borderRadius="0px" />
                <div className="p-4 space-y-3">
                  <Skeleton height="20px" width="75%" />
                  <Skeleton height="16px" width="50%" />
                </div>
              </div>
            ))}
          </div>
        ) : events.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <Link key={event.id} href={`/watch/${event.id}`}>
                <article
                  className="az-glass overflow-hidden cursor-pointer transition-all hover:scale-[1.02]"
                  style={{ boxShadow: '0 0 20px rgba(255,255,255,0.05)' }}
                >
                  <div className="relative">
                    <OptimizedImage
                      src={event.thumbnail}
                      alt={event.title}
                      width={400}
                      height={192}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--brand-near-black)]/80 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <span
                        className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium mb-2"
                        style={{
                          backgroundColor: 'rgba(232,66,10,0.2)',
                          color: 'var(--brand-orange)',
                        }}
                      >
                        {event.contentType || 'Event'}
                      </span>
                      <h3 className="text-xl font-bold text-white">{event.title}</h3>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-white/50 mb-3 line-clamp-2">{event.description}</p>
                    <button
                      type="button"
                      aria-label={`Get tickets for ${event.title}`}
                      className="az-btn-primary w-full"
                    >
                      Get Tickets
                    </button>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-lg text-white/50">No events available yet</p>
          </div>
        )}
      </section>

      <AppFooter logoVariant="light" />
    </div>
  );
}

export default LifestylePageContent;
