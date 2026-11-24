'use client';
import { Suspense, lazy, useState, useCallback, useEffect, useRef } from 'react';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { api, ContentItem } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import { PageHero } from '@/components/layout/PageHero';
import { PageShell } from '@/components/layout/PageShell';
import { OptimizedImage } from '@/components/OptimizedImage';
import analytics from '@/lib/analytics';
import { EmptyState } from '@/components/ui/EmptyState';

const WATCHLIST_KEY = 'azeebo_watchlist';

function getLocalWatchlist(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem(WATCHLIST_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function setLocalWatchlist(ids: string[]): void {
  localStorage.setItem(WATCHLIST_KEY, JSON.stringify(ids));
}

function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('azeebo_access_token');
}

function WatchlistPageContent(): React.JSX.Element {
  const queryClient = useQueryClient();
  const [localIds, setLocalIds] = useState<string[]>([]);
  const [syncedIds, setSyncedIds] = useState<string[]>([]);
  const isLoggedIn = isAuthenticated();
  const initialised = useRef(false);

  useEffect(() => {
    analytics.pageView('movies-watchlist');
    setLocalIds(getLocalWatchlist());
  }, []);

  const savedQuery = useQuery({
    queryKey: ['savedItems'],
    queryFn: async () => {
      const res = await api.user.getSavedItems(1, 100);
      if (res.success && res.data) {
        const ids = res.data.items.map((i) => i.contentId);
        setSyncedIds(ids);
        return res.data.items;
      }
      return [];
    },
    enabled: isLoggedIn,
    staleTime: 30000,
  });

  const allIds = isLoggedIn ? syncedIds : localIds;

  const watchlistQuery = useQuery({
    queryKey: ['watchlist', allIds],
    queryFn: async () => {
      if (allIds.length === 0) return [];
      const results = await Promise.all(
        allIds.map(async (id) => {
          const res = await api.request<ContentItem>(`/api/v1/content/${id}`);
          return res.success ? res.data : null;
        })
      );
      // One missing title is a partial result; every title missing is an
      // outage and must not read as an empty watchlist.
      if (results.length > 0 && results.every((item) => item === null)) {
        throw new Error('Watchlist titles could not be loaded. Please try again.');
      }
      return results.filter(Boolean) as ContentItem[];
    },
    enabled: allIds.length > 0,
    staleTime: 60000,
  });

  const removeMutation = useMutation({
    mutationFn: async (contentId: string) => {
      if (isLoggedIn) {
        return api.user.unsaveItem(contentId);
      }
      return { success: true, data: { message: 'Removed locally' } } as const;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedItems'] });
    },
  });

  useEffect(() => {
    if (!initialised.current && savedQuery.data && syncedIds.length > 0) {
      const localIds = getLocalWatchlist();
      const merged = [...new Set([...syncedIds, ...localIds])];
      setLocalWatchlist(merged);
      setLocalIds(merged);
      initialised.current = true;
    }
  }, [savedQuery.data, syncedIds]);

  const removeFromWatchlist = useCallback(
    (id: string) => {
      if (isLoggedIn) {
        removeMutation.mutate(id);
      }
      const next = localIds.filter((itemId) => itemId !== id);
      setLocalWatchlist(next);
      setLocalIds(next);
      setSyncedIds((prev) => prev.filter((itemId) => itemId !== id));
    },
    [isLoggedIn, removeMutation, localIds]
  );

  const movies = watchlistQuery.data ?? [];
  const isLoading = savedQuery.isLoading || watchlistQuery.isLoading;
  const error = savedQuery.error?.message || watchlistQuery.error?.message;

  return (
    <PageShell maxWidth="7xl" activeNav="Movies">
      <PageHero
        eyebrow="Movies"
        title="My Watchlist"
        description={`${movies.length} ${movies.length === 1 ? 'movie' : 'movies'} saved`}
      />

      <div className="-mt-4 pb-12">
        {allIds.length === 0 && !savedQuery.isLoading ? (
          <EmptyState
            icon="Film"
            title="Your watchlist is empty"
            description="Save movies to watch later"
            action={{ label: 'Browse Movies', onClick: () => (window.location.href = '/movies') }}
            dark
          />
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
            onButtonPress={() => {
              savedQuery.refetch();
              watchlistQuery.refetch();
            }}
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
                        disabled={removeMutation.isPending}
                        className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full transition-all hover:scale-110 bg-az-error-500/80"
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="white"
                          strokeWidth="2"
                        >
                          <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                      </button>
                      <div className="absolute inset-0 az-scrim" />
                      <div className="absolute bottom-4 left-4 right-4">
                        <span className="az-caption mb-2 inline-block rounded-az-pill bg-az-scarlet/20 px-2.5 py-0.5 font-medium text-az-flame">
                          {movie.contentType || 'Movie'}
                        </span>
                        <h3 className="az-subtitle text-az-ink">{movie.title}</h3>
                      </div>
                    </div>
                    <div className="p-4">
                      <p className="az-body mb-3 line-clamp-2 text-az-ink-muted">
                        {movie.description}
                      </p>
                      <Link href={`/watch/${movie.id}`}>
                        <motion.button
                          type="button"
                          className="az-btn-primary"
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
    </PageShell>
  );
}

const LazyWatchlistPage = lazy(() => Promise.resolve({ default: WatchlistPageContent }));

export default function WatchlistPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--color-az-surface-root)]">
          <p className="az-lead text-az-ink-muted">Loading...</p>
        </div>
      }
    >
      <LazyWatchlistPage />
    </Suspense>
  );
}
