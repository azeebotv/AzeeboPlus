import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '@/api';
import type { ContentItem } from '@/api';
import type {
  EngagementHistoryItem,
  UserUniverseEngagement,
  HomepageRecommendationGroup,
} from '@/api';
import { colors } from '@/theme';
import { BrandButton } from '@/components/ui/BrandButton';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { logger } from '@/utils/logger';
import HeroCarousel from './HeroCarousel';
import ContentRow from './ContentRow';

interface AuthenticatedHomepageProps {
  siteName?: string;
}

interface UniverseSection {
  universeId: string;
  universeName: string;
  universeIcon?: string;
  items: ContentItem[];
}

export default function AuthenticatedHomepage({
  siteName: _siteName = 'Azeebo+',
}: AuthenticatedHomepageProps) {
  const router = useRouter();
  const { t } = useTranslation();

  // Section 1: Hero Slides
  const [featuredSlides, setFeaturedSlides] = useState<ContentItem[]>([]);

  // Section 2: Recently Watched
  const [recentlyWatched, setRecentlyWatched] = useState<EngagementHistoryItem[]>([]);
  const [recentlyWatchedOffset, setRecentlyWatchedOffset] = useState(0);
  const [hasMoreHistory, setHasMoreHistory] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  // Section 3: Universe-Specific Content
  const [universeSections, setUniverseSections] = useState<UniverseSection[]>([]);
  const [isLoadingUniverses, setIsLoadingUniverses] = useState(true);

  // Section 4: Personalized Recommendations
  const [recommendationGroups, setRecommendationGroups] = useState<HomepageRecommendationGroup[]>(
    []
  );
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(true);

  // Section 5: Supplementary
  const [trendingContent, setTrendingContent] = useState<ContentItem[]>([]);
  const [continueWatching, setContinueWatching] = useState<ContentItem[]>([]);
  const [newReleases, setNewReleases] = useState<ContentItem[]>([]);
  const [popularInRegion, setPopularInRegion] = useState<ContentItem[]>([]);
  const [isLoadingSupplementary, setIsLoadingSupplementary] = useState(true);

  // --- Section 1: Hero Slides ---
  useEffect(() => {
    let cancelled = false;
    const loadSlides = async () => {
      try {
        const response = await api.content.getFeaturedSlides(5);
        if (!cancelled && response.success && response.data) {
          setFeaturedSlides(response.data);
        }
      } catch (error) {
        if (!cancelled) logger.error('Failed to load featured slides:', error);
      }
    };
    loadSlides();
    return () => {
      cancelled = true;
    };
  }, []);

  // --- Section 2: Recently Watched (with infinite scroll) ---
  const HISTORY_PAGE_SIZE = 10;

  const loadRecentlyWatched = useCallback(
    async (cancelled?: boolean) => {
      try {
        const response = await api.content.getContentList({
          page: Math.floor(recentlyWatchedOffset / HISTORY_PAGE_SIZE) + 1,
          limit: HISTORY_PAGE_SIZE,
        });
        if (!cancelled && response.success && response.data) {
          const newItems = response.data.items || [];
          setRecentlyWatched((prev) =>
            recentlyWatchedOffset === 0 ? newItems : [...prev, ...newItems]
          );
          setHasMoreHistory(newItems.length === HISTORY_PAGE_SIZE);
        }
      } catch (error) {
        if (!cancelled) logger.error('Failed to load recently watched:', error);
      } finally {
        if (!cancelled) setIsLoadingHistory(false);
      }
    },
    [recentlyWatchedOffset]
  );

  useEffect(() => {
    let cancelled = false;
    loadRecentlyWatched(cancelled);
    return () => {
      cancelled = true;
    };
  }, []);

  const loadMoreHistory = useCallback(async () => {
    const nextOffset = recentlyWatchedOffset + HISTORY_PAGE_SIZE;
    setRecentlyWatchedOffset(nextOffset);
    try {
      const response = await api.content.getContentList({
        page: Math.floor(nextOffset / HISTORY_PAGE_SIZE) + 1,
        limit: HISTORY_PAGE_SIZE,
      });
      if (response.success && response.data) {
        setRecentlyWatched((prev) => [...prev, ...(response.data?.items || [])]);
        setHasMoreHistory(response.data.items?.length === HISTORY_PAGE_SIZE);
      }
    } catch (error) {
      logger.error('Failed to load more history:', error);
    }
  }, [recentlyWatchedOffset]);

  const recentlyWatchedProgressMap: Record<string, number> = {};
  recentlyWatched.forEach((item) => {
    recentlyWatchedProgressMap[item.contentId] = item.progress;
  });

  // --- Section 3: Universe-Specific Content ---
  useEffect(() => {
    let cancelled = false;
    const loadUniverseContent = async () => {
      try {
        const contentResponse = await api.content.getContentList({ page: 1, limit: 50 });
        if (cancelled) return;
        if (!contentResponse.success || !contentResponse.data) {
          setIsLoadingUniverses(false);
          return;
        }

        const items = contentResponse.data.items || [];
        
        // Group by universe
        const universeMap = new Map<string, { universeId: string; universeName: string; universeIcon?: string; items: ContentItem[] }>();
        
        items.forEach((item: ContentItem) => {
          const universeId = item.universeId || 'unknown';
          const universeName = item.universe?.displayName || item.universe?.name || 'Unknown';
          const universeIcon = item.universe?.icon;
          
          if (!universeMap.has(universeId)) {
            universeMap.set(universeId, {
              universeId,
              universeName,
              universeIcon,
              items: [],
            });
          }
          
          const section = universeMap.get(universeId)!;
          if (section.items.length < 12) {
            section.items.push(item);
          }
        });

        setUniverseSections(Array.from(universeMap.values()).filter((s) => s.items.length > 0));
      } catch (error) {
        if (!cancelled) logger.error('Failed to load universe content:', error);
      } finally {
        if (!cancelled) setIsLoadingUniverses(false);
      }
    };
    loadUniverseContent();
    return () => {
      cancelled = true;
    };
  }, []);
              universeIcon: ue.universeIcon,
              items: contentResponse.success ? contentResponse.data || [] : [],
            };
          } catch (error) {
            if (!cancelled)
              logger.error(`Failed to load content for universe ${ue.universeName}:`, error);
            return {
              universeId: ue.universeId,
              universeName: ue.universeName,
              universeIcon: ue.universeIcon,
              items: [],
            };
          }
        });

        const sections = await Promise.all(contentPromises);
        if (!cancelled) {
          setUniverseSections(sections.filter((s: UniverseSection) => s.items.length > 0));
        }
      } catch (error) {
        if (!cancelled) logger.error('Failed to load universe content:', error);
      } finally {
        if (!cancelled) setIsLoadingUniverses(false);
      }
    };
    loadUniverseContent();
    return () => {
      cancelled = true;
    };
  }, []);

  // --- Section 4: Personalized Recommendations ---
  useEffect(() => {
    let cancelled = false;
    const loadRecommendations = async () => {
      try {
        // Use content list as fallback for recommendations
        const [forYou, trending] = await Promise.allSettled([
          api.content.getContentList({ page: 1, limit: 12 }),
          api.content.getTrendingContent(12),
        ]);

        if (cancelled) return;
        const fallbackGroups: HomepageRecommendationGroup[] = [];
        if (forYou.status === 'fulfilled' && forYou.value.success && forYou.value.data) {
          const items = Array.isArray(forYou.value.data.items) ? forYou.value.data.items : [];
          fallbackGroups.push({
            title: t('home.topPicksForYou'),
            reason: t('home.basedOnHistory'),
            items,
          });
        }
        if (trending.status === 'fulfilled' && trending.value.success && trending.value.data) {
          const items = Array.isArray(trending.value.data) ? trending.value.data : [];
          fallbackGroups.push({
            title: t('home.popularRightNow'),
            reason: t('home.trendingAcrossPlatform'),
            items,
          });
        }
        setRecommendationGroups(fallbackGroups);
      } catch (error) {
        if (!cancelled) logger.error('Failed to load fallback recommendations:', error);
      } finally {
        if (!cancelled) setIsLoadingRecommendations(false);
      }
    };
    loadRecommendations();
    return () => {
      cancelled = true;
    };
  }, []);

  // --- Section 5: Supplementary ---
  useEffect(() => {
    let cancelled = false;
    const loadSupplementary = async () => {
      try {
        const [trendingRes, continueRes, newRes, popularRes] = await Promise.allSettled([
          api.content.getTrendingContent(12),
          api.content.getNewReleases(12),
          api.content.getPopularInRegion(12),
        ]);

        if (cancelled) return;
        if (
          trendingRes.status === 'fulfilled' &&
          trendingRes.value.success &&
          trendingRes.value.data
        ) {
          setTrendingContent(trendingRes.value.data);
        }
        if (
          newRes.status === 'fulfilled' &&
          newRes.value.success &&
          newRes.value.data
        ) {
          setNewReleases(newRes.value.data);
        }
        if (
          popularRes.status === 'fulfilled' &&
          popularRes.value.success &&
          popularRes.value.data
        ) {
          setPopularInRegion(popularRes.value.data);
        }
      } catch (error) {
        if (!cancelled) logger.error('Failed to load supplementary content:', error);
      } finally {
        if (!cancelled) setIsLoadingSupplementary(false);
      }
    };
    loadSupplementary();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* ===== Section 1: Hero Slides Carousel ===== */}
      <HeroCarousel slides={featuredSlides} />

      {/* Personalized greeting */}
      <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.greetingContainer}>
        <Text style={styles.greeting}>{t('home.welcomeBack')}</Text>
      </Animated.View>

      {/* ===== Section 2: Recently Watched ===== */}
      <ContentRow
        title={t('home.recentlyWatched')}
        subtitle={t('home.recentlyWatchedSubtitle')}
        sectionId="recently-watched"
        items={recentlyWatched.map((e) => e.content)}
        isLoading={isLoadingHistory}
        progressMap={recentlyWatchedProgressMap}
        showProgress
        onLoadMore={loadMoreHistory}
        hasMore={hasMoreHistory}
      />

      {/* ===== Section 3: Universe-Specific Content Sections ===== */}
      {universeSections.length > 0 ? (
        <View testID="universe-sections">
          {universeSections.map((section) => (
            <ContentRow
              key={section.universeId}
              title={
                section.universeIcon
                  ? `${section.universeIcon} ${section.universeName}`
                  : section.universeName
              }
              sectionId={`universe-${section.universeId}`}
              items={section.items}
              isLoading={isLoadingUniverses}
            />
          ))}
        </View>
      ) : null}

      {/* ===== Section 4: Personalized Recommendations ===== */}
      {recommendationGroups.length > 0 ? (
        <View testID="recommendation-sections">
          {recommendationGroups.map((group, index) => (
            <ScrollReveal key={`${group.title}-${index}`}>
              <ContentRow
                title={group.title}
                subtitle={group.reason}
                sectionId={`recommendation-${index}`}
                items={group.items}
                isLoading={isLoadingRecommendations}
              />
            </ScrollReveal>
          ))}
        </View>
      ) : null}

      {/* ===== Section 5: Supplementary Sections ===== */}

      {/* Continue Watching */}
      <ContentRow
        title={t('home.continueWatching')}
        subtitle={t('home.continueWatchingSubtitle')}
        sectionId="continue-watching"
        items={continueWatching}
        isLoading={isLoadingSupplementary}
        showProgress
        progressMap={Object.fromEntries(continueWatching.map((c) => [c.id, 0.5]))}
      />

      {/* Trending Now */}
      <ContentRow
        title={t('home.trending')}
        subtitle={t('home.trendingAcrossPlatform')}
        sectionId="trending"
        items={trendingContent}
        isLoading={isLoadingSupplementary}
        cardSize="lg"
      />

      {/* New Releases */}
      <ScrollReveal>
        <ContentRow
          title={t('home.newReleases')}
          subtitle={t('home.newReleasesSubtitle')}
          sectionId="new-releases"
          items={newReleases}
          isLoading={isLoadingSupplementary}
        />
      </ScrollReveal>

      {/* Popular in Your Region */}
      <ScrollReveal>
        <ContentRow
          title={t('home.popularInYourRegion')}
          subtitle={t('home.popularNearYou')}
          sectionId="popular-region"
          items={popularInRegion}
          isLoading={isLoadingSupplementary}
        />
      </ScrollReveal>

      {/* Referral CTA */}
      <ScrollReveal>
        <LinearGradient
          colors={[colors.red, colors.primary[500]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.referralCard}
        >
          <View style={styles.referralContent}>
            <Text style={styles.referralTitle}>{t('home.inviteFriends')}</Text>
            <Text style={styles.referralDescription}>{t('home.inviteFriendsDescription')}</Text>
            <BrandButton
              title={t('home.shareYourLink')}
              onPress={() => router.push('/(tabs)/referral')}
              variant="dark"
            />
          </View>
        </LinearGradient>
      </ScrollReveal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  greetingContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 4,
  },
  greeting: {
    color: colors.text.primary,
    fontSize: 24,
    fontWeight: '800',
  },
  referralCard: {
    margin: 20,
    borderRadius: 20,
    overflow: 'hidden',
    padding: 24,
    alignItems: 'center',
  },
  referralContent: {
    alignItems: 'center',
    zIndex: 10,
  },
  referralTitle: {
    color: colors.text.primary,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  referralDescription: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 20,
  },
});
