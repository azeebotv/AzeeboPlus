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
    <PageShell activeNav="Rewards" glowColor="rgba(227, 30, 36, 0.25)">
      <div className="mb-6">
        <Link
          href="/rewards"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-az-ink/60 hover:text-az-ink transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Rewards Center
        </Link>
      </div>

      <div className="max-w-3xl mx-auto">
        <PageHero
          eyebrow="DAILY ENGAGEMENT"
          eyebrowColor="var(--color-az-flame)"
          badge={`${currentStreak} DAYS RUNNING`}
          title="Daily Activity Streak"
          subtitle="Check in daily, stream entertainment, and keep your flame alive to unlock exclusive multiplier bonuses."
          glowColor="color-mix(in srgb, var(--color-az-scarlet) 30%, transparent)"
        />

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" color="var(--color-az-flame)" />
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
              className="az-glass p-8 sm:p-12 text-center relative overflow-hidden border"
              style={{
                background:
                  'linear-gradient(135deg, color-mix(in srgb, var(--color-az-scarlet) 15%, transparent) 0%, color-mix(in srgb, var(--color-az-scarlet) 8%, transparent) 50%, rgba(18, 15, 25, 0.9) 100%)',
              }}
            >
              <div className="w-24 h-24 rounded-full bg-[var(--color-az-flame)]/20 border border-[var(--color-az-flame)]/40 flex items-center justify-center mx-auto mb-4 text-[var(--color-az-flame)] shadow-az-glow">
                <Flame className="w-12 h-12 fill-[var(--color-az-flame)] animate-pulse" />
              </div>

              <div className="flex items-baseline justify-center gap-2 mb-1">
                <span className="text-6xl sm:text-7xl font-extrabold text-az-ink tracking-tight">
                  {currentStreak}
                </span>
                <span className="text-xl sm:text-2xl font-bold text-[var(--color-az-flame)]">
                  Days
                </span>
              </div>
              <p className="text-az-ink/60 text-sm sm:text-base mb-6">
                Consecutive Platform Check-ins
              </p>

              {todayActive ? (
                <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold bg-az-success-500/15 text-az-success-400 border border-az-success-500/25">
                  <CheckCircle2 className="w-4 h-4" /> Today&apos;s check-in recorded!
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold bg-az-warning-500/15 text-az-warning-400 border border-az-warning-500/25">
                  <Flame className="w-4 h-4" /> Stream now to preserve your flame!
                </span>
              )}
            </motion.div>

            {/* Current vs Longest Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="az-glass p-5 text-center border border-az-glass-border">
                <p className="text-xs text-az-ink/50 uppercase tracking-wider font-semibold mb-1">
                  Active Streak
                </p>
                <p className="az-headline text-2xl sm:text-3xl font-extrabold text-[var(--color-az-flame)]">
                  {currentStreak} Days
                </p>
              </div>

              <div className="az-glass p-5 text-center border border-az-glass-border">
                <p className="text-xs text-az-ink/50 uppercase tracking-wider font-semibold mb-1">
                  All-Time Best
                </p>
                <p className="az-headline text-2xl sm:text-3xl font-extrabold text-az-warning-400">
                  {longestStreak} Days
                </p>
              </div>
            </div>

            {/* 30-Day Activity Heatmap */}
            <div className="az-glass p-6 sm:p-8 border border-az-glass-border">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[var(--color-az-flame)]" />
                  <h2 className="az-headline text-lg sm:text-xl text-az-ink">
                    Past 30 Days Activity
                  </h2>
                </div>
                <span className="text-xs text-az-ink/40 font-medium">Daily Heatmap</span>
              </div>

              <div className="grid grid-cols-7 gap-2.5 sm:gap-3">
                {last30Days.map((day, i) => {
                  const dayLabel = day.date.toLocaleDateString('en', { weekday: 'narrow' });
                  return (
                    <div key={i} className="text-center">
                      {i < 7 && (
                        <p className="text-[10px] text-az-ink/40 uppercase font-bold mb-2">
                          {dayLabel}
                        </p>
                      )}
                      <div
                        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-xs font-bold mx-auto transition-all ${
                          day.active
                            ? 'bg-[var(--color-az-flame)] text-az-surface-root shadow-az-glow'
                            : day.isToday
                              ? 'border-2 border-[var(--color-az-flame)] bg-[var(--color-az-flame)]/15 text-az-ink'
                              : 'bg-az-glass-fill text-az-ink/40 border border-az-ink/5'
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
            <div className="az-glass p-6 sm:p-8 border border-az-glass-border">
              <div className="flex items-center gap-2 mb-6">
                <Trophy className="w-5 h-5 text-az-warning-400" />
                <h2 className="az-headline text-lg sm:text-xl text-az-ink">
                  Streak Milestones & Bounties
                </h2>
              </div>

              <div className="space-y-3">
                {milestones.map((m) => (
                  <div
                    key={m.days}
                    className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                      m.unlocked
                        ? 'bg-az-success-500/10 border-az-success-500/25'
                        : 'bg-az-glass-fill border-az-glass-border'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          m.unlocked
                            ? 'bg-az-success-500/20 text-az-success-400'
                            : 'bg-az-glass-card text-az-ink/40'
                        }`}
                      >
                        {m.unlocked ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : (
                          <Lock className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-az-ink text-sm sm:text-base">{m.label}</p>
                        <p className="text-xs text-az-ink/50">{m.days} consecutive check-ins</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="inline-flex items-center gap-1 text-sm sm:text-base font-extrabold text-[var(--color-az-flame)]">
                        <Sparkles className="w-3.5 h-3.5" />
                        +₦{m.reward.toLocaleString()}
                      </span>
                      {m.unlocked && (
                        <span className="block text-[10px] uppercase font-bold text-az-success-400 mt-0.5">
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
