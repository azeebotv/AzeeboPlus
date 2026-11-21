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

export default function TVComedyScreen() {
  const router = useRouter();
  const [specials, setSpecials] = useState<ContentItem[]>([]);
  const [clips, setClips] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadComedyContent = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [specialsRes, clipsRes] = await Promise.allSettled([
        contentApi.getContentByCategory('comedy', 1, 20),
        contentApi.getContentByCategory('comedy-clips', 1, 15),
      ]);

      if (specialsRes.status === 'fulfilled' && specialsRes.value.success && specialsRes.value.data) {
        setSpecials(specialsRes.value.data.items ?? []);
      }
      if (clipsRes.status === 'fulfilled' && clipsRes.value.success && clipsRes.value.data) {
        setClips(clipsRes.value.data.items ?? []);
      }
    } catch {
      setError('Failed to load Comedy content');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadComedyContent();
  }, [loadComedyContent]);

  const toRailItems = (items: ContentItem[]): RailItem[] =>
    items.map((item) => ({
      id: item.id,
      title: item.title,
      thumbnail: item.mediaAsset?.thumbnailUrl || item.thumbnail,
      subtitle: item.creator?.name || 'Comedy Special',
    }));

  const handleSelect = useCallback(
    (item: RailItem) => {
      router.push(`/watch/${item.id}` as Href);
    },
    [router]
  );

  if (isLoading && specials.length === 0) {
    return <LoadingState text="Loading Comedy Universe..." />;
  }

  if (error && specials.length === 0) {
    return <ErrorState description={error} onRetry={() => void loadComedyContent()} />;
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
          <Text style={styles.badgeText}>😂 COMEDY CLUB EXCLUSIVES</Text>
        </View>
      </View>

      <View style={styles.heroSection}>
        <Text style={styles.title}>Comedy Universe</Text>
        <Text style={styles.subtitle}>
          Full-length stand-up comedy specials, unfiltered club sets, hilarious skits, and laugh-out-loud comedy battles.
        </Text>
      </View>

      <View style={styles.section}>
        <FocusableRow
          title="Stand-Up Comedy Specials"
          items={toRailItems(specials)}
          onSelect={handleSelect}
        />
      </View>

      {clips.length > 0 && (
        <View style={styles.section}>
          <FocusableRow
            title="Trending Comedy Clips"
            items={toRailItems(clips)}
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
    backgroundColor: 'rgba(249, 115, 22, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F97316',
  },
  badgeText: {
    color: '#F97316',
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
