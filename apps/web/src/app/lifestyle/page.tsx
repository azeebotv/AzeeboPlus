'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { api, ContentItem } from '@/lib/api';
import { useUniversesQuery } from '@/hooks/useUniverses';
import { PageShell } from '@/components/layout/PageShell';
import { PageHero } from '@/components/layout/PageHero';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import { OptimizedImage } from '@/components/OptimizedImage';
import analytics from '@/lib/analytics';
import {
  Star,
  Smartphone,
  Moon,
  MessageCircle,
  Building2,
  Ticket,
  ArrowRight,
  Compass,
} from 'lucide-react';

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
    <PageShell glowColor="color-mix(in srgb, var(--color-az-scarlet) 15%, transparent)">
      <PageHero
        badge="Azeebo Living"
        title="Culture & High Life"
        description="Immerse in premier nightlife, red-carpet fashion, culinary tours, and celebrity trends across Lagos, Accra, Nairobi, and Johannesburg."
      />

      <div className="max-w-7xl mx-auto py-4 -mt-4 px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Lifestyle Portals Navigation */}
        <ScrollReveal>
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-az-ink flex items-center gap-2">
                <Compass className="w-4 h-4 text-[var(--color-az-flame)]" />
                Explore Portals & Guides
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
              {[
                {
                  label: 'Celebrities',
                  href: '/lifestyle/celebrities',
                  icon: Star,
                  desc: 'A-List Spotlights',
                },
                {
                  label: 'Influencers',
                  href: '/lifestyle/influencers',
                  icon: Smartphone,
                  desc: 'Digital Creators',
                },
                {
                  label: 'Nightlife',
                  href: '/lifestyle/nightlife',
                  icon: Moon,
                  desc: 'Clubs & Lounges',
                },
                {
                  label: 'Social Scene',
                  href: '/lifestyle/social',
                  icon: MessageCircle,
                  desc: 'Vip Galas',
                },
                {
                  label: 'City Guide',
                  href: '/lifestyle/city-guide',
                  icon: Building2,
                  desc: 'Urban Maps',
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href}>
                    <motion.div
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      className="az-glass p-4 border border-az-glass-border transition-all text-center group cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-xl bg-[var(--color-az-flame)]/10 text-[var(--color-az-flame)] flex items-center justify-center mx-auto mb-2.5 group-hover:scale-110 transition-transform">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-az-ink block group-hover:text-[var(--color-az-flame)] transition-colors">
                        {item.label}
                      </span>
                      <span className="text-[10px] text-az-ink/40 block mt-0.5">{item.desc}</span>
                    </motion.div>
                  </Link>
                );
              })}
            </div>
          </div>
        </ScrollReveal>

        {/* Featured Premiere Event Banner */}
        {events.length > 0 && (
          <ScrollReveal delay={0.1}>
            <div className="relative overflow-hidden az-glass border aspect-[21/9] min-h-[320px] sm:min-h-[380px] flex items-end">
              <OptimizedImage
                src={events[0].thumbnail}
                alt={events[0].title}
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 az-scrim--hero" />
              <div className="relative z-10 p-6 sm:p-10 max-w-2xl space-y-3">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase bg-[var(--color-az-flame)]/20 text-[var(--color-az-flame)] border border-[var(--color-az-flame)]/30 backdrop-blur-sm">
                  Spotlight Event
                </span>
                <h2 className="az-headline text-2xl sm:text-4xl font-extrabold text-az-ink">
                  {events[0].title}
                </h2>
                <p className="text-xs sm:text-sm text-az-ink/70 line-clamp-2 leading-relaxed">
                  {events[0].description}
                </p>
                <div className="flex items-center gap-3 pt-2">
                  <Link
                    href={`/watch/${events[0].id}`}
                    className="az-btn-primary flex items-center gap-2"
                  >
                    <Ticket className="w-4 h-4" />
                    Access Pass
                  </Link>
                  <Link
                    href={`/watch/${events[0].id}`}
                    className="px-5 py-2.5 rounded-full text-xs font-bold text-az-ink bg-az-glass-card hover:bg-az-ink/15 border border-az-ink/15 transition-all"
                  >
                    Event Details
                  </Link>
                </div>
              </div>
            </div>
          </ScrollReveal>
        )}

        {/* Events Grid */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-az-ink tracking-tight">
                Upcoming Cultural Gatherings
              </h2>
              <p className="text-xs text-az-ink/50 mt-0.5">
                Exclusive festivals, concerts, and premier showcases across the continent
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="az-glass overflow-hidden p-4 space-y-3">
                  <Skeleton className="aspect-video w-full rounded-xl" />
                  <Skeleton className="h-5 w-3/4 rounded-md" />
                  <Skeleton className="h-4 w-1/2 rounded-md" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="max-w-md mx-auto py-12">
              <ErrorState
                title="Failed to load lifestyle content"
                description={error.message}
                onButtonPress={() => refetch()}
              />
            </div>
          ) : events.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.slice(1).map((event) => (
                <ScrollReveal key={event.id}>
                  <Link href={`/watch/${event.id}`}>
                    <motion.article
                      whileHover={{ y: -3 }}
                      className="az-glass overflow-hidden border border-az-glass-border transition-all flex flex-col group cursor-pointer"
                    >
                      <div className="relative aspect-video bg-az-glass-fill">
                        <OptimizedImage
                          src={event.thumbnail}
                          alt={event.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 az-scrim" />
                        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-black/60 backdrop-blur-sm text-[var(--color-az-flame)] border border-[var(--color-az-flame)]/30">
                            {event.contentType || 'Culture'}
                          </span>
                        </div>
                      </div>
                      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                        <div>
                          <h3 className="text-sm font-bold text-az-ink group-hover:text-[var(--color-az-flame)] transition-colors truncate">
                            {event.title}
                          </h3>
                          <p className="text-xs text-az-ink/50 line-clamp-2 mt-1">
                            {event.description}
                          </p>
                        </div>
                        <div className="pt-2 border-t border-az-ink/5 flex items-center justify-between text-xs font-semibold text-[var(--color-az-flame)]">
                          <span>View Experience</span>
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </motion.article>
                  </Link>
                </ScrollReveal>
              ))}
            </div>
          ) : (
            <div className="az-glass p-16 text-center border border-az-glass-border">
              <p className="text-xs text-az-ink/50">No cultural events scheduled at this moment.</p>
            </div>
          )}
        </section>
      </div>
    </PageShell>
  );
}

export default LifestylePageContent;
