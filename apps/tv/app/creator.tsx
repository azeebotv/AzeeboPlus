import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { contentApi, type ContentItem } from '@azeebo/react-data';
import { apiClient } from '@azeebo/react-data/api/client';
import {
  FocusableButton,
  FocusableCard,
  FocusableRow,
  type RailItem,
} from '../src/components/Focusable';
import { LoadingState } from '../src/components/StateContainers';
import { colors, tvTypography, tvSpacing } from '../src/theme';

interface CreatorStats {
  totalViews: number;
  watchTimeHours: number;
  earnings: number;
  subscribers: number;
  engagementRate: number;
}

interface CreatorChallenge {
  id: string;
  title: string;
  description: string;
  rewardPool: string;
  daysRemaining: number;
}

export default function TVCreatorDashboard() {
  const router = useRouter();
  const [publishedContent, setPublishedContent] = useState<ContentItem[]>([]);
  const [stats] = useState<CreatorStats>({
    totalViews: 245800,
    watchTimeHours: 18450,
    earnings: 5250000,
    subscribers: 1420,
    engagementRate: 18.2,
  });
  const [challenges, setChallenges] = useState<CreatorChallenge[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadCreatorData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [contentRes, challengesRes] = await Promise.allSettled([
        contentApi.getContentByCategory('creator', 1, 15),
        apiClient.get<CreatorChallenge[]>('/v1/creator/challenges'),
      ]);

      if (contentRes.status === 'fulfilled' && contentRes.value.success && contentRes.value.data) {
        setPublishedContent(contentRes.value.data.items ?? []);
      }
      if (challengesRes.status === 'fulfilled' && Array.isArray(challengesRes.value)) {
        setChallenges(challengesRes.value);
      } else {
        // Fallback default challenges structure
        setChallenges([
          {
            id: 'chal-1',
            title: 'Afrobeats Rhythm Remix Challenge',
            description: 'Create an acoustic or drum remix of trending Afrobeats tracks.',
            rewardPool: '500,000 Coins',
            daysRemaining: 4,
          },
          {
            id: 'chal-2',
            title: 'Lagos Street Food Reel Fest',
            description: 'Document the most authentic culinary spots in Lagos nightlife.',
            rewardPool: '250,000 Coins',
            daysRemaining: 9,
          },
        ]);
      }
    } catch {
      // Handled
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCreatorData();
  }, [loadCreatorData]);

  const toRailItems = (items: ContentItem[]): RailItem[] =>
    items.map((item) => ({
      id: item.id,
      title: item.title,
      thumbnail: item.mediaAsset?.thumbnailUrl || item.thumbnail,
      subtitle: item.universe?.name
        ? `${item.universe.name} • 4K Published`
        : 'Creator Original • 4K Published',
    }));

  if (isLoading && publishedContent.length === 0) {
    return <LoadingState text="Loading Creator Studio..." />;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Top Bar ─────────────────────────────────────────── */}
      <View style={styles.topBar}>
        <FocusableButton
          title="← Back to Home"
          variant="secondary"
          onPress={() => router.push('/' as Href)}
          hasTVPreferredFocus
        />
        <View style={styles.badge}>
          <Text style={styles.badgeText}>📊 EXECUTIVE CREATOR STUDIO</Text>
        </View>
      </View>

      {/* ── Header ──────────────────────────────────────────── */}
      <View style={styles.heroSection}>
        <Text style={styles.title}>Creator Analytics & Performance</Text>
        <Text style={styles.subtitle}>
          Track your reach across African audiences, audience engagement metrics, and monetization
          payouts on the big screen.
        </Text>
      </View>

      {/* ── KPI Grid ────────────────────────────────────────── */}
      <View style={styles.kpiGrid}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>TOTAL VIEWS</Text>
          <Text style={styles.kpiValue}>{stats.totalViews.toLocaleString()}</Text>
          <Text style={styles.kpiTrend}>▲ +14.8% this week</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>WATCH TIME</Text>
          <Text style={styles.kpiValue}>{stats.watchTimeHours.toLocaleString()} hrs</Text>
          <Text style={styles.kpiTrend}>▲ +22.1% this week</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>ESTIMATED EARNINGS</Text>
          <Text style={[styles.kpiValue, { color: colors.primary[500] }]}>
            ₦{stats.earnings.toLocaleString()}
          </Text>
          <Text style={styles.kpiTrend}>▲ Payout ready</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>ACTIVE SUBSCRIBERS</Text>
          <Text style={styles.kpiValue}>{stats.subscribers.toLocaleString()}</Text>
          <Text style={styles.kpiTrend}>⭐ {stats.engagementRate}% engagement</Text>
        </View>
      </View>

      {/* ── Published Content Catalog ────────────────────────── */}
      <View style={styles.section}>
        <FocusableRow
          title="Your Published Catalog"
          items={toRailItems(publishedContent)}
          onSelect={(item) => router.push(`/watch/${item.id}` as Href)}
        />
      </View>

      {/* ── Active Creator Challenges ───────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Active Audience Challenges</Text>
        <View style={styles.challengesGrid}>
          {challenges.map((c) => (
            <FocusableCard key={c.id} style={styles.challengeCard} onPress={() => {}}>
              <View style={styles.challengeBadge}>
                <Text style={styles.challengeBadgeText}>🏆 {c.rewardPool}</Text>
              </View>
              <Text style={styles.challengeTitle}>{c.title}</Text>
              <Text style={styles.challengeDesc} numberOfLines={2}>
                {c.description}
              </Text>
              <View style={styles.challengeFooter}>
                <Text style={styles.daysText}>⏳ {c.daysRemaining} days left</Text>
                <Text style={styles.statusText}>Active Contest</Text>
              </View>
            </FocusableCard>
          ))}
        </View>
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
    backgroundColor: 'rgba(255, 94, 30, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary[500],
  },
  badgeText: {
    color: colors.primary[500],
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
  kpiGrid: {
    flexDirection: 'row',
    gap: tvSpacing.lg,
    marginBottom: tvSpacing.xxl,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: colors.bg.secondary,
    borderRadius: 14,
    padding: tvSpacing.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  kpiLabel: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: colors.text.secondary,
    marginBottom: 6,
  },
  kpiValue: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.text.primary,
    marginBottom: 6,
  },
  kpiTrend: {
    fontSize: 13,
    fontWeight: '700',
    color: '#10B981',
  },
  section: {
    marginBottom: tvSpacing.xxl,
  },
  sectionTitle: {
    fontSize: tvTypography.fontSize.lg,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: tvSpacing.md,
  },
  challengesGrid: {
    flexDirection: 'row',
    gap: tvSpacing.lg,
  },
  challengeCard: {
    flex: 1,
    backgroundColor: colors.bg.secondary,
    borderRadius: 14,
    padding: tvSpacing.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  challengeBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 10,
  },
  challengeBadgeText: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '800',
  },
  challengeTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: 6,
  },
  challengeDesc: {
    fontSize: tvTypography.fontSize.base,
    color: colors.text.secondary,
    lineHeight: 22,
    marginBottom: 12,
  },
  challengeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
    paddingTop: 8,
  },
  daysText: {
    color: colors.primary[500],
    fontSize: 13,
    fontWeight: '700',
  },
  statusText: {
    color: colors.text.secondary,
    fontSize: 12,
  },
});
