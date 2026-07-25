import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { LoadingState, EmptyState, ErrorState } from '../../src/components/StateContainers';
import { apiClient } from '../../src/api/client';
import { ApiResponse } from '../../src/types/api';

type ListResponse<T> = T[] | ApiResponse<T[]>;

interface LeaderboardEntry {
  id: string;
  rank: number;
  name: string;
  avatar: string;
  points: number;
  winRate: number;
  rankChange: 'up' | 'down' | 'same';
}

const TIME_PERIODS = ['Week', 'Month', 'All Time'];

export default function LeaderboardScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const isDark = colorScheme === 'dark';
  const [period, setPeriod] = useState('Week');

  const leaderboardQuery = useQuery({
    queryKey: ['sports', 'leaderboard', period],
    queryFn: async () => {
      const res = await apiClient.get<ListResponse<LeaderboardEntry>>('/v1/sports/leaderboard');
      return Array.isArray(res) ? res : (res?.data ?? []);
    },
    staleTime: 30_000,
  });

  const isLoading = leaderboardQuery.isLoading;
  const error = leaderboardQuery.error?.message;
  const entries = leaderboardQuery.data ?? [];

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const getChangeIcon = (change: string) => {
    if (change === 'up') return '📈';
    if (change === 'down') return '📉';
    return '➡️';
  };

  if (isLoading)
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#1A0A0A' : '#ffffff' }]}>
        <LoadingState text="Loading leaderboard..." />
      </SafeAreaView>
    );
  if (error)
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#1A0A0A' : '#ffffff' }]}>
        <ErrorState description={error} onRetry={() => leaderboardQuery.refetch()} />
      </SafeAreaView>
    );
  if (!entries.length)
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#1A0A0A' : '#ffffff' }]}>
        <EmptyState
          icon="🏆"
          title="No rankings"
          description="Leaderboard will appear once players compete"
        />
      </SafeAreaView>
    );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#1A0A0A' : '#ffffff' }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: isDark ? '#ffffff' : '#1A0A0A' }]}>
          Leaderboard
        </Text>
      </View>

      <View style={styles.periodBar}>
        {TIME_PERIODS.map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.periodChip, period === p && styles.periodChipActive]}
            onPress={() => setPeriod(p)}
          >
            <Text style={[styles.periodText, period === p && styles.periodTextActive]}>{p}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={() => (
          <View style={[styles.topThree, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
            {entries.slice(0, 3).map((entry) => (
              <View key={entry.id} style={styles.topItem}>
                <Text style={styles.topRank}>{getRankIcon(entry.rank)}</Text>
                <View style={styles.topAvatar}>
                  <Text style={styles.avatarEmoji}>{entry.avatar}</Text>
                </View>
                <Text
                  style={[styles.topName, { color: isDark ? '#fff' : '#000' }]}
                  numberOfLines={1}
                >
                  {entry.name}
                </Text>
                <Text style={styles.topPoints}>{entry.points.toLocaleString()} pts</Text>
              </View>
            ))}
          </View>
        )}
        renderItem={({ item }) => (
          <View style={[styles.entryRow, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
            <Text style={styles.rankText}>{getRankIcon(item.rank)}</Text>
            <View style={styles.entryAvatar}>
              <Text style={styles.entryAvatarEmoji}>{item.avatar}</Text>
            </View>
            <View style={styles.entryInfo}>
              <Text style={[styles.entryName, { color: isDark ? '#fff' : '#000' }]}>
                {item.name}
              </Text>
              <Text style={styles.entryWinRate}>Win Rate: {item.winRate}%</Text>
            </View>
            <View style={styles.entryRight}>
              <Text style={styles.entryPoints}>{item.points.toLocaleString()}</Text>
              <Text style={styles.changeIcon}>{getChangeIcon(item.rankChange)}</Text>
            </View>
          </View>
        )}
      />
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
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { color: '#fff', fontSize: 20 },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  periodBar: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 16, gap: 10 },
  periodChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
  },
  periodChipActive: { backgroundColor: '#E74C3C' },
  periodText: { color: '#888', fontSize: 13, fontWeight: '600' },
  periodTextActive: { color: '#fff' },
  listContent: { paddingHorizontal: 16, paddingBottom: 30 },
  topThree: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  topItem: { alignItems: 'center', width: 90 },
  topRank: { fontSize: 28, marginBottom: 8 },
  topAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  avatarEmoji: { fontSize: 24 },
  topName: { fontSize: 12, fontWeight: '600', marginBottom: 2, textAlign: 'center' },
  topPoints: { color: '#E74C3C', fontSize: 12, fontWeight: '700' },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  rankText: { width: 40, fontSize: 14, fontWeight: '700', color: '#888', textAlign: 'center' },
  entryAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  entryAvatarEmoji: { fontSize: 20 },
  entryInfo: { flex: 1 },
  entryName: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  entryWinRate: { color: '#888', fontSize: 12 },
  entryRight: { alignItems: 'flex-end' },
  entryPoints: { color: '#E74C3C', fontSize: 14, fontWeight: '700', marginBottom: 2 },
  changeIcon: { fontSize: 12 },
});
