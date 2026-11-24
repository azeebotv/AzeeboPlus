import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  creatorApi,
  type CreatorDashboard,
  type CreatorAnalytics,
} from '@azeebo/react-data/api/creator';
import { LoadingState, ErrorState } from '../../src/components/StateContainers';
import { colors } from '../../src/theme';

const { width } = Dimensions.get('window');

function formatNumber(num: number): string {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
  if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K';
  return String(num);
}

export default function CreatorDashboardScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const isDark = colorScheme === 'dark';
  const [dashboardData, setDashboardData] = useState<CreatorDashboard | null>(null);
  const [analyticsData, setAnalyticsData] = useState<CreatorAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [dashboardRes, analyticsRes] = await Promise.all([
        creatorApi.getDashboard(),
        creatorApi.getAnalytics(),
      ]);
      if (dashboardRes.success) setDashboardData(dashboardRes.data ?? null);
      if (analyticsRes.success) setAnalyticsData(analyticsRes.data ?? null);
    } catch (err) {
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) {
    return (
      <SafeAreaView accessibilityLabel="Dashboard Screen" style={styles.container}>
        <LoadingState text="Loading dashboard..." />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <ErrorState description={error} onRetry={fetchData} />
      </SafeAreaView>
    );
  }

  const stats = [
    {
      id: '1',
      label: 'Total Views',
      value: formatNumber(dashboardData?.totalViews ?? 0),
      change: '',
      emoji: '👁️',
    },
    {
      id: '2',
      label: 'Followers',
      value: formatNumber(dashboardData?.totalFollowers ?? 0),
      change: '',
      emoji: '👥',
    },
    {
      id: '3',
      label: 'Total Content',
      value: String(dashboardData?.totalContent ?? 0),
      change: '',
      emoji: '📹',
    },
    {
      id: '4',
      label: 'Total Likes',
      value: formatNumber(dashboardData?.totalLikes ?? 0),
      change: '',
      emoji: '❤️',
    },
  ];

  const recentContent =
    dashboardData?.topContent?.map((item) => ({
      id: item.id,
      title: item.title,
      views: formatNumber(item.views),
      likes: formatNumber(item.likes),
      comments: '0',
      time: '',
      emoji: '🎬',
    })) ?? [];

  const recentActivity =
    dashboardData?.recentActivity?.map((item, idx) => ({
      id: String(idx),
      message: item.description,
      time: item.timestamp ? new Date(item.timestamp).toLocaleDateString() : '',
      type: item.type === 'earnings' ? 'earning' : item.type === 'content' ? 'trending' : 'comment',
    })) ?? [];

  const weeklyViews =
    analyticsData?.viewsOverTime?.slice(-7).map((item) => ({
      day: new Date(item.date).toLocaleDateString('en', { weekday: 'short' }),
      views: item.views,
    })) ?? [];

  const maxViews = Math.max(...weeklyViews.map((w) => w.views), 1);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={[{ flex: 1 }, { backgroundColor: isDark ? '#1A0A0A' : '#ffffff' }]}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity accessibilityRole="button" style={styles.backButton} onPress={() => router.back()}>
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: isDark ? '#ffffff' : '#1A0A0A' }]}>
              Creator Dashboard
            </Text>
            <TouchableOpacity accessibilityRole="button" style={styles.settingsButton}>
              <Text style={styles.settingsIcon}>⚙️</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.creatorInfo}>
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarEmoji}>👤</Text>
            </View>
            <View style={styles.creatorDetails}>
              <Text style={[styles.creatorName, { color: isDark ? '#fff' : '#000' }]}>
                Your Channel
              </Text>
              <Text style={styles.creatorCategory}>Creator</Text>
            </View>
            <TouchableOpacity accessibilityRole="button" style={styles.editButton}>
              <Text style={styles.editIcon}>✏️</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.statsGrid}>
          {stats.map((stat) => (
            <View
              key={stat.id}
              style={[styles.statCard, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}
            >
              <Text style={styles.statEmoji}>{stat.emoji}</Text>
              <Text style={[styles.statValue, { color: isDark ? '#fff' : '#000' }]}>
                {stat.value}
              </Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
              <View style={styles.statChange}>
                <Text style={styles.changeText}>{stat.change || '-'}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.analyticsSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#1A0A0A' }]}>
              Weekly Views
            </Text>
            <TouchableOpacity accessibilityRole="button">
              <Text style={styles.seeAllText}>See Details</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.chartContainer}>
            <View style={styles.chartPlaceholder}>
              {weeklyViews.length > 0 ? (
                weeklyViews.map((item, index) => (
                  <View key={index} style={styles.chartBar}>
                    <View style={[styles.bar, { height: (item.views / maxViews) * 100 }]} />
                    <Text style={styles.chartLabel}>{item.day}</Text>
                  </View>
                ))
              ) : (
                <Text style={{ color: colors.text.secondary, textAlign: 'center', width: '100%' }}>
                  No data available
                </Text>
              )}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#1A0A0A' }]}>
              Recent Content
            </Text>
            <TouchableOpacity accessibilityRole="button">
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.contentList}>
            {recentContent.length > 0 ? (
              recentContent.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.contentItem, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}
                >
                  <View style={styles.contentThumbnail}>
                    <Text style={styles.contentEmoji}>{item.emoji}</Text>
                  </View>
                  <View style={styles.contentInfo}>
                    <Text
                      style={[styles.contentTitle, { color: isDark ? '#fff' : '#000' }]}
                      numberOfLines={1}
                    >
                      {item.title}
                    </Text>
                    <View style={styles.contentMeta}>
                      <Text style={styles.metaText}>👁️ {item.views}</Text>
                      <Text style={styles.metaText}>❤️ {item.likes}</Text>
                      <Text style={styles.metaText}>💬 {item.comments}</Text>
                    </View>
                    <Text style={styles.timeText}>{item.time}</Text>
                  </View>
                  <TouchableOpacity accessibilityRole="button" style={styles.moreButton}>
                    <Text style={styles.moreIcon}>⋮</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={{ color: colors.text.secondary, textAlign: 'center', padding: 20 }}>
                No content yet
              </Text>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#1A0A0A' }]}>
              Recent Activity
            </Text>
          </View>
          <View style={styles.notificationsList}>
            {recentActivity.length > 0 ? (
              recentActivity.map((notification) => (
                <View
                  key={notification.id}
                  style={[
                    styles.notificationItem,
                    { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' },
                  ]}
                >
                  <View
                    style={[
                      styles.notificationDot,
                      notification.type === 'earning' && styles.earningDot,
                      notification.type === 'comment' && styles.commentDot,
                      notification.type === 'trending' && styles.trendingDot,
                    ]}
                  />
                  <View style={styles.notificationContent}>
                    <Text style={[styles.notificationMessage, { color: isDark ? '#fff' : '#000' }]}>
                      {notification.message}
                    </Text>
                    <Text style={styles.notificationTime}>{notification.time}</Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={{ color: colors.text.secondary, textAlign: 'center', padding: 20 }}>
                No recent activity
              </Text>
            )}
          </View>
        </View>

        <View style={styles.actionsSection}>
          <TouchableOpacity accessibilityRole="button" style={styles.actionButton}>
            <Text style={styles.actionIcon}>📤</Text>
            <Text style={styles.actionText}>Upload New Content</Text>
          </TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" style={[styles.actionButton, styles.secondaryAction]}>
            <Text style={styles.actionIcon}>📊</Text>
            <Text style={styles.actionText}>View Full Analytics</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomNav}>
          <TouchableOpacity accessibilityRole="button" style={styles.navItem} onPress={() => router.push('/(tabs)/home')}>
            <Text style={styles.navIcon}>🏠</Text>
            <Text style={styles.navLabel}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" style={styles.navItem} onPress={() => router.push('/(tabs)/watch')}>
            <Text style={styles.navIcon}>📺</Text>
            <Text style={styles.navLabel}>Watch</Text>
          </TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" style={styles.navItem} onPress={() => router.push('/(tabs)/create')}>
            <Text style={styles.navIcon}>✨</Text>
            <Text style={[styles.navLabel, { color: colors.category.teal }]}>Create</Text>
          </TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" style={styles.navItem} onPress={() => router.push('/(tabs)/rewards')}>
            <Text style={styles.navIcon}>⭐</Text>
            <Text style={styles.navLabel}>Rewards</Text>
          </TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" style={styles.navItem} onPress={() => router.push('/(tabs)/profile')}>
            <Text style={styles.navIcon}>👤</Text>
            <Text style={styles.navLabel}>Profile</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingTop: 50,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bg.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    color: '#fff',
    fontSize: 20,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bg.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsIcon: {
    fontSize: 20,
  },
  creatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.category.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 28,
  },
  creatorDetails: {
    flex: 1,
  },
  creatorName: {
    fontSize: 18,
    fontWeight: '700',
  },
  creatorCategory: {
    color: colors.text.secondary,
    fontSize: 13,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bg.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editIcon: {
    fontSize: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 8,
  },
  statCard: {
    width: (width - 40) / 2,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    color: colors.text.secondary,
    fontSize: 12,
    marginBottom: 6,
  },
  statChange: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  changeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  analyticsSection: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  seeAllText: {
    color: colors.category.teal,
    fontSize: 14,
    fontWeight: '600',
  },
  chartContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
  },
  chartPlaceholder: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
  },
  chartBar: {
    flex: 1,
    alignItems: 'center',
  },
  bar: {
    width: 24,
    backgroundColor: colors.category.teal,
    borderRadius: 4,
    marginBottom: 8,
  },
  chartLabel: {
    color: colors.text.secondary,
    fontSize: 10,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  contentList: {
    gap: 10,
  },
  contentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    gap: 12,
  },
  contentThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: colors.bg.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentEmoji: {
    fontSize: 28,
  },
  contentInfo: {
    flex: 1,
  },
  contentTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  contentMeta: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 4,
  },
  metaText: {
    color: colors.text.secondary,
    fontSize: 12,
  },
  timeText: {
    color: colors.text.tertiary,
    fontSize: 11,
  },
  moreButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreIcon: {
    color: colors.text.secondary,
    fontSize: 18,
  },
  notificationsList: {
    gap: 8,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    gap: 12,
  },
  notificationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  earningDot: {
    backgroundColor: '#10B981',
  },
  commentDot: {
    backgroundColor: '#3B82F6',
  },
  trendingDot: {
    backgroundColor: '#F59E0B',
  },
  notificationContent: {
    flex: 1,
  },
  notificationMessage: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 2,
  },
  notificationTime: {
    color: colors.text.tertiary,
    fontSize: 11,
  },
  actionsSection: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.category.teal,
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
  },
  secondaryAction: {
    backgroundColor: colors.bg.tertiary,
  },
  actionIcon: {
    fontSize: 18,
  },
  actionText: {
    color: '#000',
    fontSize: 13,
    fontWeight: '600',
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingBottom: 30,
    backgroundColor: '#1a1a1a',
    borderTopWidth: 1,
    borderTopColor: colors.bg.tertiary,
  },
  navItem: {
    alignItems: 'center',
  },
  navIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  navLabel: {
    fontSize: 11,
    color: colors.text.secondary,
  },
});
