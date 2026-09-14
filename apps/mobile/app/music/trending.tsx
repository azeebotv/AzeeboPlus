import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { colors, radius } from '../../src/theme';
import { apiClient } from '../../src/api/client';
import { LoadingState, EmptyState, ErrorState } from '../../src/components/StateContainers';

interface TrendingTrack {
  id: string;
  title: string;
  artist: string;
  rank: number;
  change: number; // positive = moved up, negative = moved down
  playCount: number;
}

export default function MusicTrendingScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const isDark = colorScheme === 'dark';

  const trendingQuery = useQuery({
    queryKey: ['music', 'trending'],
    queryFn: async () => {
      const res = await apiClient.get<TrendingTrack[]>('/v1/music/trending');
      return Array.isArray(res) ? res : [];
    },
    staleTime: 60_000,
  });

  const tracks = trendingQuery.data ?? [];

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: isDark ? colors.bg.primary : '#fff' }]}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>🔥 Trending</Text>
        <View style={{ width: 40 }} />
      </View>

      {trendingQuery.isLoading ? (
        <LoadingState text="Loading trending..." />
      ) : trendingQuery.error ? (
        <ErrorState
          description={trendingQuery.error.message}
          onRetry={() => trendingQuery.refetch()}
        />
      ) : tracks.length === 0 ? (
        <EmptyState icon="🔥" title="No trending tracks" description="Trending data coming soon" />
      ) : (
        <FlatList
          data={tracks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.card, { backgroundColor: isDark ? colors.bg.tertiary : '#f5f5f5' }]}
              activeOpacity={0.7}
            >
              <View style={styles.rankContainer}>
                <Text style={[styles.rank, item.rank <= 3 && styles.rankTop]}>{item.rank}</Text>
                {item.change > 0 && <Text style={styles.upArrow}>▲{item.change}</Text>}
                {item.change < 0 && <Text style={styles.downArrow}>▼{Math.abs(item.change)}</Text>}
                {item.change === 0 && <Text style={styles.same}>—</Text>}
              </View>
              <View style={styles.info}>
                <Text style={[styles.title, { color: colors.text.primary }]} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.artist} numberOfLines={1}>
                  {item.artist}
                </Text>
              </View>
              <Text style={styles.plays}>{(item.playCount / 1000).toFixed(0)}K</Text>
            </TouchableOpacity>
          )}
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
  list: { padding: 16, gap: 4 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: radius.md,
    gap: 12,
  },
  rankContainer: { width: 48, alignItems: 'center' },
  rank: { fontSize: 16, fontWeight: '700', color: colors.text.tertiary },
  rankTop: { color: '#F59E0B' },
  upArrow: { fontSize: 10, color: '#10B981', fontWeight: '600' },
  downArrow: { fontSize: 10, color: '#EF4444', fontWeight: '600' },
  same: { fontSize: 10, color: colors.text.tertiary },
  info: { flex: 1 },
  title: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  artist: { fontSize: 12, color: colors.text.tertiary },
  plays: { fontSize: 12, color: colors.text.tertiary, width: 48, textAlign: 'right' },
});
