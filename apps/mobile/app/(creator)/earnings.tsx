import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { contentApi } from '../../src/api';
import { logger } from '../../src/utils/logger';
import { LoadingState, EmptyState, ErrorState } from '../../src/components/StateContainers';

interface EarningsData {
  totalEarnings: number;
  availableBalance: number;
  pendingEarnings: number;
  lifetimeEarnings: number;
  earningsHistory: Array<{
    date: string;
    amount: number;
    source: string;
    status: 'completed' | 'pending' | 'failed';
  }>;
  revenueBreakdown: {
    subscriptions: number;
    tips: number;
    ads: number;
    superVotes: number;
  };
}

export default function EarningsDashboardScreen() {
  const router = useRouter();
  const [earnings, setEarnings] = useState<EarningsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadEarnings();
  }, []);

  const loadEarnings = async () => {
    try {
      const response = await contentApi.getEarnings();
      if (response.success && response.data) {
        // Cast CreatorEarnings to EarningsData since both have same structure
        setEarnings(response.data as unknown as EarningsData);
      }
    } catch (error) {
      logger.error('Failed to load earnings', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed':
        return '#10B981';
      case 'pending':
        return '#F59E0B';
      case 'failed':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <LoadingState text="Loading earnings..." />
      </SafeAreaView>
    );
  }

  if (!earnings) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ErrorState
          title="Failed to load"
          description="Could not load earnings data"
          onRetry={loadEarnings}
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
        <Text style={styles.title}>Earnings Dashboard</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceAmount}>{formatCurrency(earnings.availableBalance)}</Text>
          <TouchableOpacity
            style={styles.withdrawButton}
            onPress={() => router.push('/(tabs)/wallet/withdraw' as any)}
          >
            <Text style={styles.withdrawButtonText}>Withdraw Funds</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{formatCurrency(earnings.pendingEarnings)}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{formatCurrency(earnings.lifetimeEarnings)}</Text>
            <Text style={styles.statLabel}>Lifetime</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Revenue Breakdown</Text>
          <View style={styles.revenueCard}>
            <View style={styles.revenueRow}>
              <Text style={styles.revenueLabel}>Subscriptions</Text>
              <Text style={styles.revenueValue}>
                {formatCurrency(earnings.revenueBreakdown.subscriptions)}
              </Text>
            </View>
            <View style={styles.revenueRow}>
              <Text style={styles.revenueLabel}>Tips</Text>
              <Text style={styles.revenueValue}>
                {formatCurrency(earnings.revenueBreakdown.tips)}
              </Text>
            </View>
            <View style={styles.revenueRow}>
              <Text style={styles.revenueLabel}>Ads</Text>
              <Text style={styles.revenueValue}>
                {formatCurrency(earnings.revenueBreakdown.ads)}
              </Text>
            </View>
            <View style={styles.revenueRow}>
              <Text style={styles.revenueLabel}>Super Votes</Text>
              <Text style={styles.revenueValue}>
                {formatCurrency(earnings.revenueBreakdown.superVotes)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Earnings History</Text>
          {earnings.earningsHistory.map((item, index) => (
            <View key={index} style={styles.historyItem}>
              <View style={styles.historyInfo}>
                <Text style={styles.historySource}>{item.source}</Text>
                <Text style={styles.historyDate}>{new Date(item.date).toLocaleDateString()}</Text>
              </View>
              <View style={styles.historyRight}>
                <Text style={styles.historyAmount}>{formatCurrency(item.amount)}</Text>
                <View
                  style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}
                >
                  <Text style={styles.statusText}>{item.status}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
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
    backgroundColor: '#8B5CF6',
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
    borderBottomColor: '#1f2937',
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
  content: {
    padding: 24,
  },
  balanceCard: {
    backgroundColor: '#8B5CF6',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  withdrawButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  withdrawButtonText: {
    color: '#8B5CF6',
    fontSize: 16,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F3F4F6',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#9CA3AF',
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
  revenueCard: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
  },
  revenueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  revenueLabel: {
    fontSize: 14,
    color: '#F3F4F6',
  },
  revenueValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F3F4F6',
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  historyInfo: {
    flex: 1,
  },
  historySource: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F3F4F6',
    marginBottom: 4,
  },
  historyDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  historyRight: {
    alignItems: 'flex-end',
  },
  historyAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F3F4F6',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});
