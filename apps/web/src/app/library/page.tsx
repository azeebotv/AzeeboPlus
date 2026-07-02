'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../lib/api';
import AppHeader from '../../components/layout/AppHeader';
import AppFooter from '../../components/layout/AppFooter';
import { Skeleton } from '@/components/Skeleton';

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

interface LibrarySection {
  id: string;
  name: string;
  items: ContentItem[];
}

export default function LibraryPage(): React.JSX.Element {
  const { user: _user, isAuthenticated } = useAuth();
  const [watchlist, setWatchlist] = useState<ContentItem[]>([]);
  const [watchHistory, setWatchHistory] = useState<ContentItem[]>([]);
  const [favorites, setFavorites] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeSection, setActiveSection] = useState<'watchlist' | 'history' | 'favorites'>(
    'watchlist'
  );
  const [error, setError] = useState<string | null>(null);

  const sections: LibrarySection[] = [
    { id: 'watchlist', name: 'Watchlist', items: watchlist },
    { id: 'history', name: 'Watch History', items: watchHistory },
    { id: 'favorites', name: 'Favorites', items: favorites },
  ];

  useEffect(() => {
    const fetchLibrary = async (): Promise<void> => {
      if (!isAuthenticated) return;
      try {
        setIsLoading(true);
        setError(null);
        const [watchlistRes, historyRes, favoritesRes] = await Promise.all([
          apiFetch<any>('/interactions/watchlist'),
          apiFetch<any>('/interactions/history'),
          apiFetch<any>('/interactions/favorites'),
        ]);
        if (watchlistRes.success && watchlistRes.data)
          setWatchlist(Array.isArray(watchlistRes.data) ? watchlistRes.data : []);
        if (historyRes.success && historyRes.data)
          setWatchHistory(Array.isArray(historyRes.data) ? historyRes.data : []);
        if (favoritesRes.success && favoritesRes.data)
          setFavorites(Array.isArray(favoritesRes.data) ? favoritesRes.data : []);
      } catch (err) {
        setError('Failed to load library');
      } finally {
        setIsLoading(false);
      }
    };
    fetchLibrary();
  }, [isAuthenticated]);

  const removeFromWatchlist = useCallback(async (contentId: string) => {
    try {
      const response = await apiFetch<any>(`/interactions/watchlist/${contentId}`, {
        method: 'DELETE',
      });
      if (response.success) setWatchlist((prev) => prev.filter((item) => item.id !== contentId));
    } catch (err) {
      /* intentionally minimal */
    }
  }, []);

  const removeFromHistory = useCallback(async (contentId: string) => {
    try {
      const response = await apiFetch<any>(`/interactions/history/${contentId}`, {
        method: 'DELETE',
      });
      if (response.success) setWatchHistory((prev) => prev.filter((item) => item.id !== contentId));
    } catch (err) {
      /* intentionally minimal */
    }
  }, []);

  const toggleFavorite = useCallback(
    async (contentId: string) => {
      try {
        const isFavorited = favorites.some((item) => item.id === contentId);
        const response = await apiFetch<any>(
          isFavorited ? `/interactions/favorites/${contentId}` : '/interactions/favorites',
          {
            method: isFavorited ? 'DELETE' : 'POST',
            ...(isFavorited ? {} : { body: JSON.stringify({ contentId }) }),
          }
        );
        if (response.success) {
          if (isFavorited) {
            setFavorites((prev) => prev.filter((item) => item.id !== contentId));
          } else {
            const item =
              watchlist.find((i) => i.id === contentId) ||
              watchHistory.find((i) => i.id === contentId);
            if (item) setFavorites((prev) => [...prev, item]);
          }
        }
      } catch (err) {
        /* intentionally minimal */
      }
    },
    [favorites, watchHistory, watchlist]
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen az-nollywood-bg">
        <AppHeader />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
          <motion.div
            className="az-glass p-8 sm:p-10 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">
              Sign in to access your library
            </h2>
            <p className="text-white/50 text-sm sm:text-base">
              Save content to watch later, track your progress, and more
            </p>
          </motion.div>
        </main>
        <AppFooter />
      </div>
    );
  }

  const currentSection = sections.find((s) => s.id === activeSection);

  return (
    <div className="min-h-screen az-nollywood-bg">
      <AppHeader active="Library" />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <motion.h1
          className="az-headline text-white text-3xl sm:text-4xl mb-6 sm:mb-8"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          My Library
        </motion.h1>

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
              className="az-glass p-8 sm:p-10 text-center"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <span className="text-4xl mb-4 block">&#x26A0;&#xFE0F;</span>
              <h3 className="text-lg font-bold text-white mb-2">Error</h3>
              <p className="text-white/50 text-sm">{error}</p>
              <motion.button
                onClick={() => window.location.reload()}
                className="az-btn-primary mt-4"
                style={{ width: 'auto', paddingInline: '1.5rem' }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Try Again
              </motion.button>
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
              className="az-glass p-10 sm:p-12 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
            >
              <span className="text-4xl sm:text-5xl mb-4 block">
                {activeSection === 'watchlist'
                  ? '\u{1F4E6}'
                  : activeSection === 'history'
                    ? '\u{1F552}'
                    : '\u2764\uFE0F'}
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
                {activeSection === 'watchlist'
                  ? 'Your watchlist is empty'
                  : activeSection === 'history'
                    ? 'No watch history'
                    : 'No favorites yet'}
              </h3>
              <p className="text-white/50 text-xs sm:text-sm">
                {activeSection === 'watchlist'
                  ? 'Add content to watch later'
                  : activeSection === 'history'
                    ? 'Start watching content to build your history'
                    : 'Save your favorite content here'}
              </p>
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
                      <img
                        src={item.thumbnail}
                        alt={item.title}
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
                    {item.progress != null && item.progress > 0 && (
                      <div
                        className="absolute bottom-0 left-0 right-0 h-1"
                        style={{ background: 'rgba(255,255,255,0.2)' }}
                      >
                        <div
                          className="h-full"
                          style={{
                            width: `${Math.min(item.progress, 100)}%`,
                            background: '#E8420A',
                          }}
                        />
                      </div>
                    )}
                    {item.duration && (
                      <span
                        className="absolute bottom-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold"
                        style={{ background: 'rgba(0,0,0,0.7)', color: '#fff' }}
                      >
                        {Math.floor(item.duration / 60)}m
                      </span>
                    )}
                  </a>
                  <div className="p-4">
                    <a href={`/watch/${item.id}`}>
                      <h3 className="font-bold text-white text-sm mb-1 group-hover:text-[#E8420A] transition-colors line-clamp-1">
                        {item.title}
                      </h3>
                    </a>
                    <p className="text-xs text-white/40 mb-3 line-clamp-1">
                      {item.universe?.name || item.creator?.name}
                    </p>
                    <div className="flex items-center gap-2">
                      {activeSection === 'watchlist' && (
                        <button
                          onClick={() => removeFromWatchlist(item.id)}
                          className="flex-1 px-3 py-1.5 rounded-lg text-xs font-medium text-white/60 hover:text-white transition-colors"
                          style={{ border: '1px solid rgba(255,255,255,0.15)' }}
                        >
                          Remove
                        </button>
                      )}
                      {activeSection === 'history' && (
                        <button
                          onClick={() => removeFromHistory(item.id)}
                          className="flex-1 px-3 py-1.5 rounded-lg text-xs font-medium text-white/60 hover:text-white transition-colors"
                          style={{ border: '1px solid rgba(255,255,255,0.15)' }}
                        >
                          Clear
                        </button>
                      )}
                      <button
                        onClick={() => toggleFavorite(item.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${favorites.some((f) => f.id === item.id) ? 'text-[#E8420A]' : 'text-white/60 hover:text-white'}`}
                        style={{ border: '1px solid rgba(255,255,255,0.15)' }}
                      >
                        {favorites.some((f) => f.id === item.id) ? '\u2764\uFE0F' : '\u2661'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <AppFooter />
    </div>
  );
}
