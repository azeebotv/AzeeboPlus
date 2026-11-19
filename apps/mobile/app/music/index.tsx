import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';

import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { colors } from '../../src/theme';
import { LoadingState, EmptyState, ErrorState } from '../../src/components/StateContainers';
import { lifestyleApi } from '@azeebo/react-data/api/lifestyle';
import { extractTracks, extractGenres, NormalizedTrack, NormalizedGenre } from '../../src/lib/music';

export default function MusicScreen() {
  const router = useRouter();
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [playingId, setPlayingId] = useState<string | null>(null);

  const tracksQuery = useQuery({
    queryKey: ['lifestyle', 'music', selectedGenre],
    queryFn: async () => extractTracks(await lifestyleApi.getTracks(selectedGenre)),
    staleTime: 60_000,
  });

  const trendingQuery = useQuery({
    queryKey: ['lifestyle', 'music', 'trending'],
    queryFn: async () => extractTracks(await lifestyleApi.getTrendingTracks()),
    staleTime: 60_000,
  });

  const genresQuery = useQuery({
    queryKey: ['lifestyle', 'music', 'genres'],
    queryFn: async () => extractGenres(await lifestyleApi.getGenres()),
    staleTime: 60_000,
  });

  const tracks = tracksQuery.data ?? [];
  const trendingTracks = trendingQuery.data ?? [];
  const genres = genresQuery.data ?? [];
  const isLoading = tracksQuery.isLoading || trendingQuery.isLoading;
  const error = tracksQuery.error?.message || trendingQuery.error?.message;

  const handleRefresh = useCallback(() => {
    tracksQuery.refetch();
    trendingQuery.refetch();
  }, [tracksQuery, trendingQuery]);

  const togglePlay = useCallback((trackId: string) => {
    setPlayingId((prev) => (prev === trackId ? null : trackId));
  }, []);

  const renderTrack = ({ item }: { item: NormalizedTrack }) => (
    <TouchableOpacity
      style={[styles.trackCard, { backgroundColor: colors.bg.tertiary }]}
      onPress={() => togglePlay(item.id)}
      activeOpacity={0.7}
    >
      <Image
        source={{ uri: item.thumbnail || 'https://placehold.co/80x80/1a1a1a/ffffff?text=♪' }}
        style={styles.trackCover}
        resizeMode="cover"
      />
      {playingId === item.id && <View style={styles.playingIndicator} />}
      <View style={styles.trackInfo}>
        <Text style={[styles.trackTitle, { color: colors.text.primary }]} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={[styles.trackArtist, { color: colors.text.secondary }]} numberOfLines={1}>
          {item.artist}
        </Text>
        <View style={styles.trackMeta}>
          <View style={styles.genreBadge}>
            <Text style={styles.genreText}>{item.genre}</Text>
          </View>
          <Text style={styles.trackDuration}>{item.duration}</Text>
        </View>
      </View>
      <TouchableOpacity accessibilityRole="button" style={styles.playButton} onPress={() => togglePlay(item.id)}>
        <Text style={styles.playIcon}>{playingId === item.id ? '⏸' : '▶'}</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderTrendingTrack = ({ item, index }: { item: NormalizedTrack; index: number }) => (
    <TouchableOpacity
      style={[styles.trendingCard, { backgroundColor: colors.bg.tertiary }]}
      onPress={() => togglePlay(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.trendingRank}>
        <Text style={styles.rankText}>{index + 1}</Text>
      </View>
      <Image
        source={{ uri: item.thumbnail || 'https://placehold.co/60x60/1a1a1a/ffffff?text=♪' }}
        style={styles.trendingCover}
        resizeMode="cover"
      />
      <View style={styles.trendingInfo}>
        <Text style={[styles.trendingTitle, { color: colors.text.primary }]} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={[styles.trendingArtist, { color: colors.text.secondary }]} numberOfLines={1}>
          {item.artist}
        </Text>
      </View>
      <TouchableOpacity accessibilityRole="button" style={styles.playButtonSmall} onPress={() => togglePlay(item.id)}>
        <Text style={styles.playIconSmall}>{playingId === item.id ? '⏸' : '▶'}</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const genresWithAll: NormalizedGenre[] = [
    { id: 'All', name: 'All', slug: 'All', icon: '🎵' },
    ...genres,
  ];

  return (
    <SafeAreaView accessibilityLabel="Index Screen" style={styles.container}>
      <View style={[styles.container, { backgroundColor: colors.bg.primary }]}>
        <View style={styles.header}>
          <TouchableOpacity accessibilityRole="button" style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Music</Text>
          <View style={styles.backButton} />
        </View>

        <FlatList
          data={genresWithAll}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.genresScroll}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.genreChip, selectedGenre === item.name && styles.genreChipActive]}
              onPress={() => setSelectedGenre(item.name)}
            >
              <Text style={styles.genreIcon}>{item.icon}</Text>
              <Text
                style={[
                  styles.genreChipText,
                  selectedGenre === item.name && styles.genreChipTextActive,
                ]}
              >
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
        />

        {isLoading && <LoadingState text="Loading music..." />}
        {error && <ErrorState description={error} onRetry={handleRefresh} />}

        {!isLoading && !error && tracks.length === 0 && trendingTracks.length === 0 && (
          <EmptyState
            icon="🎵"
            title="No music found"
            description="Check back later for new tracks"
          />
        )}

        {!isLoading && !error && (tracks.length > 0 || trendingTracks.length > 0) && (
          <FlatList
            data={[]}
            renderItem={() => null}
            ListHeaderComponent={
              <>
                {trendingTracks.length > 0 && (
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                        🔥 Trending Now
                      </Text>
                    </View>
                    <FlatList
                      data={trendingTracks}
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.trendingScroll}
                      keyExtractor={(item) => item.id}
                      renderItem={renderTrendingTrack}
                    />
                  </View>
                )}

                {tracks.length > 0 && (
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                        🎵 All Tracks
                      </Text>
                    </View>
                    <View style={styles.tracksList}>
                      {tracks.map((track) => (
                        <View key={track.id}>{renderTrack({ item: track })}</View>
                      ))}
                    </View>
                  </View>
                )}
              </>
            }
            refreshControl={
              <RefreshControl
                refreshing={tracksQuery.isRefetching || trendingQuery.isRefetching}
                onRefresh={handleRefresh}
              />
            }
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
  backIcon: {
    color: colors.text.primary,
    fontSize: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  genresScroll: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  genreChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.bg.tertiary,
    gap: 6,
  },
  genreChipActive: {
    backgroundColor: colors.primary[500],
  },
  genreIcon: {
    fontSize: 14,
  },
  genreChipText: {
    color: colors.text.secondary,
    fontSize: 13,
    fontWeight: '500',
  },
  genreChipTextActive: {
    color: colors.text.primary,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  trendingScroll: {
    paddingHorizontal: 16,
    gap: 12,
  },
  trendingCard: {
    width: 200,
    borderRadius: 12,
    overflow: 'hidden',
  },
  trendingRank: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  rankText: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  trendingCover: {
    width: '100%',
    height: 120,
  },
  trendingInfo: {
    padding: 12,
  },
  trendingTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  trendingArtist: {
    fontSize: 12,
  },
  tracksList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  trackCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  trackCover: {
    width: 56,
    height: 56,
    borderRadius: 8,
  },
  playingIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: colors.primary[500],
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  trackInfo: {
    flex: 1,
  },
  trackTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  trackArtist: {
    fontSize: 13,
    marginBottom: 6,
  },
  trackMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  genreBadge: {
    backgroundColor: colors.bg.surface,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  genreText: {
    color: colors.primary[500],
    fontSize: 11,
    fontWeight: '600',
  },
  trackDuration: {
    color: colors.text.tertiary,
    fontSize: 11,
  },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    fontSize: 18,
  },
  playButtonSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bg.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIconSmall: {
    fontSize: 14,
  },
});
