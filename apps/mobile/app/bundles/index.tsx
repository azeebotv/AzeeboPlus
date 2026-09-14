import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { bundleApi } from '../../src/api/bundle';
import type { BundlePass } from '../../src/api/bundle';
import { LoadingState, ErrorState, EmptyState } from '../../src/components/StateContainers';
import { colors } from '../../src/theme';

const TIER_COLORS: Record<string, string> = {
  standard: '#3B82F6',
  premium: '#8B5CF6',
  ultimate: '#F59E0B',
};

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

const BUNDLE_PRESETS: BundlePass[] = [
  {
    id: 'entertainment',
    name: 'Entertainment Bundle',
    description: 'Reality + Comedy + Movies',
    universeIds: ['reality', 'comedy', 'movies'],
    originalPrice: 3000,
    price: 2100,
    discountPercent: 30,
    duration: 30,
    tier: 'standard',
    isActive: true,
  },
  {
    id: 'creator-pack',
    name: 'Creator Pack',
    description: 'Creator + Lifestyle',
    universeIds: ['creator', 'lifestyle'],
    originalPrice: 2000,
    price: 1500,
    discountPercent: 25,
    duration: 30,
    tier: 'premium',
    isActive: true,
  },
  {
    id: 'all-access',
    name: 'All Access',
    description: 'All 8 universes',
    universeIds: [
      'reality',
      'comedy',
      'movies',
      'creator',
      'lifestyle',
      'sports',
      'games',
      'vertical',
    ],
    originalPrice: 8000,
    price: 4800,
    discountPercent: 40,
    duration: 30,
    tier: 'ultimate',
    isActive: true,
  },
  {
    id: 'sports-games',
    name: 'Sports & Games',
    description: 'Sports + Games',
    universeIds: ['sports', 'games'],
    originalPrice: 2000,
    price: 1400,
    discountPercent: 30,
    duration: 30,
    tier: 'standard',
    isActive: true,
  },
];

export default function BundlesScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const isDark = colorScheme === 'dark';
  const [selectedTier, setSelectedTier] = useState('all');

  const comparisonQuery = useQuery({
    queryKey: ['bundle-comparison'],
    queryFn: async () => {
      const res = await bundleApi.getBundleComparison();
      if (res.success && res.data) return res.data;
      throw new Error(res.message || 'Failed to load bundles');
    },
    staleTime: 300000,
  });

  const comparison = comparisonQuery.data;
  const apiBundles = comparison?.bundles ?? [];
  const displayBundles = apiBundles.length > 0 ? apiBundles : BUNDLE_PRESETS;
  const filteredBundles =
    selectedTier === 'all' ? displayBundles : displayBundles.filter((b) => b.tier === selectedTier);

  const tiers = ['all', 'standard', 'premium', 'ultimate'];
  const styles = createStyles(isDark);

  if (comparisonQuery.isLoading) {
    return <LoadingState text="Loading bundles..." />;
  }

  if (comparisonQuery.error) {
    return (
      <ErrorState
        title="Failed to load bundles"
        description={(comparisonQuery.error as Error).message}
        actionLabel="Retry"
        onRetry={() => comparisonQuery.refetch()}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Bundle Passes</Text>
        <Text style={styles.subtitle}>Save big with multi-universe bundles</Text>
      </View>

      {comparison && (
        <View style={styles.savingsBanner}>
          <Text style={styles.savingsText}>
            Save ₦{comparison.bundleSavings.toLocaleString()}/mo vs individual passes
          </Text>
        </View>
      )}

      <View style={styles.filterRow}>
        {tiers.map((tier) => (
          <TouchableOpacity
            key={tier}
            onPress={() => setSelectedTier(tier)}
            style={[styles.filterChip, selectedTier === tier && styles.filterChipActive]}
          >
            <Text
              style={[styles.filterChipText, selectedTier === tier && styles.filterChipTextActive]}
            >
              {tier === 'all' ? 'All' : tier.charAt(0).toUpperCase() + tier.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredBundles}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.list}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/bundles/${item.id}`)}
            activeOpacity={0.7}
          >
            <View
              style={[styles.tierBadge, { backgroundColor: TIER_COLORS[item.tier] || '#6B7280' }]}
            >
              <Text style={styles.tierText}>{item.tier.toUpperCase()}</Text>
            </View>
            <Text style={styles.cardName}>{item.name}</Text>
            <Text style={styles.cardDesc} numberOfLines={2}>
              {item.description}
            </Text>
            <View style={styles.priceRow}>
              <Text style={styles.price}>₦{Number(item.price).toLocaleString()}</Text>
              <Text style={styles.period}>/mo</Text>
            </View>
            <View style={styles.discountRow}>
              <Text style={styles.originalPrice}>
                ₦{Number(item.originalPrice).toLocaleString()}
              </Text>
              <Text style={styles.discount}>{item.discountPercent}% off</Text>
            </View>
            <View style={styles.universeTags}>
              {item.universeIds.slice(0, 3).map((uid) => (
                <View key={uid} style={styles.tag}>
                  <Text style={styles.tagText}>{UNIVERSE_NAMES[uid] || uid}</Text>
                </View>
              ))}
              {item.universeIds.length > 3 && (
                <Text style={styles.moreText}>+{item.universeIds.length - 3}</Text>
              )}
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<EmptyState icon="📦" title="No bundles found" />}
      />
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
    header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
    title: { fontSize: 28, fontWeight: '700', color: text },
    subtitle: { fontSize: 14, color: subtext, marginTop: 4 },
    savingsBanner: {
      backgroundColor: colors.success[800],
      marginHorizontal: 16,
      borderRadius: 8,
      padding: 10,
      marginBottom: 12,
    },
    savingsText: { color: '#34D399', fontSize: 13, fontWeight: '600', textAlign: 'center' },
    filterRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 12 },
    filterChip: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 20,
      backgroundColor: isDark ? '#1F2937' : '#E5E7EB',
    },
    filterChipActive: { backgroundColor: '#06B6D4' },
    filterChipText: { fontSize: 13, fontWeight: '500', color: subtext },
    filterChipTextActive: { color: '#000000' },
    list: { paddingHorizontal: 12, paddingBottom: 24 },
    row: { justifyContent: 'space-between' },
    card: {
      backgroundColor: cardBg,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: border,
      padding: 12,
      marginBottom: 12,
      width: '48%',
    },
    tierBadge: {
      alignSelf: 'flex-start',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 8,
      marginBottom: 8,
    },
    tierText: { fontSize: 10, fontWeight: '700', color: '#FFFFFF' },
    cardName: { fontSize: 15, fontWeight: '700', color: text, marginBottom: 2 },
    cardDesc: { fontSize: 12, color: subtext, marginBottom: 8 },
    priceRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 2 },
    price: { fontSize: 22, fontWeight: '700', color: '#06B6D4' },
    period: { fontSize: 12, color: subtext, marginLeft: 2 },
    discountRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
    originalPrice: { fontSize: 12, color: subtext, textDecorationLine: 'line-through' },
    discount: { fontSize: 12, fontWeight: '700', color: '#10B981' },
    universeTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
    tag: {
      backgroundColor: isDark ? '#1F2937' : '#F3F4F6',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    tagText: { fontSize: 10, color: subtext },
    moreText: { fontSize: 10, color: subtext, lineHeight: 20 },
  });
}
