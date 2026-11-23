import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { bundleApi, type BundlePass } from '@azeebo/react-data/api/bundle';
import { FocusableButton, FocusableCard } from '../src/components/Focusable';
import { LoadingState } from '../src/components/StateContainers';
import { colors, tvTypography, tvSpacing } from '../src/theme';

export default function TVBundlesScreen() {
  const router = useRouter();
  const [bundles, setBundles] = useState<BundlePass[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadBundles = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await bundleApi.getBundles();
      if (res.success && Array.isArray(res.data)) {
        setBundles(res.data);
      }
    } catch {
      // Handled
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBundles();
  }, [loadBundles]);

  if (isLoading && bundles.length === 0) {
    return <LoadingState text="Loading Azeebo+ Bundle Passes..." />;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.topBar}>
        <FocusableButton
          title="← Back to Home"
          variant="secondary"
          onPress={() => router.push('/' as Href)}
          hasTVPreferredFocus
        />
        <View style={styles.badge}>
          <Text style={styles.badgeText}>🎟️ ALL-ACCESS MULTI-PASS</Text>
        </View>
      </View>

      <View style={styles.heroSection}>
        <Text style={styles.title}>Universe Bundle Passes</Text>
        <Text style={styles.subtitle}>
          Save up to 40% when bundling multiple entertainment universes. Activate directly with your
          linked Azeebo account.
        </Text>
      </View>

      <View style={styles.bundlesGrid}>
        {bundles.map((b) => (
          <FocusableCard
            key={b.id}
            style={styles.bundleCard}
            onPress={() => router.push('/auth/device-link' as Href)}
          >
            <View style={styles.tierBadge}>
              <Text style={styles.tierText}>{b.tier.toUpperCase()}</Text>
            </View>
            <Text style={styles.bundleName}>{b.name}</Text>
            <Text style={styles.bundleDesc} numberOfLines={2}>
              {b.description}
            </Text>
            <View style={styles.priceRow}>
              <Text style={styles.price}>₦{Number(b.price).toLocaleString()}</Text>
              <Text style={styles.period}>/month</Text>
            </View>
            {b.originalPrice > b.price && (
              <Text style={styles.discountText}>
                Save {b.discountPercent}% off individual universes
              </Text>
            )}
            <View style={styles.actionPrompt}>
              <Text style={styles.actionPromptText}>Press Select to Scan QR & Activate</Text>
            </View>
          </FocusableCard>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  content: {
    padding: tvSpacing.xxl,
    paddingBottom: tvSpacing.section,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tvSpacing.xl,
  },
  badge: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  badgeText: {
    color: '#3B82F6',
    fontSize: tvTypography.fontSize.base,
    fontWeight: '800',
  },
  heroSection: {
    marginBottom: tvSpacing.xl,
  },
  title: {
    fontSize: tvTypography.fontSize.xxl,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: tvSpacing.sm,
  },
  subtitle: {
    fontSize: tvTypography.fontSize.xl,
    color: colors.text.secondary,
    maxWidth: 900,
  },
  bundlesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tvSpacing.lg,
  },
  bundleCard: {
    width: '48%',
    backgroundColor: colors.bg.secondary,
    borderRadius: 16,
    padding: tvSpacing.xl,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  tierBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary[500],
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 12,
  },
  tierText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  bundleName: {
    color: colors.text.primary,
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 6,
  },
  bundleDesc: {
    color: colors.text.secondary,
    fontSize: tvTypography.fontSize.base,
    lineHeight: 22,
    marginBottom: 16,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  price: {
    color: colors.primary[500],
    fontSize: 32,
    fontWeight: '900',
  },
  period: {
    color: colors.text.secondary,
    fontSize: 16,
    marginLeft: 6,
  },
  discountText: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 16,
  },
  actionPrompt: {
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
    paddingTop: 12,
  },
  actionPromptText: {
    color: colors.text.secondary,
    fontSize: 13,
    fontWeight: '600',
  },
});
