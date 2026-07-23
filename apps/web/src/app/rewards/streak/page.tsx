'use client';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { Spinner, ErrorState } from '@azeebo/ui/web';
import Link from 'next/link';

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

interface StreakMilestone {
  days: number;
  reward: number;
  label: string;
  unlocked?: boolean;
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
        { days: 3, reward: 50, label: '3-Day Streak' },
        { days: 7, reward: 200, label: '7-Day Streak' },
        { days: 14, reward: 500, label: '14-Day Streak' },
        { days: 30, reward: 1500, label: '30-Day Streak' },
        { days: 60, reward: 3000, label: '60-Day Streak' },
        { days: 90, reward: 10000, label: '90-Day Streak' },
      ].map((m) => ({
        ...m,
        unlocked: currentStreak >= m.days,
      }));

  const isLoading = authLoading || streakQuery.isLoading;
  const error = streakQuery.error?.message || null;

  // Generate last 30 days for calendar
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
    <div style={{ backgroundColor: '#1A0A0A', minHeight: '100vh', color: '#F5F0EB' }}>
      <AppHeader />
      <main
        style={{
          maxWidth: 700,
          margin: '0 auto',
          padding: '100px 24px 60px',
        }}
      >
        <div style={{ marginBottom: 24 }}>
          <Link href="/rewards" style={{ color: '#9A8A7A', fontSize: 14, textDecoration: 'none' }}>
            &larr; Back to Rewards
          </Link>
        </div>

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700 }}>Streak</h1>
          <p style={{ color: '#9A8A7A', marginTop: 4 }}>Keep your daily streak alive</p>
        </div>

        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <Spinner size="lg" color="#E8420A" />
          </div>
        ) : error ? (
          <ErrorState
            title="Failed to load streak data"
            description={error}
            buttonText="Retry"
            onButtonPress={() => streakQuery.refetch()}
          />
        ) : (
          <>
            {/* Current streak card */}
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(232,66,10,0.2) 0%, rgba(204,28,28,0.1) 100%)',
                borderRadius: 20,
                padding: 32,
                textAlign: 'center',
                marginBottom: 24,
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 8 }}>🔥</div>
              <p style={{ fontSize: 48, fontWeight: 700, color: '#E8420A' }}>{currentStreak}</p>
              <p style={{ fontSize: 16, color: '#9A8A7A', marginBottom: 8 }}>Day Streak</p>
              {todayActive && (
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    padding: '4px 12px',
                    borderRadius: 999,
                    backgroundColor: 'rgba(34,197,94,0.15)',
                    color: '#22C55E',
                  }}
                >
                  ✓ Today&apos;s check-in done
                </span>
              )}
              {!todayActive && (
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    padding: '4px 12px',
                    borderRadius: 999,
                    backgroundColor: 'rgba(245,158,11,0.15)',
                    color: '#F59E0B',
                  }}
                >
                  Check in today to keep your streak
                </span>
              )}
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 32 }}>
              <div className="az-glass" style={{ padding: 20, borderRadius: 16, textAlign: 'center' }}>
                <p style={{ fontSize: 13, color: '#9A8A7A', marginBottom: 8 }}>Current Streak</p>
                <p style={{ fontSize: 24, fontWeight: 700, color: '#E8420A' }}>{currentStreak} days</p>
              </div>
              <div className="az-glass" style={{ padding: 20, borderRadius: 16, textAlign: 'center' }}>
                <p style={{ fontSize: 13, color: '#9A8A7A', marginBottom: 8 }}>Longest Streak</p>
                <p style={{ fontSize: 24, fontWeight: 700, color: '#F59E0B' }}>{longestStreak} days</p>
              </div>
            </div>

            {/* Streak calendar */}
            <div className="az-glass" style={{ padding: 24, borderRadius: 20, marginBottom: 32 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Last 30 Days</h2>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  gap: 6,
                }}
              >
                {last30Days.map((day, i) => {
                  const dayLabel = day.date.toLocaleDateString('en', { weekday: 'narrow' });
                  return (
                    <div key={i} style={{ textAlign: 'center' }}>
                      {i < 7 && (
                        <p style={{ fontSize: 10, color: '#6B5B4B', marginBottom: 4 }}>{dayLabel}</p>
                      )}
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 11,
                          fontWeight: 600,
                          margin: '0 auto',
                          backgroundColor: day.active
                            ? 'rgba(232,66,10,0.25)'
                            : day.isToday
                              ? 'rgba(232,66,10,0.1)'
                              : 'rgba(255,255,255,0.04)',
                          color: day.active
                            ? '#E8420A'
                            : day.isToday
                              ? '#E8420A'
                              : '#6B5B4B',
                          border: day.isToday ? '1px solid #E8420A' : 'none',
                        }}
                      >
                        {day.date.getDate()}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Milestones */}
            <div className="az-glass" style={{ padding: 24, borderRadius: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Streak Milestones</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {milestones.map((milestone) => (
                  <div
                    key={milestone.days}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '14px 16px',
                      borderRadius: 12,
                      backgroundColor: milestone.unlocked
                        ? 'rgba(34,197,94,0.08)'
                        : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${milestone.unlocked ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.04)'}`,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 18,
                          backgroundColor: milestone.unlocked
                            ? 'rgba(34,197,94,0.15)'
                            : 'rgba(255,255,255,0.05)',
                        }}
                      >
                        {milestone.unlocked ? '✓' : '🔒'}
                      </div>
                      <div>
                        <p style={{ fontWeight: 600, fontSize: 14 }}>{milestone.label}</p>
                        <p style={{ fontSize: 12, color: '#9A8A7A' }}>
                          {milestone.days} consecutive days
                        </p>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: '#E8420A' }}>
                        +₦{milestone.reward.toLocaleString()}
                      </p>
                      {milestone.unlocked && (
                        <p style={{ fontSize: 11, color: '#22C55E' }}>Unlocked</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </main>
      <AppFooter />
    </div>
  );
}
