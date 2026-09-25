import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { walletApi } from '@azeebo/react-data';
import { logger } from '@azeebo/react-data/utils/logger';
import { colors } from '../../src/theme';

interface TransactionDetail {
  id: string;
  type: string;
  amount: number;
  currency: string;
  status: string;
  description?: string;
  createdAt: string;
  updatedAt?: string;
  reference: string;
  metadata?: {
    source?: string;
    method?: string;
    fee?: number;
    relatedTransactionId?: string;
  };
  balanceBefore: number;
  balanceAfter: number;
}

export default function TransactionDetailScreen() {
  const { transactionId } = useLocalSearchParams();
  const router = useRouter();
  const [transaction, setTransaction] = useState<TransactionDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (transactionId) {
      loadTransaction(transactionId as string);
    }
  }, [transactionId]);

  const loadTransaction = async (id: string) => {
    try {
      const response = await walletApi.getTransaction(id);
      if (response.success && response.data) {
        setTransaction(response.data);
      }
    } catch (error) {
      logger.error('Failed to load transaction', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed':
        return '#10B981';
      case 'pending':
        return '#F59E0B';
      case 'failed':
        return '#EF4444';
      case 'cancelled':
        return '#6B7280';
      default:
        return '#9CA3AF';
    }
  };

  const getTypeIcon = (type: string): string => {
    switch (type) {
      case 'credit':
        return '↓';
      case 'debit':
        return '↑';
      case 'refund':
        return '↩';
      default:
        return '•';
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E8420A" />
        <Text style={styles.loadingText}>Loading transaction...</Text>
      </SafeAreaView>
    );
  }

  if (!transaction) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorText}>Transaction not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backNav}>
            <Text style={styles.backNavText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Transaction Details</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.statusRow}>
            <Text style={styles.typeIcon}>{getTypeIcon(transaction.type)}</Text>
            <View style={styles.statusInfo}>
              <Text style={styles.typeText}>{transaction.type.toUpperCase()}</Text>
              <Text style={[styles.statusText, { color: getStatusColor(transaction.status) }]}>
                {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
              </Text>
            </View>
            <Text style={styles.amountText}>
              {transaction.type === 'debit' ? '-' : '+'}
              {transaction.currency} {transaction.amount.toLocaleString()}
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Transaction Info</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Reference</Text>
            <Text style={styles.value}>{transaction.reference}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Description</Text>
            <Text style={styles.value}>{transaction.description}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Date</Text>
            <Text style={styles.value}>{new Date(transaction.createdAt).toLocaleString()}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Balance Before</Text>
            <Text style={styles.value}>
              {transaction.currency} {transaction.balanceBefore.toLocaleString()}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Balance After</Text>
            <Text style={styles.value}>
              {transaction.currency} {transaction.balanceAfter.toLocaleString()}
            </Text>
          </View>
        </View>

        {transaction.metadata && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Additional Details</Text>
            {transaction.metadata.source && (
              <View style={styles.infoRow}>
                <Text style={styles.label}>Source</Text>
                <Text style={styles.value}>{transaction.metadata.source}</Text>
              </View>
            )}
            {transaction.metadata.method && (
              <View style={styles.infoRow}>
                <Text style={styles.label}>Method</Text>
                <Text style={styles.value}>{transaction.metadata.method}</Text>
              </View>
            )}
            {transaction.metadata.fee !== undefined && (
              <View style={styles.infoRow}>
                <Text style={styles.label}>Fee</Text>
                <Text style={styles.value}>
                  {transaction.currency} {transaction.metadata.fee}
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A0A0A',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#1A0A0A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.light[400],
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#1A0A0A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 16,
    color: colors.light[400],
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#E8420A',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backNav: {
    marginRight: 12,
  },
  backNavText: {
    fontSize: 24,
    color: '#E8420A',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  card: {
    backgroundColor: colors.bg.tertiary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  statusInfo: {
    flex: 1,
  },
  typeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statusText: {
    fontSize: 14,
    marginTop: 2,
  },
  amountText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.2)',
  },
  label: {
    fontSize: 14,
    color: colors.light[400],
  },
  value: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
    maxWidth: '60%',
    textAlign: 'right',
  },
});
