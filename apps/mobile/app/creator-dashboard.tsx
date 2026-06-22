import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import {
  creatorApi,
  CreatorDashboard,
  CreatorEarnings,
  CreatorAnalytics,
} from '../../src/api/creator';
import { LoadingState, ErrorState } from '../../src/components/StateContainers';

function formatCurrency(amount: number): string {
  return '₦' + amount.toLocaleString();
}

const quickActions = [
  { id: '1', title: 'Upload Content', icon: '📤', color: '#8B5CF6' },
  { id: '2', title: 'View Analytics', icon: '📊', color: '#3B82F6' },
  { id: '3', title: 'Manage Tips', icon: '🎁', color: '#F59E0B' },
  { id: '4', title: 'Withdraw', icon: '💸', color: '#10B981' },
];

export default function CreatorDashboardScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const isDark = colorScheme === 'dark';
  const [dashboard, setDashboard] = useState<CreatorDashboard | null>(null);
  const [earnings, setEarnings] = useState<CreatorEarnings | null>(null);
  const [analytics, setAnalytics] = useState<CreatorAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [dashboardRes, earningsRes, analyticsRes] = await Promise.all([
        creatorApi.getDashboard(),
        creatorApi.getEarnings(),
        creatorApi.getAnalytics(),
      ]);
      if (dashboardRes.success) setDashboard(dashboardRes.data);
      if (earningsRes.success) setEarnings(earningsRes.data);
      if (analyticsRes.success) setAnalytics(analyticsRes.data);
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
    return <LoadingState text="Loading dashboard..." />;
  }

  if (error) {
    return <ErrorState description={error} onRetry={fetchData} />;
  }

  const statItems = [
    {
      label: 'Total Earnings',
      value: formatCurrency(earnings?.totalEarnings ?? 0),
      change: '',
      icon: '💰',
    },
    { label: 'Subscribers', value: String(dashboard?.totalFollowers ?? 0), change: '', icon: '👥' },
    { label: 'Total Views', value: String(dashboard?.totalViews ?? 0), change: '', icon: '👁️' },
    { label: 'Total Content', value: String(dashboard?.totalContent ?? 0), change: '', icon: '📹' },
  ];

  const activities =
    dashboard?.recentActivity?.map((a, i) => ({
      id: String(i),
      type: a.type === 'earnings' ? 'tip' : 'view',
      message: a.description,
      time: a.timestamp ? new Date(a.timestamp).toLocaleDateString() : '',
      icon: a.type === 'earnings' ? '💰' : '🔥',
    })) ?? [];

  const displayEarnings = {
    available: earnings?.totalEarnings ?? 0,
    pending: earnings?.pendingEarnings ?? 0,
    withdrawn: earnings?.paidEarnings ?? 0,
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: isDark ? '#0a0a0a' : '#ffffff' }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>Hello,</Text>
          <Text style={styles.creatorName}>@creator_name</Text>
        </View>
        <TouchableOpacity style={styles.profileButton}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>C</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.earningsCard}>
        <View style={styles.earningsHeader}>
          <Text style={styles.earningsTitle}>Total Earnings</Text>
          <TouchableOpacity style={styles.withdrawButton}>
            <Text style={styles.withdrawText}>Withdraw</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.earningsAmount}>{formatCurrency(displayEarnings.available)}</Text>
        <View style={styles.earningsBreakdown}>
          <View style={styles.earningItem}>
            <Text style={styles.earningLabel}>Available</Text>
            <Text style={styles.earningValue}>{formatCurrency(displayEarnings.available)}</Text>
          </View>
          <View style={styles.earningDivider} />
          <View style={styles.earningItem}>
            <Text style={styles.earningLabel}>Pending</Text>
            <Text style={styles.earningValue}>{formatCurrency(displayEarnings.pending)}</Text>
          </View>
          <View style={styles.earningDivider} />
          <View style={styles.earningItem}>
            <Text style={styles.earningLabel}>Withdrawn</Text>
            <Text style={styles.earningValue}>{formatCurrency(displayEarnings.withdrawn)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.statsGrid}>
        {statItems.map((stat, index) => (
          <View key={index} style={styles.statCard}>
            <Text style={styles.statIcon}>{stat.icon}</Text>
            <Text style={[styles.statValue, { color: isDark ? '#ffffff' : '#000000' }]}>
              {stat.value}
            </Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
            <Text style={styles.statChange}>{stat.change || '-'}</Text>
          </View>
        ))}
      </View>

      <View style={styles.quickActions}>
        <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
          Quick Actions
        </Text>
        <View style={styles.actionsGrid}>
          {quickActions.map((action) => (
            <TouchableOpacity key={action.id} style={styles.actionCard}>
              <View style={[styles.actionIcon, { backgroundColor: action.color }]}>
                <Text style={styles.actionEmoji}>{action.icon}</Text>
              </View>
              <Text style={[styles.actionTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
                {action.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.activitySection}>
        <View style={styles.activityHeader}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
            Recent Activity
          </Text>
          <TouchableOpacity>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.activityList}>
          {activities.length > 0 ? (
            activities.map((activity) => (
              <View key={activity.id} style={styles.activityItem}>
                <View style={styles.activityIcon}>
                  <Text style={styles.activityEmoji}>{activity.icon}</Text>
                </View>
                <View style={styles.activityContent}>
                  <Text style={[styles.activityMessage, { color: isDark ? '#ffffff' : '#000000' }]}>
                    {activity.message}
                  </Text>
                  <Text style={styles.activityTime}>{activity.time}</Text>
                </View>
              </View>
            ))
          ) : (
            <View style={{ padding: 16, alignItems: 'center' }}>
              <Text style={{ color: '#666' }}>No recent activity</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.payoutSection}>
        <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
          Next Payout
        </Text>
        <View style={styles.payoutCard}>
          <View style={styles.payoutInfo}>
            <Text style={styles.payoutDate}>Next payout</Text>
            <Text style={styles.payoutAmount}>{formatCurrency(displayEarnings.available)}</Text>
          </View>
          <TouchableOpacity style={styles.payoutButton}>
            <Text style={styles.payoutButtonText}>Schedule</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 40,
    backgroundColor: '#1a1a1a',
  },
  headerLeft: {},
  greeting: {
    fontSize: 14,
    color: '#888',
  },
  creatorName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  profileButton: {
    padding: 4,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  earningsCard: {
    margin: 16,
    padding: 20,
    backgroundColor: '#8B5CF6',
    borderRadius: 16,
  },
  earningsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  earningsTitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  withdrawButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  withdrawText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  earningsAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
  },
  earningsBreakdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  earningItem: {
    flex: 1,
    alignItems: 'center',
  },
  earningDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  earningLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 4,
  },
  earningValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
    gap: 8,
  },
  statCard: {
    width: '47%',
    padding: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  statChange: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
  },
  quickActions: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: '47%',
    padding: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    alignItems: 'center',
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionEmoji: {
    fontSize: 20,
  },
  actionTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  activitySection: {
    padding: 16,
    paddingTop: 0,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  viewAllText: {
    color: '#8B5CF6',
    fontSize: 14,
    fontWeight: '500',
  },
  activityList: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    overflow: 'hidden',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityEmoji: {
    fontSize: 16,
  },
  activityContent: {
    flex: 1,
  },
  activityMessage: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
    color: '#666',
  },
  payoutSection: {
    padding: 16,
    paddingTop: 0,
  },
  payoutCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  payoutInfo: {},
  payoutDate: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  payoutAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  payoutButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  payoutButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 32,
  },
});
