import { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { LoadingState, EmptyState, ErrorState } from '../src/components/StateContainers';
import { apiClient } from '../src/api/client';
import { ApiResponse } from '../src/types/api';
import { analytics } from '../src/utils/analytics';

type ListResponse<T> = T[] | ApiResponse<T[]>;

interface FeaturedItem {
  id: string;
  title: string;
  category: string;
  duration: string;
  emoji: string;
}
interface TrendingItem {
  id: string;
  title: string;
  views: string;
  emoji: string;
}
interface CategoryItem {
  id: string;
  name: string;
  emoji: string;
  count: number;
}
interface CreatorItem {
  id: string;
  name: string;
  followers: string;
  avatar: string;
}

export default function LifestyleUniverseHome() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const isDark = colorScheme === 'dark';

  const featuredQuery = useQuery({
    queryKey: ['lifestyle', 'featured'],
    queryFn: async () => {
      const res = await apiClient.get<ListResponse<FeaturedItem>>('/v1/lifestyle/featured');
      return Array.isArray(res) ? res : (res?.data ?? []);
    },
    staleTime: 60_000,
  });

  const trendingQuery = useQuery({
    queryKey: ['lifestyle', 'trending'],
    queryFn: async () => {
      const res = await apiClient.get<ListResponse<TrendingItem>>('/v1/lifestyle/trending');
      return Array.isArray(res) ? res : (res?.data ?? []);
    },
    staleTime: 60_000,
  });

  const categoriesQuery = useQuery({
    queryKey: ['lifestyle', 'categories'],
    queryFn: async () => {
      const res = await apiClient.get<ListResponse<CategoryItem>>('/v1/lifestyle/categories');
      return Array.isArray(res) ? res : (res?.data ?? []);
    },
    staleTime: 60_000,
  });

  const creatorsQuery = useQuery({
    queryKey: ['lifestyle', 'creators'],
    queryFn: async () => {
      const res = await apiClient.get<ListResponse<CreatorItem>>('/v1/lifestyle/creators');
      return Array.isArray(res) ? res : (res?.data ?? []);
    },
    staleTime: 60_000,
  });

  const isLoading =
    featuredQuery.isLoading ||
    trendingQuery.isLoading ||
    categoriesQuery.isLoading ||
    creatorsQuery.isLoading;
  const error =
    featuredQuery.error?.message ||
    trendingQuery.error?.message ||
    categoriesQuery.error?.message ||
    creatorsQuery.error?.message;

  useEffect(() => {
    if (featuredQuery.isSuccess && !featuredQuery.isFetching) {
              analytics.lifestyleFeedViewed();
    }
  }, [featuredQuery.isSuccess]);

  const featuredContent = featuredQuery.data ?? [];
  const trendingNow = trendingQuery.data ?? [];
  const categories = categoriesQuery.data ?? [];
  const creatorsToFollow = creatorsQuery.data ?? [];

  if (isLoading)
    return (
      <SafeAreaView style={styles.container}>
        <LoadingState text="Loading lifestyle content..." />
      </SafeAreaView>
    );
  if (error)
    return (
      <SafeAreaView style={styles.container}>
        <ErrorState
          description={error}
          onRetry={() => {
            featuredQuery.refetch();
            trendingQuery.refetch();
            categoriesQuery.refetch();
            creatorsQuery.refetch();
          }}
        />
      </SafeAreaView>
    );
  if (!featuredContent.length && !trendingNow.length) {
    return (
      <SafeAreaView style={styles.container}>
        <EmptyState
          icon="✨"
          title="No content available"
          description="Check back later for lifestyle stories"
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={[{ flex: 1 }, { backgroundColor: isDark ? '#1A0A0A' : '#ffffff' }]}>
        <View style={styles.header}>
          <Text style={styles.universeLabel}>✨ Lifestyle</Text>
          <Text style={[styles.headerTitle, { color: isDark ? '#ffffff' : '#1A0A0A' }]}>
            Lifestyle Universe
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScroll}
        >
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={styles.categoryChip}
              accessibilityLabel={`Filter by ${cat.name}`}
              accessibilityRole="button"
            >
              <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
              <Text style={styles.categoryName}>{cat.name}</Text>
              <Text style={styles.categoryCount}>{cat.count}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#1A0A0A' }]}>
              Featured
            </Text>
          </View>
          <FlatList
            data={featuredContent}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featuredList}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.featuredCard, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}
                accessibilityLabel={`Watch ${item.title}`}
                accessibilityRole="button"
              >
                <View style={styles.featuredImagePlaceholder}>
                  <Text style={styles.featuredEmoji}>{item.emoji}</Text>
                  <View style={styles.durationBadge}>
                    <Text style={styles.durationText}>{item.duration}</Text>
                  </View>
                </View>
                <View style={styles.featuredInfo}>
                  <Text style={styles.featuredCategory}>{item.category}</Text>
                  <Text
                    style={[styles.featuredTitle, { color: isDark ? '#fff' : '#000' }]}
                    numberOfLines={2}
                  >
                    {item.title}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#1A0A0A' }]}>
              Trending Now
            </Text>
            <TouchableOpacity accessibilityLabel="See all trending" accessibilityRole="button">
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.trendingList}>
            {trendingNow.map((item, index) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.trendingItem, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}
                accessibilityLabel={`${item.title}, trending`}
                accessibilityRole="button"
              >
                <View style={styles.trendingRank}>
                  <Text style={styles.rankNumber}>{index + 1}</Text>
                </View>
                <View style={styles.trendingThumbnail}>
                  <Text style={styles.trendingEmoji}>{item.emoji}</Text>
                </View>
                <View style={styles.trendingInfo}>
                  <Text
                    style={[styles.trendingTitle, { color: isDark ? '#fff' : '#000' }]}
                    numberOfLines={1}
                  >
                    {item.title}
                  </Text>
                  <Text style={styles.trendingViews}>👁️ {item.views}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#1A0A0A' }]}>
              Creators to Follow
            </Text>
          </View>
          <FlatList
            data={creatorsToFollow}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.creatorsList}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.creatorCard, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}
                accessibilityLabel={`View creator ${item.name}`}
                accessibilityRole="button"
              >
                <View style={styles.creatorAvatar}>
                  <Text style={styles.creatorAvatarEmoji}>{item.avatar}</Text>
                </View>
                <Text style={[styles.creatorName, { color: isDark ? '#fff' : '#000' }]}>
                  {item.name}
                </Text>
                <Text style={styles.creatorFollowers}>{item.followers}</Text>
                <TouchableOpacity
                  style={styles.followButton}
                  accessibilityLabel={`Follow ${item.name}`}
                  accessibilityRole="button"
                >
                  <Text style={styles.followButtonText}>Follow</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            )}
          />
        </View>

        <View style={styles.bottomNav}>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => router.push('/(tabs)/home')}
            accessibilityLabel="Go to Home"
            accessibilityRole="button"
          >
            <Text style={styles.navIcon}>🏠</Text>
            <Text style={styles.navLabel}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => router.push('/(tabs)/watch')}
            accessibilityLabel="Go to Watch"
            accessibilityRole="button"
          >
            <Text style={styles.navIcon}>📺</Text>
            <Text style={styles.navLabel}>Watch</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => router.push('/(tabs)/create')}
            accessibilityLabel="Go to Create"
            accessibilityRole="button"
          >
            <Text style={styles.navIcon}>✨</Text>
            <Text style={styles.navLabel}>Create</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => router.push('/(tabs)/rewards')}
            accessibilityLabel="Go to Rewards"
            accessibilityRole="button"
          >
            <Text style={styles.navIcon}>⭐</Text>
            <Text style={styles.navLabel}>Rewards</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => router.push('/(tabs)/profile')}
            accessibilityLabel="Go to Profile"
            accessibilityRole="button"
          >
            <Text style={styles.navIcon}>👤</Text>
            <Text style={styles.navLabel}>Profile</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingTop: 50,
  },
  universeLabel: {
    fontSize: 14,
    color: '#45B7D1',
    fontWeight: '600',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  categoriesScroll: {
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 20,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
  },
  categoryEmoji: {
    fontSize: 16,
  },
  categoryName: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
  },
  categoryCount: {
    color: '#888',
    fontSize: 11,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  seeAllText: {
    color: '#45B7D1',
    fontSize: 14,
    fontWeight: '600',
  },
  featuredList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  featuredCard: {
    width: 220,
    borderRadius: 12,
    overflow: 'hidden',
  },
  featuredImagePlaceholder: {
    height: 140,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  featuredEmoji: {
    fontSize: 48,
  },
  durationBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  durationText: {
    color: '#fff',
    fontSize: 11,
  },
  featuredInfo: {
    padding: 12,
  },
  featuredCategory: {
    color: '#45B7D1',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  featuredTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  trendingList: {
    paddingHorizontal: 16,
    gap: 10,
  },
  trendingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    gap: 12,
  },
  trendingRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#45B7D1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankNumber: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  trendingThumbnail: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendingEmoji: {
    fontSize: 24,
  },
  trendingInfo: {
    flex: 1,
  },
  trendingTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  trendingViews: {
    color: '#888',
    fontSize: 12,
  },
  creatorsList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  creatorCard: {
    width: 120,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginRight: 12,
  },
  creatorAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  creatorAvatarEmoji: {
    fontSize: 28,
  },
  creatorName: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  creatorFollowers: {
    color: '#888',
    fontSize: 11,
    marginBottom: 10,
  },
  followButton: {
    backgroundColor: '#45B7D1',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 6,
  },
  followButtonText: {
    color: '#000',
    fontSize: 11,
    fontWeight: '600',
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingBottom: 30,
    backgroundColor: '#1a1a1a',
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
  navItem: {
    alignItems: 'center',
  },
  navIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  navLabel: {
    fontSize: 11,
    color: '#888',
  },
});
