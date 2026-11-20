'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Crown, Sparkles, Bookmark, Coins, Share2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useFlags } from '@/context/FlagsContext';
import { api } from '@/lib/api';
import type { ContentItem, RecommendationGroup } from '@/lib/api';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import analytics from '@/lib/analytics';
import AppHeader from '../layout/AppHeader';
import AppFooter from '../layout/AppFooter';
import ExploreUniversesDock from '../layout/ExploreUniversesDock';
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

interface UniverseMeta {
  id: string;
  name: string;
  icon: string;
}

const ALL_UNIVERSES: UniverseMeta[] = [
  { id: 'reality', name: 'Reality TV', icon: '📺' },
  { id: 'movies', name: 'Movies & Cinema', icon: '🎬' },
  { id: 'comedy', name: 'Comedy Hub', icon: '😂' },
  { id: 'sports', name: 'Sports & Odds', icon: '🏆' },
  { id: 'vertical', name: 'Vertical Series', icon: '📱' },
  { id: 'games', name: 'Games & Esports', icon: '🎮' },
  { id: 'creator', name: 'Creator Universe', icon: '✨' },
  { id: 'lifestyle', name: 'Lifestyle & Nightlife', icon: '🧭' },
];

const CATEGORIES = [
  { id: 'all', label: 'All Content' },
  { id: 'reality', label: 'Reality TV' },
  { id: 'movies', label: 'Movies & Series' },
  { id: 'comedy', label: 'Comedy' },
  { id: 'sports', label: 'Sports' },
  { id: 'vertical', label: 'Verticals' },
  { id: 'games', label: 'Games' },
  { id: 'creator', label: 'Creators' },
  { id: 'lifestyle', label: 'Lifestyle' },
];

function extractContentItem(r: ContentItem | { content: ContentItem }): ContentItem {
  return 'content' in r ? r.content : r;
}

