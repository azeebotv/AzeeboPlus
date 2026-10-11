import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AmountInput } from '../../../src/components/AmountInput';
import { walletApi } from '@azeebo/react-data';
import { LoadingState, ErrorState } from '../../../src/components/StateContainers';
import { walletPresetAmounts, walletLimits } from '../../../src/config/prices';
import { colors } from '../../../src/theme';
import { brand } from '@azeebo/design-tokens';

const PRESET_AMOUNTS = walletPresetAmounts;

export default function WithdrawFundsScreen() {
  const router = useRouter();

  const [amount, setAmount] = useState<string>('');
  const [bankName, setBankName] = useState<string>('');
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [accountName, setAccountName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [balance, setBalance] = useState<number>(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);
  const [balanceError, setBalanceError] = useState<string | null>(null);

  const fetchBalance = async () => {
    setIsLoadingBalance(true);
    setBalanceError(null);
    try {
      const res = await walletApi.getBalance();
      if (res.success && res.data) {
        setBalance(res.data.balance);
      }
    } catch (err: unknown) {
      setBalanceError((err instanceof Error ? err.message : null) || 'Failed to load balance');
    } finally {
      setIsLoadingBalance(false);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, []);
  const [errors, setErrors] = useState<{
    amount?: string;
    bankName?: string;
    accountNumber?: string;
    accountName?: string;
  }>({});

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};
    const numAmount = parseFloat(amount);

    if (!amount || isNaN(numAmount)) {
      newErrors.amount = 'Please enter a valid amount';
    } else if (numAmount < walletLimits.minimumWithdrawal) {
      newErrors.amount = `Minimum withdrawal is ₦${walletLimits.minimumWithdrawal.toLocaleString()}`;
    }

    if (!bankName.trim()) {
      newErrors.bankName = 'Bank name is required';
    }

    if (!accountNumber.trim()) {
      newErrors.accountNumber = 'Account number is required';
    } else if (accountNumber.length !== 10) {
      newErrors.accountNumber = 'Account number must be 10 digits';
    }

    if (!accountName.trim()) {
      newErrors.accountName = 'Account name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleVerifyAccount = async () => {
    if (accountNumber.length !== 10) {
      setErrors((prev) => ({ ...prev, accountNumber: 'Account number must be 10 digits' }));
      return;
    }

    setIsVerifying(true);
    try {
      const result = await walletApi.verifyBankAccount({
        bankCode: bankName,
        accountNumber,
      });
      if (result.success && result.data) {
        setAccountName(result.data.accountName);
        setErrors((prev) => ({ ...prev, accountName: undefined }));
      } else {
        setAccountName('');
        setErrors((prev) => ({
          ...prev,
          accountName: (result.error as unknown as string) || 'Could not verify account',
        }));
      }
    } catch {
      Alert.alert('Error', 'Failed to verify account');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleWithdraw = async () => {
    if (!validateForm()) {
      return;
    }

    Alert.alert(
      'Confirm Withdrawal',
      `Withdraw ₦${parseFloat(amount).toLocaleString()} to ${accountName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setIsLoading(true);
            try {
              await walletApi.withdraw({
                amount: parseFloat(amount),
                bankCode: bankName,
                accountNumber,
              });

              Alert.alert('Success', 'Withdrawal request submitted!', [
                { text: 'OK', onPress: () => router.back() },
              ]);
            } catch (error: unknown) {
              Alert.alert(
                'Error',
                (error instanceof Error ? error.message : null) ||
                  'Failed to withdraw funds. Please try again.'
              );
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const handlePresetAmount = (preset: number) => {
    setAmount(preset.toString());
    if (errors.amount) {
      setErrors((prev) => ({ ...prev, amount: undefined }));
    }
  };

  if (isLoadingBalance) {
    return <LoadingState text="Loading balance..." />;
  }

  if (balanceError) {
    return (
      <ErrorState
        title="Failed to load balance"
        description={balanceError}
        onRetry={fetchBalance}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Withdraw Funds</Text>
        </View>

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceValue}>₦{balance.toLocaleString()}</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Amount (NGN)</Text>
            <AmountInput
              value={amount}
              onChangeText={(text) => {
                setAmount(text);
                if (errors.amount) {
                  setErrors((prev) => ({ ...prev, amount: undefined }));
                }
              }}
              error={errors.amount}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Quick Select</Text>
            <View style={styles.presetGrid}>
              {PRESET_AMOUNTS.map((preset) => (
                <TouchableOpacity
                  key={preset}
                  style={[
                    styles.presetButton,
                    amount === preset.toString() && styles.presetButtonSelected,
                  ]}
                  onPress={() => handlePresetAmount(preset)}
                >
                  <Text
                    style={[
                      styles.presetText,
                      amount === preset.toString() && styles.presetTextSelected,
                    ]}
                  >
                    ₦{preset.toLocaleString()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Bank Name</Text>
            <TextInput
              style={[styles.input, errors.bankName && styles.inputError]}
              placeholder="Select your bank"
              placeholderTextColor="#666"
              value={bankName}
              onChangeText={(text) => {
                setBankName(text);
                if (errors.bankName) {
                  setErrors((prev) => ({ ...prev, bankName: undefined }));
                }
              }}
            />
            {errors.bankName && <Text style={styles.errorText}>{errors.bankName}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Account Number</Text>
            <View style={styles.accountNumberRow}>
              <TextInput
                style={[
                  styles.input,
                  styles.accountNumberInput,
                  errors.accountNumber && styles.inputError,
                ]}
                placeholder="0123456789"
                placeholderTextColor="#666"
                value={accountNumber}
                onChangeText={(text) => {
                  const cleaned = text.replace(/\D/g, '').slice(0, 10);
                  setAccountNumber(cleaned);
                  if (errors.accountNumber) {
                    setErrors((prev) => ({ ...prev, accountNumber: undefined }));
                  }
                }}
                keyboardType="numeric"
                maxLength={10}
              />
              <TouchableOpacity
                style={[
                  styles.verifyButton,
                  accountNumber.length !== 10 && styles.verifyButtonDisabled,
                ]}
                onPress={handleVerifyAccount}
                disabled={accountNumber.length !== 10}
              >
                {isVerifying ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.verifyButtonText}>Verify</Text>
                )}
              </TouchableOpacity>
            </View>
            {errors.accountNumber && <Text style={styles.errorText}>{errors.accountNumber}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Account Name</Text>
            <TextInput
              style={[styles.input, styles.readOnlyInput, errors.accountName && styles.inputError]}
              placeholder="Account name will appear here"
              placeholderTextColor="#666"
              value={accountName}
              onChangeText={setAccountName}
              editable={false}
            />
            {errors.accountName && <Text style={styles.errorText}>{errors.accountName}</Text>}
          </View>

          <TouchableOpacity
            style={[styles.withdrawButton, isLoading && styles.withdrawButtonDisabled]}
            onPress={handleWithdraw}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.withdrawButtonText}>
                Withdraw ₦{parseFloat(amount || '0').toLocaleString()}
              </Text>
            )}
          </TouchableOpacity>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>ℹ️ Information</Text>
            <Text style={styles.infoText}>
              • Minimum withdrawal: ₦{walletLimits.minimumWithdrawal.toLocaleString()}
              {'\n'}• Processing time: 1-3 business days{'\n'}• Withdrawal fees may apply{'\n'}•
              Ensure account details are correct
            </Text>
          </View>
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
  scrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  backButton: {
    marginRight: 16,
  },
  backButtonText: {
    fontSize: 24,
    color: colors.light[100],
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.light[100],
  },
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    color: colors.light[100],
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.neutral[700],
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#fff',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  readOnlyInput: {
    backgroundColor: colors.neutral[950],
    color: colors.light[400],
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetButton: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.neutral[700],
  },
  presetButtonSelected: {
    backgroundColor: brand.flame,
    borderColor: brand.flame,
  },
  presetText: {
    color: colors.light[100],
    fontSize: 14,
    fontWeight: '500',
  },
  presetTextSelected: {
    color: '#fff',
  },
  accountNumberRow: {
    flexDirection: 'row',
    gap: 8,
  },
  accountNumberInput: {
    flex: 1,
  },
  verifyButton: {
    backgroundColor: brand.flame,
    borderRadius: 12,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  verifyButtonDisabled: {
    opacity: 0.5,
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  withdrawButton: {
    backgroundColor: brand.flame,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  withdrawButtonDisabled: {
    opacity: 0.7,
  },
  withdrawButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  balanceCard: {
    backgroundColor: brand.flame,
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    alignItems: 'center',
  },
  balanceLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginBottom: 4,
  },
  balanceValue: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '700',
  },
  infoCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
  },
  infoTitle: {
    fontSize: 14,
    color: colors.light[100],
    fontWeight: '500',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: colors.light[400],
    lineHeight: 20,
  },
});
