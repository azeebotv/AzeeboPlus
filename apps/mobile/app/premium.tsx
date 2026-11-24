import { useState } from 'react';
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
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@azeebo/react-data/contexts/AuthContext';
import { subscriptionApi } from '@azeebo/react-data/api/subscription';
import { colors, typography, spacing, radius } from '../src/theme';

const PREMIUM_FEATURES = [
  {
    icon: '🚫',
    title: 'Ad-Free Experience',
    description: 'Watch all content without any advertisements or interruptions.',
  },
  {
    icon: '🎬',
    title: 'HD & 4K Streaming',
    description: 'Enjoy content in stunning high-definition and 4K quality.',
  },
  {
    icon: '⭐',
    title: 'Exclusive Content',
    description: 'Access premium-only shows, movies, and special features.',
  },
  {
    icon: '📥',
    title: 'Offline Downloads',
    description: 'Download content to watch anytime, even without internet.',
  },
  {
    icon: '🏆',
    title: 'Early Access',
    description: 'Get early access to new episodes and premieres before anyone else.',
  },
  {
    icon: '🎮',
    title: 'Premium Challenges',
    description: 'Participate in exclusive challenges and competitions with bigger rewards.',
  },
];

const BONUS_FEATURES = [
  { icon: '💬', label: 'Priority Support' },
  { icon: '🎯', label: 'Personalized Recommendations' },
  { icon: '💾', label: 'Cloud Sync Across Devices' },
  { icon: '🔐', label: 'Advanced Privacy Controls' },
];