export default function AuthenticatedHomepage({
  siteName = 'Azeebo+',
}: AuthenticatedHomepageProps): React.JSX.Element {
  const { user } = useAuth();
  const { isEnabled } = useFlags();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  // web_recommendations_rail (off): gates the personalized recommendation row.
  const showRecommendationsRail = isEnabled('web_recommendations_rail');
  // web_new_home (off): gates the newer home rails (trending / new releases /
  // popular-in-region supplementary sections).
  const showNewHomeRails = isEnabled('web_new_home');

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
        // Fetch home feed (trending, latest, recommended) and all 8 universes in parallel
        const [homeResponse, ...universeResults] = await Promise.all([
          api.content.getHomeFeed(),
          ...ALL_UNIVERSES.map((u) => api.content.getContentByUniverse(u.id, 1, 12)),
        ]);

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

          // Set new releases and popular
          setNewReleases((latest || []).slice(0, 12));
          setPopularInRegion((trending || []).slice(0, 12));
        } else {
          // Graceful fallback for feed
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
            setRecentlyWatched(newRes.value.data || []);
            setNewReleases(newRes.value.data || []);
          }
          if (popularRes.status === 'fulfilled' && popularRes.value.success) {
            setPopularInRegion(popularRes.value.data || []);
          }
        }

        // Build universe sections from all 8 universes
        const sections: UniverseSection[] = [];
        ALL_UNIVERSES.forEach((u, idx) => {
          const res = universeResults[idx];
          const items: ContentItem[] =
            res && res.success && res.data
              ? Array.isArray(res.data)
                ? res.data
                : Array.isArray(res.data.items)
                  ? res.data.items
                  : []
              : [];

          if (items.length > 0) {
            sections.push({
              universeId: u.id,
              universeName: u.name,
              universeIcon: u.icon,
              items,
            });
          }
        });

        setUniverseSections(sections);
        setIsLoadingUniverses(false);
      } catch {
        // Complete fallback
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

  const filteredUniverseSections = useMemo(() => {
    if (selectedCategory === 'all') return universeSections;
    return universeSections.filter((section) => {
      const matchId = section.universeId.toLowerCase();
      const matchName = section.universeName.toLowerCase();
      const cat = selectedCategory.toLowerCase();
      return matchId.includes(cat) || matchName.includes(cat);
    });
  }, [selectedCategory, universeSections]);

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
    <div className="min-h-screen relative overflow-x-hidden bg-az-surface-root text-az-ink">
      <AppHeader active="Home" logoVariant="light" />

      {/* Top Ambient glow */}
      <div
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full blur-[140px] -z-0"
        style={{
          background:
            'radial-gradient(circle, color-mix(in srgb, var(--color-az-scarlet) 18%, transparent) 0%, color-mix(in srgb, var(--color-az-scarlet) 6%, transparent) 50%, transparent 80%)',
        }}
        aria-hidden="true"
      />

      <main className="relative z-10">
        {/* ===== Section 1: Hero Slides Carousel ===== */}
        <HeroSlides slides={featuredSlides} />

        {/* ===== Section 1.5: Personalized User Welcome & Quick Action Bar ===== */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-2">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
            {/* Left: User Identity + VIP Pill */}
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-az-scarlet to-az-flame flex items-center justify-center text-white font-bold text-lg shadow-sm">
                {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'A'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-white text-lg sm:text-xl font-bold">
                    Welcome back{user?.displayName ? `, ${user.displayName}` : ''}
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-az-flame/15 border border-az-flame/30 text-az-flame shadow-sm">
                    <Crown size={11} className="fill-current" />
                    <span>VIP PASS</span>
                  </span>
                </div>
                <p className="text-xs text-az-ink-muted mt-0.5">
                  Stream unlimited movies, reality shows, and live events
                </p>
              </div>
            </div>

            {/* Right: Quick Action Chips */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <Link
                href="/library"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-colors"
              >
                <Bookmark size={13} className="text-az-flame" />
                <span>My Watchlist</span>
              </Link>
              <Link
                href="/wallet"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-colors"
              >
                <Coins size={13} className="text-az-accent-gold" />
                <span>Rewards & Coins</span>
              </Link>
              <a
                href="#recently-watched"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-colors"
              >
                <Sparkles size={13} className="text-az-success-400" />
                <span>Continue Watching</span>
              </a>
            </div>
          </div>
        </section>

        {/* ===== Explore Azeebo+ Universes Dock ===== */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <ExploreUniversesDock />
        </section>

        {/* ===== Category Quick Filter Pills ===== */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                    isSelected
                      ? 'bg-az-flame text-az-surface-root font-bold shadow-az-glow'
                      : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* ===== Section 2: Recently Watched / Viewed ===== */}
        {recentlyWatched.length > 0 && (
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
        )}

        {/* ===== Section: Trending Now (Always Visible) ===== */}
        <ContentRow
          title="🔥 Trending Now"
          subtitle="Popular across Nigeria & globally"
          sectionId="trending"
          items={trendingContent}
          isLoading={isLoadingSupplementary && trendingContent.length === 0}
          cardSize="lg"
        />

        {/* ===== Section 3: Universe-Specific Content Sections ===== */}
        {filteredUniverseSections.length > 0 && (
          <div data-testid="universe-sections">
            {filteredUniverseSections.map((section) => (
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
        {showRecommendationsRail && recommendationGroups.length > 0 && (
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

        {/* ===== Section 5: Supplementary Sections (gated by web_new_home) ===== */}
        {showNewHomeRails && (
          <>
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
          </>
        )}

        {/* Bottom CTA for referrals */}
        <ScrollReveal>
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
            <div className="relative py-10 sm:py-14 rounded-2xl overflow-hidden text-center bg-gradient-to-r from-az-scarlet via-az-flame to-az-scarlet shadow-az-glow">
              <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-black/30 backdrop-blur-md text-white border border-white/20 mb-4">
                  <Coins size={14} className="text-az-accent-gold" />
                  <span>Referral Rewards Program</span>
                </span>
                <h3 className="az-headline text-white text-2xl sm:text-3xl lg:text-4xl mb-3">
                  Invite Friends, Earn Rewards & Coins
                </h3>
                <p className="text-sm sm:text-base text-white/90 mb-6 max-w-xl mx-auto leading-relaxed">
                  Share Azeebo+ with friends and receive 250 bonus coins for every friend who joins.
                  Unlock VIP screenings and creator events.
                </p>
                <Link href="/referral">
                  <motion.button
                    type="button"
                    className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-az-surface-root text-white font-bold text-sm sm:text-base shadow-lg hover:bg-az-surface-panel transition-all"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Share2 size={16} />
                    <span>Share Your Invite Link</span>
                  </motion.button>
                </Link>
              </div>
            </div>
          </section>
        </ScrollReveal>
      </main>

      <AppFooter siteName={siteName} logoVariant="light" />
    </div>
  );
}
