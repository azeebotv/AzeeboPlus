import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useColorScheme } from 'react-native';
import { apiClient } from '../../src/api';
import { logger } from '../../src/utils/logger';
import { colors, typography, spacing, radius } from '../../src/theme';
import { LoadingState, ErrorState, EmptyState } from '../../src/components/StateContainers';
import {
  PageTransition,
  ScrollReveal,
  StaggerGrid,
  GlowCard,
  AnimatedProgress,
  FadeIn,
} from '../../src/components/motion';

interface RewardItem {
  id: string;
  title: string;
  description: string;
  progress: number;
  total: number;
  icon: string;
  color: string;
}

interface RewardHistoryItem {
  id: string;
  title: string;
  points: number;
  date: string;
  icon: string;
}

interface RedeemOption {
  id: string;
  name: string;
  points: number;
  icon: string;
}

export default function RewardsScreen() {
  const colorScheme = useColorScheme();
  const [rewards, setRewards] = useState<RewardItem[]>([]);
  const [history, setHistory] = useState<RewardHistoryItem[]>([]);
  const [redeemOptions, setRedeemOptions] = useState<RedeemOption[]>([]);
  const [currentPoints, setCurrentPoints] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isDark = colorScheme === 'dark';

  const fetchRewards = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [pointsRes, rewardsRes, historyRes, redeemRes] = await Promise.all([
        apiClient.get<{ points: number }>('/rewards/points').catch(() => ({ points: 0 })),
        apiClient.get<RewardItem[]>('/rewards/quests').catch(() => []),
        apiClient.get<RewardHistoryItem[]>('/rewards/history').catch(() => []),
        apiClient.get<RedeemOption[]>('/rewards/redeem-options').catch(() => []),
      ]);
      setCurrentPoints(pointsRes.points);
      setRewards(Array.isArray(rewardsRes) ? rewardsRes : []);
      setHistory(Array.isArray(historyRes) ? historyRes : []);
      setRedeemOptions(Array.isArray(redeemRes) ? redeemRes : []);
    } catch (err: any) {
      logger.error('Failed to load rewards:', err);
      setError(err.message || 'Failed to load rewards');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRewards();
  }, []);

  if (isLoading) {
    return (
      <ScrollView
        style={[styles.container, { backgroundColor: isDark ? '#0a0a0a' : '#ffffff' }]}
      >
        <LoadingState text="Loading rewards..." />
      </ScrollView>
    );
  }

  if (error) {
    return (
      <ScrollView
        style={[styles.container, { backgroundColor: isDark ? '#0a0a0a' : '#ffffff' }]}
      >
        <ErrorState description={error} onRetry={fetchRewards} />
      </ScrollView>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: isDark ? '#0a0a0a' : '#ffffff' }]}>
      <PageTransition>
        <ScrollReveal direction="up">
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
              Rewards
            </Text>
            <TouchableOpacity style={[styles.historyButton, { backgroundColor: isDark ? '#1a1a1a' : '#f0f0f0' }]}>
              <Text style={styles.historyIcon}>📜</Text>
            </TouchableOpacity>
          </View>
        </ScrollReveal>

        <ScrollReveal direction="up" delay={60}>
          <FadeIn>
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
          </FadeIn>
        </ScrollReveal>

        <ScrollReveal direction="up" delay={120}>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
              Earn Points
            </Text>
            <StaggerGrid staggerDelay={60}>
              {rewards.map((reward) => (
                <View
                  key={reward.id}
                  style={[styles.rewardItem, { backgroundColor: isDark ? '#1a1a1a' : '#f8f9fa' }]}
                >
                  <View style={[styles.rewardIcon, { backgroundColor: `${reward.color}20` }]}>
                    <Text style={styles.rewardIconText}>{reward.icon}</Text>
                  </View>
                  <View style={styles.rewardInfo}>
                    <Text style={[styles.rewardTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
                      {reward.title}
                    </Text>
                    <Text style={styles.rewardDescription}>{reward.description}</Text>
                    <AnimatedProgress
                      progress={(reward.progress / reward.total) * 100}
                      color={reward.color}
                    />
                    <Text style={styles.rewardProgressText}>
                      {reward.progress}/{reward.total} completed
                    </Text>
                  </View>
                </View>
              ))}
            </StaggerGrid>
          </View>
        </ScrollReveal>

        <ScrollReveal direction="up" delay={180}>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
              Redeem Rewards
            </Text>
            <View style={styles.redeemGrid}>
              {redeemOptions.map((option) => (
                <GlowCard
                  key={option.id}
                  variant="subtle"
                  padding={16}
                  onPress={() => {}}
                  style={[
                    styles.redeemCard,
                    currentPoints < option.points && { opacity: 0.5 },
                  ]}
                >
                  <Text style={styles.redeemIcon}>{option.icon}</Text>
                  <Text style={[styles.redeemName, { color: isDark ? '#ffffff' : '#000000' }]}>
                    {option.name}
                  </Text>
                  <View
                    style={[
                      styles.redeemPoints,
                      currentPoints < option.points && { backgroundColor: '#ccc' },
                    ]}
                  >
                    <Text style={styles.redeemPointsText}>{option.points} pts</Text>
                  </View>
                </GlowCard>
              ))}
            </View>
          </View>
        </ScrollReveal>

        <ScrollReveal direction="up" delay={240}>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
              Recent Activity
            </Text>
            <View style={styles.historyList}>
              {history.length === 0 ? (
                <Text style={{ color: '#888', textAlign: 'center', padding: 20 }}>
                  No recent activity
                </Text>
              ) : (
                history.map((item) => (
                  <View
                    key={item.id}
                    style={[styles.historyItem, { backgroundColor: isDark ? '#1a1a1a' : '#f8f9fa' }]}
                  >
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
                ))
              )}
            </View>
          </View>
        </ScrollReveal>

        <ScrollReveal direction="up" delay={300}>
          <GlowCard variant="subtle" padding={16} style={styles.bonusSection}>
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
          </GlowCard>
        </ScrollReveal>
      </PageTransition>
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
  rewardItem: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
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
  rewardProgressText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  redeemGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  redeemCard: {
    width: '47%',
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
