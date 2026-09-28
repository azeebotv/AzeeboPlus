import { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { LoadingState, EmptyState, ErrorState } from '../../src/components/StateContainers';
import { apiClient } from '@azeebo/react-data/api/client';
import { comedySubscription } from '../../src/config/prices';
import { ApiResponse } from '@azeebo/react-data/types/api';
import { analytics } from '../../src/utils/analytics';
import { colors } from '../../src/theme';

type ListResponse<T> = T[] | ApiResponse<T[]>;

interface FeaturedSeries {
  id: string;
  title: string;
  season: string;
  rating: string;
  emoji: string;
}
interface VerticalItem {
  id: string;
  title: string;
  episodes: number;
  emoji: string;
}
interface GenreItem {
  id: string;
  name: string;
  emoji: string;
}

export default function VerticalUniverseHome() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const isDark = colorScheme === 'dark';

  const featuredQuery = useQuery({
    queryKey: ['vertical', 'featured'],
    queryFn: async () => {
      const res = await apiClient.get<ListResponse<FeaturedSeries>>('/v1/vertical/titles/featured');
      return Array.isArray(res) ? res : (res?.data ?? []);
    },
    staleTime: 60_000,
  });

  const seriesQuery = useQuery({
    queryKey: ['vertical', 'series'],
    queryFn: async () => {
      const res = await apiClient.get<ListResponse<VerticalItem>>('/v1/vertical/titles');
      return Array.isArray(res) ? res : (res?.data ?? []);
    },
    staleTime: 60_000,
  });

  const genresQuery = useQuery({
    queryKey: ['vertical', 'genres'],
    queryFn: async () => {
      // No genre catalog upstream; lore categories are the closest taxonomy.
      const res = await apiClient.get<ListResponse<GenreItem>>('/v1/vertical/lore/categories');
      return Array.isArray(res) ? res : (res?.data ?? []);
    },
    staleTime: 60_000,
  });

  const isLoading = featuredQuery.isLoading || seriesQuery.isLoading || genresQuery.isLoading;
  const error =
    featuredQuery.error?.message || seriesQuery.error?.message || genresQuery.error?.message;

  useEffect(() => {
    if (featuredQuery.isSuccess && !featuredQuery.isFetching) {
      analytics.verticalUniverseViewed('home');
    }
  }, [featuredQuery.isSuccess]);

  const featuredSeries = featuredQuery.data ?? [];
  const verticalContent = seriesQuery.data ?? [];
  const genres = genresQuery.data ?? [];

  if (isLoading)
    return (
      <SafeAreaView style={styles.container}>
        <LoadingState text="Loading vertical series..." />
      </SafeAreaView>
    );
  if (error)
    return (
      <SafeAreaView style={styles.container}>
        <ErrorState
          description={error}
          onRetry={() => {
            featuredQuery.refetch();
            seriesQuery.refetch();
            genresQuery.refetch();
          }}
        />
      </SafeAreaView>
    );
  if (!featuredSeries.length && !verticalContent.length) {
    return (
      <SafeAreaView style={styles.container}>
        <EmptyState
          icon="🏰"
          title="No series available"
          description="Check back later for vertical content"
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={[{ flex: 1 }, { backgroundColor: isDark ? '#1A0A0A' : '#ffffff' }]}>
        <View style={styles.header}>
          <Text style={styles.universeLabel}>🏰 Vertical</Text>
          <Text style={[styles.headerTitle, { color: isDark ? '#ffffff' : '#1A0A0A' }]}>
            Vertical Universe
          </Text>
          <Text style={styles.headerSubtitle}>Premium series in vertical format</Text>
        </View>

        <View style={styles.genreScroll}>
          {genres.map((genre) => (
            <TouchableOpacity
              key={genre.id}
              style={styles.genreChip}
              accessibilityLabel={`Filter by ${genre.name}`}
              accessibilityRole="button"
            >
              <Text style={styles.genreEmoji}>{genre.emoji}</Text>
              <Text style={styles.genreName}>{genre.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#1A0A0A' }]}>
            Featured Series
          </Text>
          <FlatList
            data={featuredSeries}
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
                  <View style={styles.ratingBadge}>
                    <Text style={styles.ratingText}>⭐ {item.rating}</Text>
                  </View>
                </View>
                <View style={styles.featuredInfo}>
                  <Text style={[styles.featuredTitle, { color: isDark ? '#fff' : '#000' }]}>
                    {item.title}
                  </Text>
                  <Text style={styles.featuredSeason}>{item.season}</Text>
                  <TouchableOpacity
                    style={styles.watchButton}
                    accessibilityLabel={`Watch ${item.title}`}
                    accessibilityRole="button"
                  >
                    <Text style={styles.watchButtonText}>Watch</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#1A0A0A' }]}>
              Nigerian Series
            </Text>
            <TouchableOpacity
              accessibilityLabel="See all Nigerian series"
              accessibilityRole="button"
            >
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.verticalGrid}>
            {verticalContent.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.verticalCard, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}
                accessibilityLabel={`Watch ${item.title}`}
                accessibilityRole="button"
              >
                <View style={styles.verticalThumbnail}>
                  <Text style={styles.verticalEmoji}>{item.emoji}</Text>
                  <View style={styles.episodeBadge}>
                    <Text style={styles.episodeText}>{item.episodes} Episodes</Text>
                  </View>
                </View>
                <Text style={[styles.verticalTitle, { color: isDark ? '#fff' : '#000' }]}>
                  {item.title}
                </Text>
                <View style={styles.verticalMeta}>
                  <Text style={styles.verticalGenre}>Drama</Text>
                  <View style={styles.verticalRating}>
                    <Text style={styles.ratingSmall}>⭐ 4.5</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.passSection}>
          <View style={styles.passBanner}>
            <View style={styles.passContent}>
              <Text style={styles.passTitle}>🎬 Vertical Pass</Text>
              <Text style={styles.passSubtitle}>
                Access all Nigerian series from ₦{comedySubscription.monthly.toLocaleString()}/month
              </Text>
              <TouchableOpacity
                style={styles.passButton}
                accessibilityLabel="Get Vertical Pass"
                accessibilityRole="button"
              >
                <Text style={styles.passButtonText}>Get Pass</Text>
              </TouchableOpacity>
            </View>
          </View>
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
    color: colors.category.mint,
    fontWeight: '600',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: colors.text.secondary,
    fontSize: 14,
    marginTop: 4,
  },
  genreScroll: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 20,
    gap: 10,
  },
  genreChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
  },
  genreEmoji: {
    fontSize: 16,
  },
  genreName: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
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
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  seeAllText: {
    color: colors.category.mint,
    fontSize: 14,
    fontWeight: '600',
  },
  featuredList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  featuredCard: {
    width: 180,
    borderRadius: 12,
    overflow: 'hidden',
  },
  featuredImagePlaceholder: {
    height: 240,
    backgroundColor: colors.bg.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  featuredEmoji: {
    fontSize: 64,
  },
  ratingBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  ratingText: {
    color: colors.category.highlight,
    fontSize: 12,
    fontWeight: '600',
  },
  featuredInfo: {
    padding: 12,
  },
  featuredTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  featuredSeason: {
    color: colors.text.secondary,
    fontSize: 12,
    marginBottom: 10,
  },
  watchButton: {
    backgroundColor: colors.category.mint,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  watchButtonText: {
    color: '#000',
    fontSize: 13,
    fontWeight: '600',
  },
  verticalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  verticalCard: {
    width: '47%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  verticalThumbnail: {
    height: 200,
    backgroundColor: colors.bg.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  verticalEmoji: {
    fontSize: 56,
  },
  episodeBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  episodeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '500',
  },
  verticalTitle: {
    fontSize: 14,
    fontWeight: '600',
    padding: 10,
    paddingBottom: 4,
  },
  verticalMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  verticalGenre: {
    color: colors.category.mint,
    fontSize: 12,
    fontWeight: '500',
  },
  verticalRating: {
    backgroundColor: colors.bg.tertiary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ratingSmall: {
    color: colors.category.highlight,
    fontSize: 11,
  },
  passSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  passBanner: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.category.mint,
  },
  passContent: {
    alignItems: 'center',
  },
  passTitle: {
    color: colors.category.mint,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  passSubtitle: {
    color: colors.text.secondary,
    fontSize: 14,
    marginBottom: 16,
  },
  passButton: {
    backgroundColor: colors.category.mint,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  passButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingBottom: 30,
    backgroundColor: '#1a1a1a',
    borderTopWidth: 1,
    borderTopColor: colors.bg.tertiary,
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
    color: colors.text.secondary,
  },
});
