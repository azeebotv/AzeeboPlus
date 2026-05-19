import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, Dimensions } from 'react-native';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

const STATS = [
  { id: '1', label: 'Total Views', value: '1.2M', change: '+12%', emoji: '👁️' },
  { id: '2', label: 'Followers', value: '45.2K', change: '+8%', emoji: '👥' },
  { id: '3', label: 'Engagement', value: '8.5%', change: '+2%', emoji: '❤️' },
  { id: '4', label: 'Earnings', value: '₦125K', change: '+15%', emoji: '💰' },
];

const RECENT_CONTENT = [
  { id: '1', title: 'New Dance Tutorial', views: '45K', likes: '3.2K', comments: '245', time: '2h ago', emoji: '💃' },
  { id: '2', title: 'Afrobeat Challenge', views: '120K', likes: '12K', comments: '890', time: '1d ago', emoji: '🎵' },
  { id: '3', title: 'Behind the Scenes', views: '23K', likes: '2.1K', comments: '156', time: '2d ago', emoji: '🎬' },
];

const NOTIFICATIONS = [
  { id: '1', message: 'You earned ₦5,000 from your latest content', time: '1h ago', type: 'earning' },
  { id: '2', message: 'Marcus commented on your video', time: '3h ago', type: 'comment' },
  { id: '3', message: 'Your video is trending in Dance!', time: '5h ago', type: 'trending' },
];

const ANALYTICS_DATA = [
  { day: 'Mon', views: 12000 },
  { day: 'Tue', views: 15000 },
  { day: 'Wed', views: 8000 },
  { day: 'Thu', views: 22000 },
  { day: 'Fri', views: 18000 },
  { day: 'Sat', views: 25000 },
  { day: 'Sun', views: 30000 },
];

export default function CreatorDashboard() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const isDark = colorScheme === 'dark';

  return (
    <ScrollView style={[styles.container, { backgroundColor: isDark ? '#0a0a0a' : '#ffffff' }]}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
            Creator Dashboard
          </Text>
          <TouchableOpacity style={styles.settingsButton}>
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.creatorInfo}>
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarEmoji}>👤</Text>
          </View>
          <View style={styles.creatorDetails}>
            <Text style={[styles.creatorName, { color: isDark ? '#fff' : '#000' }]}>Your Channel</Text>
            <Text style={styles.creatorCategory}>Dance • Music</Text>
          </View>
          <TouchableOpacity style={styles.editButton}>
            <Text style={styles.editIcon}>✏️</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.statsGrid}>
        {STATS.map((stat) => (
          <View key={stat.id} style={[styles.statCard, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
            <Text style={styles.statEmoji}>{stat.emoji}</Text>
            <Text style={[styles.statValue, { color: isDark ? '#fff' : '#000' }]}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
            <View style={styles.statChange}>
              <Text style={styles.changeText}>{stat.change}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.analyticsSection}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
            Weekly Views
          </Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>See Details</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.chartContainer}>
          <View style={styles.chartPlaceholder}>
            {ANALYTICS_DATA.map((item, index) => (
              <View key={index} style={styles.chartBar}>
                <View
                  style={[
                    styles.bar,
                    { height: (item.views / 30000) * 100 },
                  ]}
                />
                <Text style={styles.chartLabel}>{item.day}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
            Recent Content
          </Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.contentList}>
          {RECENT_CONTENT.map((item) => (
            <TouchableOpacity key={item.id} style={[styles.contentItem, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
              <View style={styles.contentThumbnail}>
                <Text style={styles.contentEmoji}>{item.emoji}</Text>
              </View>
              <View style={styles.contentInfo}>
                <Text style={[styles.contentTitle, { color: isDark ? '#fff' : '#000' }]} numberOfLines={1}>
                  {item.title}
                </Text>
                <View style={styles.contentMeta}>
                  <Text style={styles.metaText}>👁️ {item.views}</Text>
                  <Text style={styles.metaText}>❤️ {item.likes}</Text>
                  <Text style={styles.metaText}>💬 {item.comments}</Text>
                </View>
                <Text style={styles.timeText}>{item.time}</Text>
              </View>
              <TouchableOpacity style={styles.moreButton}>
                <Text style={styles.moreIcon}>⋮</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
            Notifications
          </Text>
        </View>
        <View style={styles.notificationsList}>
          {NOTIFICATIONS.map((notification) => (
            <View key={notification.id} style={[styles.notificationItem, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
              <View style={[
                styles.notificationDot,
                notification.type === 'earning' && styles.earningDot,
                notification.type === 'comment' && styles.commentDot,
                notification.type === 'trending' && styles.trendingDot,
              ]} />
              <View style={styles.notificationContent}>
                <Text style={[styles.notificationMessage, { color: isDark ? '#fff' : '#000' }]}>
                  {notification.message}
                </Text>
                <Text style={styles.notificationTime}>{notification.time}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.actionsSection}>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>📤</Text>
          <Text style={styles.actionText}>Upload New Content</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.secondaryAction]}>
          <Text style={styles.actionIcon}>📊</Text>
          <Text style={styles.actionText}>View Full Analytics</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/(tabs)/home')}>
          <Text style={styles.navIcon}>🏠</Text>
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/(tabs)/watch')}>
          <Text style={styles.navIcon}>📺</Text>
          <Text style={styles.navLabel}>Watch</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/(tabs)/create')}>
          <Text style={styles.navIcon}>✨</Text>
          <Text style={[styles.navLabel, { color: '#4ECDC4' }]}>Create</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/(tabs)/rewards')}>
          <Text style={styles.navIcon}>⭐</Text>
          <Text style={styles.navLabel}>Rewards</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/(tabs)/profile')}>
          <Text style={styles.navIcon}>👤</Text>
          <Text style={styles.navLabel}>Profile</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
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
    backgroundColor: '#2a2a2a',
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
    backgroundColor: '#2a2a2a',
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
    backgroundColor: '#4ECDC4',
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
    color: '#888',
    fontSize: 13,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2a2a2a',
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
    color: '#888',
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
    color: '#4ECDC4',
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
    backgroundColor: '#4ECDC4',
    borderRadius: 4,
    marginBottom: 8,
  },
  chartLabel: {
    color: '#888',
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
    backgroundColor: '#2a2a2a',
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
    color: '#888',
    fontSize: 12,
  },
  timeText: {
    color: '#666',
    fontSize: 11,
  },
  moreButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreIcon: {
    color: '#888',
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
    color: '#666',
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
    backgroundColor: '#4ECDC4',
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
  },
  secondaryAction: {
    backgroundColor: '#2a2a2a',
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
    borderTopColor: '#2a2a2a',
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
    color: '#888',
  },
});