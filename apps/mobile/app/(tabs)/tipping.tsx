import React, { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { creatorApi } from '../../src/api/creator';
import { colors, spacing, typography, radius } from '../../src/theme';

const TIER_COLORS: Record<string, string> = {
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#FFD700',
  platinum: '#E5E4E2',
};

export default function TipsHistoryScreen() {
  const router = useRouter();
  const [page, setPage] = React.useState(1);

  const tipsQuery = useQuery({
    queryKey: ['my-tips', page],
    queryFn: () => creatorApi.getMyTips(page, 10),
  });

  const tips = tipsQuery.data?.data?.items ?? [];
  const totalTips = tipsQuery.data?.data?.total ?? 0;
  const totalPages = tipsQuery.data?.data?.totalPages ?? 1;

  const creatorIds = useMemo(() => Array.from(new Set(tips.map((t) => t.creatorId))), [tips]);

  const creatorsQuery = useQuery({
    queryKey: ['tip-creator-profiles', creatorIds],
    queryFn: async () => {
      const profiles = await Promise.all(
        creatorIds.map((id) => creatorApi.getCreatorProfile(id))
      );
      const map: Record<string, string> = {};
      profiles.forEach((res, idx) => {
        const id = creatorIds[idx];
        if (id && res.success && res.data) {
          map[id] = res.data.displayName || 'Unknown Creator';
        }
      });
      return map;
    },
    enabled: creatorIds.length > 0,
  });

  const creatorNames = creatorsQuery.data ?? {};

  const renderItem = ({ item }: { item: typeof tips[0] }) => (
    <TouchableOpacity
      style={styles.tipItem}
      onPress={() => router.push(`/creators/${item.creatorId}`)}
      activeOpacity={0.8}
    >
      <View style={styles.row}>
        <Text style={styles.creatorName}>{creatorNames[item.creatorId] || 'Creator'}</Text>
        <Text style={styles.amount}>₦{item.amount.toLocaleString()}</Text>
      </View>
      <View style={styles.metaRow}>
        {item.tier && (
          <View
            style={[
              styles.tierBadge,
              {
                backgroundColor: `${
                  TIER_COLORS[item.tier.toLowerCase()] ??
                  colors.text.muted
                }20`,
              }
            ]}
          >
            <Text
              style={[
                styles.tierText,
                {
                  color:
                    TIER_COLORS[item.tier.toLowerCase()] ??
                    colors.text.muted,
                },
              ]}
            >
              {item.tier.charAt(0).toUpperCase() + item.tier.slice(1)}
            </Text>
          </View>
        )}
        <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
      </View>
      {item.message ? <Text style={styles.message}>{item.message}</Text> : null}
    </TouchableOpacity>
  );

  const isLoading = tipsQuery.isLoading || (tipsQuery.isFetching && tipsQuery.isPending);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Tips</Text>
      <Text style={styles.subtitle}>{totalTips} tips sent</Text>

      {isLoading && tips.length === 0 ? (
        <ActivityIndicator style={styles.loader} color={colors.primary[500]} size="large" />
      ) : null}

      <FlatList
        data={tips}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No tips sent yet.</Text>
              <Text style={styles.emptySubtext}>Support your favorite creators to see them here.</Text>
            </View>
          ) : null
        }
      />

      {tipsQuery.isFetching && tips.length > 0 ? (
        <ActivityIndicator style={styles.inlineLoader} color={colors.primary[500]} />
      ) : null}

      {page < totalPages && !tipsQuery.isFetching ? (
        <TouchableOpacity style={styles.loadMore} onPress={() => setPage((p) => p + 1)}>
          <Text style={styles.loadMoreText}>Load More</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
    padding: spacing.lg,
    paddingTop: 60,
  },
  title: {
    color: colors.text.primary,
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
  },
  subtitle: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.md,
  },
  loader: {
    marginTop: 40,
  },
  list: {
    gap: spacing.md,
  },
  tipItem: {
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  creatorName: {
    color: colors.text.primary,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  amount: {
    color: colors.primary[500],
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  tierBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  tierText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
  date: {
    color: colors.text.tertiary,
    fontSize: typography.fontSize.xs,
  },
  message: {
    color: colors.text.tertiary,
    fontSize: typography.fontSize.sm,
    marginTop: spacing.sm,
  },
  empty: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
  },
  emptySubtext: {
    color: colors.text.tertiary,
    fontSize: typography.fontSize.sm,
    marginTop: spacing.xs,
  },
  inlineLoader: {
    marginVertical: spacing.md,
  },
  loadMore: {
    padding: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.lg,
    marginTop: spacing.sm,
  },
  loadMoreText: {
    color: colors.primary[500],
    fontWeight: typography.fontWeight.semibold,
    fontSize: typography.fontSize.base,
  },
});
