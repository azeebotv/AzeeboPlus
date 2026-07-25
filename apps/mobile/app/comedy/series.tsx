import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { LoadingState, EmptyState, ErrorState } from '../../src/components/StateContainers';
import { apiClient } from '../../src/api/client';
import { ApiResponse } from '../../src/types/api';

type ListResponse<T> = T[] | ApiResponse<T[]>;

interface ComedySeries {
  id: string;
  title: string;
  episodes: number;
  season: number;
  nextEpisode: string;
  genre: string;
  emoji: string;
}

const GENRES = ['All', 'Stand-up Series', 'Sketch Show', 'Improv Hour', 'Comedy Talk'];

export default function SeriesScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const isDark = colorScheme === 'dark';
  const [selectedGenre, setSelectedGenre] = useState('All');

  const seriesQuery = useQuery({
    queryKey: ['comedy', 'series', selectedGenre],
    queryFn: async () => {
      const res = await apiClient.get<ListResponse<ComedySeries>>('/v1/comedy/series');
      return Array.isArray(res) ? res : (res?.data ?? []);
    },
    staleTime: 60_000,
  });

  const isLoading = seriesQuery.isLoading;
  const error = seriesQuery.error?.message;
  const allSeries = seriesQuery.data ?? [];
  const series =
    selectedGenre === 'All' ? allSeries : allSeries.filter((s) => s.genre === selectedGenre);

  if (isLoading)
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#1A0A0A' : '#ffffff' }]}>
        <LoadingState text="Loading series..." />
      </SafeAreaView>
    );
  if (error)
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#1A0A0A' : '#ffffff' }]}>
        <ErrorState description={error} onRetry={() => seriesQuery.refetch()} />
      </SafeAreaView>
    );
  if (!series.length)
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#1A0A0A' : '#ffffff' }]}>
        <EmptyState icon="📺" title="No series" description="Check back for comedy series" />
      </SafeAreaView>
    );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#1A0A0A' : '#ffffff' }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: isDark ? '#ffffff' : '#1A0A0A' }]}>Series</Text>
      </View>

      <FlatList
        horizontal
        data={GENRES}
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.genreBar}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.genreChip, selectedGenre === item && styles.genreChipActive]}
            onPress={() => setSelectedGenre(item)}
          >
            <Text style={[styles.genreText, selectedGenre === item && styles.genreTextActive]}>
              {item}
            </Text>
          </TouchableOpacity>
        )}
      />

      <FlatList
        data={series}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.seriesCard, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}
          >
            <View style={styles.seriesThumb}>
              <Text style={styles.seriesEmoji}>{item.emoji}</Text>
              <View style={styles.episodeBadge}>
                <Text style={styles.episodeText}>
                  S{item.season} • {item.episodes} eps
                </Text>
              </View>
            </View>
            <View style={styles.seriesInfo}>
              <Text style={[styles.seriesTitle, { color: isDark ? '#fff' : '#000' }]}>
                {item.title}
              </Text>
              <Text style={styles.seriesGenre}>{item.genre}</Text>
              <View style={styles.nextEpisodeRow}>
                <Text style={styles.nextLabel}>Next:</Text>
                <Text style={styles.nextTime}>{item.nextEpisode}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.watchButton}>
              <Text style={styles.watchButtonText}>▶ Watch</Text>
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
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { color: '#fff', fontSize: 20 },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  genreBar: { paddingHorizontal: 16, paddingBottom: 16, gap: 10 },
  genreChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    marginRight: 10,
  },
  genreChipActive: { backgroundColor: '#F39C12' },
  genreText: { color: '#888', fontSize: 13, fontWeight: '600' },
  genreTextActive: { color: '#000' },
  listContent: { paddingHorizontal: 16, paddingBottom: 30 },
  seriesCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  seriesThumb: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    position: 'relative',
  },
  seriesEmoji: { fontSize: 36 },
  episodeBadge: {
    position: 'absolute',
    bottom: 4,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  episodeText: { color: '#fff', fontSize: 9 },
  seriesInfo: { flex: 1 },
  seriesTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  seriesGenre: { color: '#888', fontSize: 12, marginBottom: 6 },
  nextEpisodeRow: { flexDirection: 'row', gap: 6 },
  nextLabel: { color: '#888', fontSize: 12 },
  nextTime: { color: '#F39C12', fontSize: 12, fontWeight: '600' },
  watchButton: {
    backgroundColor: '#F39C12',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  watchButtonText: { color: '#000', fontSize: 12, fontWeight: '600' },
});
