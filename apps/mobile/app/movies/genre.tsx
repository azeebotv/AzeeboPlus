import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { colors, radius } from '../../src/theme';
import { apiClient } from '@azeebo/react-data/api/client';
import { LoadingState, EmptyState, ErrorState } from '../../src/components/StateContainers';
import { brand } from '@azeebo/design-tokens';

interface Genre {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  movieCount: number;
}

const GENRE_COLORS: Record<string, string> = {
  action: '#EF4444',
  comedy: '#F59E0B',
  drama: '#8B5CF6',
  horror: '#6B7280',
  romance: '#EC4899',
  scifi: '#3B82F6',
  thriller: '#1E293B',
  documentary: '#10B981',
  animation: '#06B6D4',
  nollywood: brand.flame,
};

export default function MoviesGenreScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const isDark = colorScheme === 'dark';

  const genresQuery = useQuery({
    queryKey: ['movies', 'genres'],
    // GET /v1/genres (movie-service genre controller) → { success, data: [...] }
    // with `_count.movies` per genre.
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; data?: Genre[] }>('/v1/genres');
      const list = Array.isArray(res?.data) ? res.data : [];
      return list.map((g) => ({
        ...g,
        movieCount:
          typeof g.movieCount === 'number'
            ? g.movieCount
            : ((g as unknown as { _count?: { movies?: number } })._count?.movies ?? 0),
      }));
    },
    staleTime: 300_000,
  });

  const genres = genresQuery.data ?? [];

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: isDark ? colors.bg.primary : '#fff' }]}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Browse by Genre</Text>
        <View style={{ width: 40 }} />
      </View>

      {genresQuery.isLoading ? (
        <LoadingState text="Loading genres..." />
      ) : genresQuery.error ? (
        <ErrorState description={genresQuery.error.message} onRetry={() => genresQuery.refetch()} />
      ) : genres.length === 0 ? (
        <EmptyState
          icon="🎬"
          title="No genres yet"
          description="Genres appear as movies are added"
        />
      ) : (
        <FlatList
          data={genres}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const bgColor = GENRE_COLORS[item.slug] || colors.primary[500];
            return (
              <TouchableOpacity
                style={[styles.card, { backgroundColor: bgColor + '15' }]}
                activeOpacity={0.7}
                onPress={() => router.push(`/movies/genres/${encodeURIComponent(item.slug)}`)}
                accessibilityRole="button"
                accessibilityLabel={`Browse ${item.name} movies`}
              >
                <Text style={[styles.genreName, { color: bgColor }]}>{item.name}</Text>
                <Text style={styles.movieCount}>{item.movieCount} movies</Text>
                <Text style={[styles.arrow, { color: bgColor }]}>›</Text>
              </TouchableOpacity>
            );
          }}
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
  card: {
    padding: 20,
    borderRadius: radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  genreName: { fontSize: 17, fontWeight: '700', flex: 1 },
  movieCount: { fontSize: 13, color: colors.text.secondary },
  arrow: { fontSize: 22, fontWeight: '700' },
});
