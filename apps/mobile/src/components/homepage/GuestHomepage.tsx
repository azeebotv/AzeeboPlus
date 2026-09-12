import { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useFlags } from '@/contexts/FlagsContext';
import * as Updates from 'expo-updates';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '@/api';
import type { ContentItem } from '@/api';
import { colors, universeColors } from '@/theme';
import { GlassCard } from '@/components/ui/GlassCard';
import { BrandButton } from '@/components/ui/BrandButton';
import { AmbientGlow } from '@/components/motion/AmbientGlow';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { logger } from '@/utils/logger';
import HeroCarousel from './HeroCarousel';
import ContentRow from './ContentRow';

const CATEGORY_CARDS = [
  {
    category: 'Reality',
    sub: 'The real you wants to play',
    iconName: 'tv-outline' as const,
    color: colors.primary[500],
  },
  {
    category: 'Vertical',
    sub: "Dive into what's trending",
    iconName: 'phone-portrait-outline' as const,
    color: colors.red,
  },
  {
    category: 'Movie',
    sub: 'Nollywood & Beyond',
    iconName: 'film-outline' as const,
    color: colors.primary[500],
  },
  {
    category: 'Creator',
    sub: 'Watch. Follow. Repeat.',
    iconName: 'videocam-outline' as const,
    color: colors.bg.tertiary,
  },
  {
    category: 'Cinemaxis',
    sub: 'Explore Cinemaxis',
    iconName: 'sparkles-outline' as const,
    color: colors.bg.secondary,
  },
  {
    category: 'Comedy',
    sub: 'Laugh Out Loud',
    iconName: 'happy-outline' as const,
    color: colors.bg.tertiary,
  },
  {
    category: 'Sports',
    sub: 'Live & Loud',
    iconName: 'football-outline' as const,
    color: colors.bg.secondary,
  },
  {
    category: 'Lifestyle',
    sub: 'Elevate your lifestyle',
    iconName: 'color-palette-outline' as const,
    color: universeColors.lifestyle,
  },
  {
    category: 'Games',
    sub: 'Play & Win',
    iconName: 'game-controller-outline' as const,
    color: universeColors.games,
  },
];

