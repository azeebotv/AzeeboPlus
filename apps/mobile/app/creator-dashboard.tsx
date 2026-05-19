import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';

const stats = [
  { label: 'Total Earnings', value: '₦245,000', change: '+12%', icon: '💰' },
  { label: 'Subscribers', value: '12.5K', change: '+8%', icon: '👥' },
  { label: 'Tips Received', value: '342', change: '+24%', icon: '🎁' },
  { label: 'Total Views', value: '1.2M', change: '+15%', icon: '👁️' },
];

const recentActivities = [
  { id: '1', type: 'tip', message: 'Segun tipped you ₦500', time: '2m ago', icon: '🎁' },
  { id: '2', type: 'subscribe', message: 'New subscriber: Chioma', time: '15m ago', icon: '👋' },
  { id: '3', type: 'view', message: 'Your content reached 1K views', time: '1h ago', icon: '🔥' },
  { id: '4', type: 'withdrawal', message: 'Withdrawal of ₦50,000 processed', time: '3h ago', icon: '✅' },
];

const quickActions = [
  { id: '1', title: 'Upload Content', icon: '📤', color: '#8B5CF6' },
  { id: '2', title: 'View Analytics', icon: '📊', color: '#3B82F6' },
  { id: '3', title: 'Manage Tips', icon: '🎁', color: '#F59E0B' },
  { id: '4', title: 'Withdraw', icon: '💸', color: '#10B981' },
];

export default function CreatorDashboardScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [earnings] = useState({
    available: 45000,
    pending: 12500,
    withdrawn: 197500,
  });

  return (
    <ScrollView style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#0a0a0a' : '#ffffff' }]}>
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
        <Text style={styles.earningsAmount}>₦{earnings.available.toLocaleString()}</Text>
        <View style={styles.earningsBreakdown}>
          <View style={styles.earningItem}>
            <Text style={styles.earningLabel}>Available</Text>
            <Text style={styles.earningValue}>₦{earnings.available.toLocaleString()}</Text>
          </View>
          <View style={styles.earningDivider} />
          <View style={styles.earningItem}>
            <Text style={styles.earningLabel}>Pending</Text>
            <Text style={styles.earningValue}>₦{earnings.pending.toLocaleString()}</Text>
          </View>
          <View style={styles.earningDivider} />
          <View style={styles.earningItem}>
            <Text style={styles.earningLabel}>Withdrawn</Text>
            <Text style={styles.earningValue}>₦{earnings.withdrawn.toLocaleString()}</Text>
          </View>
        </View>
      </View>

      <View style={styles.statsGrid}>
        {stats.map((stat, index) => (
          <View key={index} style={styles.statCard}>
            <Text style={styles.statIcon}>{stat.icon}</Text>
            <Text style={[styles.statValue, { color: colorScheme === 'dark' ? '#ffffff' : '#000000' }]}>
              {stat.value}
            </Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
            <Text style={styles.statChange}>{stat.change}</Text>
          </View>
        ))}
      </View>

      <View style={styles.quickActions}>
        <Text style={[styles.sectionTitle, { color: colorScheme === 'dark' ? '#ffffff' : '#000000' }]}>
          Quick Actions
        </Text>
        <View style={styles.actionsGrid}>
          {quickActions.map((action) => (
            <TouchableOpacity key={action.id} style={styles.actionCard}>
              <View style={[styles.actionIcon, { backgroundColor: action.color }]}>
                <Text style={styles.actionEmoji}>{action.icon}</Text>
              </View>
              <Text style={[styles.actionTitle, { color: colorScheme === 'dark' ? '#ffffff' : '#000000' }]}>
                {action.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.activitySection}>
        <View style={styles.activityHeader}>
          <Text style={[styles.sectionTitle, { color: colorScheme === 'dark' ? '#ffffff' : '#000000' }]}>
            Recent Activity
          </Text>
          <TouchableOpacity>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.activityList}>
          {recentActivities.map((activity) => (
            <View key={activity.id} style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <Text style={styles.activityEmoji}>{activity.icon}</Text>
              </View>
              <View style={styles.activityContent}>
                <Text style={[styles.activityMessage, { color: colorScheme === 'dark' ? '#ffffff' : '#000000' }]}>
                  {activity.message}
                </Text>
                <Text style={styles.activityTime}>{activity.time}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.payoutSection}>
        <Text style={[styles.sectionTitle, { color: colorScheme === 'dark' ? '#ffffff' : '#000000' }]}>
          Next Payout
        </Text>
        <View style={styles.payoutCard}>
          <View style={styles.payoutInfo}>
            <Text style={styles.payoutDate}>May 15, 2026</Text>
            <Text style={styles.payoutAmount}>₦45,000</Text>
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
