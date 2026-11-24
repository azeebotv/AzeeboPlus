import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { colors, radius } from '../../../src/theme';
import { apiClient } from '@azeebo/react-data/api/client';
import { extractTracks } from '../../../src/lib/music';
import { LoadingState, EmptyState, ErrorState } from '../../../src/components/StateContainers';

interface GenreDetail {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  trackCount: number;
  totalDuration: number;
  totalPlays: number;
  featured: {
    id: string;
    title: string;
    artistName?: string;
    coverImage?: string;
    playCount?: number;
  }[];
}

/**
 * GET /v1/lifestyle/music/genres/:slug — slug is the slugified genre name;
 * the service aggregates stats and top-3 featured tracks.
 */
export default function GenreDetailScreen() {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const genreSlug = typeof slug === 'string' ? decodeURIComponent(slug) : '';

  const genreQuery = useQuery({
    queryKey: ['music', 'genre', genreSlug],
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; data: GenreDetail }>(
        `/v1/lifestyle/music/genres/${encodeURIComponent(genreSlug)}`
      );
      return res?.data ?? null;
    },
    enabled: genreSlug.length > 0,
    staleTime: 60_000,
  });

  const tracksQuery = useQuery({
    queryKey: ['music', 'genre-tracks', genreSlug],
    queryFn: async () =>
      extractTracks(await apiClient.get(`/v1/lifestyle/music?genre=${encodeURIComponent(genreSlug)}`)),
    enabled: genreSlug.length > 0,
    staleTime: 60_000,
  });

  const genre = genreQuery.data;
  const tracks = tracksQuery.data ?? [];
  const isLoading = genreQuery.isLoading || tracksQuery.isLoading;
  const error = genreQuery.error?.message ?? tracksQuery.error?.message;

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.round((seconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  if (!genreSlug) {
    return (
      <SafeAreaView accessibilityLabel="Screen Screen" style={[styles.container, { backgroundColor: colors.bg.primary }]}>
        <EmptyState icon="🎶" title="Genre not found" description="Invalid genre link" />
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg.primary }]}>
        <LoadingState text="Loading genre..." />
      </SafeAreaView>
    );
  }

  if (error || !genre) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg.primary }]}>
        <ErrorState
          description={error ?? 'Genre not found'}
          onRetry={() => {
            genreQuery.refetch();
            tracksQuery.refetch();
          }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg.primary }]}>
      <View style={styles.header}>
        <TouchableOpacity accessibilityRole="button" style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]} numberOfLines={1}>
          {genre.name}
        </Text>
        <View style={styles.backButton} />
      </View>

      <FlatList
        data={tracks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.hero}>
            <Text style={styles.heroIcon}>🎶</Text>
            <Text style={[styles.heroName, { color: colors.text.primary }]}>{genre.name}</Text>
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={[styles.statValue, { color: colors.text.primary }]}>
                  {genre.trackCount}
                </Text>
                <Text style={styles.statLabel}>tracks</Text>
              </View>
              <View style={styles.stat}>
                <Text style={[styles.statValue, { color: colors.text.primary }]}>
                  {formatDuration(genre.totalDuration)}
                </Text>
                <Text style={styles.statLabel}>total</Text>
              </View>
              <View style={styles.stat}>
                <Text style={[styles.statValue, { color: colors.text.primary }]}>
                  {(genre.totalPlays ?? 0).toLocaleString()}
                </Text>
                <Text style={styles.statLabel}>plays</Text>
              </View>
            </View>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon="🎵"
            title="No tracks yet"
            description="No published tracks in this genre"
          />
        }
        renderItem={({ item, index }) => (
          <TouchableOpacity
            style={[styles.trackCard, { backgroundColor: colors.bg.tertiary }]}
            activeOpacity={0.7}
          >
            <Text style={styles.trackIndex}>{index + 1}</Text>
            <View style={styles.trackInfo}>
              <Text style={[styles.trackTitle, { color: colors.text.primary }]} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.trackArtist} numberOfLines={1}>
                {item.artist}
              </Text>
            </View>
            {item.duration ? (
              <Text style={styles.trackDuration}>
                {`${Math.floor(item.duration / 60)}:${(item.duration % 60).toString().padStart(2, '0')}`}
              </Text>
            ) : null}
          </TouchableOpacity>
        )}
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
  headerTitle: { fontSize: 18, fontWeight: '700', flex: 1, textAlign: 'center' },
  list: { padding: 16, paddingBottom: 40 },
  hero: { alignItems: 'center', marginBottom: 24 },
  heroIcon: { fontSize: 40, marginBottom: 8 },
  heroName: { fontSize: 22, fontWeight: '800', marginBottom: 12, textTransform: 'capitalize' },
  statsRow: { flexDirection: 'row', gap: 32 },
  stat: { alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '700' },
  statLabel: { fontSize: 12, color: colors.text.tertiary },
  trackCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: radius.md,
    gap: 12,
    marginBottom: 8,
  },
  trackIndex: { width: 24, textAlign: 'center', color: colors.text.tertiary, fontWeight: '600' },
  trackInfo: { flex: 1 },
  trackTitle: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  trackArtist: { fontSize: 12, color: colors.text.tertiary },
  trackDuration: { fontSize: 12, color: colors.text.tertiary },
});
