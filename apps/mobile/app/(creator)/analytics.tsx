import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { creatorApi } from '../../src/api';
import { logger } from '../../src/utils/logger';
import { LoadingState, ErrorState } from '../../src/components/StateContainers';

// Analytics data interface for UI
interface AnalyticsData {
  totalViews: number;
  totalLikes: number;
  totalFollowers: number;
  totalEarnings: number;
  viewsGrowth: number;
  followersGrowth: number;
  earningsGrowth: number;
  topContent: Array<{
    id: string;
    title: string;
    views: number;
    thumbnail: string;
  }>;
  demographics: {
    ageGroups: Array<{ range: string; percentage: number }>;
    topCountries: Array<{ country: string; percentage: number }>;
    genderSplit: { male: number; female: number; other: number };
  };
  engagementMetrics: {
    avgWatchTime: number;
    completionRate: number;
    shareRate: number;
    commentRate: number;
  };
}

export default function CreatorAnalyticsScreen() {
  const router = useRouter();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    try {
      const response = await creatorApi.getAnalytics();
      if (response.success && response.data) {
        // Cast to AnalyticsData since UI expects this format
        // Backend should return consistent type
        setAnalytics(response.data as unknown as AnalyticsData);
      }
    } catch (error) {
      logger.error('Failed to load analytics', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <LoadingState text="Loading analytics..." />
      </SafeAreaView>
    );
  }

  if (!analytics) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ErrorState
          title="Failed to load"
          description="Could not load analytics data"
          onRetry={loadAnalytics}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Creator Analytics</Text>
      </View>

      <View style={styles.timeRangeSelector}>
        {(['7d', '30d', '90d', 'all'] as const).map((range) => (
          <TouchableOpacity
            key={range}
            style={[styles.timeRangeButton, timeRange === range && styles.timeRangeButtonActive]}
            onPress={() => setTimeRange(range)}
          >
            <Text style={[styles.timeRangeText, timeRange === range && styles.timeRangeTextActive]}>
              {range === '7d'
                ? '7 Days'
                : range === '30d'
                  ? '30 Days'
                  : range === '90d'
                    ? '90 Days'
                    : 'All Time'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{formatNumber(analytics.totalViews)}</Text>
            <Text style={styles.statLabel}>Total Views</Text>
            <Text
              style={[
                styles.growthText,
                analytics.viewsGrowth >= 0 ? styles.growthPositive : styles.growthNegative,
              ]}
            >
              {analytics.viewsGrowth >= 0 ? '↑' : '↓'} {Math.abs(analytics.viewsGrowth)}%
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{formatNumber(analytics.totalFollowers)}</Text>
            <Text style={styles.statLabel}>Followers</Text>
            <Text
              style={[
                styles.growthText,
                analytics.followersGrowth >= 0 ? styles.growthPositive : styles.growthNegative,
              ]}
            >
              {analytics.followersGrowth >= 0 ? '↑' : '↓'} {Math.abs(analytics.followersGrowth)}%
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>₦{formatNumber(analytics.totalEarnings)}</Text>
            <Text style={styles.statLabel}>Earnings</Text>
            <Text
              style={[
                styles.growthText,
                analytics.earningsGrowth >= 0 ? styles.growthPositive : styles.growthNegative,
              ]}
            >
              {analytics.earningsGrowth >= 0 ? '↑' : '↓'} {Math.abs(analytics.earningsGrowth)}%
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{formatNumber(analytics.totalLikes)}</Text>
            <Text style={styles.statLabel}>Likes</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Engagement Metrics</Text>
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{analytics.engagementMetrics.avgWatchTime}m</Text>
              <Text style={styles.metricLabel}>Avg Watch Time</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{analytics.engagementMetrics.completionRate}%</Text>
              <Text style={styles.metricLabel}>Completion Rate</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{analytics.engagementMetrics.shareRate}%</Text>
              <Text style={styles.metricLabel}>Share Rate</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{analytics.engagementMetrics.commentRate}%</Text>
              <Text style={styles.metricLabel}>Comment Rate</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Performing Content</Text>
          {analytics.topContent.map((content, index) => (
            <View key={content.id} style={styles.topContentItem}>
              <Text style={styles.rankText}>#{index + 1}</Text>
              <View style={styles.topContentInfo}>
                <Text style={styles.topContentTitle} numberOfLines={1}>
                  {content.title}
                </Text>
                <Text style={styles.topContentViews}>{formatNumber(content.views)} views</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Audience Demographics</Text>
          <View style={styles.demographicsCard}>
            <Text style={styles.demographicsSubtitle}>Age Groups</Text>
            {analytics.demographics.ageGroups.map((age) => (
              <View key={age.range} style={styles.demographicRow}>
                <Text style={styles.demographicLabel}>{age.range}</Text>
                <View style={styles.demographicBar}>
                  <View style={[styles.demographicFill, { width: `${age.percentage}%` }]} />
                </View>
                <Text style={styles.demographicValue}>{age.percentage}%</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A0A0A',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#9CA3AF',
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#F3F4F6',
    fontSize: 18,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#E8420A',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  backButton: {
    marginRight: 16,
  },
  backButtonText: {
    fontSize: 24,
    color: '#F3F4F6',
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F3F4F6',
  },
  timeRangeSelector: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  timeRangeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#2A2A2A',
    marginRight: 8,
  },
  timeRangeButtonActive: {
    backgroundColor: '#E8420A',
  },
  timeRangeText: {
    color: '#F3F4F6',
    fontSize: 14,
    fontWeight: '500',
  },
  timeRangeTextActive: {
    color: '#fff',
  },
  content: {
    padding: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F3F4F6',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  growthText: {
    fontSize: 12,
    fontWeight: '600',
  },
  growthPositive: {
    color: '#10B981',
  },
  growthNegative: {
    color: '#EF4444',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F3F4F6',
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#E8420A',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  topContentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  rankText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E8420A',
    marginRight: 12,
    width: 30,
  },
  topContentInfo: {
    flex: 1,
  },
  topContentTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F3F4F6',
    marginBottom: 2,
  },
  topContentViews: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  demographicsCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
  },
  demographicsSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F3F4F6',
    marginBottom: 12,
  },
  demographicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  demographicLabel: {
    fontSize: 12,
    color: '#F3F4F6',
    width: 50,
  },
  demographicBar: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
    marginHorizontal: 12,
  },
  demographicFill: {
    height: '100%',
    backgroundColor: '#E8420A',
    borderRadius: 4,
  },
  demographicValue: {
    fontSize: 12,
    color: '#F3F4F6',
    width: 40,
    textAlign: 'right',
  },
});
