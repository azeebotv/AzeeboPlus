'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';
import { ErrorState, Skeleton } from '@azeebo/ui/web';
import Link from 'next/link';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, Check, ArrowLeft, Trophy, Sparkles, X, Lock } from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { PageHero } from '@/components/layout/PageHero';

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  unlocked?: boolean;
  progress?: number;
  target?: number;
  earnedAt?: string;
}

export default function BadgesPage(): React.JSX.Element {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);

  const badgesQuery = useQuery({
    queryKey: ['rewards', 'badges'],
    queryFn: async () => {
      const res = await apiFetch<{ badges: Badge[] } | Badge[]>('/rewards/badges');
      if (res.success && res.data) {
        const badges = Array.isArray(res.data)
          ? res.data
          : (res.data as { badges: Badge[] }).badges || [];
        return badges.map((b: Badge) => ({
          id: String(b.id),
          name: String(b.name || ''),
          description: String(b.description || ''),
          icon: String(b.icon || ''),
          points: Number(b.points || 0),
          unlocked: Boolean(b.unlocked ?? true),
          progress: Number(b.progress ?? 0),
          target: Number(b.target ?? b.points ?? 1),
          earnedAt: b.earnedAt,
        }));
      }
      return [];
    },
    staleTime: 60000,
  });

  const badges = badgesQuery.data ?? [];
  const earnedBadges = badges.filter((b) => b.unlocked);
  const lockedBadges = badges.filter((b) => !b.unlocked);
  const isLoading = authLoading || badgesQuery.isLoading;
  const error = badgesQuery.error?.message || null;

  if (authLoading) return <></>;
  if (!isAuthenticated || !user) return <></>;

  return (
    <PageShell activeNav="Rewards" glowColor="rgba(251, 191, 36, 0.2)">
      <div className="mb-6">
        <Link
          href="/rewards"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-az-ink/60 hover:text-az-ink transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Rewards Center
        </Link>
      </div>

      <PageHero
        eyebrow="ACHIEVEMENTS & HONORS"
        eyebrowColor="var(--brand-gold)"
        badge={`${earnedBadges.length} / ${badges.length} UNLOCKED`}
        title="Badges of Distinction"
        subtitle="Earn recognition for your streaming dedication, community participation, and universal milestones."
        glowColor="color-mix(in srgb, var(--color-az-warning-400) 25%, transparent)"
      />

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="az-glass h-52 p-4">
              <Skeleton className="h-full w-full rounded-xl" />
            </div>
          ))}
        </div>
      ) : error ? (
        <ErrorState
          title="Failed to load badges"
          description={error}
          buttonText="Retry"
          onButtonPress={() => badgesQuery.refetch()}
        />
      ) : (
        <div className="space-y-12">
          {/* Earned Badges Showcase */}
          {earnedBadges.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-6">
                <Trophy className="w-5 h-5 text-az-warning-400" />
                <h2 className="az-headline text-xl sm:text-2xl text-az-ink">
                  Earned Achievements ({earnedBadges.length})
                </h2>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {earnedBadges.map((badge, idx) => (
                  <motion.div
                    key={badge.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    onClick={() => setSelectedBadge(badge)}
                    className="az-glass p-6 text-center cursor-pointer border hover:scale-[1.03] transition-all relative overflow-hidden group"
                    style={{
                      background:
                        'linear-gradient(135deg, color-mix(in srgb, var(--color-az-warning-400) 10%, transparent) 0%, rgba(24, 21, 30, 0.95) 100%)',
                    }}
                  >
                    <div className="w-16 h-16 rounded-2xl bg-az-warning-500/15 border border-az-warning-500/30 flex items-center justify-center mx-auto mb-3.5 text-az-warning-400 shadow-[0_0_25px_rgba(251,191,36,0.3)] group-hover:scale-110 transition-transform">
                      <Award className="w-8 h-8" />
                    </div>

                    <h3 className="font-bold text-az-ink text-base mb-1 group-hover:text-az-warning-400 transition-colors">
                      {badge.name}
                    </h3>
                    <p className="text-xs text-az-ink/50 mb-3 line-clamp-2">{badge.description}</p>

                    <div className="inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-full bg-az-success-500/15 text-az-success-400 border border-az-success-500/25">
                      <Check className="w-3.5 h-3.5 stroke-[3]" /> Unlocked
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {/* Locked Badges */}
          {lockedBadges.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-6">
                <Lock className="w-5 h-5 text-az-ink/40" />
                <h2 className="az-headline text-xl sm:text-2xl text-az-ink/70">
                  Locked Achievements ({lockedBadges.length})
                </h2>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {lockedBadges.map((badge, idx) => {
                  const progressPct = Math.min(
                    ((badge.progress ?? 0) / (badge.target ?? 1)) * 100,
                    100
                  );
                  return (
                    <motion.div
                      key={badge.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      onClick={() => setSelectedBadge(badge)}
                      className="az-glass p-6 text-center cursor-pointer border opacity-60 hover:opacity-100 transition-all group"
                    >
                      <div className="w-16 h-16 rounded-2xl bg-az-glass-fill border border-az-glass-border flex items-center justify-center mx-auto mb-3.5 text-az-ink/40 group-hover:text-az-ink/70">
                        <Award className="w-8 h-8" />
                      </div>

                      <h3 className="font-bold text-az-ink text-base mb-1">{badge.name}</h3>
                      <p className="text-xs text-az-ink/40 mb-4 line-clamp-2">
                        {badge.description}
                      </p>

                      <div className="space-y-1.5">
                        <div className="w-full bg-az-glass-card rounded-full h-1.5 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[var(--color-az-flame)] to-az-warning-500"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-az-ink/40">
                          {badge.progress ?? 0} / {badge.target ?? 1}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </section>
          )}

          {badges.length === 0 && (
            <div className="az-glass p-12 text-center border border-az-glass-border">
              <Award className="w-12 h-12 text-az-warning-400 mx-auto mb-4 opacity-80" />
              <h3 className="text-lg font-bold text-az-ink mb-2">No Badges Available Yet</h3>
              <p className="text-sm text-az-ink/50">Check back soon for new season achievements.</p>
            </div>
          )}
        </div>
      )}

      {/* Badge Detail Dialog */}
      <AnimatePresence>
        {selectedBadge && (
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedBadge(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="az-glass max-w-md w-full p-8 text-center relative border"
              style={{
                background:
                  'linear-gradient(135deg, rgba(24, 21, 30, 0.98) 0%, rgba(35, 25, 18, 0.95) 100%)',
              }}
            >
              <button
                onClick={() => setSelectedBadge(null)}
                className="absolute top-4 right-4 p-2 rounded-full text-az-ink/40 hover:text-az-ink bg-az-glass-fill"
              >
                <X className="w-4 h-4" />
              </button>

              <div
                className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-5 ${
                  selectedBadge.unlocked
                    ? 'bg-az-warning-500/20 border border-az-warning-500/40 text-az-warning-400 shadow-[0_0_40px_rgba(251,191,36,0.3)]'
                    : 'bg-az-glass-fill border border-az-glass-border text-az-ink/40'
                }`}
              >
                <Award className="w-10 h-10" />
              </div>

              <h2 className="az-headline text-2xl text-az-ink mb-2">{selectedBadge.name}</h2>
              <p className="text-sm text-az-ink/60 mb-6 leading-relaxed">
                {selectedBadge.description}
              </p>

              <div className="flex items-center justify-center gap-6 py-4 border-y border-az-glass-border mb-6">
                <div>
                  <p className="text-xs text-az-ink/40 uppercase font-semibold mb-1">
                    Points Reward
                  </p>
                  <span className="text-xl font-extrabold text-[var(--color-az-flame)] flex items-center justify-center gap-1">
                    <Sparkles className="w-4 h-4" />+{selectedBadge.points}
                  </span>
                </div>

                <div>
                  <p className="text-xs text-az-ink/40 uppercase font-semibold mb-1">Status</p>
                  <span
                    className={`text-sm font-bold ${
                      selectedBadge.unlocked ? 'text-az-success-400' : 'text-az-ink/40'
                    }`}
                  >
                    {selectedBadge.unlocked ? 'Unlocked' : 'In Progress'}
                  </span>
                </div>
              </div>

              <button onClick={() => setSelectedBadge(null)} className="az-btn-primary">
                Close Dossier
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PageShell>
  );
}
