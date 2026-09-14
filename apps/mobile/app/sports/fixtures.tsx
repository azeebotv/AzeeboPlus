import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SectionList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { LoadingState, EmptyState, ErrorState } from '../../src/components/StateContainers';
import { apiClient } from '../../src/api/client';
import { ApiResponse } from '../../src/types/api';
import { colors } from '../../src/theme';

type ListResponse<T> = T[] | ApiResponse<T[]>;

interface Fixture {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore?: number;
  awayScore?: number;
  date: string;
  time: string;
  league: string;
  status: 'upcoming' | 'live' | 'finished';
  venue?: string;
}

export default function FixturesScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const isDark = colorScheme === 'dark';
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'live' | 'finished'>('all');

  const fixturesQuery = useQuery({
    queryKey: ['sports', 'fixtures'],
    queryFn: async () => {
      const res = await apiClient.get<ListResponse<Fixture>>('/v1/sports/fixtures');
      return Array.isArray(res) ? res : (res?.data ?? []);
    },
    staleTime: 30_000,
  });

  const isLoading = fixturesQuery.isLoading;
  const error = fixturesQuery.error?.message;
  const allFixtures = fixturesQuery.data ?? [];

  const filteredFixtures =
    filter === 'all' ? allFixtures : allFixtures.filter((f) => f.status === filter);

  const groupedFixtures = filteredFixtures.reduce<Record<string, Fixture[]>>((acc, fixture) => {
    const date = fixture.date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(fixture);
    return acc;
  }, {});

  const sections = Object.entries(groupedFixtures).map(([date, data]) => ({
    title: date,
    data,
  }));

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#1A0A0A' : '#ffffff' }]}>
        <LoadingState text="Loading fixtures..." />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#1A0A0A' : '#ffffff' }]}>
        <ErrorState description={error} onRetry={() => fixturesQuery.refetch()} />
      </SafeAreaView>
    );
  }

  if (!allFixtures.length) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#1A0A0A' : '#ffffff' }]}>
        <EmptyState
          icon="⚽"
          title="No fixtures"
          description="Check back later for upcoming fixtures"
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#1A0A0A' : '#ffffff' }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: isDark ? '#ffffff' : '#1A0A0A' }]}>
          Fixtures
        </Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar}>
        {(['all', 'upcoming', 'live', 'finished'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderSectionHeader={({ section }) => (
          <View style={[styles.sectionHeader, { backgroundColor: isDark ? '#1A0A0A' : '#ffffff' }]}>
            <Text style={[styles.sectionDate, { color: isDark ? '#ffffff' : '#1A0A0A' }]}>
              {section.title}
            </Text>
          </View>
        )}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.fixtureCard, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}
            onPress={() => router.push('/sports/fixture-detail')}
          >
            <View style={styles.fixtureLeague}>
              <Text style={styles.leagueText}>{item.league}</Text>
              <View style={[styles.statusBadge, item.status === 'live' && styles.statusLive]}>
                <Text style={[styles.statusText, item.status === 'live' && styles.statusTextLive]}>
                  {item.status === 'live' ? 'LIVE' : item.status === 'finished' ? 'FT' : item.time}
                </Text>
              </View>
            </View>
            <View style={styles.fixtureTeams}>
              <View style={styles.teamInfo}>
                <Text style={styles.teamEmoji}>🔵</Text>
                <Text style={[styles.teamName, { color: isDark ? '#fff' : '#000' }]}>
                  {item.homeTeam}
                </Text>
              </View>
              {item.homeScore !== undefined ? (
                <View style={styles.scoreBox}>
                  <Text style={[styles.scoreText, { color: isDark ? '#fff' : '#000' }]}>
                    {item.homeScore} - {item.awayScore}
                  </Text>
                </View>
              ) : (
                <View style={styles.vsBox}>
                  <Text style={styles.vsText}>VS</Text>
                </View>
              )}
              <View style={[styles.teamInfo, styles.teamInfoRight]}>
                <Text style={[styles.teamName, { color: isDark ? '#fff' : '#000' }]}>
                  {item.awayTeam}
                </Text>
                <Text style={styles.teamEmoji}>🔴</Text>
              </View>
            </View>
            {item.venue && <Text style={styles.venueText}>📍 {item.venue}</Text>}
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContent}
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
  filterBar: { paddingHorizontal: 16, marginBottom: 12, maxHeight: 50 },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    marginRight: 10,
  },
  filterChipActive: { backgroundColor: colors.palette.alarmRed },
  filterText: { color: colors.palette.grey500, fontSize: 13, fontWeight: '600' },
  filterTextActive: { color: '#fff' },
  sectionHeader: { paddingHorizontal: 16, paddingVertical: 8 },
  sectionDate: { fontSize: 14, fontWeight: '700', color: colors.palette.alarmRed },
  listContent: { paddingBottom: 30 },
  fixtureCard: { marginHorizontal: 16, marginBottom: 12, padding: 16, borderRadius: 12 },
  fixtureLeague: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  leagueText: { color: colors.palette.grey500, fontSize: 12 },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: colors.palette.charcoal,
  },
  statusLive: { backgroundColor: colors.palette.alarmRed },
  statusText: { color: colors.palette.grey500, fontSize: 11, fontWeight: '600' },
  statusTextLive: { color: '#fff' },
  fixtureTeams: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  teamInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  teamInfoRight: { justifyContent: 'flex-end' },
  teamEmoji: { fontSize: 24 },
  teamName: { fontSize: 14, fontWeight: '600' },
  scoreBox: {
    backgroundColor: colors.palette.charcoal,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  scoreText: { fontSize: 20, fontWeight: '700' },
  vsBox: { paddingHorizontal: 20 },
  vsText: { color: colors.palette.grey500, fontSize: 16, fontWeight: '600' },
  venueText: { color: colors.palette.grey500, fontSize: 12, textAlign: 'center' },
});
