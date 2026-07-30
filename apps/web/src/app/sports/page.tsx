'use client';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import Link from 'next/link';
import { api, ContentItem } from '@/lib/api';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { OptimizedImage } from '@/components/OptimizedImage';
import analytics from '@/lib/analytics';

function SportsPageContent(): React.JSX.Element {
  useEffect(() => {
    analytics.pageView('sports');
  }, []);

  const universesQuery = useQuery({
    queryKey: ['universes'],
    queryFn: async () => {
      const res = await api.universe.getUniverses();
      if (!res.success || !res.data) throw new Error(res.message || 'Failed to load universes');
      return res.data;
    },
    staleTime: 300000,
  });

  const sportsUniverse = universesQuery.data?.find((u) => u.name?.toLowerCase() === 'sports');

  const {
    data: matches = [],
    isLoading,
    error,
    refetch,
  } = useQuery<ContentItem[], Error>({
    queryKey: ['sports-content', sportsUniverse?.id],
    queryFn: async () => {
      if (!sportsUniverse?.id) throw new Error('Sports universe not found');
      const result = await api.content.getContentByUniverse(sportsUniverse.id, 1, 20);
      if (result.success && result.data) {
        return Array.isArray(result.data) ? result.data : result.data.items || [];
      }
      throw new Error(result.message || 'Failed to load sports content.');
    },
    staleTime: 60000,
    enabled: !!sportsUniverse?.id,
  });

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#1A0A0A' }}>
      <AppHeader active="Sports" />

      {/* Hero Section */}
      <section className="relative">
        {isLoading ? (
          <Skeleton height="500px" borderRadius="0px" />
        ) : error ? (
          <div className="h-[500px] flex items-center justify-center">
            <ErrorState
              title="Failed to load sports content"
              description={error.message}
              onButtonPress={() => refetch()}
            />
          </div>
        ) : matches.length > 0 ? (
          <div
            className="relative h-[500px]"
            style={{ background: 'linear-gradient(135deg, #0D3B2E, #E8420A)' }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center px-4">
                <div
                  className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                >
                  <span className="text-white text-3xl font-bold">⚽</span>
                </div>
                <h2 className="text-4xl font-bold text-white mb-2">{matches[0].title}</h2>
                <p className="text-white/80 text-lg mb-6 max-w-2xl">{matches[0].description}</p>
                <div className="flex items-center justify-center gap-4">
                  <Link href={`/watch/${matches[0].id}`}>
                    <button
                      type="button"
                      aria-label="Watch live sports content"
                      className="px-6 py-3 rounded-full text-sm font-semibold text-white transition-all"
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        border: '1px solid rgba(255,255,255,0.3)',
                      }}
                    >
                      Watch Live
                    </button>
                  </Link>
                  <Link
                    href={`/sports/predictions`}
                    className="px-6 py-3 rounded-full text-sm font-semibold transition-all inline-block"
                    style={{ backgroundColor: '#fff', color: '#0D3B2E' }}
                  >
                    Make Prediction
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-[500px] flex items-center justify-center">
            <p className="text-lg text-white/60">No sports content available</p>
          </div>
        )}
      </section>

      {/* Content Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">Featured Sports Content</h2>
            <p className="text-base mt-1 text-white/50">Don&apos;t miss the action</p>
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
        ) : matches.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {matches.map((match) => (
              <Link key={match.id} href={`/watch/${match.id}`}>
                <article
                  className="az-glass overflow-hidden cursor-pointer transition-all hover:scale-[1.02]"
                  style={{ boxShadow: '0 0 20px rgba(255,255,255,0.05)' }}
                >
                  <div className="relative">
                    <OptimizedImage
                      src={match.thumbnail}
                      alt={match.title}
                      width={400}
                      height={192}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1A0A0A]/80 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <span
                        className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium mb-2"
                        style={{ backgroundColor: 'rgba(13,59,46,0.4)', color: '#4ADE80' }}
                      >
                        {match.contentType || 'Sport'}
                      </span>
                      <h3 className="text-xl font-bold text-white">{match.title}</h3>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-white/50 mb-3 line-clamp-2">{match.description}</p>
                    <button type="button" aria-label={`Watch ${match.title}`} className="az-btn-primary w-full">
                      Watch Now
                    </button>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-lg text-white/50">No sports content available yet</p>
          </div>
        )}
      </section>

      <AppFooter />
    </div>
  );
}

export const metadata = {
  title: 'Sports | Azeebo',
  description: 'Watch live sports, make predictions, and follow your favorite teams and leagues.',
  openGraph: {
    title: 'Sports | Azeebo',
    description: 'Watch live sports, make predictions, and follow your favorite teams and leagues.',
  },
};

export default SportsPageContent;
