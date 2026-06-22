import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { subscriptionApi } from '../../../src/api';
import { logger } from '../../../src/utils/logger';
import { LoadingState, EmptyState, ErrorState } from '../../../src/components/StateContainers';

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  duration: number;
  features: string[];
  isActive: boolean;
  tier: string;
}

interface CurrentSubscription {
  id: string;
  planId: string;
  status: string;
  plan?: { name: string };
  endDate: string;
}

export default function SubscriptionPlansScreen() {
  const router = useRouter();

  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<CurrentSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubscribing, setIsSubscribing] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [plansResponse, subscriptionResponse] = await Promise.all([
        subscriptionApi.getPlans(),
        subscriptionApi.getCurrentSubscription(),
      ]);

      if (plansResponse.success && plansResponse.data) {
        setPlans(plansResponse.data as SubscriptionPlan[]);
      }

      if (subscriptionResponse.success && subscriptionResponse.data) {
        setCurrentSubscription(subscriptionResponse.data);
      }
    } catch (error) {
      logger.error('Failed to load subscription data', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    Alert.alert(
      'Subscribe to Plan',
      `Subscribe to ${plan.name} for ₦${plan.price.toLocaleString()}/${plan.duration} days?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Subscribe',
          onPress: async () => {
            setIsSubscribing(plan.id);
            try {
              await subscriptionApi.subscribe({
                planId: plan.id,
                autoRenew: true,
              });

              Alert.alert('Success', 'Subscription activated!', [
                { text: 'OK', onPress: () => loadData() },
              ]);
            } catch (error: any) {
              Alert.alert('Error', error?.message || 'Failed to subscribe. Please try again.');
            } finally {
              setIsSubscribing(null);
            }
          },
        },
      ]
    );
  };

  const handleCancelSubscription = async () => {
    if (!currentSubscription) return;

    Alert.alert(
      'Cancel Subscription',
      'Are you sure you want to cancel your subscription? You will lose access at the end of your billing period.',
      [
        { text: 'Keep Subscription', style: 'cancel' },
        {
          text: 'Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await subscriptionApi.cancelSubscription(currentSubscription.id);
              Alert.alert('Success', 'Subscription cancelled', [
                { text: 'OK', onPress: () => loadData() },
              ]);
            } catch (error: any) {
              Alert.alert('Error', 'Failed to cancel subscription');
            }
          },
        },
      ]
    );
  };

  const getTierColor = (tier: string): string => {
    switch (tier) {
      case 'free':
        return '#6B7280';
      case 'basic':
        return '#3B82F6';
      case 'premium':
        return '#8B5CF6';
      case 'enterprise':
        return '#F59E0B';
      default:
        return '#6B7280';
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <LoadingState text="Loading plans..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Subscription Plans</Text>
        </View>

        {currentSubscription && (
          <View style={styles.currentPlanCard}>
            <View style={styles.currentPlanHeader}>
              <Text style={styles.currentPlanTitle}>Current Plan</Text>
              <View
                style={[
                  styles.statusBadge,
                  currentSubscription.status === 'active'
                    ? styles.statusBadgeActive
                    : styles.statusBadgeInactive,
                ]}
              >
                <Text style={styles.statusText}>{currentSubscription.status}</Text>
              </View>
            </View>
            <Text style={styles.currentPlanName}>{currentSubscription.plan?.name || 'N/A'}</Text>
            <Text style={styles.currentPlanExpiry}>
              Expires: {new Date(currentSubscription.endDate).toLocaleDateString()}
            </Text>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancelSubscription}>
              <Text style={styles.cancelButtonText}>Cancel Subscription</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.sectionTitle}>Available Plans</Text>

        {plans.map((plan) => {
          const isCurrentPlan = currentSubscription?.planId === plan.id;
          const isPopular = plan.tier === 'premium';

          return (
            <View
              key={plan.id}
              style={[
                styles.planCard,
                isPopular && styles.planCardPopular,
                isCurrentPlan && styles.planCardCurrent,
              ]}
            >
              {isPopular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularBadgeText}>Most Popular</Text>
                </View>
              )}

              <View style={styles.planHeader}>
                <View style={[styles.tierBadge, { backgroundColor: getTierColor(plan.tier) }]}>
                  <Text style={styles.tierBadgeText}>
                    {plan.tier.charAt(0).toUpperCase() + plan.tier.slice(1)}
                  </Text>
                </View>
                <Text style={styles.planName}>{plan.name}</Text>
              </View>

              <View style={styles.priceContainer}>
                <Text style={styles.currency}>₦</Text>
                <Text style={styles.price}>{plan.price.toLocaleString()}</Text>
                <Text style={styles.duration}>/{plan.duration} days</Text>
              </View>

              <Text style={styles.planDescription}>{plan.description}</Text>

              <View style={styles.featuresList}>
                {plan.features.map((feature, index) => (
                  <View key={index} style={styles.featureItem}>
                    <Text style={styles.featureIcon}>✓</Text>
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={[
                  styles.subscribeButton,
                  isCurrentPlan && styles.subscribeButtonDisabled,
                  isPopular && styles.subscribeButtonPopular,
                ]}
                onPress={() => !isCurrentPlan && handleSubscribe(plan)}
                disabled={isCurrentPlan || isSubscribing === plan.id}
              >
                {isSubscribing === plan.id ? (
                  <ActivityIndicator color="#fff" />
                ) : isCurrentPlan ? (
                  <Text style={styles.subscribeButtonText}>Current Plan</Text>
                ) : (
                  <Text style={styles.subscribeButtonText}>Subscribe</Text>
                )}
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#9CA3AF',
    fontSize: 14,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
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
  currentPlanCard: {
    backgroundColor: '#1f1f2e',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#8B5CF6',
  },
  currentPlanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  currentPlanTitle: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeActive: {
    backgroundColor: '#10B981',
  },
  statusBadgeInactive: {
    backgroundColor: '#EF4444',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  currentPlanName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F3F4F6',
    marginBottom: 8,
  },
  currentPlanExpiry: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 16,
  },
  cancelButton: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F3F4F6',
    marginBottom: 16,
  },
  planCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  planCardPopular: {
    borderColor: '#8B5CF6',
    borderWidth: 2,
  },
  planCardCurrent: {
    opacity: 0.7,
  },
  popularBadge: {
    backgroundColor: '#8B5CF6',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  popularBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  tierBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tierBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  planName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F3F4F6',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  currency: {
    fontSize: 20,
    color: '#F3F4F6',
    fontWeight: '600',
  },
  price: {
    fontSize: 36,
    color: '#F3F4F6',
    fontWeight: 'bold',
  },
  duration: {
    fontSize: 14,
    color: '#9CA3AF',
    marginLeft: 4,
  },
  planDescription: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 16,
    lineHeight: 20,
  },
  featuresList: {
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureIcon: {
    color: '#10B981',
    fontSize: 16,
    marginRight: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#F3F4F6',
  },
  subscribeButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  subscribeButtonPopular: {
    backgroundColor: '#8B5CF6',
  },
  subscribeButtonDisabled: {
    backgroundColor: '#4B5563',
  },
  subscribeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
