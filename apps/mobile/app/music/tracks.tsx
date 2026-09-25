import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { colors, radius } from '../../src/theme';
import { lifestyleApi } from '@azeebo/react-data/api/lifestyle';
import { extractTracks } from '../../src/lib/music';
import { LoadingState, EmptyState, ErrorState } from '../../src/components/StateContainers';

export default function MusicTracksScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');

  const tracksQuery = useQuery({
    queryKey: ['lifestyle', 'music', 'all-tracks'],
    queryFn: async () => extractTracks(await lifestyleApi.getTracks()),
    staleTime: 60_000,
  });

  const tracks = useMemo(() => {
    const all = tracksQuery.data ?? [];
    if (!search.trim()) return all;
    const q = search.toLowerCase();
    return all.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q) ||
        (t.genre ?? '').toLowerCase().includes(q)
    );
  }, [tracksQuery.data, search]);

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '—';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg.primary }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Tracks</Text>
        <View style={styles.backButton} />
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={[styles.searchInput, { backgroundColor: colors.bg.tertiary, color: colors.text.primary }]}
          placeholder="Search tracks..."
          placeholderTextColor={colors.text.tertiary}
          value={search}
          onChangeText={setSearch}
          accessibilityLabel="Search tracks"
        />
      </View>

      {tracksQuery.isLoading ? (
        <LoadingState text="Loading tracks..." />
      ) : tracksQuery.error ? (
        <ErrorState
          description={tracksQuery.error?.message ?? 'Failed to load tracks'}
          onRetry={() => tracksQuery.refetch()}
        />
      ) : tracks.length === 0 ? (
        <EmptyState
          icon="🎵"
          title="No tracks"
          description={search ? 'No tracks match your search' : 'Check back for new releases'}
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
              <Text style={styles.index}>{index + 1}</Text>
              <View style={styles.info}>
                <Text style={[styles.title, { color: colors.text.primary }]} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.artist} numberOfLines={1}>
                  {item.artist}
                  {item.genre ? ` · ${item.genre}` : ''}
                </Text>
              </View>
              <Text style={styles.duration}>{formatDuration(item.duration)}</Text>
              <Text style={styles.plays}>
                {item.playCount ? `${Math.round(item.playCount / 1000)}K` : ''}
              </Text>
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
  artist: { fontSize: 12, color: colors.text.tertiary },
  duration: { fontSize: 12, color: colors.text.tertiary, width: 40, textAlign: 'right' },
  plays: { fontSize: 12, color: colors.text.tertiary, width: 40, textAlign: 'right' },
});
