'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import type { ContentItem, EngagementHistoryItem, RecommendationGroup } from '@/lib/api';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import analytics from '@/lib/analytics';
import AppHeader from '../layout/AppHeader';
import AppFooter from '../layout/AppFooter';
import HeroSlides from './HeroSlides';
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- recommendation API responses may have nested content structure
function extractContentItem(r: any): ContentItem {
  return r.content || r;
}

export default function AuthenticatedHomepage({
  siteName = 'Azeebo+',
}: AuthenticatedHomepageProps): React.JSX.Element {
  const { user } = useAuth();

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
  const [recommendationGroups, setRecommendationGroups] = useState<RecommendationGroup[]>([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(true);

  // Section 5: Supplementary sections
  const [trendingContent, setTrendingContent] = useState<ContentItem[]>([]);
  const [continueWatching, setContinueWatching] = useState<ContentItem[]>([]);
  const [newReleases, setNewReleases] = useState<ContentItem[]>([]);
  const [popularInRegion, setPopularInRegion] = useState<ContentItem[]>([]);
  const [isLoadingSupplementary, setIsLoadingSupplementary] = useState(true);

  // --- Section 1: Hero Slides ---
  useEffect(() => {
    const loadSlides = async () => {
      try {
        const response = await api.engagement.getFeaturedSlides(5);
        if (response.success && Array.isArray(response.data)) {
          setFeaturedSlides(response.data);
        }
      } catch {
        // Graceful degradation
      }
    };
    loadSlides();
  }, []);

  // --- Section 2: Recently Watched (with infinite scroll) ---
  const HISTORY_PAGE_SIZE = 10;

  const loadRecentlyWatched = useCallback(async () => {
    try {
      const response = await api.engagement.getRecentlyWatched(
        HISTORY_PAGE_SIZE,
        recentlyWatchedOffset
      );
      if (response.success && response.data) {
        const newItems = Array.isArray(response.data.items) ? response.data.items : [];
        setRecentlyWatched((prev) =>
          recentlyWatchedOffset === 0 ? newItems : [...prev, ...newItems]
        );
        setHasMoreHistory(!!response.data.hasMore);
      }
    } catch {
      // Graceful degradation
    } finally {
      setIsLoadingHistory(false);
    }
  }, [recentlyWatchedOffset]);

  useEffect(() => {
    loadRecentlyWatched();
  }, []);

  const loadMoreHistory = useCallback(async () => {
    const nextOffset = recentlyWatchedOffset + HISTORY_PAGE_SIZE;
    setRecentlyWatchedOffset(nextOffset);
    try {
      const response = await api.engagement.getRecentlyWatched(HISTORY_PAGE_SIZE, nextOffset);
      if (response.success && response.data) {
        setRecentlyWatched((prev) => [...prev, ...(response.data?.items || [])]);
        setHasMoreHistory(!!response.data.hasMore);
      }
    } catch {
      // Graceful degradation
    }
  }, [recentlyWatchedOffset]);

  // Build progress map for recently watched
  const recentlyWatchedProgressMap: Record<string, number> = {};
  recentlyWatched.forEach((item) => {
    recentlyWatchedProgressMap[item.contentId] = item.progress;
  });

  // --- Section 3: Universe-Specific Content ---
  useEffect(() => {
    const loadUniverseContent = async () => {
      try {
        const engagementResponse = await api.engagement.getUniverseEngagement();
        if (!engagementResponse.success || !engagementResponse.data) {
          setIsLoadingUniverses(false);
          return;
        }

        const universeEngagement = Array.isArray(engagementResponse.data)
          ? engagementResponse.data.sort((a, b) => b.engagementCount - a.engagementCount)
          : [];

        const contentPromises = universeEngagement.map(async (ue) => {
          try {
            const contentResponse = await api.engagement.getContentByUniverse(ue.universeId, 12);
            return {
              universeId: ue.universeId,
              universeName: ue.universeName,
              universeIcon: ue.universeIcon,
              items: contentResponse.success
                ? Array.isArray(contentResponse.data)
                  ? contentResponse.data
                  : []
                : [],
            };
          } catch {
            return {
              universeId: ue.universeId,
              universeName: ue.universeName,
              universeIcon: ue.universeIcon,
              items: [],
            };
          }
        });

        const sections = await Promise.all(contentPromises);
        setUniverseSections(sections.filter((s) => s.items.length > 0));
      } catch {
        // Graceful degradation
      } finally {
        setIsLoadingUniverses(false);
      }
    };
    loadUniverseContent();
  }, []);

  // --- Section 4: Personalized Recommendations ---
  useEffect(() => {
    const loadRecommendations = async () => {
      try {
        const response = await api.engagement.getPersonalizedRecommendations();
        if (response.success && response.data) {
          setRecommendationGroups(response.data);
        }
      } catch {
        // Graceful degradation — fall back to generic recommendations
        try {
          const [forYou, trending] = await Promise.allSettled([
            api.recommendation.getForYou(12),
            api.recommendation.getTrending(12),
          ]);

          const fallbackGroups: RecommendationGroup[] = [];
          if (forYou.status === 'fulfilled' && forYou.value.success && forYou.value.data) {
            const items = Array.isArray(forYou.value.data)
              ? forYou.value.data.map(extractContentItem)
              : [];
            fallbackGroups.push({
              title: 'Top picks for you',
              reason: 'Based on your viewing history',
              items,
            });
          }
          if (trending.status === 'fulfilled' && trending.value.success && trending.value.data) {
            const items = Array.isArray(trending.value.data)
              ? trending.value.data.map(extractContentItem)
              : [];
            fallbackGroups.push({
              title: 'Popular right now',
              reason: 'Trending across the platform',
              items,
            });
          }
          setRecommendationGroups(fallbackGroups);
        } catch {
          // Complete fallback
        }
      } finally {
        setIsLoadingRecommendations(false);
      }
    };
    loadRecommendations();
  }, []);

  // --- Section 5: Supplementary Sections ---
  useEffect(() => {
    const loadSupplementary = async () => {
      try {
        const [trendingRes, continueRes, newRes, popularRes] = await Promise.allSettled([
          api.content.getTrendingContent(12),
          api.engagement.getContinueWatching(10),
          api.engagement.getNewReleases(12),
          api.engagement.getPopularInRegion(12),
        ]);

        if (
          trendingRes.status === 'fulfilled' &&
          trendingRes.value.success &&
          Array.isArray(trendingRes.value.data)
        ) {
          setTrendingContent(trendingRes.value.data);
        }
        if (
          continueRes.status === 'fulfilled' &&
          continueRes.value.success &&
          Array.isArray(continueRes.value.data)
        ) {
          setContinueWatching(continueRes.value.data);
        }
        if (
          newRes.status === 'fulfilled' &&
          newRes.value.success &&
          Array.isArray(newRes.value.data)
        ) {
          setNewReleases(newRes.value.data);
        }
        if (
          popularRes.status === 'fulfilled' &&
          popularRes.value.success &&
          Array.isArray(popularRes.value.data)
        ) {
          setPopularInRegion(popularRes.value.data);
        }
      } catch {
        // Graceful degradation
      } finally {
        setIsLoadingSupplementary(false);
      }
    };
    loadSupplementary();
  }, []);

  // Track which homepage version is served
  useEffect(() => {
    analytics.homepageVersionServed(true);
  }, []);

  return (
    <div className="min-h-screen az-nollywood-bg">
      <AppHeader active="Home" />

      <main>
        {/* ===== Section 1: Hero Slides Carousel ===== */}
        <HeroSlides slides={featuredSlides} />

        {/* Personalized greeting */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-2">
          <motion.h1
            className="az-headline text-white text-2xl sm:text-3xl"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            Welcome back{user?.displayName ? `, ${user.displayName}` : ''}
          </motion.h1>
        </div>

        {/* ===== Section 2: Recently Watched / Viewed ===== */}
        <ContentRow
          title="Recently Watched"
          subtitle="Continue where you left off"
          sectionId="recently-watched"
          items={recentlyWatched.map((e) => e.content)}
          isLoading={isLoadingHistory}
          progressMap={recentlyWatchedProgressMap}
          showProgress
          onLoadMore={loadMoreHistory}
          hasMore={hasMoreHistory}
        />

        {/* ===== Section 3: Universe-Specific Content Sections ===== */}
        {universeSections.length > 0 && (
          <div data-testid="universe-sections">
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
          </div>
        )}

        {/* ===== Section 4: Personalized Recommendations ===== */}
        {recommendationGroups.length > 0 && (
          <div data-testid="recommendation-sections">
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
          </div>
        )}

        {/* ===== Section 5: Supplementary Sections ===== */}

        {/* Continue Watching */}
        <ContentRow
          title="Continue Watching"
          subtitle="Pick up where you left off"
          sectionId="continue-watching"
          items={continueWatching}
          isLoading={isLoadingSupplementary}
          showProgress
          progressMap={Object.fromEntries(continueWatching.map((c) => [c.id, (c as ContentItem & { progress?: number }).progress ?? 0.5])) as Record<string, number>}
        />

        {/* Trending Now */}
        <ContentRow
          title="Trending Now"
          subtitle="Popular across the platform"
          sectionId="trending"
          items={trendingContent}
          isLoading={isLoadingSupplementary}
          cardSize="lg"
        />

        {/* New Releases */}
        <ScrollReveal>
          <ContentRow
            title="New Releases"
            subtitle="Fresh content just dropped"
            sectionId="new-releases"
            items={newReleases}
            isLoading={isLoadingSupplementary}
          />
        </ScrollReveal>

        {/* Popular in Your Region */}
        <ScrollReveal>
          <ContentRow
            title="Popular in Your Region"
            subtitle="What's hot near you"
            sectionId="popular-region"
            items={popularInRegion}
            isLoading={isLoadingSupplementary}
          />
        </ScrollReveal>

        {/* Bottom CTA for referrals */}
        <ScrollReveal>
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
            <div
              className="relative py-10 sm:py-14 rounded-3xl overflow-hidden text-center"
              style={{
                background: 'linear-gradient(135deg, #CC1C1C 0%, #E8420A 100%)',
                boxShadow: '0 20px 50px rgba(204,28,28,0.35)',
              }}
            >
              <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6">
                <h3 className="az-headline text-white text-2xl sm:text-3xl lg:text-4xl mb-3">
                  Invite Friends, Earn Rewards
                </h3>
                <p className="text-sm sm:text-base text-white/90 mb-6 max-w-xl mx-auto">
                  Share Azeebo+ with friends and earn rewards for every friend who signs up.
                </p>
                <a href="/referral">
                  <motion.button
                    type="button"
                    className="px-6 sm:px-8 py-3 rounded-full text-sm sm:text-base font-bold transition-all"
                    style={{ background: '#1A0A0A', color: '#fff' }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Share Your Link
                  </motion.button>
                </a>
              </div>
            </div>
          </section>
        </ScrollReveal>
      </main>

      <AppFooter siteName={siteName} />
    </div>
  );
}
