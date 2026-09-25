import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { apiClient } from '@azeebo/react-data';
import { LoadingState, EmptyState, ErrorState } from '../../src/components/StateContainers';
import { colors } from '../../src/theme';

interface PlayerStats {
  id: string;
  name: string;
  avatar: string;
  totalScore: number;
  gamesPlayed: number;
  winRate: number;
  rank: number;
  rankChange: string;
  longestStreak: number;
  achievements: { id: string; title: string; emoji: string; earned: boolean }[];
  recentGames: { id: string; title: string; score: number; date: string; emoji: string }[];
}

export default function StatsScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const isDark = colorScheme === 'dark';
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const res = await apiClient.get<PlayerStats>('/games/stats');
        setStats(res);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load stats');
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (isLoading)
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#1A0A0A' : '#ffffff' }]}>
        <LoadingState text="Loading stats..." />
      </SafeAreaView>
    );
  if (error)
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#1A0A0A' : '#ffffff' }]}>
        <ErrorState description={error} onRetry={() => {}} />
      </SafeAreaView>
    );
  if (!stats)
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#1A0A0A' : '#ffffff' }]}>
        <EmptyState icon="📊" title="No stats" description="Play games to see your stats" />
      </SafeAreaView>
    );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#1A0A0A' : '#ffffff' }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: isDark ? '#ffffff' : '#1A0A0A' }]}>
          My Stats
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.profileCard, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
          <View style={styles.avatar}>
            <Text style={styles.avatarEmoji}>{stats.avatar}</Text>
          </View>
          <Text style={[styles.name, { color: isDark ? '#fff' : '#000' }]}>{stats.name}</Text>
          <View style={styles.rankRow}>
            <Text style={styles.rankBadge}>🏅 #{stats.rank}</Text>
            <Text style={styles.rankChange}>{stats.rankChange}</Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
            <Text style={[styles.statValue, { color: isDark ? '#fff' : '#000' }]}>
              {stats.totalScore.toLocaleString()}
            </Text>
            <Text style={styles.statLabel}>Total Score</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
            <Text style={[styles.statValue, { color: isDark ? '#fff' : '#000' }]}>
              {stats.gamesPlayed}
            </Text>
            <Text style={styles.statLabel}>Games Played</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
            <Text style={[styles.statValue, { color: isDark ? '#fff' : '#000' }]}>
              {stats.winRate}%
            </Text>
            <Text style={styles.statLabel}>Win Rate</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
            <Text style={[styles.statValue, { color: isDark ? '#fff' : '#000' }]}>
              🔥 {stats.longestStreak}
            </Text>
            <Text style={styles.statLabel}>Longest Streak</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>
            Achievements
          </Text>
          <View style={styles.achievementsGrid}>
            {stats.achievements.map((ach) => (
              <View
                key={ach.id}
                style={[styles.achievementCard, !ach.earned && styles.achievementLocked]}
              >
                <Text style={styles.achievementEmoji}>{ach.earned ? ach.emoji : '🔒'}</Text>
                <Text
                  style={[styles.achievementTitle, { color: isDark ? '#fff' : '#000' }]}
                  numberOfLines={1}
                >
                  {ach.title}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>
            Recent Games
          </Text>
          {stats.recentGames.map((game) => (
            <View
              key={game.id}
              style={[styles.recentRow, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}
            >
              <Text style={styles.recentEmoji}>{game.emoji}</Text>
              <View style={styles.recentInfo}>
                <Text style={[styles.recentTitle, { color: isDark ? '#fff' : '#000' }]}>
                  {game.title}
                </Text>
                <Text style={styles.recentDate}>{game.date}</Text>
              </View>
              <Text style={styles.recentScore}>{game.score.toLocaleString()}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingTop: 50, gap: 12 },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bg.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { color: '#fff', fontSize: 20 },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  content: { paddingBottom: 30 },
  profileCard: { margin: 16, padding: 24, borderRadius: 16, alignItems: 'center' },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.bg.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarEmoji: { fontSize: 40 },
  name: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  rankRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rankBadge: { color: colors.category.purple, fontSize: 16, fontWeight: '700' },
  rankChange: { color: colors.text.secondary, fontSize: 14 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 10 },
  statCard: { width: '47%', padding: 16, borderRadius: 12, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '700', marginBottom: 4 },
  statLabel: { color: colors.text.secondary, fontSize: 12 },
  section: { paddingHorizontal: 16, marginTop: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  achievementsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  achievementCard: {
    width: 100,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
  },
  achievementLocked: { opacity: 0.5 },
  achievementEmoji: { fontSize: 30, marginBottom: 6 },
  achievementTitle: { fontSize: 11, fontWeight: '600', textAlign: 'center' },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  recentEmoji: { fontSize: 28, marginRight: 12 },
  recentInfo: { flex: 1 },
  recentTitle: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  recentDate: { color: colors.text.secondary, fontSize: 12 },
  recentScore: { color: colors.category.purple, fontSize: 16, fontWeight: '700' },
});
