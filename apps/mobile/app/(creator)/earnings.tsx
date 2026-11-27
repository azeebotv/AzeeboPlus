import { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { contentApi } from '@azeebo/react-data';
import { logger } from '@azeebo/react-data/utils/logger';
import { LoadingState, ErrorState } from '../../src/components/StateContainers';
import { colors } from '../../src/theme';
import { brand } from '@azeebo/design-tokens';

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
      <SafeAreaView accessibilityLabel="Earnings Screen" style={styles.container} edges={['top']}>
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
        <TouchableOpacity accessibilityRole="button" style={styles.backButton} onPress={() => router.back()}>
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
            onPress={() => router.push('/(tabs)/wallet/withdraw' as Href)}
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
    backgroundColor: '#1A0A0A',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: colors.light[400],
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: colors.light[100],
    fontSize: 18,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: brand.flame,
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
    color: colors.light[100],
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.light[100],
  },
  content: {
    padding: 24,
  },
  balanceCard: {
    backgroundColor: brand.flame,
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
    color: brand.flame,
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
    backgroundColor: colors.bg.tertiary,
    borderRadius: 12,
    padding: 16,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.light[100],
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.light[400],
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.light[100],
    marginBottom: 16,
  },
  revenueCard: {
    backgroundColor: colors.bg.tertiary,
    borderRadius: 12,
    padding: 16,
  },
  revenueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.2)',
  },
  revenueLabel: {
    fontSize: 14,
    color: colors.light[100],
  },
  revenueValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.light[100],
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.bg.tertiary,
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
    color: colors.light[100],
    marginBottom: 4,
  },
  historyDate: {
    fontSize: 12,
    color: colors.light[400],
  },
  historyRight: {
    alignItems: 'flex-end',
  },
  historyAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.light[100],
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
