import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  Linking,
  AppState,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AmountInput } from '../../../src/components/AmountInput';
import { walletApi, paymentApi, useWallet } from '@azeebo/react-data';
import { analytics } from '../../../src/utils/analytics';
import { useAppleGooglePay } from '../../../src/hooks/useAppleGooglePay';
import { LoadingState, ErrorState } from '../../../src/components/StateContainers';
import { useAuth } from '@azeebo/react-data/contexts/AuthContext';
import { addFundsPresetAmounts, walletLimits } from '../../../src/config/prices';
import { colors } from '../../../src/theme';
import { brand } from '@azeebo/design-tokens';

const PRESET_AMOUNTS = addFundsPresetAmounts;

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
  const { getWallet } = useWallet();
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
        if (res.data.length === 0) {
          // success-with-empty-list is a server-side outage fallback, not a
          // healthy catalog. Fail honestly instead of offering methods the
          // backend cannot honor (parity with the TV fund screen).
          setProvidersError(
            'No payment providers are available right now. Please try again later.'
          );
        } else {
          setProviders(res.data);
        }
      } else {
        setProvidersError('Failed to load payment methods');
      }
    } catch (err: unknown) {
      setProvidersError(
        (err instanceof Error ? err.message : null) || 'Failed to load payment methods'
      );
    } finally {
      setIsLoadingProviders(false);
    }
  };

  useEffect(() => {
    void fetchProviders();
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
    } else if (numAmount < walletLimits.minimumDeposit) {
      newErrors.amount = `Minimum amount is ₦${walletLimits.minimumDeposit.toLocaleString()}`;
    } else if (numAmount > walletLimits.maximumDeposit) {
      newErrors.amount = `Maximum amount is ₦${walletLimits.maximumDeposit.toLocaleString()}`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ── Post-checkout verification ─────────────────────────────────────────
  // Mirrors the TV fund screen: verify AFTER the user returns from the
  // provider checkout (AppState → active), then poll every 3s (up to 5 min)
  // until the payment settles. The previous flow verified while the user was
  // still inside the provider webview, always reported "Payment Pending",
  // and popped the screen out from under them.
  const VERIFY_INTERVAL_MS = 3000;
  const VERIFY_SESSION_MS = 5 * 60 * 1000;
  const verifyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionDeadlineRef = useRef(0);
  const appStateSubRef = useRef<{ remove: () => void } | null>(null);

  const stopVerification = useCallback(() => {
    if (verifyTimerRef.current) {
      clearTimeout(verifyTimerRef.current);
      verifyTimerRef.current = null;
    }
    appStateSubRef.current?.remove();
    appStateSubRef.current = null;
  }, []);

  useEffect(() => stopVerification, [stopVerification]);

  const finishVerification = useCallback(
    (outcome: 'success' | 'failed' | 'pending') => {
      stopVerification();
      if (outcome === 'success') {
        void getWallet(); // refresh the header badge + wallet context (H5)
        Alert.alert('Success', 'Wallet funded successfully!', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else if (outcome === 'failed') {
        Alert.alert(
          'Payment Failed',
          'Your payment was not completed. No money was taken. You can safely try again.'
        );
      } else {
        Alert.alert(
          'Payment Pending',
          'Your payment is still processing. If you completed it, check Transactions in a moment — the balance updates automatically once the provider confirms.'
        );
      }
    },
    [getWallet, router, stopVerification]
  );

  // Analytics wrapper: one event with the settled outcome per funding attempt.
  // Declared before verifyOnce, which calls it.
  const finishVerificationTracked = useCallback(
    (outcome: 'success' | 'failed' | 'pending') => {
      if (outcome === 'success') {
        analytics.walletFunded(parseFloat(amount || '0'), selectedMethod);
      } else if (outcome === 'failed') {
        analytics.paymentFailed(
          parseFloat(amount || '0'),
          selectedMethod,
          'provider_reported_failed'
        );
      }
      finishVerification(outcome);
    },
    [amount, selectedMethod, finishVerification]
  );

  const verifyOnce = useCallback(
    (reference: string) => {
      void (async () => {
        try {
          const res = await paymentApi.verify(reference);
          if (res.success && res.data) {
            if (res.data.status === 'success') {
              finishVerificationTracked('success');
              return;
            }
            if (res.data.status === 'failed') {
              finishVerificationTracked('failed');
              return;
            }
          }
        } catch {
          // Network blip — verify is idempotent; keep polling.
        }
        if (Date.now() >= sessionDeadlineRef.current) {
          finishVerificationTracked('pending');
          return;
        }
        verifyTimerRef.current = setTimeout(() => verifyOnce(reference), VERIFY_INTERVAL_MS);
      })();
    },
    [finishVerificationTracked]
  );

  const startVerification = useCallback(
    (reference: string) => {
      sessionDeadlineRef.current = Date.now() + VERIFY_SESSION_MS;
      // Kick off immediately (covers instant-settle flows), then re-check
      // every time the app returns to the foreground (user came back from
      // the provider webview/browser) and on the interval timer.
      verifyOnce(reference);
      appStateSubRef.current = AppState.addEventListener('change', (state) => {
        if (state === 'active') verifyOnce(reference);
      });
    },
    [verifyOnce]
  );

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
        const { authorizationUrl, reference } = response.data;

        if (authorizationUrl) {
          const supported = await Linking.canOpenURL(authorizationUrl);
          if (!supported) {
            Alert.alert('Error', 'Could not open payment URL');
            return;
          }
          await Linking.openURL(authorizationUrl);
          analytics.paymentInitialized(parseFloat(amount), selectedMethod, 'wallet_funding');
          if (reference) {
            // Verify when the user returns + poll until settle. The screen
            // stays put (no router.back) so the outcome alerts land here.
            startVerification(reference);
          } else {
            finishVerificationTracked('pending');
          }
        } else {
          finishVerificationTracked('success');
        }
      } else {
        Alert.alert('Error', response.message || 'Failed to add funds. Please try again.');
      }
    } catch (error: unknown) {
      Alert.alert(
        'Error',
        (error instanceof Error ? error.message : null) || 'Failed to add funds. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppleGooglePay = async () => {
    const numAmount = parseFloat(amount);

    const result = await processPayment(numAmount, 'NGN', 'Wallet funding');

    if (result.success) {
      void getWallet(); // refresh header badge + wallet context
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
              minimumAmount={walletLimits.minimumDeposit}
              maximumAmount={walletLimits.maximumDeposit}
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
              • Minimum deposit: ₦{walletLimits.minimumDeposit.toLocaleString()}
              {'\n'}• Maximum deposit: ₦{walletLimits.maximumDeposit.toLocaleString()}
              {'\n'}• Funds are added instantly{'\n'}• Transaction fees may apply
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
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.neutral[700],
  },
  methodCardSelected: {
    borderColor: brand.flame,
    backgroundColor: colors.bg.deep,
  },
  methodIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.bg.tertiary,
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
    color: colors.light[100],
    marginBottom: 2,
  },
  methodDescription: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
  methodRadio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.neutral[700],
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodRadioSelected: {
    borderColor: brand.flame,
  },
  methodRadioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: brand.flame,
  },
  addButton: {
    backgroundColor: brand.flame,
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
