'use client';
import { Suspense, lazy, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import analytics from '@/lib/analytics';

interface KnowledgeItem {
  id: string;
  title: string;
  description: string;
  category: string;
  requiredLevel: number;
  requiredMissions: number;
  isUnlocked: boolean;
  unlockHint: string;
  icon: string;
}

function KnowledgeLockedContent() {
  useEffect(() => {
    analytics.pageView('aou-knowledge-locked');
  }, []);

  const query = useQuery({
    queryKey: ['aou', 'knowledge-locked'],
    queryFn: async () => {
      const res = await api.request<KnowledgeItem[]>('/api/v1/aou/knowledge/locked');
      if (res.success && res.data) return res.data;
      throw new Error(res.message || 'Failed to load locked knowledge');
    },
  });

  const items: KnowledgeItem[] = query.data ?? [];

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--brand-near-black)' }}>
      <AppHeader active="AOU" />
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl"></span>
            <h1 className="text-3xl sm:text-4xl font-bold text-white">Locked Knowledge</h1>
          </div>
          <p className="text-white/50 text-lg mb-8 max-w-2xl">
            Complete missions and level up to unlock deeper knowledge across the Azeebo+ universes.
          </p>
        </motion.div>

        {query.isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="az-glass overflow-hidden">
                <Skeleton height="180px" borderRadius="0" />
                <div className="p-4 space-y-3">
                  <Skeleton height="20px" width="70%" />
                  <Skeleton height="16px" width="50%" />
                </div>
              </div>
            ))}
          </div>
        ) : query.error ? (
          <ErrorState
            title="Failed to load"
            description={query.error.message}
            onButtonPress={() => query.refetch()}
          />
        ) : items.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-5xl mb-4"></p>
            <p className="text-xl text-white/60">
              All knowledge unlocked! You&apos;ve mastered everything.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                className="az-glass overflow-hidden opacity-75 hover:opacity-100 transition-opacity"
              >
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">{item.icon || 'Lock'}</span>
                    <span
                      className="px-2.5 py-0.5 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: 'rgba(232,66,10,0.15)',
                        color: 'var(--brand-orange)',
                      }}
                    >
                      {item.category}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-white/50 mb-4 line-clamp-2">{item.description}</p>
                  <div className="space-y-2 text-xs text-white/40">
                    <div className="flex justify-between">
                      <span>Required Level</span>
                      <span className="text-white/60 font-semibold">
                        Level {item.requiredLevel}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Required Missions</span>
                      <span className="text-white/60 font-semibold">{item.requiredMissions}</span>
                    </div>
                  </div>
                  <div
                    className="mt-4 p-3 rounded-lg"
                    style={{ backgroundColor: 'rgba(245,158,11,0.08)' }}
                  >
                    <p className="text-xs text-yellow-400/80">{item.unlockHint}</p>
                  </div>
                  <button
                    className="mt-4 w-full az-btn-primary opacity-50 cursor-not-allowed"
                    disabled
                  >
                    LockLocked
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

const Lazy = lazy(() => Promise.resolve({ default: KnowledgeLockedContent }));
export default function KnowledgeLockedPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--brand-near-black)]">
          <p className="text-white/50 text-lg">Loading...</p>
        </div>
      }
    >
      <Lazy />
    </Suspense>
  );
}
