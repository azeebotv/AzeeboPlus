'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import type { ContentItem, RecommendationGroup } from '@/lib/api';
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
  const [recentlyWatched, setRecentlyWatched] = useState<ContentItem[]>([]);
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
  const [continueWatching] = useState<ContentItem[]>([]);
  const [newReleases, setNewReleases] = useState<ContentItem[]>([]);
  const [popularInRegion, setPopularInRegion] = useState<ContentItem[]>([]);
  const [isLoadingSupplementary, setIsLoadingSupplementary] = useState(true);

  // --- Single API call for all home page data ---
  useEffect(() => {
    const loadAllData = async () => {
      try {
        // Use the combined home feed endpoint
        const homeResponse = await api.content.getHomeFeed();

        if (homeResponse.success && homeResponse.data) {
          const { trending, recommended, latest } = homeResponse.data;

          // Set hero slides from trending (top 5)
          setFeaturedSlides((trending || []).slice(0, 5));

          // Set recently watched from latest
          setRecentlyWatched(latest || []);
          setIsLoadingHistory(false);

          // Set trending content
          setTrendingContent(trending || []);

          // Set recommendations
          if (recommended && recommended.length > 0) {
            setRecommendationGroups([
              {
                title: 'Recommended for You',
                reason: 'Based on your viewing history',
                items: recommended,
              },
            ]);
          }

          // Group by universe for universe sections
          const allContent = [...(trending || []), ...(latest || [])];
          const universeMap = new Map<string, UniverseSection>();

          allContent.forEach((item) => {
            const universeId = item.universeId || 'unknown';
            const universeName = item.universe?.name || 'Unknown';
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
          setIsLoadingUniverses(false);

          // Set new releases and popular
          setNewReleases((latest || []).slice(0, 12));
          setPopularInRegion((trending || []).slice(0, 12));
        }
      } catch {
        // Graceful degradation - load individual sections
        try {
          const [slidesRes, trendingRes, newRes, popularRes] = await Promise.allSettled([
            api.content.getFeaturedSlides(5),
            api.content.getTrendingContent(12),
            api.content.getNewReleases(12),
            api.content.getPopularInRegion(12),
          ]);

          if (slidesRes.status === 'fulfilled' && slidesRes.value.success) {
            setFeaturedSlides(slidesRes.value.data || []);
          }
          if (trendingRes.status === 'fulfilled' && trendingRes.value.success) {
            setTrendingContent(trendingRes.value.data || []);
          }
          if (newRes.status === 'fulfilled' && newRes.value.success) {
            setNewReleases(newRes.value.data || []);
          }
          if (popularRes.status === 'fulfilled' && popularRes.value.success) {
            setPopularInRegion(popularRes.value.data || []);
          }
        } catch {
          // Complete fallback
        }
      } finally {
        setIsLoadingHistory(false);
        setIsLoadingUniverses(false);
        setIsLoadingRecommendations(false);
        setIsLoadingSupplementary(false);
      }
    };
    loadAllData();
  }, []);

  const HISTORY_PAGE_SIZE = 10;

  const loadMoreHistory = useCallback(async () => {
    const nextOffset = recentlyWatchedOffset + HISTORY_PAGE_SIZE;
    setRecentlyWatchedOffset(nextOffset);
    try {
      const response = await api.content.getContentList({
        page: Math.floor(nextOffset / HISTORY_PAGE_SIZE) + 1,
        limit: HISTORY_PAGE_SIZE,
      });
      if (response.success && response.data) {
        const newItems = Array.isArray(response.data.items) ? response.data.items : [];
        setRecentlyWatched((prev) => [...prev, ...newItems]);
        setHasMoreHistory(newItems.length === HISTORY_PAGE_SIZE);
      }
    } catch {
      // Graceful degradation
    }
  }, [recentlyWatchedOffset]);

  // Build progress map for recently watched
  const recentlyWatchedProgressMap: Record<string, number> = {};
  recentlyWatched.forEach((item) => {
    recentlyWatchedProgressMap[item.id] = 0;
  });

  // --- Section 4: Personalized Recommendations ---
  useEffect(() => {
    const loadRecommendations = async () => {
      try {
        // Use content list as fallback for recommendations
        const [forYou, trending] = await Promise.allSettled([
          api.content.getContentList({ page: 1, limit: 12 }),
          api.content.getTrendingContent(12),
        ]);

        const fallbackGroups: RecommendationGroup[] = [];
        if (forYou.status === 'fulfilled' && forYou.value.success && forYou.value.data) {
          const items = Array.isArray(forYou.value.data.items)
            ? forYou.value.data.items.map(extractContentItem)
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
        const [trendingRes, newRes, popularRes] = await Promise.allSettled([
          api.content.getTrendingContent(12),
          api.content.getNewReleases(12),
          api.content.getPopularInRegion(12),
        ]);

        if (
          trendingRes.status === 'fulfilled' &&
          trendingRes.value.success &&
          Array.isArray(trendingRes.value.data)
        ) {
          setTrendingContent(trendingRes.value.data);
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
          items={recentlyWatched}
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
          progressMap={
            Object.fromEntries(
              continueWatching.map((c) => [
                c.id,
                (c as ContentItem & { progress?: number }).progress ?? 0.5,
              ])
            ) as Record<string, number>
          }
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
                    style={{ background: '#1A0A0A', color: 'var(--brand-white)' }}
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