export default function GuestHomepage() {
  const { universeEnabled } = useFlags();
  const router = useRouter();
  const { t } = useTranslation();
  const [featuredContent, setFeaturedContent] = useState<ContentItem[]>([]);
  const [trendingContent, setTrendingContent] = useState<ContentItem[]>([]);
  const [hasOTAUpdate, setHasOTAUpdate] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const checkForOTAUpdate = async () => {
      try {
        if (!Updates.channel || !__DEV__) return;
        const update = await Updates.checkForUpdateAsync();
        if (!cancelled && update.isAvailable) setHasOTAUpdate(true);
      } catch (error) {
        if (!cancelled) logger.error('Failed to check for OTA update:', error);
      }
    };

    const loadGuestContent = async () => {
      try {
        const [featured, trending] = await Promise.allSettled([
          api.content.getFeaturedContent(5),
          api.content.getTrendingContent(12),
        ]);
        if (cancelled) return;
        if (featured.status === 'fulfilled' && featured.value.success && featured.value.data) {
          setFeaturedContent(featured.value.data);
        }
        if (trending.status === 'fulfilled' && trending.value.success && trending.value.data) {
          setTrendingContent(trending.value.data);
        }
      } catch (error) {
        if (!cancelled) logger.error('Failed to load guest content:', error);
      }
    };

    checkForOTAUpdate();
    loadGuestContent();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* OTA Update Banner */}
      {hasOTAUpdate ? (
        <Pressable
          style={styles.updateBanner}
          onPress={() => Updates.reloadAsync()}
          accessibilityLabel={t('home.installNow')}
          accessibilityRole="button"
        >
          <Ionicons name="arrow-up-circle" size={18} color={colors.bg.primary} />
          <Text style={styles.updateBannerText}>{t('home.newUpdate')}</Text>
          <Text style={styles.updateBannerLink}>{t('home.installNow')}</Text>
        </Pressable>
      ) : null}

      {/* ===== Hero Carousel ===== */}
      {featuredContent.length > 0 ? (
        <HeroCarousel slides={featuredContent} />
      ) : (
        /* Fallback hero for guests */
        <View style={styles.hero}>
          <AmbientGlow color="rgba(232,66,10,0.25)" size={300} />

          {/* Center content */}
          <View style={styles.heroContent}>
            <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.heroText}>
              <Text style={styles.heroGreeting}>{t('home.greeting')}</Text>
              <Text style={styles.heroGreetingSecondary}>{t('home.greetingSecondary')}</Text>
              <Text style={styles.heroTitle}>{t('home.title')}</Text>
              <Text style={styles.heroDescription}>{t('home.description')}</Text>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(600).springify()} style={styles.heroActions}>
              <BrandButton
                title={t('auth.getStarted')}
                onPress={() => router.push('/(auth)/register')}
                variant="primary"
              />
              <BrandButton
                title={t('auth.alreadyHaveAccount')}
                onPress={() => router.push('/(auth)/login')}
                variant="glass"
              />
            </Animated.View>
          </View>

          {/* Category cards */}
          <View style={styles.categoryGrid}>
            {CATEGORY_CARDS.map((card, index) => (
              <Animated.View
                key={card.category}
                entering={FadeInDown.delay(300 + index * 80).springify()}
              >
                <GlassCard style={styles.categoryCard}>
                  <View style={[styles.categoryIcon, { backgroundColor: `${card.color}22` }]}>
                    <Ionicons name={card.iconName} size={22} color={card.color || colors.primary[500]} />
                  </View>
                  <Text style={styles.categoryTitle}>{card.category}</Text>
                  <Text style={styles.categorySub}>{card.sub}</Text>
                </GlassCard>
              </Animated.View>
            ))}
          </View>
        </View>
      )}

      {/* ===== Main Content ===== */}
      <View style={styles.content}>
        {/* Trending Now — visible to guests as preview */}
        {trendingContent.length > 0 ? (
          <ContentRow
            title={t('home.trending')}
            subtitle={t('home.trendingSubtitle')}
            sectionId="guest-trending"
            items={trendingContent}
            cardSize="lg"
          />
        ) : null}

        {/* Rewards CTA Section */}
        <ScrollReveal>
          <LinearGradient
            colors={[colors.red, colors.primary[500]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.rewardsCard}
          >
            <AmbientGlow color="rgba(255,255,255,0.15)" size={200} />
            <View style={styles.rewardsContent}>
              <View style={styles.rewardsBadge}>
                <Text style={styles.rewardsBadgeText}>{t('home.earnWhileWatching')}</Text>
              </View>
              <Text style={styles.rewardsTitle}>{t('home.unlockRewards')}</Text>
              <Text style={styles.rewardsDescription}>{t('home.rewardsDescription')}</Text>
              <BrandButton
                title={t('home.startEarning')}
                onPress={() => router.push('/(auth)/register')}
                variant="dark"
              />
            </View>
          </LinearGradient>
        </ScrollReveal>

        {/* Explore by Universe CTA */}
        <ScrollReveal>
          <View style={styles.universeSection}>
            <Text style={styles.sectionTitle}>{t('home.exploreByUniverse')}</Text>
            <View style={styles.universeGrid}>
              {[
                {
                  name: 'Movie',
                  iconName: 'film-outline' as const,
                  href: '/movies',
                  color: colors.primary[500],
                  flag: 'movie',
                },
                {
                  name: 'Comedy',
                  iconName: 'happy-outline' as const,
                  href: '/comedy',
                  color: universeColors.comedy,
                  flag: 'comedy',
                },
                {
                  name: 'Sports',
                  iconName: 'football-outline' as const,
                  href: '/sports',
                  color: universeColors.sports,
                  flag: 'sports',
                },
                {
                  name: 'Music',
                  iconName: 'musical-notes-outline' as const,
                  href: '/music',
                  color: universeColors.music,
                  flag: 'music',
                },
                {
                  name: 'Reality',
                  iconName: 'tv-outline' as const,
                  href: '/reality',
                  color: universeColors.reality,
                  flag: 'reality',
                },
                {
                  name: 'Lifestyle',
                  iconName: 'color-palette-outline' as const,
                  href: '/lifestyle',
                  color: universeColors.lifestyle,
                  flag: 'lifestyle',
                },
                {
                  name: 'Vertical',
                  iconName: 'phone-portrait-outline' as const,
                  href: '/vertical',
                  color: universeColors.vertical,
                  flag: 'vertical',
                },
                {
                  name: 'Games',
                  iconName: 'game-controller-outline' as const,
                  href: '/games',
                  color: universeColors.games,
                  flag: 'games',
                },
                {
                  name: 'Creator',
                  iconName: 'videocam-outline' as const,
                  href: '/creators',
                  color: universeColors.creators,
                  flag: 'creator',
                },
                {
                  name: 'Cinemaxis',
                  iconName: 'sparkles-outline' as const,
                  href: '/cinemaxis',
                  color: universeColors.comedy,
                  flag: 'cinemaxis',
                },
              ]
                .filter((u) => universeEnabled(u.flag))
                .map((u) => (
                  <Pressable
                    key={u.name}
                    style={styles.universeCard}
                    onPress={() => router.push(u.href as string)}
                    accessibilityLabel={`${t('home.explore')} ${u.name}`}
                    accessibilityRole="button"
                  >
                    <View style={[styles.universeIcon, { backgroundColor: `${u.color}22` }]}>
                      <Ionicons name={u.iconName} size={20} color={u.color || colors.primary[500]} />
                    </View>
                    <Text style={styles.universeName}>{u.name}</Text>
                  </Pressable>
                ))}
            </View>
          </View>
        </ScrollReveal>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  updateBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning[500],
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 8,
  },
  updateBannerText: {
    color: colors.bg.primary,
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  updateBannerLink: {
    color: colors.bg.primary,
    fontSize: 13,
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
  hero: {
    minHeight: 400,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg.green,
    paddingTop: 40,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  heroContent: {
    alignItems: 'center',
    zIndex: 10,
  },
  heroText: {
    alignItems: 'center',
    marginBottom: 30,
  },
  heroGreeting: {
    color: colors.text.primary,
    fontSize: 30,
    fontWeight: '800',
    marginBottom: 4,
  },
  heroGreetingSecondary: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  heroTitle: {
    color: colors.primary[500],
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 12,
  },
  heroDescription: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  heroActions: {
    gap: 12,
    width: '100%',
    alignItems: 'center',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginTop: 30,
    zIndex: 10,
  },
  categoryCard: {
    width: 100,
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryEmoji: {
    fontSize: 22,
  },
  categoryTitle: {
    color: colors.text.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  categorySub: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    marginTop: 2,
  },
  content: {
    paddingHorizontal: 0,
  },
  rewardsCard: {
    margin: 20,
    borderRadius: 20,
    overflow: 'hidden',
    padding: 24,
    alignItems: 'center',
  },
  rewardsContent: {
    alignItems: 'center',
    zIndex: 10,
  },
  rewardsBadge: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 16,
  },
  rewardsBadgeText: {
    color: colors.text.primary,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  rewardsTitle: {
    color: colors.text.primary,
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  rewardsDescription: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 20,
  },
  universeSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionTitle: {
    color: colors.text.primary,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 16,
    textAlign: 'center',
  },
  universeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  universeCard: {
    width: '45%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  universeIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  universeEmoji: {
    fontSize: 20,
  },
  universeName: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});
