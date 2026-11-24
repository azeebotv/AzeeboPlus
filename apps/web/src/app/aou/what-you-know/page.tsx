'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { apiFetch } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import { PageShell } from '@/components/layout/PageShell';
import { PageHero } from '@/components/layout/PageHero';
import { CheckCircle2, Lock, ArrowLeft, BookOpen, Sparkles } from 'lucide-react';

interface KnowledgeUnit {
  id: string;
  title: string;
  category: string;
  unlocked: boolean;
  unlockedAt?: string;
  description?: string;
}

export default function AOUWhatYouKnowPage(): React.JSX.Element {
  const {
    data: knowledge,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['aou', 'what-you-know'],
    queryFn: async () => {
      const res = await apiFetch<{
        units: KnowledgeUnit[];
        totalUnlocked: number;
        totalUnits: number;
      }>('/v1/knowledge/what-you-know');
      return res.success && res.data ? res.data : null;
    },
  });

  if (error) {
    return (
      <PageShell activeNav="Vertical">
        <ErrorState
          title="Codex Unavailable"
          description="Failed to load your unlocked knowledge codex. Please try again."
          buttonText="Retry"
          onButtonPress={() => refetch()}
        />
      </PageShell>
    );
  }

  const categories =
    knowledge?.units.reduce(
      (acc, unit) => {
        if (!acc[unit.category]) acc[unit.category] = [];
        acc[unit.category].push(unit);
        return acc;
      },
      {} as Record<string, KnowledgeUnit[]>
    ) ?? {};

  return (
    <PageShell activeNav="Vertical" glowColor="rgba(245, 158, 11, 0.2)">
      <div className="mb-6">
        <Link
          href="/aou"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-az-ink/60 hover:text-az-warning-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Agbalá Olódùmarè Hub
        </Link>
      </div>

      <PageHero
        eyebrow="CODEX & WISDOM"
        eyebrowColor="var(--color-az-accent-gold)"
        title="What You Know"
        subtitle="Your personalized compendium of unlocked revelations, mystical origins, and cosmic lore."
        glowColor="color-mix(in srgb, var(--color-az-warning-500) 25%, transparent)"
        actions={
          <Link
            href="/aou/knowledge-locked"
            className="px-5 py-2 rounded-full text-xs sm:text-sm font-semibold text-az-ink/80 hover:text-az-ink border border-az-ink/15 bg-az-glass-fill hover:bg-az-glass-card transition-all flex items-center gap-2"
          >
            <Lock className="w-3.5 h-3.5 text-az-warning-400" />
            View Locked Knowledge
          </Link>
        }
      />

      {/* Progress Summary Header */}
      {knowledge && (
        <div className="az-glass p-6 sm:p-8 mb-10 border">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-az-warning-500/10 border border-az-warning-500/30 flex items-center justify-center text-az-warning-400">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-az-ink">Unlocked Knowledge Codex</h2>
                <p className="text-xs sm:text-sm text-az-ink/60">
                  {knowledge.totalUnlocked} of {knowledge.totalUnits} items unlocked
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="az-headline text-2xl sm:text-3xl font-extrabold text-az-warning-400">
                {Math.round((knowledge.totalUnlocked / (knowledge.totalUnits || 1)) * 100)}%
              </span>
              <p className="text-xs text-az-ink/40 uppercase tracking-wider font-semibold">
                COMPLETION
              </p>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-8">
          {[1, 2].map((i) => (
            <div key={i} className="space-y-4">
              <Skeleton height="32px" width="200px" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Skeleton height="140px" borderRadius="16px" />
                <Skeleton height="140px" borderRadius="16px" />
              </div>
            </div>
          ))}
        </div>
      ) : Object.keys(categories).length > 0 ? (
        <div className="space-y-12">
          {Object.entries(categories).map(([category, units], catIndex) => (
            <section key={category}>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-az-warning-400" />
                <h2 className="az-headline text-xl sm:text-2xl text-az-ink uppercase">
                  {category}
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {units.map((unit, unitIndex) => (
                  <motion.div
                    key={unit.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: (catIndex * 2 + unitIndex) * 0.05 }}
                    className="az-glass p-5 sm:p-6 border border-az-glass-border transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <h3 className="font-bold text-az-ink text-base sm:text-lg">{unit.title}</h3>
                        {unit.unlocked ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-az-success-500/10 text-az-success-400 border border-az-success-500/20">
                            <CheckCircle2 className="w-3 h-3" /> Unlocked
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-az-glass-fill text-az-ink/40 border border-az-glass-border">
                            <Lock className="w-3 h-3" /> Locked
                          </span>
                        )}
                      </div>
                      {unit.description && (
                        <p className="text-sm text-az-ink/65 leading-relaxed mb-4">
                          {unit.description}
                        </p>
                      )}
                    </div>

                    {unit.unlockedAt && (
                      <p className="text-[11px] text-az-ink/40 pt-2 border-t border-az-ink/5">
                        Unlocked on {new Date(unit.unlockedAt).toLocaleDateString()}
                      </p>
                    )}
                  </motion.div>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="az-glass p-12 text-center">
          <BookOpen className="w-10 h-10 text-az-warning-400 mx-auto mb-4 opacity-80" />
          <h3 className="text-lg font-bold text-az-ink mb-2">No Lore Recorded Yet</h3>
          <p className="text-sm text-az-ink/50 max-w-md mx-auto mb-6">
            Watch episodes, take part in quizzes, and complete challenges to unlock units in your
            codex.
          </p>
          <Link
            href="/aou"
            className="az-btn-primary inline-block text-center"
            style={{ width: 'auto', paddingInline: '2rem' }}
          >
            Explore the Storyworld
          </Link>
        </div>
      )}
    </PageShell>
  );
}
