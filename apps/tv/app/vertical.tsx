import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { contentApi, type ContentItem } from '@azeebo/react-data';
import { FocusableButton, FocusableRow, type RailItem } from '../src/components/Focusable';
import { LoadingState, ErrorState } from '../src/components/StateContainers';
import { colors, tvTypography, tvSpacing } from '../src/theme';

export default function TVVerticalScreen() {
  const router = useRouter();
  const [agbalaEpisodes, setAgbalaEpisodes] = useState<ContentItem[]>([]);
  const [loreClips, setLoreClips] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadVerticalContent = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [agbalaRes, loreRes] = await Promise.allSettled([
        contentApi.getContentByCategory('agbala', 1, 20),
        contentApi.getContentByCategory('vertical', 1, 15),
      ]);

      if (agbalaRes.status === 'fulfilled' && agbalaRes.value.success && agbalaRes.value.data) {
        setAgbalaEpisodes(agbalaRes.value.data.items ?? []);
      }
      if (loreRes.status === 'fulfilled' && loreRes.value.success && loreRes.value.data) {
        setLoreClips(loreRes.value.data.items ?? []);
      }
    } catch {
      setError('Failed to load Agbala content');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadVerticalContent();
  }, [loadVerticalContent]);

  const toRailItems = (items: ContentItem[]): RailItem[] =>
    items.map((item) => ({
      id: item.id,
      title: item.title,
      thumbnail: item.mediaAsset?.thumbnailUrl || item.thumbnail,
      subtitle: item.universe?.name || 'Agbala Chronicles',
    }));

  const handleSelect = useCallback(
    (item: RailItem) => {
      router.push(`/watch/${item.id}` as Href);
    },
    [router]
  );

  if (isLoading && agbalaEpisodes.length === 0) {
    return <LoadingState text="Opening the Agbala Canon..." />;
  }

  if (error && agbalaEpisodes.length === 0) {
    return <ErrorState description={error} onRetry={() => void loadVerticalContent()} />;
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
          <Text style={styles.badgeText}>⚡ MYTHIC STORYWORLD</Text>
        </View>
      </View>

      <View style={styles.heroSection}>
        <Text style={styles.title}>Agbala & Vertical Universe</Text>
        <Text style={styles.subtitle}>
          African fantasy lore, episodic micro-dramas, ancient mythologies, and serialized canon
          sagas.
        </Text>
      </View>

      <View style={styles.section}>
        <FocusableRow
          title="Agbala: The Chronicles"
          items={toRailItems(agbalaEpisodes)}
          onSelect={handleSelect}
        />
      </View>

      {loreClips.length > 0 && (
        <View style={styles.section}>
          <FocusableRow
            title="Canon Lore & Character Archives"
            items={toRailItems(loreClips)}
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
    backgroundColor: 'rgba(147, 51, 234, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.category.purple,
  },
  badgeText: {
    color: colors.category.purple,
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
