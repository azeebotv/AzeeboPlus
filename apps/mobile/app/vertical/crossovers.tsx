import { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { colors, radius } from '../../src/theme';
import { apiClient } from '@azeebo/react-data/api/client';
import { LoadingState, EmptyState, ErrorState } from '../../src/components/StateContainers';
import { analytics } from '../../src/utils/analytics';

interface Crossover {
  id: string;
  title: string;
  description: string;
  universeA: string;
  universeB: string;
  status: string;
}

export default function CrossoversListScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const isDark = colorScheme === 'dark';

  const crossoversQuery = useQuery({
    queryKey: ['vertical', 'crossovers'],
    queryFn: async () => {
      const res = await apiClient.get<Crossover[]>('/v1/vertical/crossovers');
      return Array.isArray(res) ? res : [];
    },
    staleTime: 60_000,
  });

  useEffect(() => {
    analytics.lifestyleFeedViewed();
  }, []);

  const crossovers = crossoversQuery.data ?? [];

  const renderItem = ({ item }: { item: Crossover }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: isDark ? colors.bg.tertiary : '#f5f5f5' }]}
      onPress={() => router.push(`/vertical/crossover-detail?id=${item.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardIcon}>🔀</Text>
        <View style={styles.cardInfo}>
          <Text style={[styles.cardTitle, { color: colors.text.primary }]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.cardUniverses}>
            {item.universeA} ↔ {item.universeB}
          </Text>
        </View>
        <View style={[styles.statusBadge, item.status === 'active' && styles.statusActive]}>
          <Text style={[styles.statusText, item.status === 'active' && styles.statusTextActive]}>
            {item.status}
          </Text>
        </View>
      </View>
      <Text
        style={[styles.cardDesc, { color: isDark ? colors.text.secondary : '#666' }]}
        numberOfLines={2}
      >
        {item.description}
      </Text>
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

      {crossoversQuery.isLoading ? (
        <LoadingState text="Loading crossovers..." />
      ) : crossoversQuery.error ? (
        <ErrorState
          description={crossoversQuery.error.message}
          onRetry={() => crossoversQuery.refetch()}
        />
      ) : crossovers.length === 0 ? (
        <EmptyState
          icon="🔀"
          title="No crossovers"
          description="Cross-universe events coming soon"
        />
      ) : (
        <FlatList
          data={crossovers}
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
  list: { padding: 16, gap: 12 },
  card: { padding: 16, borderRadius: radius.lg },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  cardIcon: { fontSize: 28 },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  cardUniverses: { fontSize: 12, color: colors.primary[500], fontWeight: '600' },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: colors.bg.tertiary,
  },
  statusActive: { backgroundColor: colors.alpha.success25 },
  statusText: { fontSize: 11, fontWeight: '600', color: colors.text.tertiary },
  statusTextActive: { color: '#22C55E' },
  cardDesc: { fontSize: 13, lineHeight: 20 },
});
