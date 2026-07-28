'use client';
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { apiClient } from '../../src/api/client';

interface WalletBalance {
  balance: number;
  currency: string;
}

export default function AddFundsScreen() {
  const router = useRouter();
  const [amount, setAmount] = useState(500);
  const [isLoading, setIsLoading] = useState(false);
  const [balance, setBalance] = useState<WalletBalance | null>(null);

  const quickAmounts = [100, 300, 500, 1000, 2000, 5000];

  const loadBalance = async () => {
    try {
      const res = await apiClient.get<WalletBalance>('/api/v1/wallet/balance');
      setBalance(res);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to load balance:', error);
    }
  };

  useEffect(() => {
    loadBalance();
  }, []);

  const handleAddFunds = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.post<{ success: boolean }>('/api/v1/wallet/add', {
        amount,
        method: 'card',
      });
      if (res.success) {
        Alert.alert('Success', 'Funds added to your wallet!');
        loadBalance();
        router.back();
      } else {
        throw new Error('Failed to add funds');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to add funds. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Add Funds</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ padding: 16 }}>
        <View style={styles.balanceSection}>
          <Text style={styles.balanceLabel}>Current Balance</Text>
          <Text style={styles.balanceAmount}>
            {balance ? `₦${balance.balance.toLocaleString()}` : 'Loading...'}
          </Text>
        </View>

        <View style={styles.amountSection}>
          <Text style={styles.amountLabel}>Amount to Add</Text>
          <View style={styles.amountInputContainer}>
            <Text style={styles.currencySymbol}>₦</Text>
            <TextInput
              style={styles.amountInput}
              value={String(amount)}
              onChangeText={(text) => setAmount(Number(text))}
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.quickAmounts}>
          <Text style={styles.quickLabel}>Quick Select</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickButtons}>
            {quickAmounts.map((quickAmount) => (
              <TouchableOpacity
                key={quickAmount}
                style={[styles.quickButton, amount === quickAmount && styles.quickButtonSelected]}
                onPress={() => setAmount(quickAmount)}
              >
                <Text style={styles.quickButtonText}>₦{quickAmount}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <TouchableOpacity
          style={[styles.addButton, isLoading && styles.disabledButton]}
          onPress={handleAddFunds}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.addButtonText}>Add Funds</Text>
          )}
        </TouchableOpacity>
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
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { color: '#fff', fontSize: 20 },
  title: { color: '#fff', fontSize: 18, fontWeight: '600', marginLeft: 'auto' },
  content: { flex: 1 },
  balanceSection: {
    backgroundColor: '#140808',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  balanceLabel: { color: '#9A8A7A', fontSize: 12 },
  balanceAmount: { color: '#fff', fontSize: 24, fontWeight: '700', marginTop: 4 },
  amountSection: { marginBottom: 24 },
  amountLabel: { color: '#fff', fontSize: 14, fontWeight: '600', marginBottom: 8 },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#140808',
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  currencySymbol: { color: '#fff', fontSize: 18, fontWeight: '600', marginRight: 8 },
  amountInput: {
    flex: 1,
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  quickAmounts: { marginBottom: 24 },
  quickLabel: { color: '#fff', fontSize: 14, fontWeight: '600', marginBottom: 12 },
  quickButtons: { flexDirection: 'row', gap: 8 },
  quickButton: {
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  quickButtonSelected: { backgroundColor: '#E8420A' },
  quickButtonText: { color: '#fff', fontSize: 14 },
  addButton: {
    backgroundColor: '#E8420A',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  disabledButton: { opacity: 0.5 },
  addButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
