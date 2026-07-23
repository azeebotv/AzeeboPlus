import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { subscriptionApi, type SubscriptionPlan, type Subscription } from '../../src/api/subscription';
import { colors, typography, spacing, radius } from '../../src/theme';

export default function PlansScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [plansResponse, subResponse] = await Promise.all([
        subscriptionApi.getPlans(),
        subscriptionApi.getCurrentSubscription().catch(() => ({ success: false, data: null })),
      ]);

      if (plansResponse.success && plansResponse.data) {
        setPlans(plansResponse.data);
      }

      if (subResponse.success && subResponse.data) {
        setCurrentSubscription(subResponse.data);
      }
    } catch (error) {
      console.error('Failed to load subscription data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  const handleSubscribe = (plan: SubscriptionPlan) => {
    if (!isAuthenticated) {
      Alert.alert('Sign In Required', 'Please sign in to subscribe', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => router.push('/(auth)/login') },
      ]);
      return;
    }

    if (currentSubscription?.planId === plan.id && currentSubscription?.status === 'active') {
      Alert.alert('Already Subscribed', 'You are already subscribed to this plan.');
      return;
    }

    setSelectedPlan(plan);
    router.push(`/subscription/payment?planId=${plan.id}&planName=${encodeURIComponent(plan.name)}&price=${plan.price}&currency=${plan.currency}`);
  };

  const formatPrice = (price: number, currency: string) => {
    return `${currency === 'NGN' ? '₦' : '$'}${price.toLocaleString()}`;
  };

  const getIntervalLabel = (interval?: string) => {
    switch (interval) {
      case 'monthly':
        return '/month';
      case 'yearly':
        return '/year';
      default:
        return '';
    }
  };

  const isCurrentPlan = (plan: SubscriptionPlan) => {
    return currentSubscription?.planId === plan.id && currentSubscription?.status === 'active';
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.primary[500]} />
        }
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Subscription Plans</Text>
          <Text style={styles.subtitle}>Choose the plan that works for you</Text>
        </View>

        {currentSubscription && currentSubscription.status === 'active' && (
          <View style={styles.currentPlanBanner}>
            <Text style={styles.currentPlanLabel}>Your current plan</Text>
            <Text style={styles.currentPlanName}>{currentSubscription.plan?.name || 'Active Plan'}</Text>
            <TouchableOpacity onPress={() => router.push('/subscription/current')}>
              <Text style={styles.manageLink}>Manage Subscription →</Text>
            </TouchableOpacity>
          </View>
        )}

        {plans.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>No plans available</Text>
            <Text style={styles.emptySubtext}>Check back later for new subscription options</Text>
          </View>
        ) : (
          <View style={styles.plansContainer}>
            {plans.map((plan) => {
              const active = isCurrentPlan(plan);
              return (
                <TouchableOpacity
                  key={plan.id}
                  style={[styles.planCard, active && styles.planCardActive]}
                  onPress={() => handleSubscribe(plan)}
                  disabled={active}
                  activeOpacity={active ? 1 : 0.7}
                >
                  {active && (
                    <View style={styles.activeBadge}>
                      <Text style={styles.activeBadgeText}>CURRENT</Text>
                    </View>
                  )}

                  <View style={styles.planHeader}>
                    <Text style={styles.planName}>{plan.name}</Text>
                    {plan.tier && (
                      <View style={[styles.tierBadge, { backgroundColor: getTierColor(plan.tier) }]}>
                        <Text style={styles.tierText}>{plan.tier}</Text>
                      </View>
                    )}
                  </View>

                  {plan.description && (
                    <Text style={styles.planDescription}>{plan.description}</Text>
                  )}

                  <View style={styles.priceRow}>
                    <Text style={styles.price}>{formatPrice(plan.price, plan.currency)}</Text>
                    <Text style={styles.interval}>{getIntervalLabel(plan.interval)}</Text>
                  </View>

                  {plan.features && plan.features.length > 0 && (
                    <View style={styles.featuresContainer}>
                      {plan.features.map((feature, index) => (
                        <View key={index} style={styles.featureRow}>
                          <Text style={styles.featureCheck}>✓</Text>
                          <Text style={styles.featureText}>{feature}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {!active && (
                    <TouchableOpacity
                      style={[styles.subscribeButton, selectedPlan?.id === plan.id && styles.subscribeButtonLoading]}
                      onPress={() => handleSubscribe(plan)}
                      disabled={selectedPlan?.id === plan.id}
                    >
                      {selectedPlan?.id === plan.id ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <Text style={styles.subscribeButtonText}>Subscribe Now</Text>
                      )}
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

function getTierColor(tier: string): string {
  switch (tier.toLowerCase()) {
    case 'basic':
      return colors.light[500];
    case 'premium':
      return colors.primary[500];
    case 'enterprise':
      return colors.accent.gold;
    default:
      return colors.primary[500];
  }
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
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
  },
  currentPlanBanner: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.bg.tertiary,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.primary[500],
  },
  currentPlanLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.xs,
  },
  currentPlanName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  manageLink: {
    color: colors.primary[500],
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  plansContainer: {
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  planCard: {
    backgroundColor: colors.bg.tertiary,
    borderRadius: radius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  planCardActive: {
    borderColor: colors.primary[500],
  },
  activeBadge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    backgroundColor: colors.primary[500],
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  activeBadgeText: {
    color: '#fff',
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  planName: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  tierBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  tierText: {
    color: '#fff',
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    textTransform: 'uppercase',
  },
  planDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  price: {
    fontSize: typography.fontSize.hero,
    fontWeight: typography.fontWeight.extrabold,
    color: colors.primary[500],
  },
  interval: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
  },
  featuresContainer: {
    gap: spacing.sm,
    marginBottom: spacing.xl,
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
  subscribeButton: {
    backgroundColor: colors.primary[500],
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  subscribeButtonLoading: {
    opacity: 0.7,
  },
  subscribeButtonText: {
    color: '#fff',
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: spacing.xl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
  bottomPadding: {
    height: 40,
  },
});
