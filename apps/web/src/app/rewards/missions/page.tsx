'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';
import { ErrorState, Skeleton } from '@azeebo/ui/web';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { OptimizedImage } from '@/components/OptimizedImage';
import { PageShell } from '@/components/layout/PageShell';
import { PageHero } from '@/components/layout/PageHero';
import { ArrowLeft, CheckCircle2, Target, Sparkles, Trophy } from 'lucide-react';

interface Mission {
  id: string;
  title: string;
  description: string;
  points: number;
  image?: string;
  isActive: boolean;
  type: string;
  progress?: number;
  total?: number;
  isCompleted?: boolean;
  completedAt?: string;
}

export default function MissionsPage(): React.JSX.Element {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();

  const missionsQuery = useQuery({
    queryKey: ['rewards', 'missions'],
    queryFn: async () => {
      const res = await apiFetch<{ missions: Mission[] } | Mission[]>('/rewards/missions');
      if (res.success && res.data) {
        const missions = Array.isArray(res.data)
          ? res.data
          : (res.data as { missions: Mission[] }).missions || [];
        return missions.map((m: Mission) => ({
          id: String(m.id),
          title: String(m.title || ''),
          description: String(m.description || ''),
          points: Number(m.points || 0),
          image: m.image,
          isAvailable: Boolean(m.isActive),
          category: String(m.type || 'mission'),
          progress: Number(m.progress ?? 0),
          total: Number(m.total ?? 100),
          isCompleted: Boolean(m.isCompleted),
        }));
      }
      return [];
    },
    staleTime: 60000,
  });

  const missions = missionsQuery.data ?? [];
  const activeMissions = missions.filter((m) => !m.isCompleted);
  const completedMissions = missions.filter((m) => m.isCompleted);
  const isLoading = authLoading || missionsQuery.isLoading;
  const error = missionsQuery.error?.message || null;

  if (authLoading) return <></>;
  if (!isAuthenticated || !user) return <></>;

  return (
    <PageShell activeNav="Rewards" glowColor="rgba(232, 66, 10, 0.2)">
      <div className="mb-6">
        <Link
          href="/rewards"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Rewards Center
        </Link>
      </div>

      <PageHero
        eyebrow="QUESTS & REPUTATION"
        eyebrowColor="var(--brand-orange)"
        badge={`${activeMissions.length} ACTIVE`}
        title="Streaming Missions"
        subtitle="Complete viewing goals, rate shows, vote on reality stars, and level up your loyalty points."
        glowColor="rgba(232, 66, 10, 0.25)"
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="az-glass h-56 rounded-3xl p-5">
              <Skeleton className="h-full w-full rounded-2xl" />
            </div>
          ))}
        </div>
      ) : error ? (
        <ErrorState
          title="Failed to load missions"
          description={error}
          buttonText="Retry"
          onButtonPress={() => missionsQuery.refetch()}
        />
      ) : (
        <div className="space-y-12">
          {/* Active Missions */}
          <section>
            <div className="flex items-center gap-2 mb-6">
              <Target className="w-5 h-5 text-[var(--brand-orange)]" />
              <h2 className="az-headline text-xl sm:text-2xl font-bold text-white">
                Active Missions ({activeMissions.length})
              </h2>
            </div>

            {activeMissions.length === 0 ? (
              <div className="az-glass p-12 rounded-3xl text-center border border-white/10">
                <Trophy className="w-12 h-12 text-amber-400 mx-auto mb-4 opacity-80" />
                <h3 className="text-lg font-bold text-white mb-1">All Quests Completed!</h3>
                <p className="text-white/50 text-sm">New missions arrive daily at 00:00 WAT.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {activeMissions.map((mission, idx) => (
                  <motion.div
                    key={mission.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="az-glass rounded-3xl overflow-hidden border border-white/10 hover:border-[var(--brand-orange)]/40 transition-all flex flex-col justify-between group shadow-lg"
                  >
                    {mission.image && (
                      <div className="w-full h-40 overflow-hidden relative">
                        <OptimizedImage
                          src={mission.image}
                          alt={mission.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#18151e] via-transparent to-transparent" />
                      </div>
                    )}

                    <div className="p-6">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[var(--brand-orange)]/15 text-[var(--brand-orange)] border border-[var(--brand-orange)]/25">
                          {mission.category}
                        </span>
                        <span className="text-sm font-extrabold text-[var(--brand-orange)] flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5" />+{mission.points.toLocaleString()} pts
                        </span>
                      </div>

                      <h3 className="text-base sm:text-lg font-bold text-white mb-1.5 group-hover:text-white transition-colors">
                        {mission.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-white/60 mb-5 leading-relaxed">
                        {mission.description}
                      </p>

                      {/* Progress Bar */}
                      <div className="space-y-1.5 pt-3 border-t border-white/5">
                        <div className="flex justify-between text-xs text-white/50 font-medium">
                          <span>Mission Progress</span>
                          <span className="text-white font-bold">
                            {mission.progress} / {mission.total}
                          </span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{
                              width: `${Math.min(((mission.progress ?? 0) / (mission.total || 1)) * 100, 100)}%`,
                            }}
                            transition={{ duration: 0.6 }}
                            className="h-full rounded-full bg-gradient-to-r from-[var(--brand-orange)] to-[#cc1c1c]"
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </section>

          {/* Completed Missions */}
          {completedMissions.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-6">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <h2 className="az-headline text-xl sm:text-2xl font-bold text-white">
                  Completed Missions ({completedMissions.length})
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {completedMissions.map((mission) => (
                  <div
                    key={mission.id}
                    className="az-glass p-5 rounded-2xl border border-white/5 opacity-70 flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          Complete
                        </span>
                        <h3 className="font-bold text-white text-sm sm:text-base">{mission.title}</h3>
                      </div>
                      <p className="text-xs text-white/50 line-clamp-1">{mission.description}</p>
                    </div>

                    <span className="text-sm font-bold text-emerald-400 shrink-0">
                      +{mission.points.toLocaleString()} pts
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </PageShell>
  );
}
