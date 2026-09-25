import { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { colors, radius } from '../../src/theme';
import { apiClient } from '@azeebo/react-data/api/client';
import { LoadingState, EmptyState, ErrorState } from '../../src/components/StateContainers';
import { analytics } from '../../src/utils/analytics';
import { extractTracks, NormalizedTrack } from '../../src/lib/music';

export default function LifestyleMusicScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const isDark = colorScheme === 'dark';

  const musicQuery = useQuery({
    queryKey: ['lifestyle', 'music'],
    queryFn: async () => extractTracks(await apiClient.get('/v1/lifestyle/music')),
    staleTime: 60_000,
  });

  useEffect(() => {
    analytics.lifestyleFeedViewed();
  }, []);

  const tracks = musicQuery.data ?? [];

  const formatDuration = (s?: number) =>
    typeof s === 'number' ? `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}` : '--:--';

  const renderItem = ({ item }: { item: NormalizedTrack }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: isDark ? colors.bg.tertiary : '#f5f5f5' }]}
      activeOpacity={0.7}
      onPress={() =>
        item.artistId
          ? router.push(`/music/${encodeURIComponent(item.artistId)}`)
          : router.push('/music')
      }
      accessibilityRole="button"
      accessibilityLabel={`${item.title} by ${item.artist}`}
    >
      <View style={[styles.thumb, { backgroundColor: colors.primary[500] + '20' }]}>
        <Text style={styles.thumbText}>🎵</Text>
      </View>
      <View style={styles.cardInfo}>
        <Text style={[styles.cardTitle, { color: colors.text.primary }]} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.cardArtist}>{item.artist}</Text>
      </View>
      <Text style={[styles.duration, { color: colors.text.tertiary }]}>
        {formatDuration(item.duration)}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: isDark ? colors.bg.primary : '#fff' }]}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Music</Text>
        <View style={{ width: 40 }} />
      </View>

      {musicQuery.isLoading ? (
        <LoadingState text="Loading music..." />
      ) : musicQuery.error ? (
        <ErrorState description={musicQuery.error.message} onRetry={() => musicQuery.refetch()} />
      ) : tracks.length === 0 ? (
        <EmptyState icon="🎵" title="No tracks" description="Check back for new releases" />
      ) : (
        <FlatList
          data={tracks}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
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
  list: { padding: 16, gap: 10 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: radius.lg,
    gap: 12,
  },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbText: { fontSize: 20 },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  cardArtist: { fontSize: 12, color: colors.text.tertiary },
  duration: { fontSize: 13 },
});
