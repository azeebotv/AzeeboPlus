'use client';
import { Suspense, lazy, useEffect, useState, useCallback } from 'react';

import { motion } from 'framer-motion';
import Link from 'next/link';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import analytics from '@/lib/analytics';
import { OptimizedImage } from '@/components/OptimizedImage';

interface SavedItem {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  url: string;
  savedAt: string;
}

function SocialPageContent(): React.JSX.Element {
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);

  useEffect(() => {
    analytics.pageView('lifestyle-social');
    const saved = localStorage.getItem('azeebo_social_saves');
    if (saved) setSavedItems(JSON.parse(saved));
  }, []);

  const removeSaved = useCallback((id: string) => {
    setSavedItems((prev) => {
      const next = prev.filter((item) => item.id !== id);
      localStorage.setItem('azeebo_social_saves', JSON.stringify(next));
      return next;
    });
  }, []);

  const shareItem = useCallback(async (item: SavedItem) => {
    if (navigator.share) {
      try {
        await navigator.share({ title: item.title, text: item.description, url: item.url });
      } catch {
        // user cancelled
      }
    } else {
      await navigator.clipboard.writeText(item.url);
    }
  }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--brand-near-black)' }}>
      <AppHeader active="Lifestyle" />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="mb-8">
          <Link
            href="/lifestyle"
            className="text-sm text-white/40 hover:text-white/60 transition-colors mb-4 inline-block"
          >
            ← Back to Lifestyle
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold text-white">Social</h1>
          <p className="text-white/50 mt-2">Save and share your favorite lifestyle moments</p>
        </div>

        {savedItems.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-4"></p>
            <h2 className="text-xl font-bold text-white mb-2">No saved items yet</h2>
            <p className="text-white/50 mb-6">Save lifestyle content to share with friends</p>
            <Link href="/lifestyle">
              <motion.button
                type="button"
                className="az-btn-primary"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Explore Lifestyle
              </motion.button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {savedItems.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="az-glass p-4 flex items-center gap-4"
                style={{ boxShadow: '0 0 15px rgba(255,255,255,0.03)' }}
              >
                <OptimizedImage
                  src={item.thumbnail}
                  alt={item.title}
                  className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-semibold truncate">{item.title}</h3>
                  <p className="text-white/40 text-sm truncate">{item.description}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => shareItem(item)}
                    className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110"
                    style={{ backgroundColor: 'rgba(232,66,10,0.2)' }}
                    title="Share"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#E8400A"
                      strokeWidth="2"
                    >
                      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => removeSaved(item.id)}
                    className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110"
                    style={{ backgroundColor: 'rgba(239,68,68,0.2)' }}
                    title="Remove"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#EF4444"
                      strokeWidth="2"
                    >
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      <AppFooter />
    </div>
  );
}

const LazySocialPage = lazy(() => Promise.resolve({ default: SocialPageContent }));

export default function SocialPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--brand-near-black)]">
          <p className="text-white/50 text-lg">Loading...</p>
        </div>
      }
    >
      <LazySocialPage />
    </Suspense>
  );
}
