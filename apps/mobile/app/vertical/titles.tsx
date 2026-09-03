import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { colors, radius } from '../../src/theme';
import { apiClient } from '../../src/api/client';
import { LoadingState, EmptyState, ErrorState } from '../../src/components/StateContainers';
import { analytics } from '../../src/utils/analytics';

interface Title {
  id: string;
  title: string;
  genre: string;
  status: string;
  emoji: string;
  characterCount: number;
  episodeCount: number;
}

export default function TitlesListScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const isDark = colorScheme === 'dark';
  const [filter, setFilter] = useState<string>('all');

  const titlesQuery = useQuery({
    queryKey: ['vertical', 'titles', filter],
    queryFn: async () => {
      const endpoint = filter === 'all'
        ? '/v1/vertical/titles'
        : `/v1/vertical/titles?status=${filter}`;
      const res = await apiClient.get<Title[]>(endpoint);
      return Array.isArray(res) ? res : [];
    },
    staleTime: 60_000,
  });

  useEffect(() => {
    analytics.lifestyleFeedViewed();
  }, []);

  const titles = titlesQuery.data ?? [];
  const filters = ['all', 'active', 'completed', 'upcoming'];

  const renderItem = ({ item }: { item: Title }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: isDark ? colors.bg.tertiary : '#f5f5f5' }]}
      onPress={() => router.push(`/vertical-title?id=${item.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.cardIcon}>
        <Text style={styles.cardIconText}>{item.emoji}</Text>
      </View>
      <View style={styles.cardInfo}>
        <Text style={[styles.cardTitle, { color: colors.text.primary }]} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.cardMeta}>
          {item.genre} • {item.characterCount} characters • {item.episodeCount} episodes
        </Text>
      </View>
      <View style={[styles.statusBadge, item.status === 'active' && styles.statusActive]}>
        <Text style={[styles.statusText, item.status === 'active' && styles.statusTextActive]}>
          {item.status}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? colors.bg.primary : '#fff' }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Titles</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.filterBar}>
        {filters.map((f) => (
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
      </View>

      {titlesQuery.isLoading ? (
        <LoadingState text="Loading titles..." />
      ) : titlesQuery.error ? (
        <ErrorState description={titlesQuery.error.message} onRetry={() => titlesQuery.refetch()} />
      ) : titles.length === 0 ? (
        <EmptyState icon="📖" title="No titles found" description="Check back later" />
      ) : (
        <FlatList
          data={titles}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, paddingTop: 40,
  },
  backButton: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.bg.tertiary, alignItems: 'center', justifyContent: 'center',
  },
  backIcon: { color: colors.text.primary, fontSize: 20 },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  filterBar: {
    flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 12, gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: colors.bg.tertiary,
  },
  filterChipActive: { backgroundColor: colors.primary[500] },
  filterText: { color: colors.text.secondary, fontSize: 13, fontWeight: '500' },
  filterTextActive: { color: '#fff' },
  list: { padding: 16, gap: 12 },
  card: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: radius.lg, gap: 12 },
  cardIcon: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: colors.primary[500] + '20', alignItems: 'center', justifyContent: 'center',
  },
  cardIconText: { fontSize: 22 },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  cardMeta: { fontSize: 12, color: colors.text.tertiary },
  statusBadge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
    backgroundColor: colors.bg.tertiary,
  },
  statusActive: { backgroundColor: '#22C55E25' },
  statusText: { fontSize: 11, fontWeight: '600', color: colors.text.tertiary },
  statusTextActive: { color: '#22C55E' },
});
