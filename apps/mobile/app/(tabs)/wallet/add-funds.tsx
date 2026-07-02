import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AmountInput } from '../../../src/components/AmountInput';
import { walletApi, paymentApi } from '../../../src/api';
import { useAppleGooglePay } from '../../../src/hooks/useAppleGooglePay';
import { LoadingState, ErrorState } from '../../../src/components/StateContainers';
import { useAuth } from '../../../src/contexts/AuthContext';

const PRESET_AMOUNTS = [500, 1000, 2000, 5000, 10000, 20000];

const PAYMENT_METHOD_META: Record<string, { name: string; icon: string; description: string }> = {
  paystack: { name: 'Debit Card', icon: '💳', description: 'Visa, Mastercard' },
  flutterwave: { name: 'Flutterwave', icon: '🌊', description: 'Secure card payments' },
  bank: { name: 'Bank Transfer', icon: '🏦', description: 'Direct bank transfer' },
  ussd: { name: 'USSD', icon: '📱', description: 'Dial code to pay' },
  mobile: { name: 'Mobile Money', icon: '💰', description: 'MTN, Airtel, etc.' },
};

export default function AddFundsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    isAvailable: isAppleGooglePayAvailable,
    paymentMethodLabel,
    processPayment,
    isLoading: _isAppleGooglePayLoading,
  } = useAppleGooglePay();

  const [amount, setAmount] = useState<string>('');
  const [selectedMethod, setSelectedMethod] = useState<string>('paystack');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ amount?: string }>({});
  const [providers, setProviders] = useState<{ provider: string; name: string }[]>([]);
  const [isLoadingProviders, setIsLoadingProviders] = useState(true);
  const [providersError, setProvidersError] = useState<string | null>(null);

  const fetchProviders = async () => {
    setIsLoadingProviders(true);
    setProvidersError(null);
    try {
      const res = await paymentApi.getProviders();
      if (res.success && res.data) {
        setProviders(res.data);
      }
    } catch (err: any) {
      setProvidersError(err.message || 'Failed to load payment methods');
    } finally {
      setIsLoadingProviders(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  const paymentMethods =
    providers.length > 0
      ? providers.map((p) => ({
          id: p.provider,
          name: PAYMENT_METHOD_META[p.provider]?.name || p.name,
          icon: PAYMENT_METHOD_META[p.provider]?.icon || '💳',
          description: PAYMENT_METHOD_META[p.provider]?.description || '',
        }))
      : Object.entries(PAYMENT_METHOD_META).map(([id, meta]) => ({ id, ...meta }));

  const allPaymentMethods = isAppleGooglePayAvailable
    ? [
        ...paymentMethods,
        {
          id: 'apple_google_pay',
          name: paymentMethodLabel,
          icon: Platform.OS === 'ios' ? '🍎' : '🤖',
          description: `Pay with ${paymentMethodLabel}`,
        },
      ]
    : paymentMethods;

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};
    const numAmount = parseFloat(amount);

    if (!amount || isNaN(numAmount)) {
      newErrors.amount = 'Please enter a valid amount';
    } else if (numAmount < 100) {
      newErrors.amount = 'Minimum amount is ₦100';
    } else if (numAmount > 1000000) {
      newErrors.amount = 'Maximum amount is ₦1,000,000';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddFunds = async () => {
    if (!validateForm()) {
      return;
    }

    if (selectedMethod === 'apple_google_pay') {
      await handleAppleGooglePay();
      return;
    }

    setIsLoading(true);
    try {
      const response = await walletApi.fundWallet({
        amount: parseFloat(amount),
        provider: selectedMethod as 'paystack' | 'flutterwave',
        email: user?.email || '',
      });

      if (response.success && response.data) {
        const { authorizationUrl } = response.data;

        if (authorizationUrl) {
          Alert.alert('Payment Initiated', 'You will be redirected to complete your payment.', [
            {
              text: 'Continue',
              onPress: () => {},
            },
          ]);
        } else {
          Alert.alert('Success', 'Wallet funded successfully!', [
            { text: 'OK', onPress: () => router.back() },
          ]);
        }
      }
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to add funds. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppleGooglePay = async () => {
    const numAmount = parseFloat(amount);

    const result = await processPayment(numAmount, 'NGN', 'Wallet funding');

    if (result.success) {
      Alert.alert('Success', 'Wallet funded successfully!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } else {
      Alert.alert('Payment Failed', result.error || 'Failed to process payment. Please try again.');
    }
  };

  const handlePresetAmount = (preset: number) => {
    setAmount(preset.toString());
    if (errors.amount) {
      setErrors({});
    }
  };

  if (isLoadingProviders) {
    return <LoadingState text="Loading payment methods..." />;
  }

  if (providersError) {
    return (
      <ErrorState
        title="Failed to load payment methods"
        description={providersError}
        onRetry={fetchProviders}
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
          <Text style={styles.title}>Add Funds</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Amount (NGN)</Text>
            <AmountInput
              value={amount}
              onChangeText={(text) => {
                setAmount(text);
                if (errors.amount) {
                  setErrors({});
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
            <Text style={styles.label}>Payment Method</Text>
            {allPaymentMethods.map((method) => (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.methodCard,
                  selectedMethod === method.id && styles.methodCardSelected,
                ]}
                onPress={() => setSelectedMethod(method.id)}
              >
                <View style={styles.methodIcon}>
                  <Text style={styles.methodIconText}>{method.icon}</Text>
                </View>
                <View style={styles.methodContent}>
                  <Text style={styles.methodName}>{method.name}</Text>
                  <Text style={styles.methodDescription}>{method.description}</Text>
                </View>
                <View
                  style={[
                    styles.methodRadio,
                    selectedMethod === method.id && styles.methodRadioSelected,
                  ]}
                >
                  {selectedMethod === method.id && <View style={styles.methodRadioInner} />}
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.addButton, isLoading && styles.addButtonDisabled]}
            onPress={handleAddFunds}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.addButtonText}>
                Add ₦{parseFloat(amount || '0').toLocaleString()}
              </Text>
            )}
          </TouchableOpacity>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>ℹ️ Information</Text>
            <Text style={styles.infoText}>
              • Minimum deposit: ₦100{'\n'}• Maximum deposit: ₦1,000,000{'\n'}• Funds are added
              instantly{'\n'}• Transaction fees may apply
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
    color: '#F3F4F6',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#F3F4F6',
  },
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    color: '#F3F4F6',
    marginBottom: 8,
    fontWeight: '500',
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
    borderColor: '#333',
  },
  presetButtonSelected: {
    backgroundColor: '#E8420A',
    borderColor: '#E8420A',
  },
  presetText: {
    color: '#F3F4F6',
    fontSize: 14,
    fontWeight: '500',
  },
  presetTextSelected: {
    color: '#fff',
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  methodCardSelected: {
    borderColor: '#E8420A',
    backgroundColor: '#1f1f2e',
  },
  methodIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  methodIconText: {
    fontSize: 20,
  },
  methodContent: {
    flex: 1,
  },
  methodName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#F3F4F6',
    marginBottom: 2,
  },
  methodDescription: {
    fontSize: 12,
    color: '#666',
  },
  methodRadio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodRadioSelected: {
    borderColor: '#E8420A',
  },
  methodRadioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E8420A',
  },
  addButton: {
    backgroundColor: '#E8420A',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  addButtonDisabled: {
    opacity: 0.7,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
  },
  infoTitle: {
    fontSize: 14,
    color: '#F3F4F6',
    fontWeight: '500',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#9CA3AF',
    lineHeight: 20,
  },
});
