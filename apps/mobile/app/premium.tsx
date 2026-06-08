import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { subscriptionApi } from '../src/api';
import { logger } from '../src/utils/logger';
import { LoadingState, ErrorState, EmptyState } from '../src/components/StateContainers';

interface PremiumPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: 'weekly' | 'monthly' | 'yearly';
  features: string[];
  isPopular: boolean;
  discount?: number;
}

interface PremiumStatus {
  isPremium: boolean;
  planName?: string;
  expiresAt?: string;
  autoRenew: boolean;
}

export default function PremiumAccessScreen() {
  const router = useRouter();
  const [plans, setPlans] = useState<PremiumPlan[]>([]);
  const [status, setStatus] = useState<PremiumStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPremiumData();
  }, []);

  const loadPremiumData = async () => {
    try {
      const [plansResponse, statusResponse] = await Promise.all([
        subscriptionApi.getPlans(),
        subscriptionApi.getCurrentSubscription(),
      ]);

      if (plansResponse.success && plansResponse.data) {
        setPlans(plansResponse.data.map((plan: any) => ({
          id: plan.id,
          name: plan.name,
          description: plan.description,
          price: plan.price,
          duration: plan.duration === 7 ? 'weekly' : plan.duration === 30 ? 'monthly' : 'yearly',
          features: plan.features,
          isPopular: plan.tier === 'premium',
        })));
      }

      if (statusResponse.success && statusResponse.data) {
        const sub = statusResponse.data;
        setStatus({
          isPremium: sub.status === 'active',
          planName: sub.plan?.name,
          expiresAt: sub.endDate,
          autoRenew: sub.autoRenew,
        });
      }
    } catch (error) {
      logger.error('Failed to load premium data:', error);
      setError('Failed to load premium data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribe = async (planId: string) => {
    setIsPurchasing(true);
    try {
      const response = await subscriptionApi.subscribe({ planId, autoRenew: true });
      if (response.success) {
        Alert.alert(
          'Success',
          'You are now a premium member!',
          [{ text: 'OK', onPress: () => loadPremiumData() }]
        );
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to subscribe');
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleCancel = async () => {
    Alert.alert(
      'Cancel Subscription',
      'Are you sure you want to cancel your premium subscription?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              if (status?.planName) {
                await subscriptionApi.cancelSubscription(status.planName);
              }
              Alert.alert('Success', 'Subscription cancelled');
              loadPremiumData();
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel subscription');
            }
          },
        },
      ]
    );
  };

  const getDurationLabel = (duration: string): string => {
    switch (duration) {
      case 'weekly': return '/week';
      case 'monthly': return '/month';
      case 'yearly': return '/year';
      default: return '';
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <LoadingState text="Loading premium plans..." />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ErrorState description={error} onRetry={loadPremiumData} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Premium Access</Text>
        <Text style={styles.subtitle}>Unlock exclusive content and features</Text>
      </View>

      {status?.isPremium && (
        <View style={styles.activeCard}>
          <View style={styles.activeHeader}>
            <Text style={styles.activeIcon}>👑</Text>
            <View style={styles.activeInfo}>
              <Text style={styles.activeTitle}>Premium Active</Text>
              <Text style={styles.activePlan}>{status.planName}</Text>
            </View>
          </View>
          <Text style={styles.expiresText}>
            Expires: {status.expiresAt ? new Date(status.expiresAt).toLocaleDateString() : 'N/A'}
          </Text>
          <View style={styles.autoRenewRow}>
            <Text style={styles.autoRenewLabel}>Auto-renew</Text>
            <Text style={styles.autoRenewValue}>{status.autoRenew ? 'On' : 'Off'}</Text>
          </View>
          {status.autoRenew && (
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
              <Text style={styles.cancelButtonText}>Cancel Subscription</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <View style={styles.plansSection}>
        <Text style={styles.plansTitle}>Choose Your Plan</Text>
        {plans.map((plan) => (
          <TouchableOpacity
            key={plan.id}
            style={[
              styles.planCard,
              plan.isPopular && styles.planCardPopular,
            ]}
            onPress={() => handleSubscribe(plan.id)}
            disabled={isPurchasing}
          >
            {plan.isPopular && (
              <View style={styles.popularBadge}>
                <Text style={styles.popularText}>Most Popular</Text>
              </View>
            )}
            <View style={styles.planHeader}>
              <Text style={styles.planName}>{plan.name}</Text>
              <View style={styles.priceContainer}>
                <Text style={styles.price}>₦{plan.price.toLocaleString()}</Text>
                <Text style={styles.duration}>{getDurationLabel(plan.duration)}</Text>
              </View>
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
                plan.isPopular && styles.subscribeButtonPopular,
              ]}
              onPress={() => handleSubscribe(plan.id)}
              disabled={isPurchasing}
            >
              {isPurchasing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.subscribeButtonText}>Subscribe Now</Text>
              )}
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  activeCard: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  activeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  activeIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  activeInfo: {
    flex: 1,
  },
  activeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F59E0B',
  },
  activePlan: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  expiresText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  autoRenewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  autoRenewLabel: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  autoRenewValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  cancelButton: {
    backgroundColor: '#EF444420',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#EF4444',
    fontWeight: '600',
    fontSize: 14,
  },
  plansSection: {
    marginBottom: 24,
  },
  plansTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  planCard: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  planCardPopular: {
    borderWidth: 2,
    borderColor: '#8B5CF6',
  },
  popularBadge: {
    backgroundColor: '#8B5CF6',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
  },
  popularText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 12,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  planName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B5CF6',
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
    fontWeight: 'bold',
  },
  featureText: {
    fontSize: 14,
    color: '#E5E7EB',
  },
  subscribeButton: {
    backgroundColor: '#374151',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  subscribeButtonPopular: {
    backgroundColor: '#8B5CF6',
  },
  subscribeButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
});
