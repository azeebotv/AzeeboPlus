import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as Updates from 'expo-updates';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '@/api';
import type { ContentItem } from '@/api';
import { GlassCard } from '@/components/ui/GlassCard';
import { BrandButton } from '@/components/ui/BrandButton';
import { AmbientGlow } from '@/components/motion/AmbientGlow';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import HeroCarousel from './HeroCarousel';
import ContentRow from './ContentRow';

const CATEGORY_CARDS = [
  { category: 'Movies', sub: 'Nollywood', emoji: '\u{1F3AC}', color: '#E8420A' },
  { category: 'Music', sub: 'Afrobeats', emoji: '\u{1F3A4}', color: '#CC1C1C' },
  { category: 'Sports', sub: 'Super Eagles', emoji: '\u26BD', color: '#22c55e' },
  { category: 'Comedy', sub: 'Taooma', emoji: '\u{1F602}', color: '#fbbf24' },
  { category: 'Reality', sub: 'Live Shows', emoji: '\u{1F4FA}', color: '#8b5cf6' },
  { category: 'Creators', sub: 'Vloggers', emoji: '\u{1F4E1}', color: '#3b82f6' },
];

export default function GuestHomepage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [featuredContent, setFeaturedContent] = useState<ContentItem[]>([]);
  const [trendingContent, setTrendingContent] = useState<ContentItem[]>([]);
  const [hasOTAUpdate, setHasOTAUpdate] = useState(false);

  useEffect(() => {
    checkForOTAUpdate();
    loadGuestContent();
  }, []);

  const checkForOTAUpdate = async () => {
    try {
      if (!Updates.channel || !__DEV__) return;
      const update = await Updates.checkForUpdateAsync();
      if (update.isAvailable) setHasOTAUpdate(true);
    } catch {}
  };

  const loadGuestContent = async () => {
    try {
      const [featured, trending] = await Promise.allSettled([
        api.content.getFeaturedContent(5),
        api.content.getTrendingContent(12),
      ]);
      if (featured.status === 'fulfilled' && featured.value.success && featured.value.data) {
        setFeaturedContent(featured.value.data);
      }
      if (trending.status === 'fulfilled' && trending.value.success && trending.value.data) {
        setTrendingContent(trending.value.data);
      }
    } catch {}
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* OTA Update Banner */}
      {hasOTAUpdate ? (
        <Pressable
          style={styles.updateBanner}
          onPress={() => Updates.reloadAsync()}
        >
          <Ionicons name="arrow-up-circle" size={18} color="#1A0A0A" />
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
          <AmbientGlow color="rgba(13,90,60,0.5)" size={300} className="" />

          {/* Center content */}
          <View style={styles.heroContent}>
            <Animated.View
              entering={FadeInDown.delay(200).springify()}
              style={styles.heroText}
            >
              <Text style={styles.heroGreeting}>{t('home.greeting')}</Text>
              <Text style={styles.heroGreetingSecondary}>{t('home.greetingSecondary')}</Text>
              <Text style={styles.heroTitle}>{t('home.title')}</Text>
              <Text style={styles.heroDescription}>{t('home.description')}</Text>
            </Animated.View>

            <Animated.View
              entering={FadeInDown.delay(600).springify()}
              style={styles.heroActions}
            >
              <BrandButton
                label={t('auth.getStarted')}
                onPress={() => router.push('/auth/register')}
                variant="primary"
                icon="rocket"
              />
              <BrandButton
                label={t('auth.alreadyHaveAccount')}
                onPress={() => router.push('/auth/login')}
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
                    <Text style={styles.categoryEmoji}>{card.emoji}</Text>
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
            colors={['#CC1C1C', '#E8420A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.rewardsCard}
          >
            <AmbientGlow color="rgba(255,255,255,0.15)" size={200} className="" />
            <View style={styles.rewardsContent}>
              <View style={styles.rewardsBadge}>
                <Text style={styles.rewardsBadgeText}>{t('home.earnWhileWatching')}</Text>
              </View>
              <Text style={styles.rewardsTitle}>{t('home.unlockRewards')}</Text>
              <Text style={styles.rewardsDescription}>{t('home.rewardsDescription')}</Text>
              <BrandButton
                label={t('home.startEarning')}
                onPress={() => router.push('/auth/register')}
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
                { name: 'Movies', icon: '\u{1F3AC}', href: '/movies', color: '#E8420A' },
                { name: 'Comedy', icon: '\u{1F602}', href: '/comedy', color: '#fbbf24' },
                { name: 'Sports', icon: '\u26BD', href: '/sports', color: '#22c55e' },
                { name: 'Reality', icon: '\u{1F4FA}', href: '/reality', color: '#8b5cf6' },
                { name: 'Lifestyle', icon: '\u{1F3A8}', href: '/lifestyle', color: '#ec4899' },
                { name: 'Vertical', icon: '\u{1F4F1}', href: '/vertical', color: '#3b82f6' },
                { name: 'Games', icon: '\u{1F3AE}', href: '/games', color: '#06b6d4' },
              ].map((u) => (
                <Pressable
                  key={u.name}
                  style={styles.universeCard}
                  onPress={() => router.push(u.href as any)}
                >
                  <View style={[styles.universeIcon, { backgroundColor: `${u.color}22` }]}>
                    <Text style={styles.universeEmoji}>{u.icon}</Text>
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
    backgroundColor: '#fbbf24',
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 8,
  },
  updateBannerText: {
    color: '#1A0A0A',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  updateBannerLink: {
    color: '#1A0A0A',
    fontSize: 13,
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
  hero: {
    minHeight: 400,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0D3B2E',
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
    color: '#fff',
    fontSize: 30,
    fontWeight: '800',
    marginBottom: 4,
  },
  heroGreetingSecondary: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  heroTitle: {
    color: '#E8420A',
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
    color: '#fff',
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
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  rewardsTitle: {
    color: '#fff',
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
    color: '#fff',
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
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
