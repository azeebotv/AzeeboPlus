import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LoadingState, EmptyState, ErrorState } from '../../src/components/StateContainers';
import { userApi } from '@azeebo/react-data/api/user';
import { contentApi } from '@azeebo/react-data';
import { logger } from '@azeebo/react-data/utils/logger';
import { colors } from '../../src/theme';

interface WatchlistMovie {
  id: string;
  title: string;
  genre: string;
  rating: string;
  year: string;
  emoji: string;
}

type SortOption = 'recent' | 'rating' | 'title';

export default function WatchlistScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const isDark = colorScheme === 'dark';
  const [sortBy, setSortBy] = useState<SortOption>('recent');

  const savedQuery = useQuery({
    queryKey: ['user', 'saved'],
    queryFn: async () => {
      const res = await userApi.getSavedItems(1, 100);
      if (res.success && res.data) {
        return res.data.items.map((item) => ({
          id: item.contentId,
          title: item.title,
          thumbnail: item.thumbnail,
          savedAt: item.savedAt,
        }));
      }
      return [];
    },
    staleTime: 30000,
  });

  const watchlistQuery = useQuery({
    queryKey: ['watchlist', 'content', savedQuery.data],
    queryFn: async () => {
      const savedItems = savedQuery.data ?? [];
      if (savedItems.length === 0) return [];
      const results = await Promise.all(
        savedItems.map(async (item) => {
          try {
            const res = await contentApi.getContentById(item.id);
            if (res.success && res.data) {
              return {
                id: res.data.id,
                title: res.data.title,
                genre: res.data.universe?.name || 'General',
                rating: '8.5',
                year: new Date(res.data.createdAt).getFullYear().toString(),
                emoji: '🎬',
              } as WatchlistMovie;
            }
          } catch {
            logger.warn('Failed to fetch watchlist content');
          }
          return null;
        })
      );
      return results.filter(Boolean) as WatchlistMovie[];
    },
    enabled: (savedQuery.data ?? []).length > 0,
    staleTime: 30000,
  });

  const unsaveMutation = useMutation({
    mutationFn: (contentId: string) => userApi.unsaveItem(contentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'saved'] });
    },
  });

  const handleRemove = useCallback(
    (movie: WatchlistMovie) => {
      Alert.alert('Remove', `Remove "${movie.title}" from watchlist?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            unsaveMutation.mutate(movie.id, {
              onError: () => {
                Alert.alert('Error', 'Failed to remove from watchlist');
              },
            });
          },
        },
      ]);
    },
    [unsaveMutation]
  );

  const isLoading = savedQuery.isLoading || watchlistQuery.isLoading;
  const error = savedQuery.error?.message || watchlistQuery.error?.message;
  let movies = watchlistQuery.data ?? [];

  if (sortBy === 'rating')
    movies = [...movies].sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));
  if (sortBy === 'title') movies = [...movies].sort((a, b) => a.title.localeCompare(b.title));

  if (isLoading)
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#1A0A0A' : '#ffffff' }]}>
        <LoadingState text="Loading watchlist..." />
      </SafeAreaView>
    );
  if (error)
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#1A0A0A' : '#ffffff' }]}>
        <ErrorState
          description={error}
          onRetry={() => {
            savedQuery.refetch();
            watchlistQuery.refetch();
          }}
        />
      </SafeAreaView>
    );
  if (!movies.length)
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#1A0A0A' : '#ffffff' }]}>
        <EmptyState icon="🎬" title="Empty watchlist" description="Save movies to watch later" />
      </SafeAreaView>
    );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#1A0A0A' : '#ffffff' }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: isDark ? '#ffffff' : '#1A0A0A' }]}>
          Watchlist
        </Text>
      </View>

      <View style={styles.sortBar}>
        {(['recent', 'rating', 'title'] as const).map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.sortChip, sortBy === s && styles.sortChipActive]}
            onPress={() => setSortBy(s)}
          >
            <Text style={[styles.sortText, sortBy === s && styles.sortTextActive]}>
              {s === 'recent' ? '🕐 Recent' : s === 'rating' ? '⭐ Top Rated' : '📝 A-Z'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={movies}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.movieCard, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}
            onPress={() => router.push(`/movies/${item.id}`)}
          >
            <View style={styles.movieThumb}>
              <Text style={styles.movieEmoji}>{item.emoji}</Text>
              <View style={styles.ratingBadge}>
                <Text style={styles.ratingText}>⭐ {item.rating}</Text>
              </View>
            </View>
            <View style={styles.movieInfo}>
              <Text
                style={[styles.movieTitle, { color: isDark ? '#fff' : '#000' }]}
                numberOfLines={1}
              >
                {item.title}
              </Text>
              <Text style={styles.movieGenre}>
                {item.genre} • {item.year}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => handleRemove(item)}
              disabled={unsaveMutation.isPending}
            >
              <Text style={styles.removeIcon}>✕</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingTop: 50, gap: 12 },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bg.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { color: '#fff', fontSize: 20 },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  sortBar: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 16, gap: 10 },
  sortChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
  },
  sortChipActive: { backgroundColor: colors.category.highlight },
  sortText: { color: colors.text.secondary, fontSize: 12, fontWeight: '600' },
  sortTextActive: { color: '#000' },
  listContent: { paddingHorizontal: 16, paddingBottom: 30 },
  movieCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  movieThumb: {
    width: 60,
    height: 80,
    borderRadius: 8,
    backgroundColor: colors.bg.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    position: 'relative',
  },
  movieEmoji: { fontSize: 30 },
  ratingBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ratingText: { color: colors.category.highlight, fontSize: 10, fontWeight: '600' },
  movieInfo: { flex: 1 },
  movieTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  movieGenre: { color: colors.text.secondary, fontSize: 12 },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.bg.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeIcon: { color: colors.text.secondary, fontSize: 14 },
});
