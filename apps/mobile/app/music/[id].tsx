import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { colors, radius } from '../../src/theme';
import { apiClient } from '@azeebo/react-data/api/client';
import { extractTracks } from '../../src/lib/music';
import { LoadingState, EmptyState, ErrorState } from '../../src/components/StateContainers';

interface ArtistDetail {
  id: string;
  name: string;
  avatar: string | null;
  bio: string | null;
  genre: string | null;
  trackCount: number;
  followerCount: number | null;
  socialLinks: { platform: string; url: string }[];
}

/**
 * GET /v1/lifestyle/music/artists/:id — id is the slugified artist name.
 * Tracks are fetched separately via the artistId query filter.
 */
export default function ArtistDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const artistId = typeof id === 'string' ? decodeURIComponent(id) : '';

  const artistQuery = useQuery({
    queryKey: ['music', 'artist', artistId],
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; data: ArtistDetail }>(
        `/v1/lifestyle/music/artists/${encodeURIComponent(artistId)}`
      );
      return res?.data ?? null;
    },
    enabled: artistId.length > 0,
    staleTime: 60_000,
  });

  const tracksQuery = useQuery({
    queryKey: ['music', 'artist-tracks', artistId],
    queryFn: async () => extractTracks(await apiClient.get(`/v1/lifestyle/music?artistId=${encodeURIComponent(artistId)}`)),
    enabled: artistId.length > 0,
    staleTime: 60_000,
  });

  const artist = artistQuery.data;
  const tracks = tracksQuery.data ?? [];
  const isLoading = artistQuery.isLoading || tracksQuery.isLoading;
  const error = artistQuery.error?.message ?? tracksQuery.error?.message;

  if (!artistId) {
    return (
      <SafeAreaView accessibilityLabel="Screen Screen" style={[styles.container, { backgroundColor: colors.bg.primary }]}>
        <EmptyState icon="🎤" title="Artist not found" description="Invalid artist link" />
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg.primary }]}>
        <LoadingState text="Loading artist..." />
      </SafeAreaView>
    );
  }

  if (error || !artist) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg.primary }]}>
        <ErrorState
          description={error ?? 'Artist not found'}
          onRetry={() => {
            artistQuery.refetch();
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
          {artist.name}
        </Text>
        <View style={styles.backButton} />
      </View>

      <FlatList
        data={tracks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.hero}>
            {artist.avatar ? (
              <Image source={{ uri: artist.avatar }} style={styles.avatarImage} />
            ) : (
              <View style={[styles.avatar, { backgroundColor: colors.primary[500] + '20' }]}>
                <Text style={styles.avatarText}>{artist.name.charAt(0).toUpperCase()}</Text>
              </View>
            )}
            <Text style={[styles.name, { color: colors.text.primary }]}>{artist.name}</Text>
            {!!artist.genre && <Text style={styles.genre}>{artist.genre}</Text>}
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={[styles.statValue, { color: colors.text.primary }]}>
                  {artist.trackCount}
                </Text>
                <Text style={styles.statLabel}>tracks</Text>
              </View>
              {artist.followerCount !== null && (
                <View style={styles.stat}>
                  <Text style={[styles.statValue, { color: colors.text.primary }]}>
                    {artist.followerCount.toLocaleString()}
                  </Text>
                  <Text style={styles.statLabel}>followers</Text>
                </View>
              )}
            </View>
            {!!artist.bio && (
              <Text style={[styles.bio, { color: colors.text.secondary }]}>{artist.bio}</Text>
            )}
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon="🎵"
            title="No tracks yet"
            description="This artist has no published tracks"
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
                {item.album || item.genre || 'Single'}
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
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: { fontSize: 36, fontWeight: '700', color: colors.primary[500] },
  avatarImage: { width: 96, height: 96, borderRadius: 48, marginBottom: 12 },
  name: { fontSize: 22, fontWeight: '800', marginBottom: 2 },
  genre: { fontSize: 13, color: colors.primary[500], fontWeight: '600', marginBottom: 12 },
  statsRow: { flexDirection: 'row', gap: 32, marginBottom: 12 },
  stat: { alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '700' },
  statLabel: { fontSize: 12, color: colors.text.tertiary },
  bio: { fontSize: 13, textAlign: 'center', lineHeight: 20, paddingHorizontal: 16 },
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
