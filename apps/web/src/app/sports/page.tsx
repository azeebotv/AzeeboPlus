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

function SportsPageContent(): React.JSX.Element {
  useEffect(() => {
    analytics.pageView('sports');
  }, []);

  const universesQuery = useUniversesQuery();

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
    <div
      className="min-h-screen relative overflow-x-hidden"
      style={{ background: 'var(--hp-bg)', color: 'var(--text-primary)' }}
    >
      <AppHeader active="Sports" logoVariant="light" />

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
            className="relative h-[500px] flex items-center justify-center overflow-hidden"
            style={{
              background:
                'radial-gradient(ellipse at top, rgba(232,66,10,0.18) 0%, var(--bg-secondary) 50%, var(--bg-primary) 100%)',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            {/* Ambient decorative glow */}
            <div
              className="absolute -top-32 -left-32 w-96 h-96 rounded-full blur-3xl pointer-events-none"
              style={{ background: 'rgba(16,185,129,0.12)' }}
            />
            <div
              className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full blur-3xl pointer-events-none"
              style={{ background: 'rgba(232,66,10,0.15)' }}
            />

            <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-5 az-glass"
                style={{
                  border: '1px solid rgba(232,66,10,0.3)',
                  boxShadow: '0 0 30px rgba(232,66,10,0.2)',
                  color: 'var(--brand-orange, #E8420A)',
                }}
              >
                <svg
                  width="36"
                  height="36"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                  <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                  <path d="M4 22h16" />
                  <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                  <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                  <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
                </svg>
              </div>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase mb-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Live & Upcoming Sports
              </span>
              <h2 className="text-4xl sm:text-5xl font-bold text-white mb-3 tracking-tight">
                {matches[0].title}
              </h2>
              <p className="text-white/70 text-base sm:text-lg mb-8 max-w-2xl mx-auto leading-relaxed">
                {matches[0].description}
              </p>
              <div className="flex items-center justify-center gap-4 flex-wrap">
                <Link href={`/watch/${matches[0].id}`}>
                  <button
                    type="button"
                    aria-label="Watch live sports content"
                    className="az-btn-primary"
                    style={{
                      paddingInline: '2rem',
                    }}
                  >
                    Watch Live
                  </button>
                </Link>
                <Link
                  href={`/sports/predictions`}
                  className="px-6 py-3 rounded-full text-sm font-semibold transition-all inline-block az-glass border border-white/15 text-white hover:border-orange-500/50 hover:bg-white/5"
                >
                  Make Prediction
                </Link>
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
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--brand-near-black)]/80 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <span
                        className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold mb-2"
                        style={{
                          backgroundColor: 'rgba(16,185,129,0.15)',
                          color: '#34D399',
                          border: '1px solid rgba(16,185,129,0.25)',
                        }}
                      >
                        {match.contentType || 'Sport'}
                      </span>
                      <h3 className="text-xl font-bold text-white">{match.title}</h3>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-white/50 mb-3 line-clamp-2">{match.description}</p>
                    <button
                      type="button"
                      aria-label={`Watch ${match.title}`}
                      className="az-btn-primary w-full"
                    >
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

      <AppFooter logoVariant="light" />
    </div>
  );
}

export default SportsPageContent;
