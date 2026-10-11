'use client';
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { apiClient } from '@azeebo/react-data/api/client';
import { LoadingState } from '../../src/components/StateContainers';
import { useWallet } from '@azeebo/react-data/contexts/WalletContext';
import { createLogger } from '@azeebo/react-data/utils/logger';
import type { SubscriptionPlan } from '@azeebo/react-data/types/api';
import { colors } from '../../src/theme';
import { brand } from '@azeebo/design-tokens';

const logger = createLogger('SubscriptionPlans');

export default function SubscriptionPlansScreen() {
  const router = useRouter();
  const { wallet } = useWallet();

  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);

  const walletBalance = wallet?.balance || 0;

  const loadSubscriptionData = async () => {
    setIsLoading(true);
    try {
      const [plansRes, currentRes] = await Promise.all([
        // Note: gateway route is /subscription (singular) — the rest of the
        // mobile API layer already uses /v1/subscription/*.
        apiClient.get<SubscriptionPlan[]>('/v1/subscription/plans'),
        apiClient.get<SubscriptionPlan>('/v1/subscription/current').catch(() => null),
      ]);

      if (plansRes) {
        setPlans(Array.isArray(plansRes) ? plansRes : []);
      }

      if (currentRes) {
        setCurrentPlan(Array.isArray(currentRes) ? currentRes[0] : currentRes);
      }
    } catch (error) {
      logger.error('Failed to load subscription data', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const handleSubscribe = () => {
    if (!selectedPlan) return;
    Alert.alert(
      'Confirm Subscription',
      `Subscribe to ${selectedPlan.name} for ₦${selectedPlan.price.toLocaleString()}/${selectedPlan.duration} days?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Subscribe',
          onPress: () =>
            router.push(
              `/subscription/payment?planId=${selectedPlan.id}&planName=${encodeURIComponent(selectedPlan.name)}&price=${selectedPlan.price}&currency=NGN`
            ),
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingState text="Loading subscription plans..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Subscription Plans</Text>
        </View>

        {currentPlan && (
          <View style={styles.currentPlan}>
            <Text style={styles.currentPlanTitle}>Current Plan</Text>
            <Text style={styles.currentPlanName}>{currentPlan.name}</Text>
            <Text style={styles.currentPlanInfo}>Renews in {currentPlan.duration} days</Text>
          </View>
        )}

        <View style={styles.plansSection}>
          <Text style={styles.sectionTitle}>Available Plans</Text>
          {plans.length === 0 ? (
            <Text style={styles.emptyText}>No subscription plans available</Text>
          ) : (
            plans.map((plan) => (
              <TouchableOpacity
                key={plan.id}
                style={[styles.planCard, selectedPlan?.id === plan.id && styles.planCardSelected]}
                onPress={() => setSelectedPlan(plan)}
              >
                <View style={styles.planHeader}>
                  <Text style={styles.planName}>{plan.name}</Text>
                  {plan.tier && (
                    <View style={styles.tierBadge}>
                      <Text style={styles.tierText}>{plan.tier}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.planPrice}>
                  ₦{plan.price.toLocaleString()}
                  <Text style={styles.planPeriod}>/{plan.duration} days</Text>
                </Text>
                {plan.features && plan.features.length > 0 && (
                  <View style={styles.featuresList}>
                    {plan.features.slice(0, 3).map((feature, idx) => (
                      <Text key={idx} style={styles.featureItem}>
                        ✓ {feature}
                      </Text>
                    ))}
                    {plan.features.length > 3 && (
                      <Text style={styles.moreFeatures}>+{plan.features.length - 3} more</Text>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            ))
          )}
        </View>

        {selectedPlan && (
          <View style={styles.checkoutSection}>
            <Text style={styles.checkoutTitle}>Confirm Selection</Text>
            <Text style={styles.checkoutName}>{selectedPlan.name}</Text>
            <Text style={styles.checkoutPrice}>₦{selectedPlan.price.toLocaleString()}</Text>
            <TouchableOpacity
              style={[
                styles.buyButton,
                walletBalance < selectedPlan.price && styles.insufficientFunds,
              ]}
              onPress={handleSubscribe}
              disabled={walletBalance < selectedPlan.price}
            >
              <Text style={styles.buyButtonText}>
                {walletBalance >= selectedPlan.price ? 'Subscribe Now' : 'Insufficient Funds'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A0A0A' },
  content: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
    backgroundColor: '#1a1a1a',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bg.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { color: '#fff', fontSize: 20 },
  title: { color: '#fff', fontSize: 18, fontWeight: '600', marginLeft: 'auto' },
  currentPlan: {
    backgroundColor: '#140808',
    padding: 16,
    borderRadius: 12,
    margin: 16,
    alignItems: 'center',
  },
  currentPlanTitle: { color: '#9A8A7A', fontSize: 12, marginBottom: 4 },
  currentPlanName: { color: '#fff', fontSize: 16, fontWeight: '600' },
  currentPlanInfo: { color: '#6A5A4A', fontSize: 12, marginTop: 4 },
  plansSection: { paddingHorizontal: 16 },
  sectionTitle: { color: '#fff', fontSize: 20, fontWeight: '600', marginBottom: 16 },
  emptyText: { color: '#9A8A7A', textAlign: 'center', padding: 40 },
  planCard: {
    backgroundColor: '#140808',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2A1A1A',
  },
  planCardSelected: { borderColor: brand.flame, backgroundColor: 'rgba(232,66,10,0.15)' },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  planName: { color: '#fff', fontSize: 16, fontWeight: '600' },
  tierBadge: {
    backgroundColor: brand.flame,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tierText: { color: '#fff', fontSize: 10, fontWeight: '600' },
  planPrice: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 8 },
  planPeriod: { color: '#9A8A7A', fontSize: 14 },
  featuresList: { marginTop: 8 },
  featureItem: { color: '#9A8A7A', fontSize: 13, marginBottom: 4 },
  moreFeatures: { color: '#6A5A4A', fontSize: 13 },
  checkoutSection: {
    margin: 16,
    padding: 16,
    backgroundColor: '#140808',
    borderRadius: 12,
    alignItems: 'center',
  },
  checkoutTitle: { color: '#9A8A7A', fontSize: 12, marginBottom: 4 },
  checkoutName: { color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 4 },
  checkoutPrice: { color: brand.flame, fontSize: 18, fontWeight: '700', marginBottom: 16 },
  buyButton: {
    backgroundColor: brand.flame,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  insufficientFunds: { opacity: 0.5 },
  buyButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
