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
import { useRouter } from 'expo-router';
import { useAuth } from '@azeebo/react-data/contexts/AuthContext';
import { subscriptionApi, type Subscription } from '@azeebo/react-data/api/subscription';
import { colors, typography, spacing, radius } from '../../src/theme';
import { createLogger } from '@azeebo/react-data/utils/logger';

const logger = createLogger('CurrentSubscription');

export default function CurrentSubscriptionScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/(auth)/login');
      return;
    }
    loadSubscription();
  }, [isAuthenticated]);

  const loadSubscription = async () => {
    try {
      const response = await subscriptionApi.getCurrentSubscription();
      if (response.success && response.data) {
        setSubscription(response.data);
      }
    } catch (error) {
      logger.error('Failed to load subscription', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (!subscription) return;

    Alert.alert(
      'Cancel Subscription',
      'Are you sure you want to cancel your subscription? You will retain access until the end of your billing period.',
      [
        { text: 'Keep Subscription', style: 'cancel' },
        {
          text: 'Cancel',
          style: 'destructive',
          onPress: confirmCancel,
        },
      ]
    );
  };

  const confirmCancel = async () => {
    if (!subscription) return;

    setIsCancelling(true);
    try {
      await subscriptionApi.cancelSubscription(subscription.id);
      Alert.alert(
        'Subscription Cancelled',
        'Your subscription has been cancelled. You retain access until the end of your billing period.',
        [{ text: 'OK', onPress: () => loadSubscription() }]
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to cancel subscription';
      Alert.alert('Error', message);
    } finally {
      setIsCancelling(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatPrice = (price: number, currency: string) => {
    return `${currency === 'NGN' ? '₦' : '$'}${price.toLocaleString()}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return colors.success[500];
      case 'cancelled':
        return colors.warning[500];
      case 'expired':
        return colors.error[500];
      default:
        return colors.text.tertiary;
    }
  };

  const isExpired = (endDate: string) => {
    return new Date(endDate) < new Date();
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
        </View>
      </SafeAreaView>
    );
  }

  if (!subscription) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>My Subscription</Text>
        </View>

        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📺</Text>
          <Text style={styles.emptyText}>No Active Subscription</Text>
          <Text style={styles.emptySubtext}>Subscribe to unlock premium content and features</Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => router.push('/subscription/plans')}
          >
            <Text style={styles.browseButtonText}>Browse Plans</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const expired = isExpired(subscription.endDate);
  const statusColor = getStatusColor(subscription.status);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>My Subscription</Text>
        </View>

        <View style={styles.statusBanner}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>
            {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
            {expired && ' (Expired)'}
          </Text>
        </View>

        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Plan</Text>
            <Text style={styles.detailValue}>{subscription.plan?.name || 'Unknown Plan'}</Text>
          </View>

          <View style={styles.detailDivider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Price</Text>
            <Text style={[styles.detailValue, styles.priceValue]}>
              {subscription.plan
                ? formatPrice(subscription.plan.price, subscription.plan.currency)
                : '—'}
            </Text>
          </View>

          <View style={styles.detailDivider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Started</Text>
            <Text style={styles.detailValue}>{formatDate(subscription.startDate)}</Text>
          </View>

          <View style={styles.detailDivider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Renews</Text>
            <Text style={[styles.detailValue, expired && styles.expiredText]}>
              {formatDate(subscription.endDate)}
            </Text>
          </View>

          <View style={styles.detailDivider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Auto-Renew</Text>
            <Text
              style={[
                styles.detailValue,
                { color: subscription.autoRenew ? colors.success[500] : colors.text.tertiary },
              ]}
            >
              {subscription.autoRenew ? 'Enabled' : 'Disabled'}
            </Text>
          </View>

          {subscription.paymentMethod && (
            <>
              <View style={styles.detailDivider} />
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Payment Method</Text>
                <Text style={styles.detailValue}>{subscription.paymentMethod}</Text>
              </View>
            </>
          )}

          {subscription.lastPaymentDate && (
            <>
              <View style={styles.detailDivider} />
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Last Payment</Text>
                <Text style={styles.detailValue}>{formatDate(subscription.lastPaymentDate)}</Text>
              </View>
            </>
          )}
        </View>

        {subscription.plan?.features && subscription.plan.features.length > 0 && (
          <View style={styles.featuresSection}>
            <Text style={styles.sectionTitle}>Plan Features</Text>
            <View style={styles.featuresCard}>
              {subscription.plan.features.map((feature, index) => (
                <View key={index} style={styles.featureRow}>
                  <Text style={styles.featureCheck}>✓</Text>
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.actionsContainer}>
          {expired && (
            <TouchableOpacity
              style={styles.renewButton}
              onPress={() => router.push('/subscription/plans')}
            >
              <Text style={styles.renewButtonText}>Renew Subscription</Text>
            </TouchableOpacity>
          )}

          {subscription.status === 'active' && !expired && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancel}
              disabled={isCancelling}
            >
              {isCancelling ? (
                <ActivityIndicator color={colors.error[500]} size="small" />
              ) : (
                <Text style={styles.cancelButtonText}>Cancel Subscription</Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  backButton: {
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
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.bg.tertiary,
    borderRadius: radius.md,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  detailsCard: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.bg.tertiary,
    borderRadius: radius.xl,
    padding: spacing.xl,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  detailLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
  },
  detailValue: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    textAlign: 'right',
    flex: 1,
    marginLeft: spacing.lg,
  },
  priceValue: {
    color: colors.primary[500],
  },
  expiredText: {
    color: colors.error[500],
  },
  detailDivider: {
    height: 1,
    backgroundColor: colors.border.subtle,
  },
  featuresSection: {
    marginTop: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    marginBottom: spacing.md,
  },
  featuresCard: {
    backgroundColor: colors.bg.tertiary,
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.md,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  featureCheck: {
    color: colors.success[500],
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
  },
  featureText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    flex: 1,
  },
  actionsContainer: {
    marginTop: spacing.xxl,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  renewButton: {
    backgroundColor: colors.primary[500],
    paddingVertical: spacing.lg,
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  renewButtonText: {
    color: '#fff',
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    paddingVertical: spacing.lg,
    borderRadius: radius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.error[500],
  },
  cancelButtonText: {
    color: colors.error[500],
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  emptyText: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    fontSize: typography.fontSize.base,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginBottom: spacing.xxl,
  },
  browseButton: {
    backgroundColor: colors.primary[500],
    paddingHorizontal: spacing.xxxl,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
  },
  browseButtonText: {
    color: '#fff',
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
  },
  bottomPadding: {
    height: 40,
  },
});