export default function PremiumAccessScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');

  const plansQuery = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      const res = await subscriptionApi.getPlans();
      return res.success ? res.data : null;
    },
  });

  const plans = plansQuery.data ?? [];
  const premiumMonthly = plans.find(
    (p) => p.tier?.toLowerCase() === 'premium' && p.interval === 'monthly'
  );
  const premiumYearly = plans.find(
    (p) => p.tier?.toLowerCase() === 'premium' && p.interval === 'yearly'
  );

  const formatPrice = (price: number, currency?: string) => {
    const symbol = currency === 'NGN' || !currency ? '₦' : currency;
    return `${symbol}${price.toLocaleString()}`;
  };

  const selectedPlanData = selectedPlan === 'monthly' ? premiumMonthly : premiumYearly;
  const priceDisplay = selectedPlanData
    ? `${formatPrice(selectedPlanData.price, selectedPlanData.currency)}/${selectedPlan === 'monthly' ? 'mo' : 'yr'}`
    : 'Loading...';

  const alternatePlanData = selectedPlan === 'monthly' ? premiumYearly : premiumMonthly;
  const altPriceDisplay = alternatePlanData
    ? `${formatPrice(alternatePlanData.price, alternatePlanData.currency)}/${selectedPlan === 'monthly' ? 'yr' : 'mo'}`
    : '';

  const handleSubscribe = async () => {
    if (!isAuthenticated) {
      Alert.alert('Sign In Required', 'Please sign in to subscribe to Premium', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => router.push('/(auth)/login') },
      ]);
      return;
    }

    setIsLoading(true);
    try {
      const plansResponse = await subscriptionApi.getPlans();
      if (plansResponse.success && plansResponse.data) {
        const plan = plansResponse.data.find(
          (p) => p.tier?.toLowerCase() === 'premium' && p.interval === selectedPlan
        );
        if (plan) {
          router.push(
            `/subscription/payment?planId=${plan.id}&planName=${encodeURIComponent(plan.name)}&price=${plan.price}&currency=${plan.currency}`
          );
        } else {
          router.push('/subscription/plans');
        }
      } else {
        router.push('/subscription/plans');
      }
    } catch {
      router.push('/subscription/plans');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView accessibilityLabel="Premium Screen" style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.hero}>
          <Text style={styles.heroIcon}>⭐</Text>
          <Text style={styles.heroTitle}>Go Premium</Text>
          <Text style={styles.heroSubtitle}>
            Unlock the ultimate Azeebo+ experience with premium access
          </Text>
        </View>

        <View style={styles.featuresGrid}>
          {PREMIUM_FEATURES.map((feature, index) => (
            <View key={index} style={styles.featureCard}>
              <Text style={styles.featureIcon}>{feature.icon}</Text>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureDescription}>{feature.description}</Text>
            </View>
          ))}
        </View>

        <View style={styles.planSelector}>
          <Text style={styles.planSelectorTitle}>Choose Your Plan</Text>
          <View style={styles.planToggle}>
            <TouchableOpacity
              style={[styles.planOption, selectedPlan === 'monthly' && styles.planOptionActive]}
              onPress={() => setSelectedPlan('monthly')}
            >
              <Text
                style={[
                  styles.planOptionLabel,
                  selectedPlan === 'monthly' && styles.planOptionLabelActive,
                ]}
              >
                Monthly
              </Text>
              <Text
                style={[
                  styles.planOptionPrice,
                  selectedPlan === 'monthly' && styles.planOptionPriceActive,
                ]}
              >
                {plansQuery.isLoading ? '...' : priceDisplay}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.planOption, selectedPlan === 'yearly' && styles.planOptionActive]}
              onPress={() => setSelectedPlan('yearly')}
            >
              <View style={styles.savingsBadge}>
                <Text style={styles.savingsText}>SAVE 40%</Text>
              </View>
              <Text
                style={[
                  styles.planOptionLabel,
                  selectedPlan === 'yearly' && styles.planOptionLabelActive,
                ]}
              >
                Yearly
              </Text>
              <Text
                style={[
                  styles.planOptionPrice,
                  selectedPlan === 'yearly' && styles.planOptionPriceActive,
                ]}
              >
                {plansQuery.isLoading
                  ? '...'
                  : selectedPlan === 'yearly'
                    ? priceDisplay
                    : altPriceDisplay}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.bonusSection}>
          <Text style={styles.bonusTitle}>Also Includes</Text>
          <View style={styles.bonusGrid}>
            {BONUS_FEATURES.map((feature, index) => (
              <View key={index} style={styles.bonusItem}>
                <Text style={styles.bonusIcon}>{feature.icon}</Text>
                <Text style={styles.bonusLabel}>{feature.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.bundleSection}>
          <Text style={styles.bundleTitle}>Bundle Passes</Text>
          <Text style={styles.bundleDesc}>Save up to 40% with multi-universe bundles</Text>
          <TouchableOpacity accessibilityRole="button" style={styles.bundleButton} onPress={() => router.push('/bundles')}>
            <Text style={styles.bundleButtonText}>View Bundles</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.ctaSection}>
          <TouchableOpacity
            style={[styles.subscribeButton, isLoading && styles.subscribeButtonDisabled]}
            onPress={handleSubscribe}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.subscribeButtonText}>
                {selectedPlan === 'yearly' ? 'Subscribe Yearly — Save 40%' : 'Subscribe Monthly'}
              </Text>
            )}
          </TouchableOpacity>
          <Text style={styles.cancelNote}>Cancel anytime. No questions asked.</Text>
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
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    padding: spacing.lg,
  },
  backButton: {},
  backText: {
    color: colors.primary[500],
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  hero: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
  },
  heroIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  heroTitle: {
    fontSize: typography.fontSize.hero,
    fontWeight: typography.fontWeight.extrabold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  heroSubtitle: {
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  featuresGrid: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  featureCard: {
    backgroundColor: colors.bg.tertiary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  featureIcon: {
    fontSize: 28,
    marginBottom: spacing.sm,
  },
  featureTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  featureDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  planSelector: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  planSelectorTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  planToggle: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  planOption: {
    flex: 1,
    backgroundColor: colors.bg.tertiary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  planOptionActive: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[500] + '15',
  },
  savingsBadge: {
    backgroundColor: colors.success[500],
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    marginBottom: spacing.sm,
  },
  savingsText: {
    color: '#fff',
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  planOptionLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  planOptionLabelActive: {
    color: colors.primary[500],
  },
  planOptionPrice: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  planOptionPriceActive: {
    color: colors.primary[500],
  },
  bonusSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  bonusTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  bonusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  bonusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.tertiary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    gap: spacing.xs,
  },
  bonusIcon: {
    fontSize: 16,
  },
  bonusLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  bundleSection: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary[500] + '10',
    marginHorizontal: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.primary[500] + '40',
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  bundleTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  bundleDesc: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  bundleButton: {
    backgroundColor: colors.primary[500],
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.lg,
  },
  bundleButtonText: {
    color: '#fff',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
  ctaSection: {
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  subscribeButton: {
    backgroundColor: colors.primary[500],
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.lg,
    alignItems: 'center',
    width: '100%',
    marginBottom: spacing.sm,
  },
  subscribeButtonDisabled: {
    opacity: 0.7,
  },
  subscribeButtonText: {
    color: '#fff',
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
  },
  cancelNote: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
  },
  bottomPadding: {
    height: 40,
  },
});
