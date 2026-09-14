import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { LoadingState, EmptyState, ErrorState } from '../../src/components/StateContainers';
import { apiClient } from '../../src/api/client';
import { ApiResponse } from '../../src/types/api';
import { colors } from '../../src/theme';

type ListResponse<T> = T[] | ApiResponse<T[]>;

interface Tournament {
  id: string;
  title: string;
  game: string;
  prize: string;
  entryFee: string;
  participants: number;
  maxParticipants: number;
  status: 'upcoming' | 'active' | 'completed';
  startTime: string;
  emoji: string;
}

const STATUS_FILTERS = ['All', 'Upcoming', 'Active', 'Completed'];

export default function TournamentsScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const isDark = colorScheme === 'dark';
  const [filter, setFilter] = useState('All');

  const tournamentsQuery = useQuery({
    queryKey: ['games', 'tournaments', filter],
    queryFn: async () => {
      const res = await apiClient.get<ListResponse<Tournament>>('/v1/games/tournaments');
      return Array.isArray(res) ? res : (res?.data ?? []);
    },
    staleTime: 30_000,
  });

  const isLoading = tournamentsQuery.isLoading;
  const error = tournamentsQuery.error?.message;
  const allTournaments = tournamentsQuery.data ?? [];
  const tournaments =
    filter === 'All'
      ? allTournaments
      : allTournaments.filter((t) => t.status === filter.toLowerCase());

  if (isLoading)
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#1A0A0A' : '#ffffff' }]}>
        <LoadingState text="Loading tournaments..." />
      </SafeAreaView>
    );
  if (error)
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#1A0A0A' : '#ffffff' }]}>
        <ErrorState description={error} onRetry={() => tournamentsQuery.refetch()} />
      </SafeAreaView>
    );
  if (!tournaments.length)
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#1A0A0A' : '#ffffff' }]}>
        <EmptyState
          icon="🏆"
          title="No tournaments"
          description="Check back for upcoming tournaments"
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
          Tournaments
        </Text>
      </View>

      <View style={styles.filterBar}>
        {STATUS_FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={tournaments}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.tournamentCard, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}
            onPress={() => router.push('/games/tournament-detail')}
          >
            <View style={styles.tournamentLeft}>
              <Text style={styles.tournamentEmoji}>{item.emoji}</Text>
            </View>
            <View style={styles.tournamentInfo}>
              <Text style={[styles.tournamentTitle, { color: isDark ? '#fff' : '#000' }]}>
                {item.title}
              </Text>
              <Text style={styles.tournamentGame}>{item.game}</Text>
              <View style={styles.tournamentMeta}>
                <Text style={styles.metaText}>🏆 {item.prize}</Text>
                <Text style={styles.metaText}>
                  👥 {item.participants}/{item.maxParticipants}
                </Text>
              </View>
            </View>
            <View style={styles.tournamentRight}>
              <View
                style={[
                  styles.statusBadge,
                  item.status === 'active' && styles.statusActive,
                  item.status === 'completed' && styles.statusCompleted,
                ]}
              >
                <Text
                  style={[styles.statusText, item.status === 'active' && styles.statusTextActive]}
                >
                  {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                </Text>
              </View>
              {item.status === 'upcoming' && <Text style={styles.startTime}>{item.startTime}</Text>}
            </View>
          </TouchableOpacity>
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
    backgroundColor: colors.palette.charcoal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { color: '#fff', fontSize: 20 },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  filterBar: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 16, gap: 10 },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
  },
  filterChipActive: { backgroundColor: colors.palette.plum },
  filterText: { color: colors.palette.grey500, fontSize: 13, fontWeight: '600' },
  filterTextActive: { color: '#000' },
  listContent: { paddingHorizontal: 16, paddingBottom: 30 },
  tournamentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  tournamentLeft: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: colors.palette.charcoal,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  tournamentEmoji: { fontSize: 28 },
  tournamentInfo: { flex: 1 },
  tournamentTitle: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  tournamentGame: { color: colors.palette.plum, fontSize: 12, marginBottom: 6 },
  tournamentMeta: { flexDirection: 'row', gap: 12 },
  metaText: { color: colors.palette.grey500, fontSize: 12 },
  tournamentRight: { alignItems: 'flex-end' },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: colors.palette.grey800,
    marginBottom: 4,
  },
  statusActive: { backgroundColor: '#EF4444' },
  statusCompleted: { backgroundColor: '#22C55E' },
  statusText: { color: colors.palette.grey500, fontSize: 11, fontWeight: '600' },
  statusTextActive: { color: '#fff' },
  startTime: { color: colors.palette.grey500, fontSize: 11 },
});
