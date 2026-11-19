'use client';
import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Film, Heart } from 'lucide-react';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../lib/api';
import { PageShell } from '@/components/layout/PageShell';
import { PageHero } from '@/components/layout/PageHero';
import { OptimizedImage } from '../../components/OptimizedImage';
import { EmptyState } from '../../components/ui/EmptyState';

interface ContentItem {
  id: string;
  title: string;
  description?: string;
  thumbnail: string;
  duration?: number;
  category?: string;
  universe?: { name: string };
  creator?: { name: string };
  progress?: number;
  addedAt?: string;
}

interface LibraryData {
  watchlist: ContentItem[];
  history: ContentItem[];
  favorites: ContentItem[];
}

export default function LibraryPage(): React.JSX.Element {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState<'watchlist' | 'history' | 'favorites'>(
    'watchlist'
  );

  const { data, isLoading, error, refetch } = useQuery<LibraryData, Error>({
    queryKey: ['library'],
    queryFn: async () => {
      const [watchlistRes, historyRes, favoritesRes] = await Promise.all([
        apiFetch<ContentItem[]>('/interactions/watchlist', {}, { maxRetries: 2, timeoutMs: 10000 }),
        apiFetch<ContentItem[]>('/interactions/history', {}, { maxRetries: 2, timeoutMs: 10000 }),
        apiFetch<ContentItem[]>('/interactions/favorites', {}, { maxRetries: 2, timeoutMs: 10000 }),
      ]);
      return {
        watchlist:
          watchlistRes.success && watchlistRes.data
            ? Array.isArray(watchlistRes.data)
              ? watchlistRes.data
              : []
            : [],
        history:
          historyRes.success && historyRes.data
            ? Array.isArray(historyRes.data)
              ? historyRes.data
              : []
            : [],
        favorites:
          favoritesRes.success && favoritesRes.data
            ? Array.isArray(favoritesRes.data)
              ? favoritesRes.data
              : []
            : [],
      };
    },
    staleTime: 60000,
    enabled: isAuthenticated && !authLoading,
  });

  const watchlist = data?.watchlist ?? [];
  const watchHistory = data?.history ?? [];
  const favorites = data?.favorites ?? [];

  const sections = [
    { id: 'watchlist', name: 'Watchlist', items: watchlist },
    { id: 'history', name: 'Watch History', items: watchHistory },
    { id: 'favorites', name: 'Favorites', items: favorites },
  ];

  const removeFromWatchlist = useCallback(
    async (contentId: string) => {
      try {
        const response = await apiFetch<{ removed: boolean }>(
          `/interactions/watchlist/${contentId}`,
          {
            method: 'DELETE',
          }
        );
        if (response.success) {
          queryClient.setQueryData<LibraryData>(['library'], (old) =>
            old ? { ...old, watchlist: old.watchlist.filter((item) => item.id !== contentId) } : old
          );
        }
      } catch (err) {
        /* intentionally minimal */
      }
    },
    [queryClient]
  );

  const removeFromHistory = useCallback(
    async (contentId: string) => {
      try {
        const response = await apiFetch<{ removed: boolean }>(
          `/interactions/history/${contentId}`,
          {
            method: 'DELETE',
          }
        );
        if (response.success) {
          queryClient.setQueryData<LibraryData>(['library'], (old) =>
            old ? { ...old, history: old.history.filter((item) => item.id !== contentId) } : old
          );
        }
      } catch (err) {
        /* intentionally minimal */
      }
    },
    [queryClient]
  );

  const toggleFavorite = useCallback(
    async (contentId: string) => {
      try {
        const isFavorited = favorites.some((item) => item.id === contentId);
        const response = await apiFetch<{ favorited: boolean }>(
          isFavorited ? `/interactions/favorites/${contentId}` : '/interactions/favorites',
          {
            method: isFavorited ? 'DELETE' : 'POST',
            ...(isFavorited ? {} : { body: JSON.stringify({ contentId }) }),
          }
        );
        if (response.success) {
          queryClient.setQueryData<LibraryData>(['library'], (old) => {
            if (!old) return old;
            if (isFavorited) {
              return { ...old, favorites: old.favorites.filter((item) => item.id !== contentId) };
            }
            const item =
              old.watchlist.find((i) => i.id === contentId) ||
              old.history.find((i) => i.id === contentId);
            return item ? { ...old, favorites: [...old.favorites, item] } : old;
          });
        }
      } catch (err) {
        /* intentionally minimal */
      }
    },
    [favorites, queryClient]
  );

  if (authLoading) return <></>;
  if (!isAuthenticated) {
    return (
      <PageShell glowColor="color-mix(in srgb, var(--color-az-scarlet) 15%, transparent)">
        <div className="mx-auto max-w-md py-12">
          <motion.div
            className="az-glass p-10 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="az-section-title mb-3 text-az-ink">Sign in to access your library</h2>
            <p className="az-body text-az-ink-muted">
              Save Nollywood blockbusters, resume streaming history, and manage your favorites.
            </p>
          </motion.div>
        </div>
      </PageShell>
    );
  }

  const currentSection = sections.find((s) => s.id === activeSection);

  return (
    <PageShell glowColor="color-mix(in srgb, var(--color-az-scarlet) 12%, transparent)">
      <PageHero
        badge="Media Hub"
        title="My Library"
        description="Your personal cinema vault: curated watchlists, streaming playback history, and favorited Nollywood titles."
      />

      <div className="-mt-4 py-4">
        {/* Section Tabs */}
        <motion.div
          className="flex gap-3 sm:gap-4 mb-6 sm:mb-8 overflow-x-auto pb-2 scrollbar-hide"
          role="tablist"
          aria-label="Library sections"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          {sections.map((section) => (
            <motion.button
              key={section.id}
              type="button"
              role="tab"
              aria-selected={activeSection === section.id}
              onClick={() => setActiveSection(section.id as typeof activeSection)}
              className={`az-body-strong whitespace-nowrap rounded-az-pill px-5 py-2 transition-colors sm:px-6 sm:py-2.5 ${
                // 14px label: white on the gradient's flame stop is 3.18:1, deep
                // ink on scarlet 4.09:1 — solid flame with deep ink is 6.03:1.
                activeSection === section.id
                  ? 'bg-az-flame text-az-surface-root shadow-az-glow'
                  : 'border border-az-ink/15 text-az-ink/60 hover:text-az-ink'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {section.name} ({section.items.length})
            </motion.button>
          ))}
        </motion.div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <ErrorState
                title="Failed to load library"
                description={error.message}
                onButtonPress={() => refetch()}
              />
            </motion.div>
          ) : isLoading ? (
            <motion.div
              key="loading"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="az-glass overflow-hidden">
                  <Skeleton height="180px" borderRadius="0px" />
                  <div className="p-4 space-y-3">
                    <Skeleton width="80%" height="16px" />
                    <Skeleton width="60%" height="12px" />
                    <Skeleton width="40%" height="12px" />
                  </div>
                </div>
              ))}
            </motion.div>
          ) : currentSection?.items.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
            >
              <EmptyState
                icon={
                  activeSection === 'watchlist'
                    ? 'Package'
                    : activeSection === 'history'
                      ? 'Clock'
                      : 'Heart'
                }
                title={
                  activeSection === 'watchlist'
                    ? 'Your watchlist is empty'
                    : activeSection === 'history'
                      ? 'No watch history'
                      : 'No favorites yet'
                }
                description={
                  activeSection === 'watchlist'
                    ? 'Add content to watch later'
                    : activeSection === 'history'
                      ? 'Start watching content to build your history'
                      : 'Save your favorite content here'
                }
                dark
                className="az-glass p-10 sm:p-12"
              />
            </motion.div>
          ) : (
            <motion.div
              key={activeSection}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6"
              role="list"
              aria-label={`${currentSection?.name} items`}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35 }}
            >
              {currentSection?.items.map((item, index) => (
                <motion.div
                  key={item.id}
                  role="listitem"
                  className="az-glass overflow-hidden group"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04, duration: 0.4 }}
                >
                  <Link href={`/watch/${item.id}`} className="relative block h-44">
                    {item.thumbnail ? (
                      <OptimizedImage
                        src={item.thumbnail}
                        alt={item.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-az-scarlet/15 to-az-ink/80 text-az-ink/40">
                        <Film className="size-12" aria-hidden="true" />
                      </div>
                    )}
                    {item.progress != null && item.progress > 0 && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-az-ink/20">
                        <div
                          className="h-full bg-az-flame"
                          style={{ width: `${Math.min(item.progress, 100)}%` }}
                        />
                      </div>
                    )}
                    {item.duration && (
                      <span className="az-micro-label absolute bottom-2 right-2 rounded bg-black/70 px-2 py-0.5 text-white">
                        {Math.floor(item.duration / 60)}m
                      </span>
                    )}
                  </Link>
                  <div className="p-4">
                    <Link href={`/watch/${item.id}`}>
                      <h3 className="az-body-strong mb-1 line-clamp-1 text-az-ink transition-colors group-hover:text-az-flame">
                        {item.title}
                      </h3>
                    </Link>
                    <p className="az-caption mb-3 line-clamp-1 text-az-ink/40">
                      {item.universe?.name || item.creator?.name}
                    </p>
                    <div className="flex items-center gap-2">
                      {activeSection === 'watchlist' && (
                        <button
                          type="button"
                          aria-label={`Remove ${item.title} from watchlist`}
                          onClick={() => removeFromWatchlist(item.id)}
                          className="flex-1 rounded-az-control border border-az-ink/15 px-3 py-1.5 text-xs font-medium text-az-ink/60 transition-colors hover:text-az-ink"
                        >
                          Remove
                        </button>
                      )}
                      {activeSection === 'history' && (
                        <button
                          type="button"
                          aria-label={`Clear ${item.title} from history`}
                          onClick={() => removeFromHistory(item.id)}
                          className="flex-1 rounded-az-control border border-az-ink/15 px-3 py-1.5 text-xs font-medium text-az-ink/60 transition-colors hover:text-az-ink"
                        >
                          Clear
                        </button>
                      )}
                      <button
                        type="button"
                        aria-label={
                          favorites.some((f) => f.id === item.id)
                            ? `Remove ${item.title} from favorites`
                            : `Add ${item.title} to favorites`
                        }
                        onClick={() => toggleFavorite(item.id)}
                        className={`flex items-center justify-center rounded-az-control border border-az-ink/15 px-3 py-1.5 text-xs font-medium transition-colors ${favorites.some((f) => f.id === item.id) ? 'text-az-flame' : 'text-az-ink/60 hover:text-az-ink'}`}
                      >
                        <Heart
                          className={`size-4 ${favorites.some((f) => f.id === item.id) ? 'fill-current' : ''}`}
                          aria-hidden="true"
                        />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageShell>
  );
}
