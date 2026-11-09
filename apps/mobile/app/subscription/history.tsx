import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@azeebo/react-data/contexts/AuthContext';
import { subscriptionApi, type Subscription } from '@azeebo/react-data/api/subscription';
import { colors, typography, spacing, radius } from '../../src/theme';
import { createLogger } from '@azeebo/react-data/utils/logger';

const logger = createLogger('SubscriptionHistory');

export default function SubscriptionHistoryScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [, setTotalPages] = useState(1);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/(auth)/login');
      return;
    }
    loadHistory();
  }, [isAuthenticated]);

  const loadHistory = async (pageNum = 1) => {
    try {
      const response = await subscriptionApi.getSubscriptionHistory(pageNum, 20);
      if (response.success && response.data) {
        const newItems = response.data.subscriptions || [];
        if (pageNum === 1) {
          setSubscriptions(newItems);
        } else {
          setSubscriptions((prev) => [...prev, ...newItems]);
        }
        const pages = response.data.pagination?.totalPages || 1;
        setTotalPages(pages);
        setHasMore(pageNum < pages);
      }
    } catch (error) {
      logger.error('Failed to load subscription history', error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    setPage(1);
    await loadHistory(1);
    setIsRefreshing(false);
  };

  const loadMore = () => {
    if (hasMore && !isLoadingMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      setIsLoadingMore(true);
      loadHistory(nextPage);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatPrice = (price: number, currency: string) => {
    return `${currency === 'NGN' ? '₦' : '$'}${price.toLocaleString()}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return colors.success[500];
      case 'cancelled':
        return colors.warning[500];
      case 'expired':
        return colors.error[500];
      default:
        return colors.text.tertiary;
    }
  };

  const renderItem = ({ item }: { item: Subscription }) => {
    const statusColor = getStatusColor(item.status);
    return (
      <View style={styles.historyCard}>
        <View style={styles.historyHeader}>
          <View style={styles.historyInfo}>
            <Text style={styles.historyPlanName}>{item.plan?.name || 'Unknown Plan'}</Text>
            <Text style={styles.historyDate}>
              {formatDate(item.startDate)} — {formatDate(item.endDate)}
            </Text>
          </View>
          {item.plan && (
            <Text style={styles.historyPrice}>
              {formatPrice(item.plan.price, item.plan.currency)}
            </Text>
          )}
        </View>

        <View style={styles.historyFooter}>
          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          </View>

          <View style={styles.historyMeta}>
            {item.paymentMethod && (
              <Text style={styles.historyMetaText}>via {item.paymentMethod}</Text>
            )}
            {item.autoRenew && <Text style={styles.autoRenewBadge}>Auto-Renew</Text>}
          </View>
        </View>

        {item.lastPaymentDate && (
          <Text style={styles.lastPayment}>Last payment: {formatDate(item.lastPaymentDate)}</Text>
        )}
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Subscription History</Text>
        <Text style={styles.subtitle}>View all your past and current subscriptions</Text>
      </View>

      <FlatList
        data={subscriptions}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        keyboardDismissMode="on-drag"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary[500]}
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📜</Text>
            <Text style={styles.emptyText}>No Subscription History</Text>
            <Text style={styles.emptySubtext}>Your subscription history will appear here</Text>
            <TouchableOpacity
              style={styles.browseButton}
              onPress={() => router.push('/subscription/plans')}
            >
              <Text style={styles.browseButtonText}>Browse Plans</Text>
            </TouchableOpacity>
          </View>
        }
        ListFooterComponent={
          isLoadingMore ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color={colors.primary[500]} />
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  backButton: {
    marginBottom: spacing.md,
  },
  backText: {
    color: colors.primary[500],
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  title: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: 40,
  },
  historyCard: {
    backgroundColor: colors.bg.tertiary,
    borderRadius: radius.xl,
    padding: spacing.xl,
    marginBottom: spacing.md,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  historyInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  historyPlanName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  historyDate: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
  },
  historyPrice: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[500],
  },
  historyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  statusText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  historyMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  historyMetaText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
  },
  autoRenewBadge: {
    fontSize: typography.fontSize.xs,
    color: colors.success[500],
    fontWeight: typography.fontWeight.semibold,
  },
  lastPayment: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: spacing.xl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginBottom: spacing.xxl,
  },
  browseButton: {
    backgroundColor: colors.primary[500],
    paddingHorizontal: spacing.xxxl,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
  },
  browseButtonText: {
    color: '#fff',
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
  },
  footerLoader: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
  },
});
