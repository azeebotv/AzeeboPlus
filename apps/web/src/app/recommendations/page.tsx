'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../lib/api';
import AppHeader from '../../components/layout/AppHeader';
import AppFooter from '../../components/layout/AppFooter';
import { Skeleton } from '@/components/Skeleton';
import { OptimizedImage } from '@/components/OptimizedImage';

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
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastItemRef = useRef<HTMLDivElement | null>(null);

  const filters = [
    { id: 'all', name: 'All', icon: '🎬' },
    { id: 'movies', name: 'Movies', icon: '🎬' },
    { id: 'series', name: 'Series', icon: '📺' },
    { id: 'reality', name: 'Reality', icon: '🎭' },
    { id: 'comedy', name: 'Comedy', icon: '😂' },
    { id: 'sports', name: 'Sports', icon: '⚽' },
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
    fetchRecommendations(1, activeFilter);
  }, [activeFilter, fetchRecommendations]);

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          setPage((prev) => {
            const next = prev + 1;
            fetchRecommendations(next, activeFilter);
            return next;
          });
        }
      },
      { threshold: 0.1 }
    );
    if (lastItemRef.current) observerRef.current.observe(lastItemRef.current);
    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [hasMore, isLoading, activeFilter, fetchRecommendations]);

  const handleFilterChange = useCallback((filter: string) => {
    setActiveFilter(filter);
  }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#1A0A0A' }}>
      <AppHeader />
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
          {filters.map((filter) => (
            <button
              key={filter.id}
              role="radio"
              aria-checked={activeFilter === filter.id}
              onClick={() => handleFilterChange(filter.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeFilter === filter.id ? 'text-white' : 'text-white/60 hover:text-white'
              }`}
              style={
                activeFilter === filter.id
                  ? { background: 'linear-gradient(135deg, #E8420A, #CC1C1C)' }
                  : { border: '1px solid rgba(255,255,255,0.15)' }
              }
            >
              <span>{filter.icon}</span>
              {filter.name}
            </button>
          ))}
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
          <div className="az-glass p-8 text-center">
            <span className="text-4xl mb-4 block">&#x26A0;&#xFE0F;</span>
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
                        className="w-full h-full flex items-center justify-center"
                        style={{
                          background:
                            'linear-gradient(135deg, rgba(232,66,10,0.3), rgba(13,59,46,0.4))',
                        }}
                      >
                        <span style={{ fontSize: 48 }}>&#x1F3AC;</span>
                      </div>
                    )}
                    {item.score != null && item.score > 80 && (
                      <span
                        className="absolute top-3 right-3 px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded"
                        style={{ background: 'rgba(232,66,10,0.9)', color: '#fff' }}
                      >
                        Top Pick
                      </span>
                    )}
                    {item.duration && (
                      <span
                        className="absolute bottom-2 right-2 px-2 py-0.5 rounded text-xs font-medium"
                        style={{ background: 'rgba(0,0,0,0.7)', color: '#fff' }}
                      >
                        {Math.floor(item.duration / 60)}m
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-white text-sm mb-1 group-hover:text-[#E8420A] transition-colors line-clamp-1">
                      {item.title}
                    </h3>
                    <p className="text-xs text-white/45 line-clamp-2 mb-2">{item.description}</p>
                    <div className="flex items-center gap-2">
                      {item.universe && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#E8420A]">
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
            <div className="w-8 h-8 border-4 border-white/10 border-t-[#E8420A] rounded-full animate-spin" />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && recommendations.length === 0 && (
          <div className="az-glass p-12 text-center">
            <span className="text-5xl mb-4 block">&#x1F3AF;</span>
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
      <AppFooter />
    </div>
  );
}
