import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { contentApi, type ContentItem } from '@azeebo/react-data';
import { FocusableButton, FocusableRow, type RailItem } from '../../src/components/Focusable';
import { LoadingState, ErrorState } from '../../src/components/StateContainers';
import { logger } from '@azeebo/react-data/utils/logger';
import { colors, tvTypography, tvSpacing, tvRadius } from '../../src/theme';

export default function TVContentDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const [content, setContent] = useState<ContentItem | null>(null);
  const [recommendations, setRecommendations] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const [detailRes, relatedRes] = await Promise.allSettled([
        contentApi.getContentById(id),
        contentApi.getTrendingContent(10),
      ]);

      if (detailRes.status === 'fulfilled' && detailRes.value.success && detailRes.value.data) {
        setContent(detailRes.value.data);
      } else {
        setError('Content details unavailable.');
      }

      if (relatedRes.status === 'fulfilled' && relatedRes.value.success && relatedRes.value.data) {
        setRecommendations(relatedRes.value.data);
      }
    } catch (err) {
      logger.error('Failed to load detail screen:', err);
      setError('Failed to connect to catalog.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const toRailItems = (items: ContentItem[]): RailItem[] =>
    items.map((item) => ({
      id: item.id,
      title: item.title,
      thumbnail: item.mediaAsset?.thumbnailUrl || item.thumbnail,
      subtitle: item.universe?.name || item.creator?.name,
    }));

  if (isLoading) {
    return <LoadingState text={t('common.loading', 'Loading details...')} />;
  }

  if (error || !content) {
    return (
      <ErrorState
        description={error || 'Could not load content.'}
        onRetry={() => void loadData()}
      />
    );
  }

  const backdrop = content.mediaAsset?.thumbnailUrl || content.thumbnail;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Hero Backdrop ───────────────────────────────────── */}
      <View style={styles.heroContainer}>
        {backdrop ? (
          <Image source={{ uri: backdrop }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : null}
        <LinearGradient
          colors={['rgba(11,9,14,0.3)', 'rgba(11,9,14,0.95)']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.heroOverlay}>
          <FocusableButton title="← Back" variant="secondary" onPress={() => router.back()} />
          {content.universe?.name ? (
            <View style={styles.universeBadge}>
              <Text style={styles.universeBadgeText}>{content.universe.name}</Text>
            </View>
          ) : null}
          <Text style={styles.title} numberOfLines={2}>
            {content.title}
          </Text>
          <View style={styles.metaRow}>
            {content.duration ? (
              <Text style={styles.metaText}>{Math.round(content.duration / 60)} min</Text>
            ) : null}
            {content.categories?.[0]?.name ? (
              <Text style={styles.metaText}>• {content.categories[0].name}</Text>
            ) : null}
            <Text style={styles.metaText}>• {content.isPremium ? 'Premium' : 'Included'}</Text>
          </View>
          <Text style={styles.description} numberOfLines={3}>
            {content.description ||
              'Experience this feature on Azeebo+ in Ultra HD with high dynamic range audio.'}
          </Text>
          <View style={styles.actions}>
            <FocusableButton
              title="▶ Play Now"
              variant="primary"
              hasTVPreferredFocus
              onPress={() => router.push(`/watch/${content.id}` as Href)}
            />
            <FocusableButton
              title={isSaved ? '✓ In Watchlist' : '+ Watchlist'}
              variant="secondary"
              onPress={() => setIsSaved(!isSaved)}
            />
          </View>
        </View>
      </View>

      {/* ── Related Content Rail ────────────────────────────── */}
      {recommendations.length > 0 ? (
        <View style={styles.railSection}>
          <FocusableRow
            title="More Like This"
            items={toRailItems(recommendations)}
            onSelect={(item) => router.push(`/detail/${item.id}` as Href)}
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
  },
  heroContainer: {
    height: 520,
    justifyContent: 'flex-end',
  },
  heroOverlay: {
    padding: tvSpacing.xxl,
    maxWidth: '65%',
    gap: tvSpacing.md,
  },
  universeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(232,66,10,0.3)',
    paddingHorizontal: tvSpacing.md,
    paddingVertical: tvSpacing.xs,
    borderRadius: tvRadius.pill,
  },
  universeBadgeText: {
    color: colors.primary[500],
    fontSize: tvTypography.fontSize.xs,
    fontWeight: tvTypography.fontWeight.bold,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.text.primary,
    fontSize: tvTypography.fontSize.hero,
    fontWeight: tvTypography.fontWeight.extrabold,
    lineHeight: 60,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tvSpacing.md,
  },
  metaText: {
    color: colors.text.secondary,
    fontSize: tvTypography.fontSize.base,
  },
  description: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: tvTypography.fontSize.base,
    lineHeight: 28,
  },
  actions: {
    flexDirection: 'row',
    gap: tvSpacing.md,
    marginTop: tvSpacing.sm,
  },
  railSection: {
    marginTop: tvSpacing.xl,
  },
});
