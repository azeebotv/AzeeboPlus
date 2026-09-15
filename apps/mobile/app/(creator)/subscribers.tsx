import { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { colors, radius } from '../../src/theme';
import { apiClient } from '@azeebo/react-data/api/client';
import { LoadingState, EmptyState, ErrorState } from '../../src/components/StateContainers';
import { analytics } from '../../src/utils/analytics';

interface Subscriber {
  id: string;
  name: string;
  avatar: string;
  plan: string;
  subscribedAt: string;
  totalPaid: number;
}

export default function SubscribersScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const isDark = colorScheme === 'dark';

  const subscribersQuery = useQuery({
    queryKey: ['creator', 'subscribers'],
    queryFn: async () => {
      const res = await apiClient.get<{ items: Subscriber[]; total: number }>(
        '/v1/creator/subscribers'
      );
      return res?.items ?? [];
    },
    staleTime: 60_000,
  });

  useEffect(() => {
    analytics.creatorEarningsViewed('all');
  }, []);

  const subscribers = subscribersQuery.data ?? [];

  const renderItem = ({ item }: { item: Subscriber }) => (
    <View style={[styles.card, { backgroundColor: isDark ? colors.bg.tertiary : '#f5f5f5' }]}>
      <View style={[styles.avatar, { backgroundColor: colors.primary[500] + '20' }]}>
        <Text style={styles.avatarText}>{item.name[0]}</Text>
      </View>
      <View style={styles.cardInfo}>
        <Text style={[styles.cardName, { color: colors.text.primary }]}>{item.name}</Text>
        <Text style={styles.cardMeta}>
          {item.plan} • Subscribed {new Date(item.subscribedAt).toLocaleDateString()}
        </Text>
      </View>
      <Text style={[styles.amount, { color: colors.primary[500] }]}>
        ₦{item.totalPaid.toLocaleString()}
      </Text>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: isDark ? colors.bg.primary : '#fff' }]}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Subscribers</Text>
        <View style={{ width: 40 }} />
      </View>

      {subscribersQuery.isLoading ? (
        <LoadingState text="Loading subscribers..." />
      ) : subscribersQuery.error ? (
        <ErrorState
          description={subscribersQuery.error.message}
          onRetry={() => subscribersQuery.refetch()}
        />
      ) : subscribers.length === 0 ? (
        <EmptyState
          icon="👥"
          title="No subscribers yet"
          description="Share your content to grow your audience"
        />
      ) : (
        <FlatList
          data={subscribers}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text style={[styles.count, { color: colors.text.secondary }]}>
              {subscribers.length} subscriber{subscribers.length !== 1 ? 's' : ''}
            </Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 40,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bg.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { color: colors.text.primary, fontSize: 20 },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  count: { fontSize: 14, marginBottom: 12 },
  list: { padding: 16, gap: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: radius.lg,
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '700', color: colors.primary[500] },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  cardMeta: { fontSize: 12, color: colors.text.tertiary },
  amount: { fontSize: 14, fontWeight: '700' },
});
