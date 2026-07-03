import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  useColorScheme,
  ActivityIndicator,
  Alert,
  TextInput,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { paymentApi } from '../../src/api/payment';
import { useAuth } from '../../src/contexts/AuthContext';
import { LoadingState, ErrorState } from '../../src/components/StateContainers';

const PAYMENT_AMOUNTS = [
  { value: 500, label: '₦500' },
  { value: 1000, label: '₦1,000' },
  { value: 2500, label: '₦2,500' },
  { value: 5000, label: '₦5,000' },
  { value: 10000, label: '₦10,000' },
];

const PROVIDER_META: Record<string, { description: string }> = {
  paystack: { description: 'Secure card payments' },
  flutterwave: { description: 'Multiple payment options' },
};

export default function PaymentScreen() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const colorScheme = useColorScheme();

  const [selectedAmount, setSelectedAmount] = useState<number>(10);
  const [customAmount, setCustomAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCustomAmount, setShowCustomAmount] = useState(false);
  const [providers, setProviders] = useState<{ provider: string; name: string }[]>([]);
  const [selectedProvider, setSelectedProvider] = useState('paystack');
  const [isLoadingProviders, setIsLoadingProviders] = useState(true);
  const [providersError, setProvidersError] = useState<string | null>(null);

  const fetchProviders = async () => {
    setIsLoadingProviders(true);
    setProvidersError(null);
    try {
      const res = await paymentApi.getProviders();
      if (res.success && res.data) {
        setProviders(res.data);
        if (res.data.length > 0) {
          setSelectedProvider(res.data[0].provider);
        }
      }
    } catch (err: any) {
      setProvidersError(err.message || 'Failed to load payment providers');
    } finally {
      setIsLoadingProviders(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setShowCustomAmount(false);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (text: string) => {
    const numericValue = text.replace(/[^0-9]/g, '');
    setCustomAmount(numericValue);
    if (numericValue) {
      setSelectedAmount(parseInt(numericValue, 10));
    }
    setShowCustomAmount(true);
  };

  const handlePayment = async () => {
    if (!isAuthenticated || !user?.email) {
      Alert.alert('Error', 'Please log in to make a payment');
      return;
    }

    const amount = showCustomAmount && customAmount ? parseInt(customAmount, 10) : selectedAmount;
    if (!amount || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setIsLoading(true);
    try {
      const response = await paymentApi.initialize({
        amount,
        currency: 'USD',
        email: user.email,
        metadata: {
          userId: user.id,
          type: 'wallet_funding',
        },
      });

      if (response.success && response.data) {
        if (response.data.authorizationUrl) {
          Alert.alert(
            'Redirect to Payment',
            `You will be redirected to Paystack to complete your payment of ₦${amount.toLocaleString()}.`,
            [
              {
                text: 'Cancel',
                style: 'cancel',
              },
              {
                text: 'Continue',
                onPress: async () => {
                  const supported = await Linking.canOpenURL(response.data!.authorizationUrl);
                  if (supported) {
                    await Linking.openURL(response.data!.authorizationUrl);
                  } else {
                    Alert.alert('Error', 'Could not open payment URL');
                  }
                },
              },
            ]
          );
        } else {
          Alert.alert('Success', `Payment of ₦${amount.toLocaleString()} processed successfully`);
        }
      } else {
        Alert.alert('Error', response.message || 'Failed to initialize payment');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to initialize payment');
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#000' : '#fff' }]}
        edges={['top']}
      >
        <View style={styles.unauthenticatedContainer}>
          <ActivityIndicator size="large" color="#E8420A" />
        </View>
      </SafeAreaView>
    );
  }

  if (!isAuthenticated) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#000' : '#fff' }]}
        edges={['top']}
      >
        <View style={styles.unauthenticatedContainer}>
          <Text style={styles.lockIcon}>💳</Text>
          <Text style={[styles.lockText, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>
            Please log in to make payments
          </Text>
          <TouchableOpacity style={styles.loginButton} onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.loginButtonText}>Log In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (isLoadingProviders) {
    return <LoadingState text="Loading payment providers..." />;
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

  const displayAmount = showCustomAmount && customAmount ? customAmount : selectedAmount.toString();

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#000' : '#fff' }]}
      edges={['top']}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>
            Add Funds
          </Text>
          <Text style={[styles.subtitle, { color: colorScheme === 'dark' ? '#888' : '#666' }]}>
            Select an amount to add to your wallet
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colorScheme === 'dark' ? '#888' : '#666' }]}>
            Select Amount
          </Text>
          <View style={styles.amountGrid}>
            {PAYMENT_AMOUNTS.map((item) => (
              <TouchableOpacity
                key={item.value}
                style={[
                  styles.amountButton,
                  {
                    backgroundColor:
                      !showCustomAmount && selectedAmount === item.value
                        ? '#E8420A'
                        : colorScheme === 'dark'
                          ? '#1a1a1a'
                          : '#f5f5f5',
                  },
                ]}
                onPress={() => handleAmountSelect(item.value)}
              >
                <Text
                  style={[
                    styles.amountText,
                    {
                      color:
                        !showCustomAmount && selectedAmount === item.value
                          ? '#fff'
                          : colorScheme === 'dark'
                            ? '#fff'
                            : '#000',
                    },
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.customAmountSection}>
            <Text style={[styles.customLabel, { color: colorScheme === 'dark' ? '#888' : '#666' }]}>
              Or enter custom amount
            </Text>
            <View
              style={[
                styles.customInputContainer,
                { backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#f5f5f5' },
              ]}
            >
              <Text
                style={[styles.currencySymbol, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}
              >
                ₦
              </Text>
              <TextInput
                style={[styles.customInput, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}
                placeholder="Enter amount"
                placeholderTextColor="#666"
                keyboardType="numeric"
                value={customAmount}
                onChangeText={handleCustomAmountChange}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colorScheme === 'dark' ? '#888' : '#666' }]}>
            Payment Method
          </Text>

          {providers.map((provider) => {
            const isSelected = selectedProvider === provider.provider;
            const meta = PROVIDER_META[provider.provider] || {};
            return (
              <TouchableOpacity
                key={provider.provider}
                onPress={() => setSelectedProvider(provider.provider)}
                style={[
                  styles.providerOption,
                  {
                    backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#f5f5f5',
                    borderColor: isSelected ? '#E8420A' : 'transparent',
                  },
                ]}
              >
                <View style={styles.providerInfo}>
                  <Text
                    style={[
                      styles.providerName,
                      { color: colorScheme === 'dark' ? '#fff' : '#000' },
                    ]}
                  >
                    {provider.name}
                  </Text>
                  <Text style={styles.providerDescription}>{meta.description || ''}</Text>
                </View>
                <View style={[styles.radioOuter, { borderColor: isSelected ? '#E8420A' : '#666' }]}>
                  {isSelected && <View style={styles.radioInner} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.summarySection}>
          <Text style={[styles.sectionTitle, { color: colorScheme === 'dark' ? '#888' : '#666' }]}>
            Summary
          </Text>
          <View
            style={[
              styles.summaryCard,
              { backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#f5f5f5' },
            ]}
          >
            <View style={styles.summaryRow}>
              <Text
                style={[styles.summaryLabel, { color: colorScheme === 'dark' ? '#888' : '#666' }]}
              >
                Amount
              </Text>
              <Text
                style={[styles.summaryValue, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}
              >
                ₦{displayAmount}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text
                style={[styles.summaryLabel, { color: colorScheme === 'dark' ? '#888' : '#666' }]}
              >
                Provider
              </Text>
              <Text
                style={[styles.summaryValue, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}
              >
                Paystack
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text
                style={[
                  styles.summaryLabel,
                  { color: colorScheme === 'dark' ? '#fff' : '#000', fontWeight: '600' },
                ]}
              >
                Total
              </Text>
              <Text
                style={[styles.summaryValue, { color: '#E8420A', fontWeight: '700', fontSize: 18 }]}
              >
                ₦{displayAmount}
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.payButton, isLoading && styles.payButtonDisabled]}
          onPress={handlePayment}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.payButtonText}>Pay ₦{displayAmount}</Text>
          )}
        </TouchableOpacity>

        <View style={styles.secureNote}>
          <Text style={styles.secureIcon}>🔒</Text>
          <Text style={styles.secureText}>Your payment is secured by Paystack</Text>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  unauthenticatedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  lockIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  lockText: {
    fontSize: 16,
    marginBottom: 24,
  },
  loginButton: {
    backgroundColor: '#E8420A',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  amountGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  amountButton: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  amountText: {
    fontSize: 18,
    fontWeight: '600',
  },
  customAmountSection: {
    marginTop: 16,
  },
  customLabel: {
    fontSize: 12,
    marginBottom: 8,
  },
  customInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '600',
    marginRight: 8,
  },
  customInput: {
    flex: 1,
    padding: 16,
    fontSize: 18,
  },
  providerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 2,
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  providerDescription: {
    fontSize: 12,
    color: '#666',
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E8420A',
  },
  summarySection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  summaryCard: {
    padding: 16,
    borderRadius: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 14,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#333',
    marginVertical: 8,
  },
  payButton: {
    backgroundColor: '#E8420A',
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  payButtonDisabled: {
    opacity: 0.7,
  },
  payButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  secureNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  secureIcon: {
    fontSize: 16,
  },
  secureText: {
    fontSize: 12,
    color: '#666',
  },
  bottomPadding: {
    height: 24,
  },
});
