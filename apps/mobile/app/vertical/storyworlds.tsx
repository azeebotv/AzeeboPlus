import { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { colors, radius } from '../../src/theme';
import { apiClient } from '../../src/api/client';
import { LoadingState, EmptyState, ErrorState } from '../../src/components/StateContainers';
import { analytics } from '../../src/utils/analytics';

interface Storyworld {
  id: string;
  name: string;
  description: string;
  titleCount: number;
  characterCount: number;
}

export default function StoryworldsListScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const isDark = colorScheme === 'dark';

  const storyworldsQuery = useQuery({
    queryKey: ['vertical', 'storyworlds'],
    queryFn: async () => {
      const res = await apiClient.get<Storyworld[]>('/v1/vertical/storyworlds');
      return Array.isArray(res) ? res : [];
    },
    staleTime: 60_000,
  });

  useEffect(() => {
    analytics.lifestyleFeedViewed();
  }, []);

  const storyworlds = storyworldsQuery.data ?? [];

  const renderItem = ({ item }: { item: Storyworld }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: isDark ? colors.bg.tertiary : '#f5f5f5' }]}
      onPress={() => router.push(`/vertical/storyworld?id=${item.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardIcon}>🌍</Text>
        <View style={styles.cardInfo}>
          <Text style={[styles.cardName, { color: colors.text.primary }]} numberOfLines={1}>{item.name}</Text>
          <Text style={[styles.cardDesc, { color: isDark ? colors.text.secondary : '#666' }]} numberOfLines={2}>
            {item.description}
          </Text>
        </View>
        <Text style={[styles.arrow, { color: colors.text.secondary }]}>›</Text>
      </View>
      <View style={styles.cardMeta}>
        <Text style={styles.metaText}>📖 {item.titleCount} titles</Text>
        <Text style={styles.metaText}>🧑 {item.characterCount} characters</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? colors.bg.primary : '#fff' }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Storyworlds</Text>
        <View style={{ width: 40 }} />
      </View>

      {storyworldsQuery.isLoading ? (
        <LoadingState text="Loading storyworlds..." />
      ) : storyworldsQuery.error ? (
        <ErrorState description={storyworldsQuery.error.message} onRetry={() => storyworldsQuery.refetch()} />
      ) : storyworlds.length === 0 ? (
        <EmptyState icon="🌍" title="No storyworlds" description="Discover connected worlds" />
      ) : (
        <FlatList
          data={storyworlds}
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 40 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.bg.tertiary, alignItems: 'center', justifyContent: 'center' },
  backIcon: { color: colors.text.primary, fontSize: 20 },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  list: { padding: 16, gap: 12 },
  card: { padding: 16, borderRadius: radius.lg },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  cardIcon: { fontSize: 28 },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  cardDesc: { fontSize: 13, lineHeight: 20 },
  arrow: { fontSize: 24 },
  cardMeta: { flexDirection: 'row', gap: 16 },
  metaText: { fontSize: 12, color: colors.text.tertiary },
});
