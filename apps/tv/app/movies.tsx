import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { contentApi, type ContentItem } from '@azeebo/react-data';
import { FocusableButton, FocusableRow, type RailItem } from '../src/components/Focusable';
import { LoadingState, ErrorState } from '../src/components/StateContainers';
import { colors, tvTypography, tvSpacing } from '../src/theme';

export default function TVMoviesScreen() {
  const router = useRouter();
  const [movies, setMovies] = useState<ContentItem[]>([]);
  const [topRated, setTopRated] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMovies = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [moviesRes, trendingRes] = await Promise.allSettled([
        contentApi.getContentByCategory('cinemaxis', 1, 20),
        contentApi.getTrendingContent(10),
      ]);

      if (moviesRes.status === 'fulfilled' && moviesRes.value.success && moviesRes.value.data) {
        setMovies(moviesRes.value.data.items ?? []);
      }
      if (
        trendingRes.status === 'fulfilled' &&
        trendingRes.value.success &&
        trendingRes.value.data
      ) {
        setTopRated(trendingRes.value.data ?? []);
      }
    } catch {
      setError('Failed to load Cinemaxis movies');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMovies();
  }, [loadMovies]);

  const toRailItems = (items: ContentItem[]): RailItem[] =>
    items.map((item) => ({
      id: item.id,
      title: item.title,
      thumbnail: item.mediaAsset?.thumbnailUrl || item.thumbnail,
      subtitle: item.universe?.name || 'Cinemaxis Films',
    }));

  const handleSelect = useCallback(
    (item: RailItem) => {
      router.push(`/watch/${item.id}` as Href);
    },
    [router]
  );

  if (isLoading && movies.length === 0) {
    return <LoadingState text="Loading Cinemaxis Theatre..." />;
  }

  if (error && movies.length === 0) {
    return <ErrorState description={error} onRetry={() => void loadMovies()} />;
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
          <Text style={styles.badgeText}>🍿 CINEMAXIS PREMIERES</Text>
        </View>
      </View>

      <View style={styles.heroSection}>
        <Text style={styles.title}>Cinemaxis Universe</Text>
        <Text style={styles.subtitle}>
          Direct-from-theatre Nollywood blockbusters, award-winning indie cinema, and exclusive 4K
          digital premieres.
        </Text>
      </View>

      <View style={styles.section}>
        <FocusableRow
          title="Featured Blockbusters"
          items={toRailItems(movies)}
          onSelect={handleSelect}
        />
      </View>

      <View style={styles.section}>
        <FocusableRow
          title="Trending Nollywood Hits"
          items={toRailItems(topRated)}
          onSelect={handleSelect}
        />
      </View>
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
    backgroundColor: 'rgba(234, 179, 8, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.warning[500],
  },
  badgeText: {
    color: colors.warning[500],
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
