import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { apiClient } from '@azeebo/react-data';
import { LoadingState, EmptyState, ErrorState } from '../../src/components/StateContainers';
import { analytics } from '../../src/utils/analytics';
import { colors } from '../../src/theme';

interface SpecialDetail {
  id: string;
  title: string;
  comedian: string;
  comedianAvatar: string;
  duration: string;
  rating: string;
  genre: string;
  description: string;
  releaseDate: string;
  videoUrl: string;
  emoji: string;
}

export default function SpecialDetailScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const isDark = colorScheme === 'dark';
  const [special, setSpecial] = useState<SpecialDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isInWatchlist, setIsInWatchlist] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const res = await apiClient.get<SpecialDetail>(`/comedy/specials/${id}`);
        setSpecial(res);
        analytics.comedyClipViewed(String(id));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load special');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (isLoading)
    return (
      <SafeAreaView accessibilityLabel="Special Detail Screen" style={[styles.container, { backgroundColor: isDark ? '#1A0A0A' : '#ffffff' }]}>
        <LoadingState text="Loading special..." />
      </SafeAreaView>
    );
  if (error)
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#1A0A0A' : '#ffffff' }]}>
        <ErrorState description={error} onRetry={() => {}} />
      </SafeAreaView>
    );
  if (!special)
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#1A0A0A' : '#ffffff' }]}>
        <EmptyState icon="🎤" title="Special not found" />
      </SafeAreaView>
    );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#1A0A0A' : '#ffffff' }]}>
      <View style={styles.videoContainer}>
        <View style={styles.videoPlaceholder}>
          <Text style={styles.videoEmoji}>{special.emoji}</Text>
          <TouchableOpacity
            style={styles.playButton}
            onPress={() => Alert.alert('Play', 'Starting video...')}
          >
            <Text style={styles.playIcon}>▶</Text>
          </TouchableOpacity>
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>{special.duration}</Text>
          </View>
        </View>
        <TouchableOpacity accessibilityRole="button" style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <Text style={[styles.title, { color: isDark ? '#fff' : '#000' }]}>{special.title}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>⭐ {special.rating}</Text>
          <Text style={styles.metaText}>•</Text>
          <Text style={styles.metaText}>{special.genre}</Text>
          <Text style={styles.metaText}>•</Text>
          <Text style={styles.metaText}>{special.releaseDate}</Text>
        </View>

        <View style={styles.comedianRow}>
          <View style={styles.comedianAvatar}>
            <Text style={styles.avatarEmoji}>{special.comedianAvatar}</Text>
          </View>
          <Text style={[styles.comedianName, { color: isDark ? '#fff' : '#000' }]}>
            {special.comedian}
          </Text>
        </View>

        <Text style={[styles.description, { color: isDark ? '#ccc' : '#666' }]}>
          {special.description}
        </Text>

        <View style={styles.actionsRow}>
          <TouchableOpacity accessibilityRole="button" style={styles.actionButton} onPress={() => setIsLiked(!isLiked)}>
            <Text style={styles.actionIcon}>{isLiked ? '❤️' : '🤍'}</Text>
            <Text style={[styles.actionText, { color: isDark ? '#fff' : '#000' }]}>
              {isLiked ? 'Liked' : 'Like'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setIsInWatchlist(!isInWatchlist)}
          >
            <Text style={styles.actionIcon}>{isInWatchlist ? '✅' : '🔖'}</Text>
            <Text style={[styles.actionText, { color: isDark ? '#fff' : '#000' }]}>
              {isInWatchlist ? 'Saved' : 'Watchlist'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => Alert.alert('Share', 'Share this special!')}
          >
            <Text style={styles.actionIcon}>↗️</Text>
            <Text style={[styles.actionText, { color: isDark ? '#fff' : '#000' }]}>Share</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>
          Related Specials
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.relatedList}
        >
          {[1, 2, 3].map((i) => (
            <TouchableOpacity
              key={i}
              style={[styles.relatedCard, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}
            >
              <View style={styles.relatedThumb}>
                <Text style={styles.relatedEmoji}>🎤</Text>
              </View>
              <Text style={[styles.relatedTitle, { color: isDark ? '#fff' : '#000' }]}>
                Special {i}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  videoContainer: { height: 260, position: 'relative' },
  videoPlaceholder: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoEmoji: { fontSize: 80 },
  playButton: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: { color: '#fff', fontSize: 30 },
  durationBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  durationText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  backButton: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  backIcon: { color: '#fff', fontSize: 20 },
  content: { padding: 16 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  metaText: { color: colors.text.secondary, fontSize: 14 },
  comedianRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 10 },
  comedianAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bg.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: { fontSize: 20 },
  comedianName: { fontSize: 16, fontWeight: '600' },
  description: { fontSize: 14, lineHeight: 22, marginBottom: 20 },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.bg.tertiary,
    marginBottom: 24,
  },
  actionButton: { alignItems: 'center', gap: 4 },
  actionIcon: { fontSize: 24 },
  actionText: { fontSize: 11 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  relatedList: { gap: 12, paddingBottom: 30 },
  relatedCard: { width: 140, borderRadius: 10, overflow: 'hidden' },
  relatedThumb: {
    height: 100,
    backgroundColor: colors.bg.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  relatedEmoji: { fontSize: 40 },
  relatedTitle: { fontSize: 13, fontWeight: '600', padding: 8 },
});
