import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { contentApi, type ContentItem } from '@azeebo/react-data';
import { FocusableButton, FocusableRow, type RailItem } from '../src/components/Focusable';
import { LoadingState, ErrorState } from '../src/components/StateContainers';
import { logger } from '@azeebo/react-data/utils/logger';
import { colors, tvTypography, tvSpacing } from '../src/theme';

const UNIVERSES = [
  { id: 'cinemaxis', label: 'Cinemaxis Films' },
  { id: 'reality', label: 'Reality Shows' },
  { id: 'comedy', label: 'Comedy Club' },
  { id: 'lifestyle', label: 'Lifestyle & Tonight' },
  { id: 'sports', label: 'Sports Pulse' },
  { id: 'kids', label: 'Azeebo Kids' },
  { id: 'agbala', label: 'Agbala Chronicles' },
];

export default function TVBrowseScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [selectedUniverse, setSelectedUniverse] = useState('cinemaxis');
  const [universeItems, setUniverseItems] = useState<ContentItem[]>([]);
  const [trending, setTrending] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const fetchContent = useCallback(async () => {
    setIsLoading(true);
    setLoadError(false);
    try {
      const [universeRes, trendingRes] = await Promise.allSettled([
        contentApi.getContentByCategory(selectedUniverse, 1, 15),
        contentApi.getTrendingContent(12),
      ]);

      if (
        universeRes.status === 'fulfilled' &&
        universeRes.value.success &&
        universeRes.value.data
      ) {
        setUniverseItems(universeRes.value.data.items ?? []);
      }
      if (
        trendingRes.status === 'fulfilled' &&
        trendingRes.value.success &&
        trendingRes.value.data
      ) {
        setTrending(trendingRes.value.data);
      }
    } catch (err) {
      logger.error('TV Browse failed to load content:', err);
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }
  }, [selectedUniverse]);

  useEffect(() => {
    void fetchContent();
  }, [fetchContent]);

  const toRailItems = (items: ContentItem[]): RailItem[] =>
    items.map((item) => ({
      id: item.id,
      title: item.title,
      thumbnail: item.mediaAsset?.thumbnailUrl || item.thumbnail,
      subtitle: item.universe?.name || item.creator?.name,
    }));

  const handleSelect = useCallback(
    (item: RailItem) => {
      router.push(`/watch/${item.id}` as Href);
    },
    [router]
  );

  if (isLoading && universeItems.length === 0) {
    return <LoadingState text={t('common.loading', 'Loading catalog...')} />;
  }

  if (loadError && universeItems.length === 0) {
    return (
      <ErrorState
        description="Could not load catalogue. Check your connection."
        onRetry={() => void fetchContent()}
      />
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Top Bar ─────────────────────────────────────────── */}
      <View style={styles.topBar}>
        <FocusableButton
          title="← Home"
          variant="secondary"
          onPress={() => router.push('/' as Href)}
        />
        <Text style={styles.title}>Browse Universes</Text>
        <FocusableButton
          title="Search"
          variant="secondary"
          onPress={() => router.push('/search' as Href)}
        />
      </View>

      {/* ── Universe Selector Bar ──────────────────────────── */}
      <View style={styles.universeSelector}>
        {UNIVERSES.map((u, idx) => (
          <FocusableButton
            key={u.id}
            title={u.label}
            variant={selectedUniverse === u.id ? 'primary' : 'secondary'}
            hasTVPreferredFocus={idx === 0}
            onPress={() => setSelectedUniverse(u.id)}
          />
        ))}
      </View>

      {/* ── Catalog Rows ───────────────────────────────────── */}
      <View style={styles.section}>
        <FocusableRow
          title={`${UNIVERSES.find((u) => u.id === selectedUniverse)?.label || 'Featured'} Spotlight`}
          items={toRailItems(universeItems)}
          onSelect={handleSelect}
        />
      </View>

      {trending.length > 0 ? (
        <View style={styles.section}>
          <FocusableRow
            title="Across All Universes — Trending"
            items={toRailItems(trending)}
            onSelect={handleSelect}
          />
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  content: {
    paddingBottom: tvSpacing.section,
    paddingTop: tvSpacing.xl,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: tvSpacing.xxl,
    marginBottom: tvSpacing.xl,
  },
  title: {
    color: colors.text.primary,
    fontSize: tvTypography.fontSize.xxl,
    fontWeight: tvTypography.fontWeight.extrabold,
  },
  universeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tvSpacing.md,
    paddingHorizontal: tvSpacing.xxl,
    marginBottom: tvSpacing.xxl,
  },
  section: {
    marginBottom: tvSpacing.lg,
  },
});
