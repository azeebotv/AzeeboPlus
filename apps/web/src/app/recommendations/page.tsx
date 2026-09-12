'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../lib/api';
import AppHeader from '../../components/layout/AppHeader';
import AppFooter from '../../components/layout/AppFooter';
import { Skeleton } from '@/components/Skeleton';
import { OptimizedImage } from '@/components/OptimizedImage';
import { Sparkles, Film, Tv, Smile, Trophy } from 'lucide-react';

interface ContentItem {
  id: string;
  title: string;
  description?: string;
  thumbnail: string;
  duration?: number;
  category?: string;
  universe?: { name: string };
  creator?: { displayName: string };
  score?: number;
  reason?: string;
}

export default function RecommendationsPage(): React.JSX.Element {
  useAuth();
  const [recommendations, setRecommendations] = useState<ContentItem[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [page, setPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastItemRef = useRef<HTMLDivElement | null>(null);

  const filters = [
    { id: 'all', name: 'All', icon: Sparkles },
    { id: 'movies', name: 'Movies', icon: Film },
    { id: 'series', name: 'Series', icon: Tv },
    { id: 'reality', name: 'Reality', icon: Tv },
    { id: 'comedy', name: 'Comedy', icon: Smile },
    { id: 'sports', name: 'Sports', icon: Trophy },
  ];

  const fetchRecommendations = useCallback(async (pageNum: number, filter: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const params = new URLSearchParams({ page: String(pageNum), limit: '12' });
      if (filter !== 'all') params.set('category', filter);
      const response = await apiFetch<ContentItem[] | { items?: ContentItem[] }>(
        `/v1/recommendation/content?${params.toString()}`
      );
      if (response.success && response.data) {
        const data = Array.isArray(response.data) ? response.data : response.data.items || [];
        setRecommendations((prev) => (pageNum === 1 ? data : [...prev, ...data]));
        setHasMore(data.length >= 12);
      } else {
        setError('Failed to load recommendations');
      }
    } catch (err) {
      setError('Failed to load recommendations. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    setPage(1);
    setRecommendations([]);
    setHasMore(true);
    fetchRecommendations(1, activeFilter);
  }, [activeFilter, fetchRecommendations]);

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchRecommendations(nextPage, activeFilter);
    }
  }, [isLoading, hasMore, page, activeFilter, fetchRecommendations]);

  useEffect(() => {
    if (isLoading) return;
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (lastItemRef.current) {
      observerRef.current.observe(lastItemRef.current);
    }

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [isLoading, hasMore, loadMore]);

  const handleFilterChange = useCallback((filter: string) => {
    setActiveFilter(filter);
  }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--brand-near-black, #0b090e)' }}>
      <AppHeader logoVariant="light" />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="az-headline text-white text-3xl sm:text-4xl mb-2">Recommended For You</h1>
          <p className="text-white/50 text-sm">
            Personalized content based on your viewing history and preferences
          </p>
        </div>

        {/* Filters */}
        <div
          className="flex gap-3 mb-8 overflow-x-auto pb-2"
          role="radiogroup"
          aria-label="Content type filters"
        >
          {filters.map((filter) => {
            const Icon = filter.icon;
            const active = activeFilter === filter.id;
            return (
              <button
                key={filter.id}
                role="radio"
                aria-checked={active}
                onClick={() => handleFilterChange(filter.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  active ? 'text-white shadow-lg shadow-orange-500/20' : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
                style={
                  active
                    ? { background: 'linear-gradient(135deg, #E8420A, #CC1C1C)' }
                    : { border: '1px solid rgba(255,255,255,0.12)' }
                }
              >
                <Icon size={16} />
                <span>{filter.name}</span>
              </button>
            );
          })}
        </div>

        {/* Loading State */}
        {isLoading && recommendations.length === 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="az-glass overflow-hidden">
                <Skeleton height="200px" borderRadius="0px" />
                <div className="p-4 space-y-3">
                  <Skeleton width="80%" height="16px" />
                  <Skeleton width="60%" height="12px" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="az-glass p-12 text-center rounded-2xl max-w-md mx-auto">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
              <svg
                className="w-7 h-7"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.8}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Oops! Something went wrong</h3>
            <p className="text-white/50 text-sm mb-4">{error}</p>
            <button
              onClick={() => fetchRecommendations(1, activeFilter)}
              className="az-btn-primary"
              style={{ width: 'auto', paddingInline: '1.5rem' }}
            >
              Try Again
            </button>
          </div>
        )}

        {/* Content Grid */}
        {!error && recommendations.length > 0 && (
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            role="list"
            aria-label="Recommended content"
          >
            {recommendations.map((item, index) => (
              <div
                key={item.id}
                ref={index === recommendations.length - 1 ? lastItemRef : null}
                role="listitem"
                className="az-glass overflow-hidden group"
              >
                <a href={`/watch/${item.id}`} className="block">
                  <div className="relative h-48">
                    {item.thumbnail ? (
                      <OptimizedImage
                        src={item.thumbnail}
                        alt={item.title}
                        fill
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center text-white/40"
                        style={{
                          background:
                            'linear-gradient(135deg, rgba(232,66,10,0.15), rgba(24,21,30,0.8))',
                        }}
                      >
                        <svg
                          className="w-12 h-12"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={1.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75 0V5.625m0 12.75a1.125 1.125 0 001.125 1.125m0 0h1.5m-2.625-1.125V5.625m0 0A1.125 1.125 0 013.375 4.5h17.25c.621 0 1.125.504 1.125 1.125v12.75c0 .621-.504 1.125-1.125 1.125m-17.25-13.875h17.25"
                          />
                        </svg>
                      </div>
                    )}
                    {item.score != null && item.score > 80 && (
                      <span
                        className="absolute top-3 right-3 px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded"
                        style={{ background: 'rgba(232,66,10,0.9)', color: 'var(--brand-white)' }}
                      >
                        Top Pick
                      </span>
                    )}
                    {item.duration && (
                      <span
                        className="absolute bottom-2 right-2 px-2 py-0.5 rounded text-xs font-medium"
                        style={{ background: 'rgba(0,0,0,0.7)', color: 'var(--brand-white)' }}
                      >
                        {Math.floor(item.duration / 60)}m
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-white text-sm mb-1 group-hover:text-[var(--brand-orange)] transition-colors line-clamp-1">
                      {item.title}
                    </h3>
                    <p className="text-xs text-white/45 line-clamp-2 mb-2">{item.description}</p>
                    <div className="flex items-center gap-2">
                      {item.universe && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--brand-orange)]">
                          {item.universe.name}
                        </span>
                      )}
                      {item.creator && (
                        <span className="text-[10px] text-white/40">
                          by {item.creator.displayName}
                        </span>
                      )}
                    </div>
                    {item.reason && (
                      <p className="text-[10px] text-white/30 mt-2 italic">{item.reason}</p>
                    )}
                  </div>
                </a>
              </div>
            ))}
          </div>
        )}

        {/* Loading More */}
        {isLoading && recommendations.length > 0 && (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-4 border-white/10 border-t-[var(--brand-orange)] rounded-full animate-spin" />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && recommendations.length === 0 && (
          <div className="az-glass p-16 text-center rounded-2xl">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-[var(--brand-orange)]">
              <svg
                className="w-8 h-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.8}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No recommendations yet</h3>
            <p className="text-white/50 text-sm mb-4">
              Watch some content to get personalized recommendations
            </p>
            <a
              href="/browse"
              className="az-btn-primary inline-block"
              style={{ width: 'auto', paddingInline: '2rem' }}
            >
              Browse Content
            </a>
          </div>
        )}

        {/* End of Content */}
        {!hasMore && recommendations.length > 0 && (
          <div className="text-center py-8">
            <p className="text-white/40 text-sm">You&apos;ve seen all recommendations for now</p>
          </div>
        )}
      </main>
      <AppFooter logoVariant="light" />
    </div>
  );
}
