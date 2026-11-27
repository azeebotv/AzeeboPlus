import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { useColorScheme } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { colors, radius } from '../../../src/theme';
import { apiClient } from '@azeebo/react-data/api/client';
import { LoadingState, EmptyState, ErrorState } from '../../../src/components/StateContainers';

interface Genre {
  id: string;
  name: string;
  slug: string;
}

interface GenreMovie {
  id: string;
  title: string;
  thumbnail?: string | null;
  description?: string | null;
}

export default function GenreDetailScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const isDark = colorScheme === 'dark';
  const { slug } = useLocalSearchParams<{ slug: string }>();

  const [page, setPage] = useState(1);

  const genreQuery = useQuery({
    queryKey: ['genre', slug],
    enabled: !!slug,
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; data?: Genre }>(
        `/v1/genres/slug/${encodeURIComponent(String(slug))}`
      );
      return res?.data ?? null;
    },
  });

  const moviesQuery = useQuery({
    queryKey: ['genre', slug, 'movies', page],
    enabled: !!genreQuery.data?.id,
    queryFn: async () => {
      const res = await apiClient.get<{
        success: boolean;
        data?: GenreMovie[];
        meta?: { total: number; totalPages: number };
      }>(`/v1/genres/${genreQuery.data?.id}/movies?page=${page}&limit=20`);
      return {
        items: Array.isArray(res?.data) ? res.data : [],
        totalPages: res?.meta?.totalPages ?? 1,
      };
    },
  });

  const movies = moviesQuery.data?.items ?? [];
  const hasMore = page < (moviesQuery.data?.totalPages ?? 1);

  const renderMovie = ({ item }: { item: GenreMovie }) => (
    <TouchableOpacity
      style={[styles.movieCard, { backgroundColor: isDark ? colors.bg.tertiary : '#f5f5f5' }]}
      activeOpacity={0.7}
      onPress={() => router.push(`/movies/${item.id}`)}
      accessibilityRole="button"
      accessibilityLabel={`Watch ${item.title}`}
    >
      <View style={styles.thumbWrap}>
        {item.thumbnail ? (
          <Image source={{ uri: item.thumbnail }} style={styles.thumb} resizeMode="cover" />
        ) : (
          <View style={[styles.thumb, styles.thumbFallback]}>
            <Text style={styles.thumbEmoji}>🎬</Text>
          </View>
        )}
      </View>
      <View style={styles.movieInfo}>
        <Text style={[styles.movieTitle, { color: colors.text.primary }]} numberOfLines={2}>
          {item.title}
        </Text>
        {item.description ? (
          <Text style={styles.movieDesc} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}
      </View>
      <Text style={[styles.arrow, { color: colors.text.secondary }]}>›</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: isDark ? colors.bg.primary : '#fff' }]}
    >
      <View style={styles.header}>
        <TouchableOpacity accessibilityRole="button" style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]} numberOfLines={1}>
          {genreQuery.data?.name ?? 'Genre'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {genreQuery.isLoading || moviesQuery.isLoading ? (
        <LoadingState text="Loading movies..." />
      ) : genreQuery.error || moviesQuery.error ? (
        <ErrorState
          description={
            (genreQuery.error ?? moviesQuery.error)?.message ?? 'Failed to load this genre'
          }
          onRetry={() => {
            genreQuery.refetch();
            moviesQuery.refetch();
          }}
        />
      ) : movies.length === 0 ? (
        <EmptyState
          icon="🎬"
          title="Nothing here yet"
          description={`No ${genreQuery.data?.name ?? 'genre'} movies have been added`}
        />
      ) : (
        <FlatList
          data={movies}
          keyExtractor={(item) => item.id}
          renderItem={renderMovie}
          contentContainerStyle={styles.list}
          onEndReachedThreshold={0.5}
          onEndReached={() => {
            if (hasMore && !moviesQuery.isFetching) setPage((p) => p + 1);
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
  headerTitle: { fontSize: 20, fontWeight: '700', flex: 1, textAlign: 'center' },
  list: { padding: 16, gap: 12 },
  movieCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: radius.lg,
    gap: 12,
  },
  thumbWrap: { width: 84, height: 56, borderRadius: 8, overflow: 'hidden' },
  thumb: { width: '100%', height: '100%' },
  thumbFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg.tertiary,
  },
  thumbEmoji: { fontSize: 22 },
  movieInfo: { flex: 1 },
  movieTitle: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  movieDesc: { fontSize: 12, color: colors.text.tertiary },
  arrow: { fontSize: 22 },
});
