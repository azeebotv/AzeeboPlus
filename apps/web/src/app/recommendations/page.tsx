'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../lib/api';
import { PageShell } from '@/components/layout/PageShell';
import { PageHero } from '@/components/layout/PageHero';
import { Skeleton } from '@/components/Skeleton';
import { OptimizedImage } from '@/components/OptimizedImage';
import { AlertTriangle, Sparkles, Film, Tv, Smile, Trophy } from 'lucide-react';

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

  const chipClasses = (active: boolean): string =>
    [
      'az-body-strong flex items-center gap-2 whitespace-nowrap rounded-az-pill border px-4 py-2 transition-all',
      // Solid flame + deep ink: a 14px chip cannot carry the gradient (white on
      // the flame stop is 3.18:1, dark ink on scarlet 4.09:1).
      active
        ? 'border-transparent bg-az-flame text-az-surface-root shadow-az-glow'
        : 'border-az-ink/15 text-az-ink/60 hover:border-az-glass-border-hover hover:bg-az-glass-fill hover:text-az-ink',
    ].join(' ');

  const filterChips = (
    <div className="flex flex-wrap gap-3" role="radiogroup" aria-label="Content type filters">
      {filters.map((filter) => {
        const Icon = filter.icon;
        const active = activeFilter === filter.id;
        return (
          <button
            key={filter.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => handleFilterChange(filter.id)}
            className={chipClasses(active)}
          >
            <Icon size={16} aria-hidden="true" />
            <span>{filter.name}</span>
          </button>
        );
      })}
    </div>
  );

  return (
    <PageShell maxWidth="7xl">
      <PageHero
        title="Recommended For You"
        subtitle="Personalized content based on your viewing history and preferences"
        actions={filterChips}
      />

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
        <div className="az-glass p-12 text-center max-w-md mx-auto">
          <div className="flex h-14 w-14 items-center justify-center rounded-az-panel border border-az-error-500/20 bg-az-error-500/10 mx-auto mb-4 text-az-error-400">
            <AlertTriangle size={28} aria-hidden="true" />
          </div>
          <h3 className="text-lg font-bold text-az-ink mb-2">Oops! Something went wrong</h3>
          <p className="text-az-ink/50 text-sm mb-4">{error}</p>
          <button
            type="button"
            onClick={() => fetchRecommendations(1, activeFilter)}
            className="az-btn-primary az-btn-primary--inline"
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
              <Link href={`/watch/${item.id}`} className="block">
                <div className="relative h-48">
                  {item.thumbnail ? (
                    <OptimizedImage
                      src={item.thumbnail}
                      alt={item.title}
                      fill
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-az-scarlet/15 to-az-surface-panel/80 text-az-ink/40">
                      <Film size={48} aria-hidden="true" />
                    </div>
                  )}
                  {item.score != null && item.score > 80 && (
                    <span className="az-micro-label absolute top-3 right-3 rounded bg-az-scarlet/90 px-2 py-1 font-bold text-az-ink">
                      Top Pick
                    </span>
                  )}
                  {item.duration && (
                    <span className="absolute bottom-2 right-2 rounded bg-black/70 px-2 py-0.5 text-xs font-medium text-az-ink">
                      {Math.floor(item.duration / 60)}m
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-az-ink text-sm mb-1 group-hover:text-az-flame transition-colors line-clamp-1">
                    {item.title}
                  </h3>
                  <p className="text-xs text-az-ink/45 line-clamp-2 mb-2">{item.description}</p>
                  <div className="flex items-center gap-2">
                    {item.universe && (
                      <span className="az-micro-label font-bold text-az-flame">
                        {item.universe.name}
                      </span>
                    )}
                    {item.creator && (
                      <span className="text-[10px] text-az-ink/40">
                        by {item.creator.displayName}
                      </span>
                    )}
                  </div>
                  {item.reason && (
                    <p className="text-[10px] text-az-ink/30 mt-2 italic">{item.reason}</p>
                  )}
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Loading More */}
      {isLoading && recommendations.length > 0 && (
        <div className="flex justify-center py-8">
          <div
            role="status"
            aria-label="Loading more recommendations"
            className="w-8 h-8 border-4 border-az-glass-border border-t-az-flame rounded-full animate-spin"
          />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && recommendations.length === 0 && (
        <div className="az-glass p-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-az-panel border border-az-flame/20 bg-az-flame/10 mx-auto mb-4 text-az-flame">
            <Sparkles size={32} aria-hidden="true" />
          </div>
          <h3 className="text-xl font-bold text-az-ink mb-2">No recommendations yet</h3>
          <p className="text-az-ink/50 text-sm mb-4">
            Watch some content to get personalized recommendations
          </p>
          <Link href="/browse" className="az-btn-primary az-btn-primary--inline inline-block">
            Browse Content
          </Link>
        </div>
      )}

      {/* End of Content */}
      {!hasMore && recommendations.length > 0 && (
        <div className="text-center py-8">
          <p className="text-az-ink/40 text-sm">You&apos;ve seen all recommendations for now</p>
        </div>
      )}
    </PageShell>
  );
}
