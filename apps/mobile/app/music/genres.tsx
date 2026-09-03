import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { colors, radius } from '../../src/theme';
import { apiClient } from '../../src/api/client';
import { LoadingState, EmptyState, ErrorState } from '../../src/components/StateContainers';

interface Genre {
  id: string;
  name: string;
  slug: string;
  trackCount: number;
  color?: string;
}

const GENRE_COLORS: Record<string, string> = {
  afrobeats: '#E8420A',
  hiphop: '#8B5CF6',
  rnb: '#EC4899',
  pop: '#3B82F6',
  gospel: '#F59E0B',
  highlife: '#10B981',
  amapiano: '#06B6D4',
  drill: '#EF4444',
  jazz: '#6366F1',
  electronic: '#14B8A6',
};

export default function MusicGenresScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const isDark = colorScheme === 'dark';

  const genresQuery = useQuery({
    queryKey: ['music', 'genres'],
    queryFn: async () => {
      const res = await apiClient.get<Genre[]>('/v1/music/genres');
      return Array.isArray(res) ? res : [];
    },
    staleTime: 300_000,
  });

  const genres = genresQuery.data ?? [];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? colors.bg.primary : '#fff' }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Genres</Text>
        <View style={{ width: 40 }} />
      </View>

      {genresQuery.isLoading ? (
        <LoadingState text="Loading genres..." />
      ) : genresQuery.error ? (
        <ErrorState description={genresQuery.error.message} onRetry={() => genresQuery.refetch()} />
      ) : genres.length === 0 ? (
        <EmptyState icon="🎶" title="No genres" description="Genre browsing coming soon" />
      ) : (
        <FlatList
          data={genres}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.gridRow}
          renderItem={({ item }) => {
            const bgColor = GENRE_COLORS[item.slug] || item.color || colors.primary[500];
            return (
              <TouchableOpacity
                style={[styles.card, { backgroundColor: bgColor + '15' }]}
                onPress={() => router.push(`/music/genres/${item.slug}`)}
                activeOpacity={0.7}
              >
                <Text style={[styles.genreName, { color: bgColor }]}>{item.name}</Text>
                <Text style={styles.trackCount}>{item.trackCount} tracks</Text>
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 40 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.bg.tertiary, alignItems: 'center', justifyContent: 'center' },
  backIcon: { color: colors.text.primary, fontSize: 20 },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  grid: { padding: 16 },
  gridRow: { gap: 12, marginBottom: 12 },
  card: { flex: 1, padding: 20, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', minHeight: 90 },
  genreName: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  trackCount: { fontSize: 12, color: colors.text.tertiary },
});
