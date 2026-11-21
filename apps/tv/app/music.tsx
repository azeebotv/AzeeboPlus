import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { contentApi, type ContentItem } from '@azeebo/react-data';
import {
  FocusableButton,
  FocusableRow,
  type RailItem,
} from '../src/components/Focusable';
import { LoadingState, ErrorState } from '../src/components/StateContainers';
import { colors, tvTypography, tvSpacing } from '../src/theme';

export default function TVMusicScreen() {
  const router = useRouter();
  const [concerts, setConcerts] = useState<ContentItem[]>([]);
  const [musicVideos, setMusicVideos] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMusicContent = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [concertsRes, mvsRes] = await Promise.allSettled([
        contentApi.getContentByCategory('music', 1, 20),
        contentApi.getContentByCategory('concerts', 1, 15),
      ]);

      if (concertsRes.status === 'fulfilled' && concertsRes.value.success && concertsRes.value.data) {
        setConcerts(concertsRes.value.data.items ?? []);
      }
      if (mvsRes.status === 'fulfilled' && mvsRes.value.success && mvsRes.value.data) {
        setMusicVideos(mvsRes.value.data.items ?? []);
      }
    } catch {
      setError('Failed to load Music content');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMusicContent();
  }, [loadMusicContent]);

  const toRailItems = (items: ContentItem[]): RailItem[] =>
    items.map((item) => ({
      id: item.id,
      title: item.title,
      thumbnail: item.mediaAsset?.thumbnailUrl || item.thumbnail,
      subtitle: item.creator?.name || 'Afrobeats Concert',
    }));

  const handleSelect = useCallback(
    (item: RailItem) => {
      router.push(`/watch/${item.id}` as Href);
    },
    [router]
  );

  if (isLoading && concerts.length === 0) {
    return <LoadingState text="Loading Music Universe..." />;
  }

  if (error && concerts.length === 0) {
    return <ErrorState description={error} onRetry={() => void loadMusicContent()} />;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.topBar}>
        <FocusableButton
          title="← Back to Home"
          variant="secondary"
          onPress={() => router.push('/' as Href)}
          hasTVPreferredFocus
        />
        <View style={styles.badge}>
          <Text style={styles.badgeText}>🎵 LIVE CONCERT EXPERIENCES</Text>
        </View>
      </View>

      <View style={styles.heroSection}>
        <Text style={styles.title}>Music & Live Stages</Text>
        <Text style={styles.subtitle}>
          4K Afrobeats stadium tours, intimate acoustic sessions, festival livestreams, and official music videos.
        </Text>
      </View>

      <View style={styles.section}>
        <FocusableRow
          title="Headline Concerts & Live Sets"
          items={toRailItems(concerts)}
          onSelect={handleSelect}
        />
      </View>

      {musicVideos.length > 0 && (
        <View style={styles.section}>
          <FocusableRow
            title="Official Music Videos"
            items={toRailItems(musicVideos)}
            onSelect={handleSelect}
          />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  content: {
    padding: tvSpacing.xxl,
    paddingBottom: tvSpacing.section,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tvSpacing.xl,
  },
  badge: {
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A855F7',
  },
  badgeText: {
    color: '#A855F7',
    fontSize: tvTypography.fontSize.base,
    fontWeight: '800',
  },
  heroSection: {
    marginBottom: tvSpacing.xl,
  },
  title: {
    fontSize: tvTypography.fontSize.xxl,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: tvSpacing.sm,
  },
  subtitle: {
    fontSize: tvTypography.fontSize.xl,
    color: colors.text.secondary,
    maxWidth: 900,
  },
  section: {
    marginBottom: tvSpacing.xl,
  },
});
