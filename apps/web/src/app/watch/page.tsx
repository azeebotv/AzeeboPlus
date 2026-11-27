'use client';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import { api } from '@/lib/api';
import PageShell from '@/components/layout/PageShell';
import PageHero from '@/components/layout/PageHero';
import { OptimizedImage } from '@/components/OptimizedImage';
import analytics from '@/lib/analytics';
import { Tv, Smile, Film, Smartphone, Trophy, Star } from 'lucide-react';

const categories = [
  { name: 'Reality', href: '/reality', icon: Tv, universe: 'reality' },
  { name: 'Comedy', href: '/comedy', icon: Smile, universe: 'comedy' },
  { name: 'Movies', href: '/movies', icon: Film, universe: 'movies' },
  { name: 'Vertical', href: '/vertical', icon: Smartphone, universe: 'vertical' },
  { name: 'Sports', href: '/sports', icon: Trophy, universe: 'sports' },
  { name: 'Lifestyle', href: '/lifestyle', icon: Star, universe: 'lifestyle' },
] as const;

export default function WatchPage(): React.JSX.Element {
  useEffect(() => {
    analytics.pageView('watch');
  }, []);

  const trendingQuery = useQuery({
    queryKey: ['trending-content'],
    queryFn: async () => {
      const res = await api.content.getTrendingContent(12);
      if (res.success && res.data) {
        return res.data;
      }
      return [];
    },
    staleTime: 120000,
  });

  const trending = trendingQuery.data || [];

  return (
    <PageShell activeNav="Watch">
      <PageHero
        eyebrow="All Universes"
        title="Watch"
        subtitle="Discover content across all universes"
      />

      <section className="mb-12">
        <h2 className="az-section-title text-az-ink mb-4">Browse by Category</h2>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.href}
                href={cat.href}
                className="az-glass flex items-center gap-3 px-5 py-4"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-az-card bg-az-glass-fill">
                  <Icon
                    size={20}
                    style={{ color: `var(--color-az-universe-${cat.universe})` }}
                    aria-hidden="true"
                  />
                </span>
                <span className="az-body-strong text-az-ink">{cat.name}</span>
              </Link>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="az-section-title text-az-ink mb-4">Trending Now</h2>
        {trendingQuery.isLoading ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} height="280px" borderRadius="16px" />
            ))}
          </div>
        ) : trendingQuery.error ? (
          <ErrorState title="Failed to load trending content" />
        ) : trending.length === 0 ? (
          <div className="az-glass px-6 py-16 text-center">
            <p className="az-lead text-az-ink">No trending content right now.</p>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
            {trending.map((item) => (
              <Link
                key={item.id}
                href={`/watch/${item.id}`}
                className="az-glass block overflow-hidden"
              >
                <div className="relative aspect-[9/16] bg-az-surface-raised">
                  {item.thumbnail && (
                    <OptimizedImage src={item.thumbnail} alt="" fill className="object-cover" />
                  )}
                </div>
                <div className="p-3">
                  <h3 className="az-body-strong text-az-ink">{item.title}</h3>
                  {item.creator && (
                    <p className="az-caption text-az-ink-muted mt-1">{item.creator.name}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </PageShell>
  );
}
