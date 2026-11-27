'use client';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import Link from 'next/link';
import { api, ContentItem, Category } from '@/lib/api';
import { useUniversesQuery } from '@/hooks/useUniverses';
import { PageHero } from '@/components/layout/PageHero';
import { PageShell } from '@/components/layout/PageShell';
import { OptimizedImage } from '@/components/OptimizedImage';
import { Laugh, Theater, Mic, Smile, Flame, Play, type LucideIcon } from 'lucide-react';
import analytics from '@/lib/analytics';

const comedyIcons: Record<string, LucideIcon> = {
  standup: Mic,
  'stand-up': Mic,
  skits: Laugh,
  parody: Theater,
  improv: Smile,
  trending: Flame,
};

function ComedyPageContent(): React.JSX.Element {
  useEffect(() => {
    analytics.pageView('comedy');
  }, []);

  const universesQuery = useUniversesQuery();

  const comedyUniverse = universesQuery.data?.find((u) => u.name?.toLowerCase() === 'comedy');

  const categoriesQuery = useQuery<Category[]>({
    queryKey: ['categories', comedyUniverse?.id],
    queryFn: async () => {
      const res = await api.content.getCategories();
      if (!res.success || !res.data) throw new Error(res.message || 'Failed to load categories');
      return res.data;
    },
    staleTime: 300000,
  });

  const {
    data: clips = [],
    isLoading,
    error,
    refetch,
  } = useQuery<ContentItem[], Error>({
    queryKey: ['comedy-content', comedyUniverse?.id],
    queryFn: async () => {
      if (!comedyUniverse?.id) return [];
      const result = await api.content.getContentByUniverse(comedyUniverse.id, 1, 20);
      if (result.success && result.data) {
        return Array.isArray(result.data) ? result.data : result.data.items || [];
      }
      return [];
    },
    staleTime: 60000,
    enabled: !!comedyUniverse?.id,
  });

  const effectiveLoading = universesQuery.isLoading || (!!comedyUniverse?.id && isLoading);

  return (
    <PageShell activeNav="Comedy">
      <PageHero
        eyebrow="Comedy"
        title="Comedy Universe"
        description="Laugh out loud with the best African comedy content. From hilarious skits to stand-up specials."
        accentColor="var(--color-az-universe-comedy)"
        actions={
          <>
            <Link
              href="/browse?category=comedy"
              className="az-body-strong inline-block rounded-az-pill border border-az-ink/30 bg-az-ink/20 px-6 py-3 text-az-ink transition-all hover:bg-az-ink/30"
            >
              Browse Comedy
            </Link>
            {/* Flame text on the ink-white pill measured 3.18:1, so the primary
                action is flame with the deep surface ink on it instead — the
                same pairing `.az-btn-primary` uses. */}
            <Link
              href="/creators/upload"
              className="az-body-strong inline-block rounded-az-pill bg-az-flame px-6 py-3 text-az-surface-root transition-all hover:brightness-110"
            >
              Submit Your Clip
            </Link>
          </>
        }
      />

      {/* Featured Clips */}
      <section className="py-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="az-section-title text-az-ink">Trending Clips</h2>
            <p className="az-body mt-1 text-az-ink-muted">What everyone is laughing at</p>
          </div>
          <Link
            href="/browse"
            className="az-body-strong text-az-flame transition-colors hover:text-az-scarlet"
          >
            View All
          </Link>
        </div>

        {effectiveLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="az-glass overflow-hidden">
                <Skeleton height="192px" borderRadius="0px" />
                <div className="p-4 space-y-3">
                  <Skeleton height="20px" width="75%" />
                  <Skeleton height="16px" width="50%" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <ErrorState
            title="Failed to load comedy content"
            description={error.message}
            onButtonPress={() => refetch()}
          />
        ) : clips.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {clips.map((clip) => (
              <Link key={clip.id} href={`/watch/${clip.id}`}>
                <article className="az-glass overflow-hidden cursor-pointer transition-all hover:scale-[1.02] group">
                  <div className="relative">
                    <OptimizedImage
                      src={clip.thumbnail}
                      alt={clip.title}
                      width={400}
                      height={160}
                      className="w-full h-40 object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 az-scrim" aria-hidden="true" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-14 h-14 rounded-full flex items-center justify-center bg-az-ink/90">
                        <Play size={20} className="text-az-surface-root" aria-hidden="true" />
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="az-body-strong mb-2 truncate text-az-ink">{clip.title}</h3>
                    <p className="az-caption line-clamp-2 text-az-ink-muted">{clip.description}</p>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="az-lead text-az-ink-muted">No comedy clips available yet</p>
          </div>
        )}
      </section>

      {/* Categories */}
      <section className="py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="az-section-title text-az-ink">Comedy Categories</h2>
            <p className="az-body mt-1 text-az-ink-muted">Find your favorite type of comedy</p>
          </div>
        </div>

        <div
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4"
          role="group"
          aria-label="Comedy categories"
        >
          {(categoriesQuery.data || []).slice(0, 6).map((category) => (
            <button
              key={category.id}
              type="button"
              aria-label={category.name}
              className="az-glass p-4 text-center cursor-pointer transition-all hover:scale-[1.02] group flex flex-col items-center justify-center"
            >
              {(() => {
                const Icon =
                  comedyIcons[category.slug?.toLowerCase() || ''] ||
                  comedyIcons[category.name?.toLowerCase() || ''] ||
                  Laugh;
                return (
                  <div className="w-12 h-12 rounded-xl bg-az-warning-500/10 border border-az-warning-500/20 flex items-center justify-center text-az-warning-400 mb-3 group-hover:scale-110 group-hover:bg-az-warning-500/20 transition-all">
                    <Icon size={22} strokeWidth={1.75} aria-hidden="true" />
                  </div>
                );
              })()}
              <h4 className="az-body-strong text-az-ink">{category.name}</h4>
            </button>
          ))}
        </div>
      </section>
    </PageShell>
  );
}

export default ComedyPageContent;
