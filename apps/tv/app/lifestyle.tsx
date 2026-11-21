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

export default function TVLifestyleScreen() {
  const router = useRouter();
  const [lifestyleVideos, setLifestyleVideos] = useState<ContentItem[]>([]);
  const [nightlifeShows, setNightlifeShows] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLifestyleContent = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [lifeRes, nightRes] = await Promise.allSettled([
        contentApi.getContentByCategory('lifestyle', 1, 20),
        contentApi.getContentByCategory('9tlife', 1, 15),
      ]);

      if (lifeRes.status === 'fulfilled' && lifeRes.value.success && lifeRes.value.data) {
        setLifestyleVideos(lifeRes.value.data.items ?? []);
      }
      if (nightRes.status === 'fulfilled' && nightRes.value.success && nightRes.value.data) {
        setNightlifeShows(nightRes.value.data.items ?? []);
      }
    } catch {
      setError('Failed to load Lifestyle content');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadLifestyleContent();
  }, [loadLifestyleContent]);

  const toRailItems = (items: ContentItem[]): RailItem[] =>
    items.map((item) => ({
      id: item.id,
      title: item.title,
      thumbnail: item.mediaAsset?.thumbnailUrl || item.thumbnail,
      subtitle: item.universe?.name || 'Lifestyle & Culture',
    }));

  const handleSelect = useCallback(
    (item: RailItem) => {
      router.push(`/watch/${item.id}` as Href);
    },
    [router]
  );

  if (isLoading && lifestyleVideos.length === 0) {
    return <LoadingState text="Loading Lifestyle Universe..." />;
  }

  if (error && lifestyleVideos.length === 0) {
    return <ErrorState description={error} onRetry={() => void loadLifestyleContent()} />;
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
          <Text style={styles.badgeText}>✨ 9TLIFE AFTER DARK</Text>
        </View>
      </View>

      <View style={styles.heroSection}>
        <Text style={styles.title}>Lifestyle & Culture</Text>
        <Text style={styles.subtitle}>
          Nightlife docuseries, high fashion runways, fine culinary spotlights, and luxury African living.
        </Text>
      </View>

      <View style={styles.section}>
        <FocusableRow
          title="Trending Lifestyle Series"
          items={toRailItems(lifestyleVideos)}
          onSelect={handleSelect}
        />
      </View>

      {nightlifeShows.length > 0 && (
        <View style={styles.section}>
          <FocusableRow
            title="9TLIFE City Hotspots"
            items={toRailItems(nightlifeShows)}
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
    backgroundColor: 'rgba(236, 72, 153, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EC4899',
  },
  badgeText: {
    color: '#EC4899',
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
