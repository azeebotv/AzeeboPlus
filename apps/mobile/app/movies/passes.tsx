import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { LoadingState, EmptyState, ErrorState } from '../../src/components/StateContainers';
import { apiClient } from '../../src/api/client';
import { ApiResponse } from '../../src/types/api';

type ListResponse<T> = T[] | ApiResponse<T[]>;

interface PassPlan {
  id: string;
  name: string;
  price: string;
  period: string;
  features: string[];
  popular?: boolean;
  emoji: string;
}

export default function PassesScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const isDark = colorScheme === 'dark';
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const passesQuery = useQuery({
    queryKey: ['movies', 'passes'],
    queryFn: async () => {
      const res = await apiClient.get<ListResponse<PassPlan>>('/v1/movies/passes');
      return Array.isArray(res) ? res : (res?.data ?? []);
    },
    staleTime: 60_000,
  });

  const isLoading = passesQuery.isLoading;
  const error = passesQuery.error?.message;
  const passes = passesQuery.data ?? [];

  const handleSubscribe = () => {
    const plan = passes.find((p) => p.id === selectedPlan);
    if (!plan) return;
    Alert.alert('Subscribe', `Subscribe to ${plan.name} for ${plan.price}/${plan.period}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Subscribe', onPress: () => Alert.alert('Success', `Subscribed to ${plan.name}!`) },
    ]);
  };

  if (isLoading)
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#1A0A0A' : '#ffffff' }]}>
        <LoadingState text="Loading passes..." />
      </SafeAreaView>
    );
  if (error)
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#1A0A0A' : '#ffffff' }]}>
        <ErrorState description={error} onRetry={() => passesQuery.refetch()} />
      </SafeAreaView>
    );
  if (!passes.length)
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#1A0A0A' : '#ffffff' }]}>
        <EmptyState
          icon="🎟️"
          title="No passes"
          description="Cinema passes will be available soon"
        />
      </SafeAreaView>
    );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#1A0A0A' : '#ffffff' }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: isDark ? '#ffffff' : '#1A0A0A' }]}>
          Cinema Passes
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroBanner}>
          <Text style={styles.heroEmoji}>🎟️</Text>
          <Text style={[styles.heroTitle, { color: isDark ? '#fff' : '#000' }]}>Cinema Plus</Text>
          <Text style={styles.heroSubtitle}>Unlimited movies with a Cinema Plus pass</Text>
        </View>

        {passes.map((pass) => (
          <TouchableOpacity
            key={pass.id}
            style={[
              styles.planCard,
              { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' },
              selectedPlan === pass.id && styles.planCardSelected,
              pass.popular && styles.planCardPopular,
            ]}
            onPress={() => setSelectedPlan(pass.id)}
          >
            {pass.popular && (
              <View style={styles.popularBadge}>
                <Text style={styles.popularText}>MOST POPULAR</Text>
              </View>
            )}
            <View style={styles.planHeader}>
              <Text style={styles.planEmoji}>{pass.emoji}</Text>
              <View style={styles.planInfo}>
                <Text style={[styles.planName, { color: isDark ? '#fff' : '#000' }]}>
                  {pass.name}
                </Text>
                <View style={styles.priceRow}>
                  <Text style={styles.planPrice}>{pass.price}</Text>
                  <Text style={styles.planPeriod}>/{pass.period}</Text>
                </View>
              </View>
              {selectedPlan === pass.id && (
                <View style={styles.selectedCheck}>
                  <Text style={styles.checkmark}>✓</Text>
                </View>
              )}
            </View>
            <View style={styles.featuresList}>
              {pass.features.map((feature, i) => (
                <Text key={i} style={styles.featureText}>
                  ✓ {feature}
                </Text>
              ))}
            </View>
          </TouchableOpacity>
        ))}

        {selectedPlan && (
          <TouchableOpacity style={styles.subscribeButton} onPress={handleSubscribe}>
            <Text style={styles.subscribeText}>Subscribe Now</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.termsText}>
          Cancel anytime. By subscribing you agree to our Terms of Service.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingTop: 50, gap: 12 },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { color: '#fff', fontSize: 20 },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  content: { padding: 16, paddingBottom: 30 },
  heroBanner: { alignItems: 'center', padding: 24, marginBottom: 20 },
  heroEmoji: { fontSize: 60, marginBottom: 12 },
  heroTitle: { fontSize: 28, fontWeight: '700', marginBottom: 6 },
  heroSubtitle: { color: '#888', fontSize: 14, textAlign: 'center' },
  planCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 14,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  planCardSelected: { borderColor: '#FFEAA7' },
  planCardPopular: { borderColor: '#FFEAA7' },
  popularBadge: {
    position: 'absolute',
    top: -10,
    alignSelf: 'center',
    backgroundColor: '#FFEAA7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
  },
  popularText: { color: '#000', fontSize: 10, fontWeight: '700' },
  planHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  planEmoji: { fontSize: 36, marginRight: 14 },
  planInfo: { flex: 1 },
  planName: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline' },
  planPrice: { color: '#FFEAA7', fontSize: 24, fontWeight: '700' },
  planPeriod: { color: '#888', fontSize: 14 },
  selectedCheck: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFEAA7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: { color: '#000', fontWeight: '700', fontSize: 16 },
  featuresList: { gap: 6 },
  featureText: { color: '#ccc', fontSize: 14 },
  subscribeButton: {
    backgroundColor: '#FFEAA7',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  subscribeText: { color: '#000', fontSize: 16, fontWeight: '700' },
  termsText: { color: '#888', fontSize: 12, textAlign: 'center' },
});
