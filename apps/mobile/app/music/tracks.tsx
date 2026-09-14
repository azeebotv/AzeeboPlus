import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { colors, radius } from '../../src/theme';
import { apiClient } from '../../src/api/client';
import { LoadingState, EmptyState, ErrorState } from '../../src/components/StateContainers';

interface Track {
  id: string;
  title: string;
  artist: string;
  genre: string;
  duration: number;
  playCount: number;
  isExplicit: boolean;
}

export default function MusicTracksScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const isDark = colorScheme === 'dark';
  const [search, setSearch] = useState('');

  const tracksQuery = useQuery({
    queryKey: ['music', 'tracks', search],
    queryFn: async () => {
      const params = search ? `?search=${encodeURIComponent(search)}` : '';
      const res = await apiClient.get<Track[]>(`/v1/music/tracks${params}`);
      return Array.isArray(res) ? res : [];
    },
    staleTime: 60_000,
  });

  const tracks = tracksQuery.data ?? [];

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: isDark ? colors.bg.primary : '#fff' }]}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Tracks</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={[
            styles.searchInput,
            {
              backgroundColor: isDark ? colors.bg.tertiary : '#f0f0f0',
              color: colors.text.primary,
            },
          ]}
          placeholder="Search tracks..."
          placeholderTextColor={colors.text.tertiary}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {tracksQuery.isLoading ? (
        <LoadingState text="Loading tracks..." />
      ) : tracksQuery.error ? (
        <ErrorState description={tracksQuery.error.message} onRetry={() => tracksQuery.refetch()} />
      ) : tracks.length === 0 ? (
        <EmptyState
          icon="🎵"
          title="No tracks"
          description={search ? 'No tracks match your search' : 'Tracks coming soon'}
        />
      ) : (
        <FlatList
          data={tracks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              style={[styles.card, { backgroundColor: isDark ? colors.bg.tertiary : '#f5f5f5' }]}
              activeOpacity={0.7}
            >
              <Text style={styles.index}>{index + 1}</Text>
              <View style={styles.info}>
                <Text style={[styles.title, { color: colors.text.primary }]} numberOfLines={1}>
                  {item.title} {item.isExplicit && <Text style={styles.explicit}>E</Text>}
                </Text>
                <Text style={styles.artist} numberOfLines={1}>
                  {item.artist}
                </Text>
              </View>
              <Text style={styles.duration}>{formatDuration(item.duration)}</Text>
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
  searchContainer: { paddingHorizontal: 16, marginBottom: 12 },
  searchInput: { padding: 12, borderRadius: radius.md, fontSize: 14 },
  list: { padding: 16, gap: 2 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: radius.md,
    gap: 12,
  },
  index: {
    width: 24,
    textAlign: 'center',
    fontSize: 14,
    color: colors.text.tertiary,
    fontWeight: '600',
  },
  info: { flex: 1 },
  title: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  explicit: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.text.tertiary,
    backgroundColor: colors.bg.tertiary,
    paddingHorizontal: 4,
    borderRadius: 3,
    overflow: 'hidden',
  },
  artist: { fontSize: 12, color: colors.text.tertiary },
  duration: { fontSize: 12, color: colors.text.tertiary, width: 40, textAlign: 'right' },
  plays: { fontSize: 12, color: colors.text.tertiary, width: 40, textAlign: 'right' },
});
