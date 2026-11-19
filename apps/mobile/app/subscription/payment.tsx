import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@azeebo/react-data/contexts/AuthContext';
import { useWallet } from '@azeebo/react-data/contexts/WalletContext';
import { subscriptionApi } from '@azeebo/react-data/api/subscription';
import { colors, typography, spacing, radius } from '../../src/theme';

type PaymentMethod = 'wallet' | 'external';

export default function PaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    planId: string;
    planName: string;
    price: string;
    currency: string;
  }>();
  const { isAuthenticated } = useAuth();
  const { wallet } = useWallet();

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [autoRenew, setAutoRenew] = useState(true);

  const planPrice = parseFloat(params.price || '0');
  const walletBalance = wallet?.balance || 0;
  const hasEnoughBalance = walletBalance >= planPrice;

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated]);

  const handlePayWithWallet = async () => {
    if (!hasEnoughBalance) {
      Alert.alert(
        'Insufficient Balance',
        "You don't have enough wallet balance. Please fund your wallet or choose another payment method.",
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Fund Wallet', onPress: () => router.push('/(tabs)/wallet') },
        ]
      );
      return;
    }

    setSelectedMethod('wallet');
  };

  const handlePayExternal = () => {
    setSelectedMethod('external');
  };

  const handleConfirmPayment = async () => {
    if (!params.planId) {
      Alert.alert('Error', 'Invalid plan selected');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await subscriptionApi.subscribe({
        planId: params.planId,
        autoRenew,
        paymentMethod: selectedMethod === 'wallet' ? 'wallet' : 'external',
      });

      if (response.success) {
        Alert.alert(
          'Subscription Active!',
          `You are now subscribed to ${params.planName}. Enjoy your premium content!`,
          [
            {
              text: 'View Subscription',
              onPress: () => router.replace('/subscription/current'),
            },
          ]
        );
      } else {
        throw new Error(response.message || 'Payment failed');
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Payment failed. Please try again.';
      Alert.alert('Payment Failed', message);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatPrice = (price: number, currency: string) => {
    return `${currency === 'NGN' ? '₦' : '$'}${price.toLocaleString()}`;
  };

  return (
    <SafeAreaView accessibilityLabel="Payment Screen" style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Back"
            accessibilityHint="Navigates to previous screen"
          >
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Complete Payment</Text>
        </View>

        <View style={styles.planSummary}>
          <Text style={styles.planSummaryLabel}>Subscribing to</Text>
          <Text style={styles.planSummaryName}>{params.planName || 'Selected Plan'}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.planSummaryPrice}>
              {formatPrice(planPrice, params.currency || 'NGN')}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>

          <TouchableOpacity
            style={[
              styles.paymentOption,
              selectedMethod === 'wallet' && styles.paymentOptionSelected,
              !hasEnoughBalance && styles.paymentOptionDisabled,
            ]}
            onPress={handlePayWithWallet}
            disabled={isProcessing}
            accessibilityRole="radio"
            accessibilityLabel={`Pay with Wallet, Balance: ${formatPrice(walletBalance, params.currency || 'NGN')}`}
            accessibilityState={{
              selected: selectedMethod === 'wallet',
              disabled: isProcessing || !hasEnoughBalance,
            }}
          >
            <View style={styles.paymentOptionLeft}>
              <Text style={styles.paymentIcon}>💰</Text>
              <View style={styles.paymentInfo}>
                <Text style={styles.paymentLabel}>Pay with Wallet</Text>
                <Text style={styles.paymentSublabel}>
                  Balance: {formatPrice(walletBalance, params.currency || 'NGN')}
                </Text>
              </View>
            </View>
            <View style={styles.paymentOptionRight}>
              {!hasEnoughBalance && <Text style={styles.insufficientBadge}>Insufficient</Text>}
              <View
                style={[
                  styles.radioOuter,
                  selectedMethod === 'wallet' && styles.radioOuterSelected,
                ]}
              >
                {selectedMethod === 'wallet' && <View style={styles.radioInner} />}
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.paymentOption,
              selectedMethod === 'external' && styles.paymentOptionSelected,
            ]}
            onPress={handlePayExternal}
            disabled={isProcessing}
            accessibilityRole="radio"
            accessibilityLabel="Pay Externally with Card, Bank Transfer, or USSD"
            accessibilityState={{ selected: selectedMethod === 'external', disabled: isProcessing }}
          >
            <View style={styles.paymentOptionLeft}>
              <Text style={styles.paymentIcon}>💳</Text>
              <View style={styles.paymentInfo}>
                <Text style={styles.paymentLabel}>Pay Externally</Text>
                <Text style={styles.paymentSublabel}>Card, Bank Transfer, USSD</Text>
              </View>
            </View>
            <View
              style={[
                styles.radioOuter,
                selectedMethod === 'external' && styles.radioOuterSelected,
              ]}
            >
              {selectedMethod === 'external' && <View style={styles.radioInner} />}
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Options</Text>
          <View style={styles.optionRow}>
            <View style={styles.optionInfo}>
              <Text style={styles.optionLabel}>Auto-Renew</Text>
              <Text style={styles.optionSublabel}>Automatically renew when period ends</Text>
            </View>
            <TouchableOpacity
              style={[styles.toggle, autoRenew && styles.toggleActive]}
              onPress={() => setAutoRenew(!autoRenew)}
              disabled={isProcessing}
              accessibilityRole="switch"
              accessibilityLabel="Auto-Renew subscription"
              accessibilityState={{ checked: autoRenew, disabled: isProcessing }}
            >
              <View style={[styles.toggleDot, autoRenew && styles.toggleDotActive]} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.costSummary}>
          <View style={styles.costRow}>
            <Text style={styles.costLabel}>Plan</Text>
            <Text style={styles.costValue}>{params.planName}</Text>
          </View>
          <View style={styles.costRow}>
            <Text style={styles.costLabel}>Amount</Text>
            <Text style={styles.costValue}>{formatPrice(planPrice, params.currency || 'NGN')}</Text>
          </View>
          {selectedMethod === 'wallet' && (
            <View style={styles.costRow}>
              <Text style={styles.costLabel}>After Payment</Text>
              <Text style={[styles.costValue, { color: colors.success[500] }]}>
                {formatPrice(walletBalance - planPrice, params.currency || 'NGN')}
              </Text>
            </View>
          )}
          <View style={styles.costDivider} />
          <View style={styles.costRow}>
            <Text style={[styles.costLabel, styles.totalLabel]}>Total</Text>
            <Text style={[styles.costValue, styles.totalValue]}>
              {formatPrice(planPrice, params.currency || 'NGN')}
            </Text>
          </View>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[
              styles.payButton,
              (!selectedMethod || isProcessing) && styles.payButtonDisabled,
            ]}
            onPress={handleConfirmPayment}
            disabled={!selectedMethod || isProcessing}
            accessibilityRole="button"
            accessibilityLabel={
              selectedMethod === 'wallet'
                ? `Pay ${formatPrice(planPrice, params.currency || 'NGN')}`
                : 'Proceed to Payment'
            }
            accessibilityState={{ disabled: !selectedMethod || isProcessing }}
          >
            {isProcessing ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.payButtonText}>Processing...</Text>
              </View>
            ) : (
              <Text style={styles.payButtonText}>
                {selectedMethod === 'wallet'
                  ? `Pay ${formatPrice(planPrice, params.currency || 'NGN')}`
                  : 'Proceed to Payment'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelLink}
            onPress={() => router.back()}
            disabled={isProcessing}
            accessibilityRole="button"
            accessibilityLabel="Cancel payment"
            accessibilityHint="Returns to previous screen"
          >
            <Text style={styles.cancelLinkText}>Cancel</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {isProcessing && (
        <View style={styles.processingOverlay}>
          <View style={styles.processingCard}>
            <ActivityIndicator size="large" color={colors.primary[500]} />
            <Text style={styles.processingText}>Processing your payment...</Text>
            <Text style={styles.processingSubtext}>Please do not close the app</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  backButton: {
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
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
  },
  planSummary: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xxl,
    padding: spacing.xl,
    backgroundColor: colors.bg.tertiary,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.primary[500],
  },
  planSummaryLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.xs,
  },
  planSummaryName: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
  },
  planSummaryPrice: {
    fontSize: typography.fontSize.hero,
    fontWeight: typography.fontWeight.extrabold,
    color: colors.primary[500],
  },
  section: {
    marginBottom: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    marginBottom: spacing.md,
  },
  paymentOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.bg.tertiary,
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  paymentOptionSelected: {
    borderColor: colors.primary[500],
  },
  paymentOptionDisabled: {
    opacity: 0.5,
  },
  paymentOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  paymentOptionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  paymentIcon: {
    fontSize: 28,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentLabel: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: 2,
  },
  paymentSublabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
  },
  insufficientBadge: {
    fontSize: typography.fontSize.xs,
    color: colors.error[500],
    fontWeight: typography.fontWeight.semibold,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.text.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterSelected: {
    borderColor: colors.primary[500],
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary[500],
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.bg.tertiary,
    borderRadius: radius.lg,
  },
  optionInfo: {
    flex: 1,
  },
  optionLabel: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: 2,
  },
  optionSublabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
  },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.bg.surface,
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  toggleActive: {
    backgroundColor: colors.primary[500],
  },
  toggleDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
  },
  toggleDotActive: {
    alignSelf: 'flex-end',
  },
  costSummary: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xxl,
    padding: spacing.xl,
    backgroundColor: colors.bg.tertiary,
    borderRadius: radius.xl,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  costLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
  },
  costValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  costDivider: {
    height: 1,
    backgroundColor: colors.border.subtle,
    marginVertical: spacing.sm,
  },
  totalLabel: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  totalValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[500],
  },
  actionsContainer: {
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  payButton: {
    width: '100%',
    backgroundColor: colors.primary[500],
    paddingVertical: spacing.lg,
    borderRadius: radius.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  payButtonDisabled: {
    opacity: 0.5,
  },
  payButtonText: {
    color: '#fff',
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cancelLink: {
    minHeight: 44,
    justifyContent: 'center',
    padding: spacing.md,
  },
  cancelLinkText: {
    color: colors.text.tertiary,
    fontSize: typography.fontSize.base,
  },
  bottomPadding: {
    height: 40,
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingCard: {
    backgroundColor: colors.bg.tertiary,
    borderRadius: radius.xl,
    padding: spacing.xxxl,
    alignItems: 'center',
    gap: spacing.md,
  },
  processingText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  processingSubtext: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
  },
});
