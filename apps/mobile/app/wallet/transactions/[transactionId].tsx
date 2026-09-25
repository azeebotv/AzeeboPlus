'use client';
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { apiClient } from '@azeebo/react-data/api/client';
import { LoadingState, ErrorState } from '../../../src/components/StateContainers';
import type { TransactionDetail } from '@azeebo/react-data/api/wallet';
import { colors } from '../../../src/theme';

export default function TransactionDetailScreen() {
  const router = useRouter();
  const { transactionId } = useLocalSearchParams<{ transactionId: string }>();

  const [transaction, setTransaction] = useState<TransactionDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTransaction = async () => {
    if (!transactionId) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await apiClient.get<TransactionDetail>(
        `/api/v1/wallet/transactions/${transactionId}`
      );
      setTransaction(res);
    } catch (err) {
      setError('Transaction not found');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTransaction();
  }, [transactionId]);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#10B981';
      case 'pending':
        return '#F59E0B';
      case 'failed':
        return '#EF4444';
      default:
        return '#9A8A7A';
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingState text="Loading transaction..." />
      </SafeAreaView>
    );
  }

  if (error || !transaction) {
    return (
      <SafeAreaView style={styles.container}>
        <ErrorState
          title="Not Found"
          description={error || 'Transaction not found'}
          onRetry={loadTransaction}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Transaction Details</Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadTransaction} />}
      >
        <View style={styles.transactionCard}>
          <View style={styles.transactionHeader}>
            <View style={styles.idSection}>
              <Text style={styles.label}>Transaction ID</Text>
              <Text style={styles.id}>{transaction.id}</Text>
            </View>
            <View
              style={[styles.statusBadge, { backgroundColor: getStatusColor(transaction.status) }]}
            >
              <Text style={styles.statusText}>{transaction.status.toUpperCase()}</Text>
            </View>
          </View>

          <View style={styles.amountSection}>
            <Text style={styles.label}>Amount</Text>
            <Text style={styles.amount}>₦{Number(transaction.amount).toLocaleString()}</Text>
          </View>

          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Type</Text>
              <Text style={styles.value}>{transaction.type.replace('_', ' ').toUpperCase()}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>Date</Text>
              <Text style={styles.value}>{formatDate(transaction.createdAt)}</Text>
            </View>

            {transaction.description && (
              <View style={styles.infoRow}>
                <Text style={styles.label}>Description</Text>
                <Text style={styles.value}>{transaction.description}</Text>
              </View>
            )}

            {transaction.balanceAfter !== undefined && (
              <View style={styles.infoRow}>
                <Text style={styles.label}>Balance After</Text>
                <Text style={styles.value}>
                  ₦{Number(transaction.balanceAfter).toLocaleString()}
                </Text>
              </View>
            )}
          </View>
        </View>

        {transaction.status === 'pending' && (
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>
              This transaction is pending. It may take up to 24 hours to complete.
            </Text>
          </View>
        )}

        {transaction.status === 'failed' && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>
              This transaction failed. Please contact support if you believe this is an error.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A0A0A' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
    backgroundColor: '#1a1a1a',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bg.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { color: '#fff', fontSize: 20 },
  title: { color: '#fff', fontSize: 18, fontWeight: '600', marginLeft: 'auto' },
  content: { flex: 1, padding: 16 },
  transactionCard: {
    backgroundColor: '#140808',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  idSection: { flex: 1 },
  label: { color: '#9A8A7A', fontSize: 12 },
  id: { color: '#fff', fontSize: 14, fontWeight: '500', marginTop: 4, fontFamily: 'monospace' },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  amountSection: { marginBottom: 24 },
  amount: { color: '#fff', fontSize: 24, fontWeight: '700' },
  infoSection: { borderTopWidth: 1, borderTopColor: '#2A1A1A', paddingTop: 16 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  value: { color: '#fff', fontSize: 14, fontWeight: '500' },
  warningBox: {
    backgroundColor: 'rgba(245,158,11,0.1)',
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
    padding: 16,
    borderRadius: 8,
  },
  warningText: { color: '#F59E0B', fontSize: 14, lineHeight: 20 },
  errorBox: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
    padding: 16,
    borderRadius: 8,
  },
  errorText: { color: '#EF4444', fontSize: 14, lineHeight: 20 },
});
