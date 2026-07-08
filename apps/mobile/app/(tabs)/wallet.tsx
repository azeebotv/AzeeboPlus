import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  useColorScheme,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/contexts/AuthContext';
import { useWalletBalance, useWalletTransactions, useFundWallet, useWithdraw } from '../../src/hooks/useWalletQuery';

export default function WalletScreen() {
  const colorScheme = useColorScheme();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const {
    data: wallet,
    isLoading: walletLoading,
    error: walletError,
    refetch: refetchWallet,
  } = useWalletBalance();

  const {
    data: transactionsData,
    isLoading: transactionsLoading,
    error: transactionsError,
    refetch: refetchTransactions,
  } = useWalletTransactions(1, 50);

  const fundMutation = useFundWallet();
  const withdrawMutation = useWithdraw();

  const transactions = transactionsData?.items ?? [];
  const isLoading = walletLoading || transactionsLoading;
  const error = walletError?.message || transactionsError?.message || null;

  const [refreshing, setRefreshing] = useState(false);
  const [showFundModal, setShowFundModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [fundAmount, setFundAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchWallet(), refetchTransactions()]);
    setRefreshing(false);
  };

  const handleFundWallet = async () => {
    const amount = parseFloat(fundAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (!user?.email) {
      Alert.alert('Error', 'User email not found');
      return;
    }

    try {
      await fundMutation.mutateAsync({ amount, provider: 'paystack', email: user.email });
      Alert.alert('Success', 'Payment initiated. Complete payment to fund wallet.');
      setShowFundModal(false);
      setFundAmount('');
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to fund wallet');
    }
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (!bankCode || !accountNumber) {
      Alert.alert('Error', 'Please enter bank details');
      return;
    }

    try {
      await withdrawMutation.mutateAsync({ amount, bankCode, accountNumber });
      Alert.alert('Success', 'Withdrawal initiated successfully');
      setShowWithdrawModal(false);
      setWithdrawAmount('');
      setBankCode('');
      setAccountNumber('');
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to withdraw funds');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTransactionIcon = (type: string) => {
    return type === 'credit' ? '💰' : '💸';
  };

  if (authLoading) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          styles.centered,
          { backgroundColor: colorScheme === 'dark' ? '#1A0A0A' : '#fff' },
        ]}
      >
        <ActivityIndicator size="large" color="#E8420A" />
      </SafeAreaView>
    );
  }

  if (!isAuthenticated) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          styles.centered,
          { backgroundColor: colorScheme === 'dark' ? '#1A0A0A' : '#fff' },
        ]}
      >
        <Text style={styles.lockIcon}>🔒</Text>
        <Text style={[styles.lockText, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>
          Please log in to view your wallet
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#1A0A0A' : '#fff' }]}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E8420A" />
        }
      >
        <View style={styles.header}>
          <Text style={[styles.greeting, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>
            Hello, {user?.name || 'User'}
          </Text>
          <Text style={styles.title}>My Wallet</Text>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={onRefresh} accessibilityLabel="Retry loading wallet">
              <Text style={styles.retryText}>Tap to retry</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={[styles.balanceCard, { backgroundColor: '#E8420A' }]}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceAmount}>
            {wallet ? formatCurrency(wallet.balance) : '₦0.00'}
          </Text>
          {wallet?.pendingBalance && wallet.pendingBalance > 0 && (
            <Text style={styles.pendingBalance}>
              Pending: {formatCurrency(wallet.pendingBalance)}
            </Text>
          )}
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={() => setShowFundModal(true)} accessibilityLabel="Fund Wallet">
            <Text style={styles.actionIcon}>💎</Text>
            <Text style={styles.actionLabel}>Fund Wallet</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => setShowWithdrawModal(true)} accessibilityLabel="Withdraw">
            <Text style={styles.actionIcon}>🏦</Text>
            <Text style={styles.actionLabel}>Withdraw</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.transactionsSection}>
          <Text style={[styles.sectionTitle, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>
            Recent Transactions
          </Text>

          {isLoading && transactions.length === 0 ? (
            <ActivityIndicator size="large" color="#E8420A" style={styles.loader} />
          ) : transactions.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={[styles.emptyText, { color: colorScheme === 'dark' ? '#666' : '#999' }]}>
                No transactions yet
              </Text>
              <Text
                style={[styles.emptySubtext, { color: colorScheme === 'dark' ? '#444' : '#ccc' }]}
              >
                Your transaction history will appear here
              </Text>
            </View>
          ) : (
            <View style={styles.transactionsList}>
              {transactions.map((transaction) => (
                <View
                  key={transaction.id}
                  style={[
                    styles.transactionItem,
                    { borderBottomColor: colorScheme === 'dark' ? '#333' : '#eee' },
                  ]}
                >
                  <View style={styles.transactionLeft}>
                    <Text style={styles.transactionIcon}>
                      {getTransactionIcon(transaction.type)}
                    </Text>
                    <View style={styles.transactionInfo}>
                      <Text
                        style={[
                          styles.transactionTitle,
                          { color: colorScheme === 'dark' ? '#fff' : '#000' },
                        ]}
                      >
                        {transaction.description ||
                          (transaction.type === 'credit' ? 'Credit' : 'Debit')}
                      </Text>
                      <Text style={styles.transactionDate}>
                        {formatDate(transaction.createdAt)}
                      </Text>
                    </View>
                  </View>
                  <Text
                    style={[
                      styles.transactionAmount,
                      { color: transaction.type === 'credit' ? '#22C55E' : '#EF4444' },
                    ]}
                  >
                    {transaction.type === 'credit' ? '+' : '-'}
                    {formatCurrency(transaction.amount)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={showFundModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowFundModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#fff' },
            ]}
          >
            <Text style={[styles.modalTitle, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>
              Fund Wallet
            </Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Amount (NGN)</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colorScheme === 'dark' ? '#333' : '#f5f5f5',
                    color: colorScheme === 'dark' ? '#fff' : '#000',
                  },
                ]}
                placeholder="Enter amount"
                placeholderTextColor="#666"
                keyboardType="decimal-pad"
                value={fundAmount}
                onChangeText={setFundAmount}
                accessibilityLabel="Enter amount to fund"
              />
            </View>

            <View style={styles.quickAmounts}>
              {[1000, 2000, 5000, 10000].map((amount) => (
                <TouchableOpacity
                  key={amount}
                  style={styles.quickAmountButton}
                  onPress={() => setFundAmount(amount.toString())}
                  accessibilityLabel={`Fund ₦${amount.toLocaleString()}`}
                >
                  <Text style={styles.quickAmountText}>₦{amount.toLocaleString()}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[
                  styles.cancelButton,
                  { borderColor: colorScheme === 'dark' ? '#333' : '#eee' },
                ]}
                onPress={() => setShowFundModal(false)}
                disabled={fundMutation.isPending}
                accessibilityLabel="Cancel fund wallet"
              >
                <Text
                  style={[
                    styles.cancelButtonText,
                    { color: colorScheme === 'dark' ? '#fff' : '#000' },
                  ]}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleFundWallet}
                disabled={fundMutation.isPending}
                accessibilityLabel="Continue to fund wallet"
              >
                {fundMutation.isPending ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.confirmButtonText}>Continue</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showWithdrawModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowWithdrawModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#fff' },
            ]}
          >
            <Text style={[styles.modalTitle, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>
              Withdraw Funds
            </Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Amount (NGN)</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colorScheme === 'dark' ? '#333' : '#f5f5f5',
                    color: colorScheme === 'dark' ? '#fff' : '#000',
                  },
                ]}
                placeholder="Enter amount"
                placeholderTextColor="#666"
                keyboardType="decimal-pad"
                value={withdrawAmount}
                onChangeText={setWithdrawAmount}
                accessibilityLabel="Enter amount to withdraw"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Bank Code</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colorScheme === 'dark' ? '#333' : '#f5f5f5',
                    color: colorScheme === 'dark' ? '#fff' : '#000',
                  },
                ]}
                placeholder="e.g., 044"
                placeholderTextColor="#666"
                value={bankCode}
                onChangeText={setBankCode}
                accessibilityLabel="Enter bank code"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Account Number</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colorScheme === 'dark' ? '#333' : '#f5f5f5',
                    color: colorScheme === 'dark' ? '#fff' : '#000',
                  },
                ]}
                placeholder="Enter account number"
                placeholderTextColor="#666"
                keyboardType="number-pad"
                value={accountNumber}
                onChangeText={setAccountNumber}
                accessibilityLabel="Enter account number"
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[
                  styles.cancelButton,
                  { borderColor: colorScheme === 'dark' ? '#333' : '#eee' },
                ]}
                onPress={() => setShowWithdrawModal(false)}
                disabled={withdrawMutation.isPending}
                accessibilityLabel="Cancel withdrawal"
              >
                <Text
                  style={[
                    styles.cancelButtonText,
                    { color: colorScheme === 'dark' ? '#fff' : '#000' },
                  ]}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleWithdraw}
                disabled={withdrawMutation.isPending}
                accessibilityLabel="Confirm withdrawal"
              >
                {withdrawMutation.isPending ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.confirmButtonText}>Withdraw</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  lockIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  lockText: {
    fontSize: 16,
  },
  header: {
    padding: 20,
  },
  greeting: {
    fontSize: 14,
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    margin: 20,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    textAlign: 'center',
  },
  retryText: {
    color: '#E8420A',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '600',
  },
  balanceCard: {
    margin: 20,
    marginTop: 0,
    padding: 24,
    borderRadius: 16,
  },
  balanceLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginBottom: 8,
  },
  balanceAmount: {
    color: '#fff',
    fontSize: 36,
    fontWeight: '700',
  },
  pendingBalance: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginTop: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  transactionsSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  loader: {
    marginTop: 40,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 4,
  },
  transactionsList: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    overflow: 'hidden',
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  transactionIcon: {
    fontSize: 24,
  },
  transactionInfo: {
    gap: 4,
  },
  transactionTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  transactionDate: {
    fontSize: 12,
    color: '#666',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    minHeight: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: '#666',
  },
  input: {
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
  },
  quickAmounts: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  quickAmountButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  quickAmountText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E8420A',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 'auto',
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#E8420A',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
