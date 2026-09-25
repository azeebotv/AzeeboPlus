'use client';
import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
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
      <PageShell glowColor="rgba(232,66,10,0.15)">
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <motion.div
            className="az-glass p-10 text-center rounded-3xl border border-white/10 max-w-md mx-auto shadow-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-2xl font-extrabold text-white mb-3 tracking-tight">
              Sign in to access your library
            </h2>
            <p className="text-white/50 text-sm">
              Save Nollywood blockbusters, resume streaming history, and manage your favorites.
            </p>
          </motion.div>
        </main>
      </PageShell>
    );
  }

  const currentSection = sections.find((s) => s.id === activeSection);

  return (
    <PageShell glowColor="rgba(232,66,10,0.12)">
      <PageHero
        badge="Media Hub"
        title="My Library"
        description="Your personal cinema vault: curated watchlists, streaming playback history, and favorited Nollywood titles."
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 -mt-4">

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
              role="tab"
              aria-selected={activeSection === section.id}
              onClick={() => setActiveSection(section.id as typeof activeSection)}
              className={`px-5 sm:px-6 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
                activeSection === section.id ? 'text-white' : 'text-white/60 hover:text-white'
              }`}
              style={
                activeSection === section.id
                  ? { background: 'linear-gradient(135deg, #E8420A, #CC1C1C)' }
                  : { border: '1px solid rgba(255,255,255,0.15)' }
              }
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
                  <a href={`/watch/${item.id}`} className="block relative h-44">
                    {item.thumbnail ? (
                      <OptimizedImage
                        src={item.thumbnail}
                        alt={item.title}
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
                    {item.progress != null && item.progress > 0 && (
                      <div
                        className="absolute bottom-0 left-0 right-0 h-1"
                        style={{ background: 'rgba(255,255,255,0.2)' }}
                      >
                        <div
                          className="h-full"
                          style={{
                            width: `${Math.min(item.progress, 100)}%`,
                            background: 'var(--brand-orange)',
                          }}
                        />
                      </div>
                    )}
                    {item.duration && (
                      <span
                        className="absolute bottom-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold"
                        style={{ background: 'rgba(0,0,0,0.7)', color: 'var(--brand-white)' }}
                      >
                        {Math.floor(item.duration / 60)}m
                      </span>
                    )}
                  </a>
                  <div className="p-4">
                    <a href={`/watch/${item.id}`}>
                      <h3 className="font-bold text-white text-sm mb-1 group-hover:text-[var(--brand-orange)] transition-colors line-clamp-1">
                        {item.title}
                      </h3>
                    </a>
                    <p className="text-xs text-white/40 mb-3 line-clamp-1">
                      {item.universe?.name || item.creator?.name}
                    </p>
                    <div className="flex items-center gap-2">
                      {activeSection === 'watchlist' && (
                        <button
                          aria-label={`Remove ${item.title} from watchlist`}
                          onClick={() => removeFromWatchlist(item.id)}
                          className="flex-1 px-3 py-1.5 rounded-lg text-xs font-medium text-white/60 hover:text-white transition-colors"
                          style={{ border: '1px solid rgba(255,255,255,0.15)' }}
                        >
                          Remove
                        </button>
                      )}
                      {activeSection === 'history' && (
                        <button
                          aria-label={`Clear ${item.title} from history`}
                          onClick={() => removeFromHistory(item.id)}
                          className="flex-1 px-3 py-1.5 rounded-lg text-xs font-medium text-white/60 hover:text-white transition-colors"
                          style={{ border: '1px solid rgba(255,255,255,0.15)' }}
                        >
                          Clear
                        </button>
                      )}
                      <button
                        aria-label={
                          favorites.some((f) => f.id === item.id)
                            ? `Remove ${item.title} from favorites`
                            : `Add ${item.title} to favorites`
                        }
                        onClick={() => toggleFavorite(item.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-center ${favorites.some((f) => f.id === item.id) ? 'text-[var(--brand-orange)]' : 'text-white/60 hover:text-white'}`}
                        style={{ border: '1px solid rgba(255,255,255,0.15)' }}
                      >
                        {favorites.some((f) => f.id === item.id) ? (
                          <svg
                            className="w-4 h-4 fill-current"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                          >
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                          </svg>
                        ) : (
                          <svg
                            className="w-4 h-4 fill-none stroke-current stroke-2"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                            />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </PageShell>
  );
}
