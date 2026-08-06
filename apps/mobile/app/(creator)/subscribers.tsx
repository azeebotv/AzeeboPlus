import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors } from '../../src/theme';
import { moderationApi, Subscriber, SubscriberStats } from '../../src/api/moderation';
import { LoadingState, ErrorState, EmptyState } from '../../src/components/StateContainers';
import { logger } from '../../src/utils/logger';

type Tab = 'list' | 'stats';

export default function SubscribersScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();

  const [tab, setTab] = useState<Tab>('list');
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [stats, setStats] = useState<SubscriberStats | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [subscribersRes, statsRes] = await Promise.all([
        moderationApi.getCreatorSubscribers(1, 20),
        moderationApi.getSubscriberStats(),
      ]);

      if (subscribersRes.success && subscribersRes.data) {
        setSubscribers(subscribersRes.data.subscribers || []);
        setTotalPages(Math.ceil((subscribersRes.data.stats?.totalSubscribers || 0) / 20));
      }

      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      }
    } catch (err) {
      logger.error('Failed to load subscriber data:', err);
      setError('Failed to load subscriber data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadMore = useCallback(async () => {
    if (page >= totalPages || loadingMore) return;
    try {
      setLoadingMore(true);
      const response = await moderationApi.getCreatorSubscribers(page + 1, 20);
      if (response.success && response.data) {
        setSubscribers((prev) => [...prev, ...(response.data!.subscribers || [])]);
        setPage((prev) => prev + 1);
      }
    } catch (err) {
      logger.error('Failed to load more subscribers:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [page, totalPages, loadingMore]);

  const renderStatCard = (label: string, value: string | number, change?: number) => (
    <View
      style={[
        styles.statCard,
        {
          backgroundColor: colorScheme === 'dark' ? colors.bg.secondary : colors.light[50],
        },
      ]}
    >
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {change !== undefined ? (
        <Text
          style={[
            styles.statChange,
            { color: change >= 0 ? colors.success[500] : colors.error[500] },
          ]}
        >
          {change >= 0 ? '+' : ''}
          {change}%
        </Text>
      ) : null}
    </View>
  );

  const renderStatsView = () => {
    if (!stats) return null;

    return (
      <FlatList
        data={[]}
        renderItem={() => null}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.statsContent}>
            <View style={styles.statsGrid}>
              {renderStatCard('Total', stats.totalSubscribers)}
              {renderStatCard('This Week', stats.newThisWeek)}
              {renderStatCard('This Month', stats.newThisMonth)}
              {renderStatCard('Churn', `${stats.churnRate}%`)}
            </View>

            <View
              style={[
                styles.demographicsCard,
                {
                  backgroundColor: colorScheme === 'dark' ? colors.bg.secondary : colors.light[50],
                },
              ]}
            >
              <Text
                style={[
                  styles.demographicsTitle,
                  { color: colorScheme === 'dark' ? colors.text.primary : colors.bg.primary },
                ]}
              >
                Age Groups
              </Text>
              {stats.demographics?.ageGroups?.map((group, index) => (
                <View key={index} style={styles.demographicRow}>
                  <Text style={styles.demographicLabel}>{group.range}</Text>
                  <View style={styles.demographicBar}>
                    <View style={[styles.demographicBarFill, { width: `${group.percentage}%` }]} />
                  </View>
                  <Text style={styles.demographicValue}>
                    {group.count} ({group.percentage}%)
                  </Text>
                </View>
              ))}
            </View>

            <View
              style={[
                styles.demographicsCard,
                {
                  backgroundColor: colorScheme === 'dark' ? colors.bg.secondary : colors.light[50],
                },
              ]}
            >
              <Text
                style={[
                  styles.demographicsTitle,
                  { color: colorScheme === 'dark' ? colors.text.primary : colors.bg.primary },
                ]}
              >
                Top Regions
              </Text>
              {stats.demographics?.topRegions?.map((region, index) => (
                <View key={index} style={styles.demographicRow}>
                  <Text style={styles.demographicLabel}>{region.region}</Text>
                  <View style={styles.demographicBar}>
                    <View style={[styles.demographicBarFill, { width: `${region.percentage}%` }]} />
                  </View>
                  <Text style={styles.demographicValue}>
                    {region.count} ({region.percentage}%)
                  </Text>
                </View>
              ))}
            </View>
          </View>
        }
      />
    );
  };

  const renderSubscriberItem = ({ item }: { item: Subscriber }) => (
    <View
      style={[
        styles.subscriberCard,
        {
          backgroundColor: colorScheme === 'dark' ? colors.bg.secondary : colors.light[50],
        },
      ]}
    >
      <View style={[styles.avatar, { backgroundColor: colors.primary[500] + '20' }]}>
        {item.avatar ? (
          <Text style={styles.avatarText}>{item.displayName.charAt(0)}</Text>
        ) : (
          <Text style={styles.avatarText}>{item.displayName.charAt(0)}</Text>
        )}
      </View>
      <View style={styles.subscriberInfo}>
        <Text
          style={[
            styles.subscriberName,
            { color: colorScheme === 'dark' ? colors.text.primary : colors.bg.primary },
          ]}
        >
          {item.displayName}
        </Text>
        <Text style={styles.subscriberDate}>
          Subscribed {new Date(item.subscribedAt).toLocaleDateString()}
        </Text>
      </View>
      {item.isGifted ? (
        <View style={styles.giftBadge}>
          <Text style={styles.giftBadgeText}>Gift</Text>
        </View>
      ) : null}
      {item.plan ? (
        <View style={styles.planBadge}>
          <Text style={styles.planBadgeText}>{item.plan}</Text>
        </View>
      ) : null}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: colorScheme === 'dark' ? colors.bg.primary : colors.text.primary },
        ]}
      >
        <LoadingState text="Loading subscribers..." />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: colorScheme === 'dark' ? colors.bg.primary : colors.text.primary },
        ]}
      >
        <ErrorState description={error} onRetry={loadData} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: colorScheme === 'dark' ? colors.bg.primary : colors.text.primary },
      ]}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text
          style={[
            styles.headerTitle,
            { color: colorScheme === 'dark' ? colors.text.primary : colors.bg.primary },
          ]}
        >
          Subscribers
        </Text>
        <View style={styles.backButton} />
      </View>

      <View style={styles.tabBar}>
        {(['list', 'stats'] as Tab[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[
              styles.tab,
              tab === t && styles.tabActive,
              {
                backgroundColor:
                  tab === t
                    ? colors.primary[500]
                    : colorScheme === 'dark'
                      ? colors.bg.secondary
                      : colors.light[100],
              },
            ]}
            onPress={() => setTab(t)}
          >
            <Text
              style={[
                styles.tabText,
                tab === t && styles.tabTextActive,
                {
                  color:
                    tab === t
                      ? colors.text.primary
                      : colorScheme === 'dark'
                        ? colors.text.secondary
                        : colors.dark[600],
                },
              ]}
            >
              {t === 'list' ? 'Subscriber List' : 'Demographics'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'list' ? (
        <FlatList
          data={subscribers}
          keyExtractor={(item) => item.id}
          renderItem={renderSubscriberItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            <EmptyState
              icon="👥"
              title="No subscribers yet"
              description="Share your content to attract subscribers."
            />
          }
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.loadingMore}>
                <Text style={styles.loadingMoreText}>Loading more...</Text>
              </View>
            ) : null
          }
        />
      ) : (
        renderStatsView()
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bg.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    color: colors.text.primary,
    fontSize: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: colors.primary[500],
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  tabTextActive: {
    color: colors.text.primary,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  subscriberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: colors.primary[500],
    fontSize: 18,
    fontWeight: '700',
  },
  subscriberInfo: {
    flex: 1,
  },
  subscriberName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  subscriberDate: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
  giftBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: colors.success[500] + '20',
    marginRight: 8,
  },
  giftBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.success[500],
  },
  planBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: colors.primary[500] + '20',
  },
  planBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary[500],
  },
  loadingMore: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  loadingMoreText: {
    color: colors.text.tertiary,
    fontSize: 14,
  },
  statsContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: '47%',
    padding: 16,
    borderRadius: 12,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: colors.text.tertiary,
    fontWeight: '500',
  },
  statChange: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  demographicsCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  demographicsTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 16,
  },
  demographicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  demographicLabel: {
    width: 80,
    fontSize: 13,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  demographicBar: {
    flex: 1,
    height: 8,
    backgroundColor: colors.bg.tertiary,
    borderRadius: 4,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  demographicBarFill: {
    height: '100%',
    backgroundColor: colors.primary[500],
    borderRadius: 4,
  },
  demographicValue: {
    width: 80,
    fontSize: 12,
    color: colors.text.tertiary,
    textAlign: 'right',
  },
});
