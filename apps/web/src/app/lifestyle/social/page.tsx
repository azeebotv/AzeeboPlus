'use client';

import { Suspense, lazy, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { PageShell } from '@/components/layout/PageShell';
import { PageHero } from '@/components/layout/PageHero';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import analytics from '@/lib/analytics';
import { OptimizedImage } from '@/components/OptimizedImage';
import { Bookmark, Share2, Trash2, ArrowLeft, Compass, Check } from 'lucide-react';

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
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    analytics.pageView('lifestyle-social');
    const saved = localStorage.getItem('azeebo_social_saves');
    if (saved) {
      try {
        setSavedItems(JSON.parse(saved));
      } catch {
        // invalid json
      }
    }
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
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  }, []);

  return (
    <PageShell glowColor="rgba(232,66,10,0.15)">
      <PageHero
        badge="Personal Collection"
        title="Saved Moments & Circles"
        description="Your private curation of African luxury dining, premier events, and nightlife destinations saved for easy sharing."
      />

      <div className="max-w-4xl mx-auto py-4 -mt-4 px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/lifestyle"
            className="inline-flex items-center gap-2 text-xs font-semibold text-white/50 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Lifestyle Hub
          </Link>

          {savedItems.length > 0 && (
            <span className="text-xs font-mono text-white/40">
              {savedItems.length} {savedItems.length === 1 ? 'item' : 'items'} saved
            </span>
          )}
        </div>

        {savedItems.length === 0 ? (
          <div className="az-glass p-16 text-center rounded-3xl border border-white/10 max-w-md mx-auto">
            <Bookmark className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">No Saved Items Yet</h3>
            <p className="text-xs text-white/50 mb-6">
              Bookmark luxury venues, celebrity spotlights, and events while exploring Lifestyle to build your personal circle.
            </p>
            <Link
              href="/lifestyle"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold text-white bg-[var(--brand-orange)] hover:bg-[var(--brand-orange)]/90 transition-all shadow-lg shadow-[var(--brand-orange)]/25"
            >
              <Compass className="w-3.5 h-3.5" />
              Explore Lifestyle Hub
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {savedItems.map((item) => (
                <ScrollReveal key={item.id}>
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="az-glass p-4 rounded-2xl border border-white/10 flex items-center gap-4 hover:border-white/20 transition-all"
                  >
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-white/5 flex-shrink-0">
                      <OptimizedImage
                        src={item.thumbnail}
                        alt={item.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-white truncate">{item.title}</h3>
                      <p className="text-xs text-white/50 truncate mt-0.5">{item.description}</p>
                      {item.savedAt && (
                        <span className="text-[10px] font-mono text-white/30 mt-1 block">
                          Saved {new Date(item.savedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => shareItem(item)}
                        className="w-8 h-8 rounded-full flex items-center justify-center transition-all bg-white/5 hover:bg-[var(--brand-orange)]/20 text-white/70 hover:text-[var(--brand-orange)]"
                        title={copiedId === item.id ? 'Link copied!' : 'Share'}
                      >
                        {copiedId === item.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Share2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeSaved(item.id)}
                        className="w-8 h-8 rounded-full flex items-center justify-center transition-all bg-white/5 hover:bg-rose-500/20 text-white/70 hover:text-rose-400"
                        title="Remove bookmark"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                </ScrollReveal>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </PageShell>
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
