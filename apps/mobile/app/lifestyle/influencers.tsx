import { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { colors } from '../../src/theme';
import { LoadingState, EmptyState, ErrorState } from '../../src/components/StateContainers';
import { lifestyleApi, Influencer } from '@azeebo/react-data/api/lifestyle';

export default function InfluencersScreen() {
  const router = useRouter();

  const influencersQuery = useQuery({
    queryKey: ['lifestyle', 'influencers'],
    queryFn: async () => {
      const res = await lifestyleApi.getInfluencers();
      return Array.isArray(res) ? res : (res?.data ?? []);
    },
    staleTime: 60_000,
  });

  const featuredQuery = useQuery({
    queryKey: ['lifestyle', 'influencers', 'featured'],
    queryFn: async () => {
      const res = await lifestyleApi.getFeaturedInfluencers();
      return Array.isArray(res) ? res : (res?.data ?? []);
    },
    staleTime: 60_000,
  });

  const influencers = influencersQuery.data ?? [];
  const featured = featuredQuery.data ?? [];
  const isLoading = influencersQuery.isLoading || featuredQuery.isLoading;
  const error = influencersQuery.error?.message || featuredQuery.error?.message;

  const handleRefresh = useCallback(() => {
    influencersQuery.refetch();
    featuredQuery.refetch();
  }, [influencersQuery, featuredQuery]);

  const renderInfluencer = ({ item }: { item: Influencer }) => (
    <TouchableOpacity
      style={[styles.influencerCard, { backgroundColor: colors.bg.tertiary }]}
      onPress={() => router.push(`/lifestyle/influencer-detail?id=${item.id}`)}
      activeOpacity={0.7}
    >
      <Image
        source={{
          uri:
            item.photo ||
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80',
        }}
        style={styles.influencerPhoto}
        resizeMode="cover"
      />
      <View style={styles.influencerInfo}>
        <Text style={[styles.influencerName, { color: colors.text.primary }]} numberOfLines={1}>
          {item.name}
        </Text>
        <Text
          style={[styles.influencerProfession, { color: colors.text.secondary }]}
          numberOfLines={1}
        >
          {item.profession}
        </Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.text.primary }]}>
              {formatCount(item.followerCount)}
            </Text>
            <Text style={[styles.statLabel, { color: colors.text.secondary }]}>Followers</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.text.primary }]}>
              {item.collaborationCount}
            </Text>
            <Text style={[styles.statLabel, { color: colors.text.secondary }]}>Collabs</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderFeatured = ({ item }: { item: Influencer }) => (
    <TouchableOpacity
      style={[styles.featuredCard, { backgroundColor: colors.bg.tertiary }]}
      onPress={() => router.push(`/lifestyle/influencer-detail?id=${item.id}`)}
      activeOpacity={0.7}
    >
      <Image
        source={{
          uri:
            item.photo ||
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&h=280&q=80',
        }}
        style={styles.featuredImage}
        resizeMode="cover"
      />
      <View style={styles.featuredOverlay} />
      <View style={styles.featuredInfo}>
        <Text style={[styles.featuredName, { color: colors.text.primary }]} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={[styles.featuredProfession, { color: colors.text.secondary }]}>
          {item.profession}
        </Text>
        <View style={styles.featuredFollowers}>
          <Text style={styles.featuredFollowersIcon}>👥</Text>
          <Text style={styles.featuredFollowersText}>{formatCount(item.followerCount)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView accessibilityLabel="Influencers Screen" style={styles.container}>
      <View style={[styles.container, { backgroundColor: colors.bg.primary }]}>
        <View style={styles.header}>
          <TouchableOpacity accessibilityRole="button" style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Influencers</Text>
          <View style={styles.backButton} />
        </View>

        {isLoading && <LoadingState text="Loading influencers..." />}
        {error && <ErrorState description={error} onRetry={handleRefresh} />}
        {!isLoading && !error && influencers.length === 0 && (
          <EmptyState
            icon="🌟"
            title="No influencers found"
            description="Check back later for featured influencers"
          />
        )}

        {!isLoading && !error && influencers.length > 0 && (
          <FlatList
            data={[]}
            renderItem={() => null}
            ListHeaderComponent={
              <>
                {featured.length > 0 && (
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                        🌟 Featured Influencers
                      </Text>
                    </View>
                    <FlatList
                      data={featured}
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.featuredScroll}
                      keyExtractor={(item) => item.id}
                      renderItem={renderFeatured}
                    />
                  </View>
                )}

                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                      All Influencers
                    </Text>
                  </View>
                  <View style={styles.influencersGrid}>
                    {influencers.map((influencer) => (
                      <View key={influencer.id}>{renderInfluencer({ item: influencer })}</View>
                    ))}
                  </View>
                </View>
              </>
            }
            refreshControl={
              <RefreshControl
                refreshing={influencersQuery.isRefetching || featuredQuery.isRefetching}
                onRefresh={handleRefresh}
              />
            }
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

function formatCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return count.toString();
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bg.tertiary,
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
  listContent: {
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  featuredScroll: {
    paddingHorizontal: 16,
    gap: 16,
  },
  featuredCard: {
    width: 180,
    height: 260,
    borderRadius: 16,
    overflow: 'hidden',
  },
  featuredImage: {
    width: '100%',
    height: '100%',
  },
  featuredOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  featuredInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  featuredName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  featuredProfession: {
    fontSize: 12,
    marginBottom: 8,
  },
  featuredFollowers: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  featuredFollowersIcon: {
    fontSize: 12,
  },
  featuredFollowersText: {
    color: colors.text.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  influencersGrid: {
    paddingHorizontal: 16,
    gap: 12,
  },
  influencerCard: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  influencerPhoto: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  influencerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  influencerName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  influencerProfession: {
    fontSize: 13,
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border.subtle,
  },
});
