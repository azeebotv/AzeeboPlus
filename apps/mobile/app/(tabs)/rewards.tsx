import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useColorScheme } from 'react-native';

const rewards = [
  { id: '1', title: '100 Points', description: 'Watch 5 videos', progress: 3, total: 5, icon: '🎬', color: '#FF6B6B' },
  { id: '2', title: '250 Points', description: 'Invite 3 friends', progress: 1, total: 3, icon: '👥', color: '#4ECDC4' },
  { id: '3', title: '500 Points', description: 'Complete profile', progress: 4, total: 5, icon: '✅', color: '#45B7D1' },
  { id: '4', title: '1000 Points', description: 'First purchase', progress: 0, total: 1, icon: '🛒', color: '#96CEB4' },
];

const rewardsHistory = [
  { id: '1', title: 'Watch Bonus', points: 50, date: 'Today', icon: '🎬' },
  { id: '2', title: 'Daily Login', points: 10, date: 'Today', icon: '📅' },
  { id: '3', title: 'Referral Bonus', points: 250, date: 'Yesterday', icon: '👥' },
  { id: '4', title: 'Video Watch', points: 20, date: '2 days ago', icon: '🎬' },
];

const redeemOptions = [
  { id: '1', name: '100 NGN', points: 1000, icon: '💳' },
  { id: '2', name: '500 NGN', points: 5000, icon: '💰' },
  { id: '3', name: '1000 NGN', points: 10000, icon: '💵' },
  { id: '4', name: 'Premium Month', points: 3000, icon: '⭐' },
];

export default function RewardsScreen() {
  const colorScheme = useColorScheme();
  const [currentPoints] = useState(7850);

  const isDark = colorScheme === 'dark';

  return (
    <ScrollView style={[styles.container, { backgroundColor: isDark ? '#0a0a0a' : '#ffffff' }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: isDark ? '#ffffff' : '#000000' }]}>Rewards</Text>
        <TouchableOpacity style={styles.historyButton}>
          <Text style={styles.historyIcon}>📜</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.pointsCard}>
        <View style={styles.pointsContent}>
          <Text style={styles.pointsLabel}>Total Points</Text>
          <View style={styles.pointsAmount}>
            <Text style={styles.pointsValue}>{currentPoints.toLocaleString()}</Text>
            <Text style={styles.pointsSuffix}>pts</Text>
          </View>
          <Text style={styles.pointsEquivalent}>≈ {Math.floor(currentPoints / 10)} NGN</Text>
        </View>
        <View style={styles.pointsDecoration}>
          <Text style={styles.decorationIcon}>🎁</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
          Earn Points
        </Text>
        <View style={styles.rewardsList}>
          {rewards.map((reward) => (
            <View key={reward.id} style={[styles.rewardItem, { backgroundColor: isDark ? '#1a1a1a' : '#f8f9fa' }]}>
              <View style={[styles.rewardIcon, { backgroundColor: `${reward.color}20` }]}>
                <Text style={styles.rewardIconText}>{reward.icon}</Text>
              </View>
              <View style={styles.rewardInfo}>
                <Text style={[styles.rewardTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
                  {reward.title}
                </Text>
                <Text style={styles.rewardDescription}>{reward.description}</Text>
                <View style={styles.rewardProgressBar}>
                  <View style={[styles.rewardProgressFill, { width: `${(reward.progress / reward.total) * 100}%`, backgroundColor: reward.color }]} />
                </View>
                <Text style={styles.rewardProgressText}>{reward.progress}/{reward.total} completed</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
          Redeem Rewards
        </Text>
        <View style={styles.redeemGrid}>
          {redeemOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.redeemCard,
                { backgroundColor: isDark ? '#1a1a1a' : '#f8f9fa' },
                currentPoints < option.points && { opacity: 0.5 },
              ]}
              disabled={currentPoints < option.points}
            >
              <Text style={styles.redeemIcon}>{option.icon}</Text>
              <Text style={[styles.redeemName, { color: isDark ? '#ffffff' : '#000000' }]}>
                {option.name}
              </Text>
              <View style={[styles.redeemPoints, currentPoints < option.points && { backgroundColor: '#ccc' }]}>
                <Text style={styles.redeemPointsText}>{option.points} pts</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
          Recent Activity
        </Text>
        <View style={styles.historyList}>
          {rewardsHistory.map((item) => (
            <View key={item.id} style={[styles.historyItem, { backgroundColor: isDark ? '#1a1a1a' : '#f8f9fa' }]}>
              <View style={styles.historyIconView}>
                <Text style={styles.historyIconText}>{item.icon}</Text>
              </View>
              <View style={styles.historyInfo}>
                <Text style={[styles.historyTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
                  {item.title}
                </Text>
                <Text style={styles.historyDate}>{item.date}</Text>
              </View>
              <Text style={styles.historyPoints}>+{item.points}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.bonusSection}>
        <Text style={styles.bonusIcon}>🎉</Text>
        <View style={styles.bonusContent}>
          <Text style={[styles.bonusTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
            Bonus Points Weekend!
          </Text>
          <Text style={styles.bonusDescription}>Earn 2x points on all activities this weekend</Text>
        </View>
        <TouchableOpacity style={styles.bonusButton}>
          <Text style={styles.bonusButtonText}>Learn More</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  historyButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyIcon: {
    fontSize: 18,
  },
  pointsCard: {
    backgroundColor: '#8B5CF6',
    borderRadius: 20,
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  pointsContent: {
    flex: 1,
  },
  pointsLabel: {
    color: '#ffffff',
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 8,
  },
  pointsAmount: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  pointsValue: {
    color: '#ffffff',
    fontSize: 42,
    fontWeight: '700',
  },
  pointsSuffix: {
    color: '#ffffff',
    fontSize: 18,
    opacity: 0.8,
  },
  pointsEquivalent: {
    color: '#ffffff',
    fontSize: 14,
    opacity: 0.8,
    marginTop: 4,
  },
  pointsDecoration: {
    width: 64,
    height: 64,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  decorationIcon: {
    fontSize: 32,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 14,
  },
  rewardsList: {
    gap: 12,
  },
  rewardItem: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderRadius: 12,
  },
  rewardIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardIconText: {
    fontSize: 24,
  },
  rewardInfo: {
    flex: 1,
  },
  rewardTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  rewardDescription: {
    fontSize: 13,
    color: '#888',
    marginBottom: 8,
  },
  rewardProgressBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#e0e0e0',
    marginBottom: 4,
  },
  rewardProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  rewardProgressText: {
    fontSize: 12,
    color: '#666',
  },
  redeemGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  redeemCard: {
    width: '47%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  redeemIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  redeemName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  redeemPoints: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  redeemPointsText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  historyList: {
    gap: 12,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 10,
  },
  historyIconView: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyIconText: {
    fontSize: 20,
  },
  historyInfo: {
    flex: 1,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  historyDate: {
    fontSize: 12,
    color: '#888',
  },
  historyPoints: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
  },
  bonusSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    marginBottom: 32,
  },
  bonusIcon: {
    fontSize: 32,
  },
  bonusContent: {
    flex: 1,
  },
  bonusTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  bonusDescription: {
    fontSize: 13,
    color: '#B45309',
  },
  bonusButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#F59E0B',
    borderRadius: 20,
  },
  bonusButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
});
