import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bundleApi } from '@azeebo/react-data/api/bundle';
import { LoadingState, ErrorState } from '../../src/components/StateContainers';
import { colors } from '../../src/theme';

const UNIVERSE_NAMES: Record<string, string> = {
  reality: 'Reality',
  comedy: 'Comedy',
  movies: 'Movies',
  creator: 'Creator',
  lifestyle: 'Lifestyle',
  sports: 'Sports',
  games: 'Games',
  vertical: 'Vertical',
};

export default function BundleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const isDark = colorScheme === 'dark';

  const [paymentMethod, setPaymentMethod] = useState<'external' | 'wallet'>('wallet');

  const safeId = id ?? '';
  const bundleQuery = useQuery({
    queryKey: ['bundle', safeId],
    queryFn: async () => {
      const res = await bundleApi.getBundleById(safeId);
      if (res.success && res.data) return res.data;
      throw new Error(res.message || 'Failed to load bundle');
    },
    enabled: !!safeId,
  });

  const subscribeMutation = useMutation({
    mutationFn: async () => {
      const res = await bundleApi.subscribe(safeId, { paymentMethod });
      if (res.success && res.data) return res.data;
      throw new Error(res.message || 'Subscription failed');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bundle'] });
      router.back();
    },
  });

  const bundle = bundleQuery.data;
  const isLoading = bundleQuery.isLoading;
  const error = bundleQuery.error?.message;
  const styles = createStyles(isDark);

  if (isLoading) return <LoadingState text="Loading bundle..." />;

  if (error || !bundle) {
    return (
      <ErrorState
        title="Bundle not found"
        description={error || 'This bundle does not exist.'}
        actionLabel="Go Back"
        onRetry={() => router.back()}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity accessibilityRole="button" onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>{'\u2190'} Back</Text>
        </TouchableOpacity>

        <View style={styles.card}>
          <View style={styles.tierRow}>
            <View
              style={[
                styles.tierBadge,
                {
                  backgroundColor:
                    bundle.tier === 'ultimate'
                      ? '#F59E0B'
                      : bundle.tier === 'premium'
                        ? '#8B5CF6'
                        : '#3B82F6',
                },
              ]}
            >
              <Text style={styles.tierText}>{bundle.tier.toUpperCase()}</Text>
            </View>
          </View>

          <Text style={styles.name}>{bundle.name}</Text>
          <Text style={styles.description}>{bundle.description}</Text>

          <View style={styles.priceSection}>
            <View style={styles.priceRow}>
              <Text style={styles.price}>₦{Number(bundle.price).toLocaleString()}</Text>
              <Text style={styles.period}>/mo</Text>
            </View>
            <View style={styles.discountRow}>
              <Text style={styles.originalPrice}>
                ₦{Number(bundle.originalPrice).toLocaleString()}/mo
              </Text>
              <Text style={styles.discount}>{bundle.discountPercent}% off</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Included Universes</Text>
          <View style={styles.universeList}>
            {bundle.universeIds.map((uid) => (
              <View key={uid} style={styles.universeChip}>
                <Text style={styles.universeText}>{UNIVERSE_NAMES[uid] || uid}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Payment Method</Text>
          <View style={styles.paymentRow}>
            {(['wallet', 'external'] as const).map((method) => (
              <TouchableOpacity
                key={method}
                onPress={() => setPaymentMethod(method)}
                style={[styles.paymentChip, paymentMethod === method && styles.paymentChipActive]}
              >
                <Text
                  style={[styles.paymentText, paymentMethod === method && styles.paymentTextActive]}
                >
                  {method === 'wallet' ? 'Wallet' : 'Card'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            onPress={() => subscribeMutation.mutate()}
            disabled={subscribeMutation.isPending}
            style={[
              styles.subscribeBtn,
              subscribeMutation.isPending && styles.subscribeBtnDisabled,
            ]}
          >
            <Text style={styles.subscribeText}>
              {subscribeMutation.isPending ? 'Processing...' : 'Subscribe Now'}
            </Text>
          </TouchableOpacity>

          {subscribeMutation.isError && (
            <Text style={styles.errorText}>{(subscribeMutation.error as Error).message}</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(isDark: boolean) {
  const bg = isDark ? '#030712' : '#F9FAFB';
  const cardBg = isDark ? '#111827' : '#FFFFFF';
  const text = isDark ? '#FFFFFF' : '#111827';
  const subtext = isDark ? '#9CA3AF' : '#6B7280';
  const border = isDark ? '#1F2937' : '#E5E7EB';

  return StyleSheet.create({
    container: { flex: 1, backgroundColor: bg },
    scroll: { padding: 16, paddingBottom: 40 },
    backBtn: { marginBottom: 16 },
    backText: { color: colors.category.blue, fontSize: 15 },
    card: {
      backgroundColor: cardBg,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: border,
      padding: 20,
    },
    tierRow: { flexDirection: 'row', marginBottom: 12 },
    tierBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
    tierText: { fontSize: 11, fontWeight: '700', color: '#FFFFFF' },
    name: { fontSize: 24, fontWeight: '700', color: text, marginBottom: 4 },
    description: { fontSize: 14, color: subtext, marginBottom: 16 },
    priceSection: { marginBottom: 20 },
    priceRow: { flexDirection: 'row', alignItems: 'baseline' },
    price: { fontSize: 36, fontWeight: '700', color: '#06B6D4' },
    period: { fontSize: 14, color: subtext, marginLeft: 4 },
    discountRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
    originalPrice: { fontSize: 14, color: subtext, textDecorationLine: 'line-through' },
    discount: { fontSize: 14, fontWeight: '700', color: '#10B981' },
    sectionTitle: { fontSize: 15, fontWeight: '600', color: text, marginBottom: 8, marginTop: 4 },
    universeList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
    universeChip: {
      backgroundColor: isDark ? '#1F2937' : '#F3F4F6',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
    },
    universeText: { fontSize: 13, color: subtext },
    paymentRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
    paymentChip: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: border,
    },
    paymentChipActive: { borderColor: '#06B6D4', backgroundColor: isDark ? '#083344' : '#ECFEFF' },
    paymentText: { fontSize: 14, color: subtext },
    paymentTextActive: { color: '#06B6D4', fontWeight: '600' },
    subscribeBtn: {
      backgroundColor: '#06B6D4',
      borderRadius: 10,
      paddingVertical: 14,
      alignItems: 'center',
    },
    subscribeBtnDisabled: { backgroundColor: colors.light[600] },
    subscribeText: { fontSize: 16, fontWeight: '700', color: '#000000' },
    errorText: { color: colors.error[400], fontSize: 13, marginTop: 8, textAlign: 'center' },
  });
}
