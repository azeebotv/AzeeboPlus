import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { contentApi, type ContentItem } from '@azeebo/react-data';
import { useAuth } from '@azeebo/react-data/contexts/AuthContext';
import {
  FocusableCard,
  FocusableButton,
  FocusableRow,
  type RailItem,
} from '../src/components/Focusable';
import { TVNavRail } from '../src/components/TVNavRail';
import { LoadingState, ErrorState } from '../src/components/StateContainers';
import { logger } from '@azeebo/react-data/utils/logger';
import { colors, tvTypography, tvSpacing, tvDims, tvRadius } from '../src/theme';
import { useFocusEffect, type Href } from 'expo-router';

/**
 * TV Home — 10-foot UI.
 *
 * Layout: hero spotlight on top, content rails below. The hero grabs initial
 * focus on mount so the D-pad works immediately after launch. Every
 * interactive element is a Focusable* primitive, so focus order follows the
 * visual reading order (hero → rail cards left-to-right, row-by-row).
 */
export default function TVHomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { isAuthenticated, user } = useAuth();
  const [featured, setFeatured] = useState<ContentItem[]>([]);
  const [trending, setTrending] = useState<ContentItem[]>([]);
  const [newReleases, setNewReleases] = useState<ContentItem[]>([]);
  const [recentlyWatched, setRecentlyWatched] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  const loadContent = useCallback(async () => {
    setIsLoading(true);
    try {
      const [featuredRes, trendingRes, newRes, historyRes] = await Promise.allSettled([
        contentApi.getFeaturedSlides(5),
        contentApi.getTrendingContent(12),
        contentApi.getNewReleases(12),
        // M2 subset: real lean-back value — resume what you were watching.
        // Fails softly for guests (guarded by isAuthenticated below) and is
        // never a reason to fail the whole home load.
        contentApi.getWatchHistory(1, 12),
      ]);
      if (
        featuredRes.status === 'fulfilled' &&
        featuredRes.value.success &&
        featuredRes.value.data
      ) {
        setFeatured(featuredRes.value.data);
      }
      if (
        trendingRes.status === 'fulfilled' &&
        trendingRes.value.success &&
        trendingRes.value.data
      ) {
        setTrending(trendingRes.value.data);
      }
      if (newRes.status === 'fulfilled' && newRes.value.success && newRes.value.data) {
        setNewReleases(newRes.value.data);
      }
      if (historyRes.status === 'fulfilled' && historyRes.value.success && historyRes.value.data) {
        setRecentlyWatched(historyRes.value.data.items ?? []);
      }
      // All three rails empty = total load failure (network/API down). Track
      // it so the screen offers a Retry instead of a dead empty hero.
      const anyLoaded =
        (featuredRes.status === 'fulfilled' &&
          featuredRes.value.success &&
          !!featuredRes.value.data?.length) ||
        (trendingRes.status === 'fulfilled' &&
          trendingRes.value.success &&
          !!trendingRes.value.data?.length) ||
        (newRes.status === 'fulfilled' && newRes.value.success && !!newRes.value.data?.length);
      if (!anyLoaded) {
        setLoadFailed(true);
      }
    } catch (error) {
      logger.error('TV home load failed:', error);
      setLoadFailed(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadContent();
  }, [loadContent]);

  const toRailItems = (items: ContentItem[]): RailItem[] =>
    items.map((item) => ({
      id: item.id,
      title: item.title,
      thumbnail: item.mediaAsset?.thumbnailUrl || item.thumbnail,
      subtitle: item.creator?.name,
    }));

  const handleSelect = useCallback(
    (item: RailItem) => {
      router.push(`/watch/${item.id}`);
    },
    [router]
  );

  const hero = featured[0];

  // Unauthenticated TVs land on the device-link sign-in screen. Re-check on
  // every focus so returning from sign-in (or a logged-out session restore)
  // redirects immediately.
  useFocusEffect(
    useCallback(() => {
      if (!isLoading && !isAuthenticated) {
        // Typed routes are generated at dev/build time; signin is a new route,
        // so cast like the mobile app does for non-generated targets.
        router.replace('/signin' as Href);
      }
    }, [isLoading, isAuthenticated, router])
  );

  if (isLoading) {
    return <LoadingState text={t('common.loading')} />;
  }

  if (!isAuthenticated) {
    return null; // redirect in flight
  }

  // Total load failure: offer a D-pad-focusable retry instead of a dead hero.
  if (loadFailed) {
    return (
      <ErrorState
        description="Could not load content. Check your connection."
        onRetry={() => void loadContent()}
      />
    );
  }

  return (
    <View style={styles.rootContainer}>
      <TVNavRail />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero spotlight ─────────────────────────────────── */}
        {hero ? (
          <FocusableCard
            onPress={() => router.push(`/watch/${hero.id}`)}
            hasTVPreferredFocus
            style={styles.hero}
            accessibilityLabel={`${t('content.watch')} ${hero.title}`}
          >
            <Image
              source={{
                uri: hero.mediaAsset?.thumbnailUrl || hero.thumbnail,
              }}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
            />
            <LinearGradient
              colors={['rgba(11,9,14,0.95)', 'rgba(11,9,14,0.5)', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            <LinearGradient
              colors={['rgba(11,9,14,0)', 'rgba(11,9,14,0.9)']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.heroContent}>
              <View style={styles.metaBadgeRow}>
                {hero.universe?.name ? (
                  <View style={styles.universeBadge}>
                    <Text style={styles.universeBadgeText}>{hero.universe.name}</Text>
                  </View>
                ) : null}
                <View style={styles.techBadge}>
                  <Text style={styles.techBadgeText}>4K ULTRA HD</Text>
                </View>
                <View style={styles.techBadge}>
                  <Text style={styles.techBadgeText}>DOLBY ATMOS</Text>
                </View>
                <View style={styles.ratingBadge}>
                  <Text style={styles.ratingBadgeText}>★ 4.8</Text>
                </View>
              </View>

              <Text style={styles.heroTitle} numberOfLines={2}>
                {hero.title}
              </Text>
              {hero.description ? (
                <Text style={styles.heroDescription} numberOfLines={2}>
                  {hero.description}
                </Text>
              ) : null}
              <View style={styles.heroActions}>
                <FocusableButton
                  title={`▶ ${t('content.watch')}`}
                  variant="primary"
                  onPress={() => router.push(`/watch/${hero.id}`)}
                />
                <FocusableButton
                  title="+ My List"
                  variant="secondary"
                  onPress={() => router.push('/library' as Href)}
                />
              </View>
            </View>
          </FocusableCard>
        ) : (
          <View style={[styles.hero, styles.heroEmpty]}>
            <Text style={styles.heroEmptyTitle}>{t('home.greeting')}</Text>
            <Text style={styles.heroEmptySubtitle}>{t('home.greetingSecondary')}</Text>
          </View>
        )}

        {/* ── Personalized greeting + account shortcuts ──────── */}
        {isAuthenticated && user?.name ? (
          <Text style={styles.greeting}>
            {t('home.welcomeBack')}, {user.name}
          </Text>
        ) : null}
        {isAuthenticated ? (
          <View style={styles.walletRow}>
            <FocusableButton
              title="Add money to wallet"
              variant="secondary"
              onPress={() => router.push('/wallet/fund' as Href)}
            />
            {/* M2: search entry point — the lean-back verticals start here. */}
            <FocusableButton
              title="Search"
              variant="secondary"
              onPress={() => router.push('/search' as Href)}
            />
            <FocusableButton
              title="Settings"
              variant="secondary"
              onPress={() => router.push('/settings' as Href)}
            />
          </View>
        ) : null}

        {/* ── Universe Navigation Shortcuts ──────────────────── */}
        <View style={styles.universeNavRow}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.universeNavScroll}
          >
            <FocusableButton
              title="Cinemaxis"
              variant="secondary"
              onPress={() => router.push('/movies' as Href)}
            />
            <FocusableButton
              title="Reality"
              variant="secondary"
              onPress={() => router.push('/reality' as Href)}
            />
            <FocusableButton
              title="Comedy"
              variant="secondary"
              onPress={() => router.push('/comedy' as Href)}
            />
            <FocusableButton
              title="Sports"
              variant="secondary"
              onPress={() => router.push('/sports' as Href)}
            />
            <FocusableButton
              title="Lifestyle"
              variant="secondary"
              onPress={() => router.push('/lifestyle' as Href)}
            />
            <FocusableButton
              title="Music"
              variant="secondary"
              onPress={() => router.push('/music' as Href)}
            />
            <FocusableButton
              title="Agbala"
              variant="secondary"
              onPress={() => router.push('/vertical' as Href)}
            />
            <FocusableButton
              title="Games"
              variant="secondary"
              onPress={() => router.push('/games' as Href)}
            />
            <FocusableButton
              title="Watch Party"
              variant="secondary"
              onPress={() => router.push('/watch-party' as Href)}
            />
            <FocusableButton
              title="Bundles"
              variant="secondary"
              onPress={() => router.push('/bundles' as Href)}
            />
          </ScrollView>
        </View>

        {/* ── Content rails ──────────────────────────────────── */}
        {recentlyWatched.length > 0 ? (
          <FocusableRow
            title={t('home.recentlyWatched')}
            items={toRailItems(recentlyWatched)}
            onSelect={handleSelect}
          />
        ) : null}
        <FocusableRow
          title={t('home.trending')}
          items={toRailItems(trending)}
          onSelect={handleSelect}
        />
        <FocusableRow
          title={t('home.newReleases')}
          items={toRailItems(newReleases)}
          onSelect={handleSelect}
        />

        {!hero && trending.length === 0 && newReleases.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>{t('home.emptyState')}</Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.bg.primary,
  },
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  metaBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tvSpacing.sm,
    marginBottom: tvSpacing.sm,
  },
  techBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  techBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  ratingBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  ratingBadgeText: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '800',
  },
  content: {
    paddingBottom: tvSpacing.section,
  },
  hero: {
    height: tvDims.heroHeight,
    borderRadius: 0,
    marginHorizontal: 0,
  },
  heroEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg.secondary,
  },
  heroEmptyTitle: {
    color: colors.text.primary,
    fontSize: tvTypography.fontSize.hero,
    fontWeight: tvTypography.fontWeight.extrabold,
  },
  heroEmptySubtitle: {
    color: colors.text.secondary,
    fontSize: tvTypography.fontSize.lg,
    marginTop: tvSpacing.sm,
  },
  heroContent: {
    position: 'absolute',
    left: tvSpacing.xxl,
    bottom: tvSpacing.xxl,
    maxWidth: '60%',
  },
  universeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(232,66,10,0.3)',
    paddingHorizontal: tvSpacing.md,
    paddingVertical: tvSpacing.xs,
    borderRadius: tvRadius.pill,
    marginBottom: tvSpacing.sm,
  },
  universeBadgeText: {
    color: colors.primary[500],
    fontSize: tvTypography.fontSize.xs,
    fontWeight: tvTypography.fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  heroTitle: {
    color: colors.text.primary,
    fontSize: tvTypography.fontSize.xxl,
    fontWeight: tvTypography.fontWeight.extrabold,
    lineHeight: 48,
    marginBottom: tvSpacing.sm,
  },
  heroDescription: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: tvTypography.fontSize.base,
    lineHeight: 28,
    marginBottom: tvSpacing.lg,
  },
  heroActions: {
    flexDirection: 'row',
    gap: tvSpacing.md,
  },
  greeting: {
    color: colors.text.primary,
    fontSize: tvTypography.fontSize.xl,
    fontWeight: tvTypography.fontWeight.bold,
    marginHorizontal: tvSpacing.xxl,
    marginTop: tvSpacing.lg,
    marginBottom: tvSpacing.md,
  },
  walletRow: {
    flexDirection: 'row',
    gap: tvSpacing.md,
    marginHorizontal: tvSpacing.xxl,
    marginBottom: tvSpacing.md,
  },
  universeNavRow: {
    marginHorizontal: tvSpacing.xxl,
    marginBottom: tvSpacing.lg,
  },
  universeNavScroll: {
    flexDirection: 'row',
    gap: tvSpacing.md,
  },
  emptyState: {
    padding: tvSpacing.xxl,
    alignItems: 'center',
  },
  emptyStateText: {
    color: colors.text.secondary,
    fontSize: tvTypography.fontSize.lg,
  },
});
