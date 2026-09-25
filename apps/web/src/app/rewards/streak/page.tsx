'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';
import { Spinner, ErrorState } from '@azeebo/ui/web';
import { PageShell } from '@/components/layout/PageShell';
import { PageHero } from '@/components/layout/PageHero';
import { ArrowLeft, Flame, CheckCircle2, Lock, Calendar, Trophy, Sparkles } from 'lucide-react';

interface StreakMilestone {
  days: number;
  reward: number;
  label: string;
  unlocked?: boolean;
}

interface StreakData {
  currentStreak?: number;
  streak?: number;
  longestStreak?: number;
  maxStreak?: number;
  lastActiveDate?: string;
  todayActive?: boolean;
  calendar?: boolean[];
  streakDays?: boolean[];
  milestones?: StreakMilestone[];
}

export default function StreakPage(): React.JSX.Element {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();

  const streakQuery = useQuery({
    queryKey: ['rewards', 'streak'],
    queryFn: async () => {
      const res = await apiFetch<StreakData>('/rewards/streak');
      return res.data ?? {};
    },
    staleTime: 60000,
  });

  const streakData = streakQuery.data ?? {};
  const currentStreak = Number(streakData.currentStreak ?? streakData.streak ?? 0);
  const longestStreak = Number(streakData.longestStreak ?? streakData.maxStreak ?? 0);
  const calendar = Array.isArray(streakData.calendar) ? streakData.calendar : [];
  const streakDays = Array.isArray(streakData.streakDays) ? streakData.streakDays : calendar;
  const todayActive = Boolean(streakData.todayActive);

  const milestones: StreakMilestone[] = Array.isArray(streakData.milestones)
    ? streakData.milestones
    : [
        { days: 3, reward: 50, label: '3-Day Momentum' },
        { days: 7, reward: 200, label: '7-Day Champion' },
        { days: 14, reward: 500, label: '14-Day Vanguard' },
        { days: 30, reward: 1500, label: '30-Day Legend' },
        { days: 60, reward: 3000, label: '60-Day Master' },
        { days: 90, reward: 10000, label: '90-Day Immortal' },
      ].map((m) => ({
        ...m,
        unlocked: currentStreak >= m.days,
      }));

  const isLoading = authLoading || streakQuery.isLoading;
  const error = streakQuery.error?.message || null;

  // Last 30 days calculation
  const today = new Date();
  const last30Days: { date: Date; active: boolean; isToday: boolean }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dayIndex = 29 - i;
    last30Days.push({
      date: d,
      active: Boolean(streakDays[dayIndex] ?? calendar[dayIndex] ?? false),
      isToday: i === 0,
    });
  }

  if (authLoading) return <></>;
  if (!isAuthenticated || !user) return <></>;

  return (
    <PageShell activeNav="Rewards" glowColor="rgba(232, 66, 10, 0.25)">
      <div className="mb-6">
        <Link
          href="/rewards"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Rewards Center
        </Link>
      </div>

      <div className="max-w-3xl mx-auto">
        <PageHero
          eyebrow="DAILY ENGAGEMENT"
          eyebrowColor="var(--brand-orange)"
          badge={`${currentStreak} DAYS RUNNING`}
          title="Daily Activity Streak"
          subtitle="Check in daily, stream entertainment, and keep your flame alive to unlock exclusive multiplier bonuses."
          glowColor="rgba(232, 66, 10, 0.3)"
        />

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" color="var(--brand-orange)" />
          </div>
        ) : error ? (
          <ErrorState
            title="Failed to load streak status"
            description={error}
            buttonText="Retry"
            onButtonPress={() => streakQuery.refetch()}
          />
        ) : (
          <div className="space-y-8">
            {/* Primary Streak Flame Hero Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="az-glass p-8 sm:p-12 rounded-3xl text-center relative overflow-hidden border border-[var(--brand-orange)]/30"
              style={{
                background:
                  'linear-gradient(135deg, rgba(232, 66, 10, 0.15) 0%, rgba(204, 28, 28, 0.08) 50%, rgba(18, 15, 25, 0.9) 100%)',
              }}
            >
              <div className="w-24 h-24 rounded-full bg-[var(--brand-orange)]/20 border border-[var(--brand-orange)]/40 flex items-center justify-center mx-auto mb-4 text-[var(--brand-orange)] shadow-[0_0_50px_rgba(232,66,10,0.4)]">
                <Flame className="w-12 h-12 fill-[var(--brand-orange)] animate-pulse" />
              </div>

              <div className="flex items-baseline justify-center gap-2 mb-1">
                <span className="text-6xl sm:text-7xl font-extrabold text-white tracking-tight">
                  {currentStreak}
                </span>
                <span className="text-xl sm:text-2xl font-bold text-[var(--brand-orange)]">Days</span>
              </div>
              <p className="text-white/60 text-sm sm:text-base mb-6">Consecutive Platform Check-ins</p>

              {todayActive ? (
                <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                  <CheckCircle2 className="w-4 h-4" /> Today&apos;s check-in recorded!
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/25">
                  <Flame className="w-4 h-4" /> Stream now to preserve your flame!
                </span>
              )}
            </motion.div>

            {/* Current vs Longest Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="az-glass p-5 rounded-2xl text-center border border-white/10">
                <p className="text-xs text-white/50 uppercase tracking-wider font-semibold mb-1">
                  Active Streak
                </p>
                <p className="text-2xl sm:text-3xl font-extrabold text-[var(--brand-orange)]">
                  {currentStreak} Days
                </p>
              </div>

              <div className="az-glass p-5 rounded-2xl text-center border border-white/10">
                <p className="text-xs text-white/50 uppercase tracking-wider font-semibold mb-1">
                  All-Time Best
                </p>
                <p className="text-2xl sm:text-3xl font-extrabold text-amber-400">
                  {longestStreak} Days
                </p>
              </div>
            </div>

            {/* 30-Day Activity Heatmap */}
            <div className="az-glass p-6 sm:p-8 rounded-3xl border border-white/10">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[var(--brand-orange)]" />
                  <h2 className="az-headline text-lg sm:text-xl font-bold text-white">
                    Past 30 Days Activity
                  </h2>
                </div>
                <span className="text-xs text-white/40 font-medium">Daily Heatmap</span>
              </div>

              <div className="grid grid-cols-7 gap-2.5 sm:gap-3">
                {last30Days.map((day, i) => {
                  const dayLabel = day.date.toLocaleDateString('en', { weekday: 'narrow' });
                  return (
                    <div key={i} className="text-center">
                      {i < 7 && (
                        <p className="text-[10px] text-white/40 uppercase font-bold mb-2">
                          {dayLabel}
                        </p>
                      )}
                      <div
                        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-xs font-bold mx-auto transition-all ${
                          day.active
                            ? 'bg-[var(--brand-orange)] text-white shadow-[0_0_15px_rgba(232,66,10,0.4)]'
                            : day.isToday
                              ? 'border-2 border-[var(--brand-orange)] bg-[var(--brand-orange)]/15 text-white'
                              : 'bg-white/5 text-white/40 border border-white/5'
                        }`}
                      >
                        {day.date.getDate()}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Milestones Roadmap */}
            <div className="az-glass p-6 sm:p-8 rounded-3xl border border-white/10">
              <div className="flex items-center gap-2 mb-6">
                <Trophy className="w-5 h-5 text-amber-400" />
                <h2 className="az-headline text-lg sm:text-xl font-bold text-white">
                  Streak Milestones & Bounties
                </h2>
              </div>

              <div className="space-y-3">
                {milestones.map((m) => (
                  <div
                    key={m.days}
                    className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                      m.unlocked
                        ? 'bg-emerald-500/10 border-emerald-500/25'
                        : 'bg-white/5 border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          m.unlocked
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-white/10 text-white/40'
                        }`}
                      >
                        {m.unlocked ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : (
                          <Lock className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-white text-sm sm:text-base">{m.label}</p>
                        <p className="text-xs text-white/50">{m.days} consecutive check-ins</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="inline-flex items-center gap-1 text-sm sm:text-base font-extrabold text-[var(--brand-orange)]">
                        <Sparkles className="w-3.5 h-3.5" />+₦{m.reward.toLocaleString()}
                      </span>
                      {m.unlocked && (
                        <span className="block text-[10px] uppercase font-bold text-emerald-400 mt-0.5">
                          Claimed
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}
