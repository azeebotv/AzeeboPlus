import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { contentApi, type ContentItem } from '@azeebo/react-data';
import { FocusableButton, FocusableRow, type RailItem } from '../src/components/Focusable';
import { LoadingState } from '../src/components/StateContainers';
import { colors, tvTypography, tvSpacing } from '../src/theme';

export default function TVLibraryScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [history, setHistory] = useState<ContentItem[]>([]);
  const [watchlist, setWatchlist] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadLibrary = useCallback(async () => {
    setIsLoading(true);
    try {
      const [historyRes, watchlistRes] = await Promise.allSettled([
        contentApi.getWatchHistory(1, 15),
        contentApi.getSavedContent(1, 15),
      ]);

      if (historyRes.status === 'fulfilled' && historyRes.value.success && historyRes.value.data) {
        setHistory(historyRes.value.data.items ?? []);
      }
      if (watchlistRes.status === 'fulfilled' && watchlistRes.value.success && watchlistRes.value.data) {
        setWatchlist(watchlistRes.value.data.items ?? []);
      }
    } catch {
      // Graceful fallback on guest or empty states
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadLibrary();
  }, [loadLibrary]);

  const toRailItems = (items: ContentItem[]): RailItem[] =>
    items.map((item) => ({
      id: item.id,
      title: item.title,
      thumbnail: item.mediaAsset?.thumbnailUrl || item.thumbnail,
      subtitle: item.universe?.name || item.creator?.name,
    }));

  if (isLoading) {
    return <LoadingState text={t('common.loading', 'Loading library...')} />;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.topBar}>
        <FocusableButton
          title="← Home"
          variant="secondary"
          onPress={() => router.push('/' as Href)}
        />
        <Text style={styles.title}>My Library & Watchlist</Text>
        <View style={{ width: 100 }} />
      </View>

      {history.length > 0 ? (
        <View style={styles.section}>
          <FocusableRow
            title="Continue Watching"
            items={toRailItems(history)}
            onSelect={(item) => router.push(`/watch/${item.id}` as Href)}
          />
        </View>
      ) : null}

      {watchlist.length > 0 ? (
        <View style={styles.section}>
          <FocusableRow
            title="Saved Watchlist"
            items={toRailItems(watchlist)}
            onSelect={(item) => router.push(`/watch/${item.id}` as Href)}
          />
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Your watchlist is empty</Text>
          <Text style={styles.emptySubtitle}>
            Save films, reality shows, and live events to watch them on your TV anytime.
          </Text>
          <FocusableButton
            title="Browse Universes"
            variant="primary"
            hasTVPreferredFocus
            onPress={() => router.push('/browse' as Href)}
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
  section: {
    marginBottom: tvSpacing.xl,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: tvSpacing.section,
    gap: tvSpacing.md,
  },
  emptyTitle: {
    color: colors.text.primary,
    fontSize: tvTypography.fontSize.xl,
    fontWeight: tvTypography.fontWeight.bold,
  },
  emptySubtitle: {
    color: colors.text.secondary,
    fontSize: tvTypography.fontSize.base,
    maxWidth: 500,
    textAlign: 'center',
    marginBottom: tvSpacing.md,
  },
});
