import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { apiClient } from '../../src/api';
import { logger } from '../../src/utils/logger';

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

export default function StreakScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [streakData, setStreakData] = useState<StreakData>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.replace('/(auth)/login');
    }
  }, [authLoading, isAuthenticated, router]);

  const loadData = useCallback(async () => {
    try {
      const res = await apiClient.get<StreakData>('/rewards/streak');
      setStreakData(res || {});
    } catch (error) {
      logger.error('Failed to load streak data', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    loadData();
  }, [authLoading, isAuthenticated, loadData]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  const currentStreak = Number(streakData.currentStreak ?? streakData.streak ?? 0);
  const longestStreak = Number(streakData.longestStreak ?? streakData.maxStreak ?? 0);
  const streakDays = Array.isArray(streakData.streakDays)
    ? streakData.streakDays
    : Array.isArray(streakData.calendar)
      ? streakData.calendar
      : [];
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
      ].map((m) => ({ ...m, unlocked: currentStreak >= m.days }));

  // Generate last 30 days
  const today = new Date();
  const last30Days: { date: Date; active: boolean; isToday: boolean }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    last30Days.push({
      date: d,
      active: Boolean(streakDays[29 - i] ?? false),
      isToday: i === 0,
    });
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#E8420A" />
        <Text style={styles.loadingText}>Loading streak data...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#E8420A" />
        }
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Streak</Text>
          <Text style={styles.subtitle}>Keep your daily streak alive</Text>
        </View>

        {/* Current streak card */}
        <View style={styles.streakCard}>
          <Text style={styles.flameIcon}>🔥</Text>
          <Text style={styles.streakCount}>{currentStreak}</Text>
          <Text style={styles.streakLabel}>Day Streak</Text>
          {todayActive ? (
            <View style={styles.todayBadge}>
              <Text style={styles.todayBadgeText}>✓ Today&apos;s check-in done</Text>
            </View>
          ) : (
            <View style={styles.todayBadgePending}>
              <Text style={styles.todayBadgePendingText}>Check in today to keep your streak</Text>
            </View>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Current Streak</Text>
            <Text style={styles.statValue}>{currentStreak} days</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Longest Streak</Text>
            <Text style={[styles.statValue, { color: '#F59E0B' }]}>{longestStreak} days</Text>
          </View>
        </View>

        {/* Streak calendar */}
        <View style={styles.calendarSection}>
          <Text style={styles.sectionTitle}>Last 30 Days</Text>
          <View style={styles.calendarGrid}>
            {last30Days.map((day, i) => (
              <View key={i} style={styles.calendarDayContainer}>
                {i < 7 && i % 7 === 0 && (
                  <Text style={styles.dayLabel}>
                    {day.date.toLocaleDateString('en', { weekday: 'short' }).charAt(0)}
                  </Text>
                )}
                <View
                  style={[
                    styles.calendarDay,
                    day.active && styles.calendarDayActive,
                    day.isToday && styles.calendarDayToday,
                  ]}
                >
                  <Text
                    style={[
                      styles.calendarDayText,
                      day.active && styles.calendarDayTextActive,
                      day.isToday && styles.calendarDayTextToday,
                    ]}
                  >
                    {day.date.getDate()}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Milestones */}
        <View style={styles.milestonesSection}>
          <Text style={styles.sectionTitle}>Streak Milestones</Text>
          {milestones.map((milestone) => (
            <View
              key={milestone.days}
              style={[styles.milestoneCard, milestone.unlocked && styles.milestoneCardUnlocked]}
            >
              <View style={styles.milestoneLeft}>
                <View
                  style={[styles.milestoneIcon, milestone.unlocked && styles.milestoneIconUnlocked]}
                >
                  <Text style={styles.milestoneIconText}>{milestone.unlocked ? '✓' : '🔒'}</Text>
                </View>
                <View>
                  <Text style={styles.milestoneLabel}>{milestone.label}</Text>
                  <Text style={styles.milestoneSubtext}>{milestone.days} consecutive days</Text>
                </View>
              </View>
              <View style={styles.milestoneRight}>
                <Text style={styles.milestoneReward}>+₦{milestone.reward.toLocaleString()}</Text>
                {milestone.unlocked && <Text style={styles.milestoneUnlocked}>Unlocked</Text>}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A0A0A' },
  content: { flex: 1, padding: 16, paddingBottom: 32 },
  loadingText: { color: '#9CA3AF', marginTop: 12, textAlign: 'center' },
  backButton: { marginBottom: 16, paddingVertical: 4 },
  backText: { color: '#9A8A7A', fontSize: 14 },
  header: { marginBottom: 24 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#9CA3AF' },
  streakCard: {
    backgroundColor: 'rgba(232,66,10,0.15)',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    marginBottom: 24,
  },
  flameIcon: { fontSize: 48, marginBottom: 8 },
  streakCount: { fontSize: 48, fontWeight: 'bold', color: '#E8420A' },
  streakLabel: { fontSize: 16, color: '#9CA3AF', marginBottom: 12 },
  todayBadge: {
    backgroundColor: 'rgba(16,185,129,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  todayBadgeText: { fontSize: 12, fontWeight: '600', color: '#10B981' },
  todayBadgePending: {
    backgroundColor: 'rgba(245,158,11,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  todayBadgePendingText: { fontSize: 12, fontWeight: '600', color: '#F59E0B' },
  statsGrid: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statCard: {
    flex: 1,
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statLabel: { fontSize: 12, color: '#9CA3AF', marginBottom: 8 },
  statValue: { fontSize: 20, fontWeight: 'bold', color: '#E8420A' },
  calendarSection: {
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 16 },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
  },
  calendarDayContainer: { alignItems: 'center', width: 32 },
  dayLabel: { fontSize: 9, color: '#6B5B4B', marginBottom: 2 },
  calendarDay: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  calendarDayActive: { backgroundColor: 'rgba(232,66,10,0.25)' },
  calendarDayToday: { borderWidth: 1, borderColor: '#E8420A' },
  calendarDayText: { fontSize: 10, color: '#6B5B4B' },
  calendarDayTextActive: { color: '#E8420A' },
  calendarDayTextToday: { color: '#E8420A' },
  milestonesSection: { marginBottom: 24 },
  milestoneCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
    marginBottom: 10,
  },
  milestoneCardUnlocked: {
    backgroundColor: 'rgba(16,185,129,0.05)',
    borderColor: 'rgba(16,185,129,0.15)',
  },
  milestoneLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  milestoneIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  milestoneIconUnlocked: { backgroundColor: 'rgba(16,185,129,0.15)' },
  milestoneIconText: { fontSize: 16 },
  milestoneLabel: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
  milestoneSubtext: { fontSize: 11, color: '#9CA3AF' },
  milestoneRight: { alignItems: 'flex-end' },
  milestoneReward: { fontSize: 14, fontWeight: '700', color: '#E8420A' },
  milestoneUnlocked: { fontSize: 10, color: '#10B981', marginTop: 2 },
});
