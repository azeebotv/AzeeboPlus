import { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { colors } from '../../src/theme';
import { apiClient } from '../../src/api/client';
import { LoadingState, EmptyState, ErrorState } from '../../src/components/StateContainers';
import { ApiResponse } from '../../src/types/api';
import { analytics } from '../../src/utils/analytics';

interface CrossoverItem {
  id: string;
  title: string;
  description: string;
  involvedTitles: { id: string; title: string; emoji: string }[];
  status: string;
  episodes: number;
}

type ListResponse<T> = T[] | ApiResponse<T[]>;

export default function CrossoversScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const isDark = colorScheme === 'dark';

  const crossoversQuery = useQuery({
    queryKey: ['vertical', 'crossovers'],
    queryFn: async () => {
      const res = await apiClient.get<ListResponse<CrossoverItem>>('/v1/vertical/crossovers');
      return Array.isArray(res) ? res : (res?.data ?? []);
    },
    staleTime: 60_000,
  });

  useEffect(() => {
    if (crossoversQuery.isSuccess && !crossoversQuery.isFetching) {
      try {
        analytics.verticalUniverseViewed('crossovers');
      } catch {}
    }
  }, [crossoversQuery.isSuccess, crossoversQuery.isFetching]);

  const crossovers = crossoversQuery.data ?? [];

  if (crossoversQuery.isLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: isDark ? colors.bg.primary : '#fff' }]}
      >
        <LoadingState text="Loading crossovers..." />
      </SafeAreaView>
    );
  }

  if (crossoversQuery.error) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: isDark ? colors.bg.primary : '#fff' }]}
      >
        <ErrorState
          description={crossoversQuery.error.message}
          onRetry={() => crossoversQuery.refetch()}
        />
      </SafeAreaView>
    );
  }

  if (!crossovers.length) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: isDark ? colors.bg.primary : '#fff' }]}
      >
        <EmptyState
          icon="🎬"
          title="No crossovers"
          description="Check back later for crossover events"
        />
      </SafeAreaView>
    );
  }

  const renderItem = ({ item }: { item: CrossoverItem }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: isDark ? colors.bg.tertiary : '#f5f5f5' }]}
      onPress={() => router.push(`/vertical/crossover-detail?id=${item.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      <Text
        style={[styles.cardDesc, { color: isDark ? colors.text.secondary : '#666' }]}
        numberOfLines={2}
      >
        {item.description}
      </Text>
      <View style={styles.titlesRow}>
        {item.involvedTitles.map((t) => (
          <View key={t.id} style={styles.titleChip}>
            <Text style={styles.titleChipEmoji}>{t.emoji}</Text>
            <Text style={styles.titleChipText}>{t.title}</Text>
          </View>
        ))}
      </View>
      <View style={styles.cardFooter}>
        <Text style={styles.episodeCount}>{item.episodes} Episodes</Text>
        <Text style={styles.seeMore}>View →</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: isDark ? colors.bg.primary : '#fff' }]}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Crossovers</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={crossovers}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 40,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bg.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { color: colors.text.primary, fontSize: 20 },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  list: { padding: 16, gap: 16 },
  card: {
    borderRadius: 16,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: { fontSize: 18, fontWeight: '700', color: colors.text.primary, flex: 1 },
  statusBadge: {
    backgroundColor: colors.primary[500] + '30',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: { fontSize: 11, fontWeight: '600', color: colors.primary[500] },
  cardDesc: { fontSize: 14, lineHeight: 20, marginBottom: 12 },
  titlesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  titleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.surface,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  titleChipEmoji: { fontSize: 14 },
  titleChipText: { fontSize: 12, fontWeight: '600', color: colors.text.primary },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  episodeCount: { fontSize: 12, color: colors.text.secondary },
  seeMore: { fontSize: 13, fontWeight: '600', color: colors.primary[500] },
});
