'use client';
import { Suspense, lazy, useEffect, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { api, ContentItem } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { OptimizedImage } from '@/components/OptimizedImage';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import analytics from '@/lib/analytics';

// TODO: localStorage watchlist should be synced to a server-side
// user-specific watchlist endpoint for cross-device persistence.
function WatchlistPageContent(): React.JSX.Element {
  const [watchlist, setWatchlist] = useState<string[]>([]);

  useEffect(() => {
    analytics.pageView('movies-watchlist');
    const saved = localStorage.getItem('azeebo_watchlist');
    if (saved) setWatchlist(JSON.parse(saved));
  }, []);

  const watchlistQuery = useQuery({
    queryKey: ['watchlist', watchlist],
    queryFn: async () => {
      if (watchlist.length === 0) return [];
      const results = await Promise.all(
        watchlist.map(async (id) => {
          const res = await api.request<ContentItem>(`/api/v1/content/${id}`);
          return res.success ? res.data : null;
        })
      );
      return results.filter(Boolean) as ContentItem[];
    },
    enabled: watchlist.length > 0,
    staleTime: 60000,
  });

  const removeFromWatchlist = useCallback((id: string) => {
    setWatchlist((prev) => {
      const next = prev.filter((itemId) => itemId !== id);
      localStorage.setItem('azeebo_watchlist', JSON.stringify(next));
      return next;
    });
  }, []);

  const movies = watchlistQuery.data ?? [];
  const isLoading = watchlistQuery.isLoading;
  const error = watchlistQuery.error?.message;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#1A0A0A' }}>
      <AppHeader active="Movies" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <ScrollReveal>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white">My Watchlist</h1>
              <p className="text-white/50 mt-2">
                {movies.length} {movies.length === 1 ? 'movie' : 'movies'} saved
              </p>
            </div>
          </div>
        </ScrollReveal>

        {watchlist.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-4">🎬</p>
            <h2 className="text-xl font-bold text-white mb-2">Your watchlist is empty</h2>
            <p className="text-white/50 mb-6">Save movies to watch later</p>
            <Link href="/movies">
              <motion.button
                type="button"
                className="az-btn-primary"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Browse Movies
              </motion.button>
            </Link>
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="az-glass overflow-hidden">
                <Skeleton height="240px" borderRadius="0" />
                <div className="p-4 space-y-3">
                  <Skeleton height="20px" width="70%" />
                  <Skeleton height="16px" width="50%" />
                  <Skeleton height="36px" borderRadius="0" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <ErrorState
            title="Failed to load watchlist"
            description={error}
            onButtonPress={() => watchlistQuery.refetch()}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {movies.map((movie, index) => (
                <motion.div
                  key={movie.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className="az-glass overflow-hidden">
                    <div className="relative">
                      <Link href={`/watch/${movie.id}`}>
                        <OptimizedImage
                          src={movie.thumbnail}
                          alt={movie.title}
                          width={400}
                          height={192}
                          className="w-full h-48 object-cover cursor-pointer"
                        />
                      </Link>
                      <button
                        type="button"
                        onClick={() => removeFromWatchlist(movie.id)}
                        className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110"
                        style={{ backgroundColor: 'rgba(239,68,68,0.8)' }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                          <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                      </button>
                      <div className="absolute inset-0 bg-gradient-to-t from-[#1A0A0A]/80 to-transparent" />
                      <div className="absolute bottom-4 left-4 right-4">
                        <span
                          className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium mb-2"
                          style={{ backgroundColor: 'rgba(232,66,10,0.2)', color: '#E8420A' }}
                        >
                          {movie.contentType || 'Movie'}
                        </span>
                        <h3 className="text-lg font-bold text-white">{movie.title}</h3>
                      </div>
                    </div>
                    <div className="p-4">
                      <p className="text-sm text-white/50 mb-3 line-clamp-2">{movie.description}</p>
                      <Link href={`/watch/${movie.id}`}>
                        <motion.button
                          type="button"
                          className="az-btn-primary w-full"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          Watch Now
                        </motion.button>
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <AppFooter />
    </div>
  );
}

const LazyWatchlistPage = lazy(() => Promise.resolve({ default: WatchlistPageContent }));

export default function WatchlistPage(): React.JSX.Element {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#1A0A0A]"><p className="text-white/50 text-lg">Loading...</p></div>}>
      <LazyWatchlistPage />
    </Suspense>
  );
}
