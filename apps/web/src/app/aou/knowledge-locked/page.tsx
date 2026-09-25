'use client';

import { Suspense, lazy, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import { PageShell } from '@/components/layout/PageShell';
import { PageHero } from '@/components/layout/PageHero';
import { Lock, ArrowLeft, Sparkles, CheckCircle2 } from 'lucide-react';
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

function KnowledgeLockedContent(): React.JSX.Element {
  useEffect(() => {
    analytics.pageView('aou-knowledge-locked');
  }, []);

  const query = useQuery({
    queryKey: ['aou', 'knowledge-locked'],
    queryFn: async () => {
      const res = await api.request<KnowledgeItem[]>('/api/v1/knowledge/locked');
      if (res.success && res.data) return res.data;
      throw new Error(res.message || 'Failed to load locked knowledge');
    },
  });

  const items: KnowledgeItem[] = query.data ?? [];

  return (
    <PageShell activeNav="Vertical" glowColor="rgba(245, 158, 11, 0.2)">
      <div className="mb-6">
        <Link
          href="/aou"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-white/60 hover:text-amber-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Agbalá Olódùmarè Hub
        </Link>
      </div>

      <PageHero
        eyebrow="CLASSIFIED ARCHIVES"
        eyebrowColor="var(--brand-gold)"
        title="Locked Knowledge"
        subtitle="Unveil deeper universal lore, forgotten gods, and ancient rituals by leveling up and conquering missions."
        glowColor="rgba(245, 158, 11, 0.25)"
        actions={
          <Link
            href="/rewards/missions"
            className="px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold text-white transition-all shadow-lg flex items-center gap-2 hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #e8420a 0%, #cc1c1c 100%)',
              boxShadow: '0 4px 20px rgba(232, 66, 10, 0.35)',
            }}
          >
            <Sparkles className="w-4 h-4" />
            Complete Missions
          </Link>
        }
      />

      {query.isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="az-glass overflow-hidden rounded-2xl">
              <Skeleton height="140px" borderRadius="16px" />
            </div>
          ))}
        </div>
      ) : query.error ? (
        <ErrorState
          title="Failed to load archives"
          description={query.error.message}
          buttonText="Retry"
          onButtonPress={() => query.refetch()}
        />
      ) : items.length === 0 ? (
        <div className="az-glass p-12 text-center rounded-2xl">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">All Knowledge Unlocked!</h3>
          <p className="text-white/60 text-sm max-w-md mx-auto mb-6">
            You have mastered every codex entry currently recorded in Agbalá Olódùmarè.
          </p>
          <Link
            href="/aou/what-you-know"
            className="az-btn-primary inline-block text-center"
            style={{ width: 'auto', paddingInline: '2rem' }}
          >
            Review Your Wisdom
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.35 }}
              className="az-glass p-6 rounded-2xl flex flex-col justify-between border border-white/10 hover:border-amber-500/30 transition-all hover:scale-[1.01]"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wider uppercase bg-white/5 border border-white/10 text-white/70">
                    {item.category}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-white/50 mb-5 line-clamp-2 leading-relaxed">
                  {item.description}
                </p>

                <div className="space-y-2 text-xs text-white/50 pt-3 border-t border-white/5">
                  <div className="flex justify-between items-center">
                    <span>Required Level</span>
                    <span className="text-white font-semibold px-2 py-0.5 rounded bg-white/5">
                      Level {item.requiredLevel}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Required Missions</span>
                    <span className="text-white font-semibold px-2 py-0.5 rounded bg-white/5">
                      {item.requiredMissions} Completed
                    </span>
                  </div>
                </div>

                {item.unlockHint && (
                  <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <p className="text-xs text-amber-300 font-medium">💡 Hint: {item.unlockHint}</p>
                  </div>
                )}
              </div>

              <button
                disabled
                className="mt-6 w-full py-2.5 rounded-full text-xs font-bold uppercase tracking-wider bg-white/5 text-white/40 border border-white/10 cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Lock className="w-3.5 h-3.5" />
                Locked in Vault
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </PageShell>
  );
}

const Lazy = lazy(() => Promise.resolve({ default: KnowledgeLockedContent }));
export default function KnowledgeLockedPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--hp-bg)]">
          <div className="w-10 h-10 border-2 border-white/20 border-t-[var(--brand-orange)] rounded-full animate-spin" />
        </div>
      }
    >
      <Lazy />
    </Suspense>
  );
}
