import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { walletApi } from '../../src/api';
import { logger } from '../../src/utils/logger';
import { LoadingState } from '../../src/components/StateContainers';
import { colors } from '../../src/theme';

interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'payment' | 'refund' | 'reward' | 'tip';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  description: string;
  reference: string;
  createdAt: string;
  metadata?: {
    provider?: string;
    bankName?: string;
    accountNumber?: string;
    contentTitle?: string;
    creatorName?: string;
  };
}

type FilterType = 'all' | 'deposit' | 'withdrawal' | 'payment' | 'reward';

export default function TransactionsScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.replace('/(auth)/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    loadTransactions();
  }, [authLoading, isAuthenticated, filter]);

  const loadTransactions = async (pageNum = 1) => {
    try {
      const response = await walletApi.getTransactions(pageNum, 20);

      if (response.success && response.data) {
        const mapped: Transaction[] = response.data.items.map((t) => ({
          id: t.id,
          type: (t.type === 'credit' ? 'deposit' : 'payment') as Transaction['type'],
          amount: t.amount,
          currency: t.currency,
          status:
            t.status === 'completed' ? 'completed' : t.status === 'failed' ? 'failed' : 'pending',
          description: t.description || t.type,
          reference: t.id,
          createdAt: t.createdAt,
        }));
        if (pageNum === 1) {
          setTransactions(mapped);
        } else {
          setTransactions((prev) => [...prev, ...mapped]);
        }
        setHasMore(pageNum < response.data.totalPages);
      }
    } catch (error) {
      logger.error('Failed to load transactions', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    setPage(1);
    await loadTransactions(1);
    setIsRefreshing(false);
  };

  const loadMore = () => {
    if (hasMore && !isLoading) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadTransactions(nextPage);
    }
  };

  const getTypeIcon = (type: string): string => {
    switch (type) {
      case 'deposit':
        return '💰';
      case 'withdrawal':
        return '💸';
      case 'payment':
        return '🛒';
      case 'refund':
        return '↩️';
      case 'reward':
        return '🎁';
      case 'tip':
        return '💝';
      default:
        return '💳';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed':
        return colors.success[500];
      case 'pending':
        return colors.warning[500];
      case 'failed':
        return colors.error[500];
      case 'cancelled':
        return colors.light[500];
      default:
        return colors.light[400];
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-NG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatAmount = (amount: number, type: string): string => {
    const formatted = `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
    return type === 'deposit' || type === 'refund' || type === 'reward' || type === 'tip'
      ? `+${formatted}`
      : `-${formatted}`;
  };

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <TouchableOpacity
      style={styles.transactionCard}
      onPress={() => router.push(`/transactions/${item.id}`)}
    >
      <View style={styles.transactionHeader}>
        <View style={styles.typeContainer}>
          <Text style={styles.typeIcon}>{getTypeIcon(item.type)}</Text>
          <View style={styles.typeInfo}>
            <Text style={styles.description}>{item.description}</Text>
            <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
          </View>
        </View>
        <Text
          style={[
            styles.amount,
            {
              color:
                item.type === 'deposit' ||
                item.type === 'refund' ||
                item.type === 'reward' ||
                item.type === 'tip'
                  ? colors.success[500]
                  : colors.error[500],
            },
          ]}
        >
          {formatAmount(item.amount, item.type)}
        </Text>
      </View>
      <View style={styles.transactionFooter}>
        <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item.status)}20` }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Text>
        </View>
        <Text style={styles.reference}>Ref: {item.reference}</Text>
      </View>
      {item.metadata?.provider && <Text style={styles.provider}>via {item.metadata.provider}</Text>}
    </TouchableOpacity>
  );

  if (isLoading && transactions.length === 0) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <LoadingState text="Loading transactions..." />
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Transactions</Text>
        <Text style={styles.subtitle}>Your transaction history</Text>
      </View>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {(['all', 'deposit', 'withdrawal', 'payment', 'reward'] as FilterType[]).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterButton, filter === f && styles.filterButtonActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={transactions}
        renderItem={renderTransaction}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        keyboardDismissMode="on-drag"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[colors.primary[500]]}
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>💳</Text>
            <Text style={styles.emptyText}>No transactions yet</Text>
          </View>
        }
        ListFooterComponent={
          hasMore && !isLoading ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color={colors.primary[500]} />
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  header: {
    padding: 16,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.light[400],
  },
  filterContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.bg.surface,
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: colors.primary[500],
  },
  filterText: {
    fontSize: 14,
    color: colors.light[400],
    fontWeight: '500',
  },
  filterTextActive: {
    color: colors.text.primary,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  transactionCard: {
    backgroundColor: colors.bg.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  typeIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  typeInfo: {
    flex: 1,
  },
  description: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
    color: colors.light[500],
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  transactionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  reference: {
    fontSize: 11,
    color: colors.light[500],
  },
  provider: {
    fontSize: 12,
    color: colors.light[400],
    marginTop: 8,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.bg.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.light[400],
    marginTop: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: colors.light[400],
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
  },
});
