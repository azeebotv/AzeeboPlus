import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { realityApi } from '../../../src/api';
import { logger } from '../../../src/utils/logger';

interface PredictionResult {
  id: string;
  predictionId: string;
  question: string;
  correctAnswer: string;
  totalParticipants: number;
  correctParticipants: number;
  accuracyRate: number;
  pointsEarned: number;
  userAnswer: string;
  isCorrect: boolean;
  rankedPosition: number;
  rewards: Array<{
    type: 'points' | 'tokens' | 'badge';
    amount: number;
    name: string;
  }>;
}

export default function PredictionResultsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const predictionId = params.predictionId as string;

  const [result, setResult] = useState<PredictionResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadResults();
  }, [predictionId]);

  const loadResults = async () => {
    try {
      const response = await realityApi.getPredictionResults(predictionId);
      if (response.success && response.data) {
        setResult(response.data);
      }
    } catch (error) {
      logger.error('Failed to load prediction results', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadResults();
    setIsRefreshing(false);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text style={styles.loadingText}>Loading results...</Text>
      </View>
    );
  }

  if (!result) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Failed to load prediction results</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={['#8B5CF6']} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Prediction Results</Text>
        <Text style={styles.question}>{result.question}</Text>
      </View>

      <View style={styles.resultCard}>
        <View style={styles.resultHeader}>
          <Text style={styles.resultLabel}>Your Answer</Text>
          <View style={[styles.badge, result.isCorrect ? styles.badgeSuccess : styles.badgeError]}>
            <Text style={styles.badgeText}>
              {result.isCorrect ? '✓ Correct' : '✗ Incorrect'}
            </Text>
          </View>
        </View>
        <Text style={styles.answerText}>{result.userAnswer}</Text>
        <Text style={styles.correctAnswer}>Correct: {result.correctAnswer}</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{result.totalParticipants.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Participants</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{result.correctParticipants.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Correct</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{result.accuracyRate}%</Text>
          <Text style={styles.statLabel}>Accuracy</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>#{result.rankedPosition}</Text>
          <Text style={styles.statLabel}>Your Rank</Text>
        </View>
      </View>

      <View style={styles.rewardsCard}>
        <Text style={styles.rewardsTitle}>Rewards Earned</Text>
        {result.rewards.map((reward, index) => (
          <View key={index} style={styles.rewardItem}>
            <Text style={styles.rewardIcon}>
              {reward.type === 'points' ? '⭐' : reward.type === 'tokens' ? '🪙' : '🏆'}
            </Text>
            <View style={styles.rewardInfo}>
              <Text style={styles.rewardName}>{reward.name}</Text>
              <Text style={styles.rewardAmount}>+{reward.amount}</Text>
            </View>
          </View>
        ))}
        <View style={styles.pointsEarned}>
          <Text style={styles.pointsLabel}>Total Points Earned</Text>
          <Text style={styles.pointsValue}>+{result.pointsEarned}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#9CA3AF',
    marginTop: 12,
  },
  errorText: {
    color: '#EF4444',
    textAlign: 'center',
    marginTop: 40,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  question: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  resultCard: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultLabel: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeSuccess: {
    backgroundColor: '#10B98120',
  },
  badgeError: {
    backgroundColor: '#EF444420',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  answerText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  correctAnswer: {
    fontSize: 14,
    color: '#10B981',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B5CF6',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  rewardsCard: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
  },
  rewardsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  rewardIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  rewardInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rewardName: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  rewardAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
  },
  pointsEarned: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  pointsLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  pointsValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F59E0B',
  },
});
