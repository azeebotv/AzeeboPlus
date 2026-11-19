import { StyleSheet, Text, View, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { colors } from '../../src/theme';
import { lifestyleApi } from '@azeebo/react-data/api/lifestyle';
import { extractTracks } from '../../src/lib/music';
import { LoadingState, EmptyState, ErrorState } from '../../src/components/StateContainers';

export default function MusicTrendingScreen() {
  const router = useRouter();

  const trendingQuery = useQuery({
    queryKey: ['lifestyle', 'music', 'trending'],
    queryFn: async () => {
      const res = await lifestyleApi.getTrendingTracks();
      return extractTracks(res);
    },
    staleTime: 60_000,
  });

  const tracks = trendingQuery.data ?? [];

  return (
    <SafeAreaView accessibilityLabel="Trending Screen" style={[styles.container, { backgroundColor: colors.bg.primary }]}>
      <View style={styles.header}>
        <TouchableOpacity accessibilityRole="button" style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>🔥 Trending</Text>
        <View style={styles.backButton} />
      </View>

      {trendingQuery.isLoading ? (
        <LoadingState text="Loading trending..." />
      ) : trendingQuery.error ? (
        <ErrorState
          description={trendingQuery.error?.message ?? 'Failed to load trending tracks'}
          onRetry={() => trendingQuery.refetch()}
        />
      ) : tracks.length === 0 ? (
        <EmptyState
          icon="🔥"
          title="No trending tracks"
          description="Check back later for what's hot"
        />
      ) : (
        <FlatList
          data={tracks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              style={[styles.card, { backgroundColor: colors.bg.tertiary }]}
              activeOpacity={0.7}
              onPress={() =>
                item.artistId
                  ? router.push(`/music/${encodeURIComponent(item.artistId)}`)
                  : router.push('/music')
              }
              accessibilityRole="button"
              accessibilityLabel={`${item.title} by ${item.artist}`}
            >
              <View style={styles.rankContainer}>
                <Text style={[styles.rank, index < 3 && styles.rankTop]}>{index + 1}</Text>
                {index < 3 && <Text style={styles.fireIcon}>🔥</Text>}
              </View>
              <View style={styles.info}>
                <Text style={[styles.title, { color: colors.text.primary }]} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.artist} numberOfLines={1}>
                  {item.artist}
                </Text>
              </View>
              <Text style={styles.plays}>{(item.playCount ?? 0).toLocaleString()} plays</Text>
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
    paddingTop: 12,
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
  list: { padding: 16, gap: 10 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    gap: 12,
  },
  rankContainer: { width: 44, alignItems: 'center', gap: 2 },
  rank: { fontSize: 18, fontWeight: '700', color: colors.text.tertiary },
  rankTop: { color: colors.primary[500] },
  fireIcon: { fontSize: 12 },
  info: { flex: 1 },
  title: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  artist: { fontSize: 12, color: colors.text.tertiary },
  plays: { fontSize: 12, color: colors.text.secondary },
});
