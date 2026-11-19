import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { colors, radius } from '../../src/theme';
import { lifestyleApi } from '@azeebo/react-data/api/lifestyle';
import { extractTracks } from '../../src/lib/music';
import { LoadingState, EmptyState, ErrorState } from '../../src/components/StateContainers';

interface DerivedArtist {
  id: string;
  name: string;
  genre: string;
  trackCount: number;
  playCount: number;
  avatar?: string;
}

/**
 * The lifestyle-service has no artists-list endpoint — artists are free-text
 * `artistName` values on music entries, with detail available at
 * GET /v1/lifestyle/music/artists/:id (slugified name). So derive the
 * artist list from the tracks the way the web app does.
 */
export default function MusicArtistsScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');

  const tracksQuery = useQuery({
    queryKey: ['lifestyle', 'music', 'all-tracks'],
    queryFn: async () => extractTracks(await lifestyleApi.getTracks()),
    staleTime: 60_000,
  });

  const artists = useMemo<DerivedArtist[]>(() => {
    const map = new Map<string, DerivedArtist>();
    for (const t of tracksQuery.data ?? []) {
      if (!t.artist) continue;
      const id = t.artistId!;
      const existing = map.get(id);
      if (existing) {
        existing.trackCount += 1;
        existing.playCount += t.playCount ?? 0;
      } else {
        map.set(id, {
          id,
          name: t.artist,
          genre: t.genre ?? '',
          trackCount: 1,
          playCount: t.playCount ?? 0,
          avatar: t.thumbnail || undefined,
        });
      }
    }
    const list = [...map.values()].sort((a, b) => b.playCount - a.playCount);
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter((a) => a.name.toLowerCase().includes(q));
  }, [tracksQuery.data, search]);

  return (
    <SafeAreaView accessibilityLabel="Artists Screen" style={[styles.container, { backgroundColor: colors.bg.primary }]}>
      <View style={styles.header}>
        <TouchableOpacity accessibilityRole="button" style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Artists</Text>
        <View style={styles.backButton} />
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={[styles.searchInput, { backgroundColor: colors.bg.tertiary, color: colors.text.primary }]}
          placeholder="Search artists..."
          placeholderTextColor={colors.text.tertiary}
          value={search}
          onChangeText={setSearch}
          accessibilityLabel="Search artists"
        />
      </View>

      {tracksQuery.isLoading ? (
        <LoadingState text="Loading artists..." />
      ) : tracksQuery.error ? (
        <ErrorState
          description={tracksQuery.error?.message ?? 'Failed to load artists'}
          onRetry={() => tracksQuery.refetch()}
        />
      ) : artists.length === 0 ? (
        <EmptyState
          icon="🎤"
          title="No artists"
          description={search ? 'No artists match your search' : 'Artists appear as music is added'}
        />
      ) : (
        <FlatList
          data={artists}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.gridRow}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.card, { backgroundColor: colors.bg.tertiary }]}
              onPress={() => router.push(`/music/${encodeURIComponent(item.id)}`)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`View ${item.name}`}
            >
              {item.avatar ? (
                <View style={styles.avatarWrap}>
                  <View
                    style={[styles.avatarImage, { backgroundColor: colors.primary[500] + '20' }]}
                  />
                  <Text style={styles.avatarEmoji}>🎤</Text>
                </View>
              ) : (
                <View style={[styles.avatar, { backgroundColor: colors.primary[500] + '20' }]}>
                  <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
                </View>
              )}
              <Text style={[styles.cardName, { color: colors.text.primary }]} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.cardGenre} numberOfLines={1}>
                {item.genre || 'Music'}
              </Text>
              <Text style={styles.cardFollowers}>
                {item.trackCount} {item.trackCount === 1 ? 'track' : 'tracks'}
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
  grid: { padding: 16 },
  gridRow: { gap: 12, marginBottom: 12 },
  card: { flex: 1, padding: 16, borderRadius: radius.lg, alignItems: 'center' },
  avatarWrap: { position: 'relative', marginBottom: 8 },
  avatarImage: { width: 64, height: 64, borderRadius: 32 },
  avatarEmoji: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    textAlign: 'center',
    textAlignVertical: 'center',
    lineHeight: 64,
    fontSize: 24,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  avatarText: { fontSize: 24, fontWeight: '700', color: colors.primary[500] },
  cardName: { fontSize: 14, fontWeight: '700', textAlign: 'center', marginBottom: 2 },
  cardGenre: { fontSize: 11, color: colors.primary[500], fontWeight: '600', marginBottom: 2 },
  cardFollowers: { fontSize: 11, color: colors.text.tertiary },
});
