import { useState, useCallback } from 'react';
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
import { lifestyleApi, NightlifeVenue } from '../../src/api/lifestyle';

const CATEGORIES = ['All', 'Bars', 'Clubs', 'Lounges', 'Rooftops', 'Lounge'];

export default function NightlifeScreen() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('All');

  const venuesQuery = useQuery({
    queryKey: ['lifestyle', 'nightlife', selectedCategory],
    queryFn: async () => {
      const res = await lifestyleApi.getVenues(selectedCategory);
      return Array.isArray(res) ? res : (res?.data ?? []);
    },
    staleTime: 60_000,
  });

  const featuredQuery = useQuery({
    queryKey: ['lifestyle', 'nightlife', 'featured'],
    queryFn: async () => {
      const res = await lifestyleApi.getFeaturedVenues();
      return Array.isArray(res) ? res : (res?.data ?? []);
    },
    staleTime: 60_000,
  });

  const venues = venuesQuery.data ?? [];
  const featured = featuredQuery.data ?? [];
  const isLoading = venuesQuery.isLoading || featuredQuery.isLoading;
  const error = venuesQuery.error?.message || featuredQuery.error?.message;

  const handleRefresh = useCallback(() => {
    venuesQuery.refetch();
    featuredQuery.refetch();
  }, [venuesQuery, featuredQuery]);

  const renderVenue = ({ item }: { item: NightlifeVenue }) => (
    <TouchableOpacity
      style={[styles.venueCard, { backgroundColor: colors.bg.tertiary }]}
      activeOpacity={0.7}
    >
      <Image
        source={{
          uri: item.image || 'https://placehold.co/400x200/1a1a1a/ffffff?text=Venue',
        }}
        style={styles.venueImage}
        resizeMode="cover"
      />
      {item.featured && (
        <View style={styles.featuredBadge}>
          <Text style={styles.featuredBadgeText}>⭐ Featured</Text>
        </View>
      )}
      <View style={styles.venueInfo}>
        <View style={styles.venueHeader}>
          <Text style={[styles.venueName, { color: colors.text.primary }]} numberOfLines={1}>
            {item.name}
          </Text>
          <View style={styles.ratingBadge}>
            <Text style={styles.ratingIcon}>★</Text>
            <Text style={styles.ratingText}>{item.rating}</Text>
          </View>
        </View>
        <Text style={[styles.venueLocation, { color: colors.text.secondary }]} numberOfLines={1}>
          📍 {item.location}
        </Text>
        <View style={styles.venueMeta}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{item.category}</Text>
          </View>
          {item.priceRange && (
            <Text style={[styles.priceRange, { color: colors.text.secondary }]}>
              {item.priceRange}
            </Text>
          )}
        </View>
        {item.tags && item.tags.length > 0 && (
          <View style={styles.tags}>
            {item.tags.slice(0, 3).map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderFeatured = ({ item }: { item: NightlifeVenue }) => (
    <TouchableOpacity
      style={[styles.featuredCard, { backgroundColor: colors.bg.tertiary }]}
      activeOpacity={0.7}
    >
      <Image
        source={{
          uri: item.image || 'https://placehold.co/300x200/1a1a1a/ffffff?text=Venue',
        }}
        style={styles.featuredImage}
        resizeMode="cover"
      />
      <View style={styles.featuredOverlay} />
      <View style={styles.featuredInfo}>
        <Text style={[styles.featuredName, { color: colors.text.primary }]} numberOfLines={1}>
          {item.name}
        </Text>
        <View style={styles.featuredMeta}>
          <Text style={styles.featuredRating}>★ {item.rating}</Text>
          <Text style={styles.featuredCategory}>{item.category}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.container, { backgroundColor: colors.bg.primary }]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Nightlife</Text>
          <View style={styles.backButton} />
        </View>

        <FlatList
          data={CATEGORIES}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScroll}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.categoryChip, selectedCategory === item && styles.categoryChipActive]}
              onPress={() => setSelectedCategory(item)}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  selectedCategory === item && styles.categoryChipTextActive,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />

        {isLoading && <LoadingState text="Loading venues..." />}
        {error && <ErrorState description={error} onRetry={handleRefresh} />}
        {!isLoading && !error && venues.length === 0 && (
          <EmptyState
            icon="🌙"
            title="No venues found"
            description="Check back later for nightlife venues"
          />
        )}

        {!isLoading && !error && venues.length > 0 && (
          <FlatList
            data={[]}
            renderItem={() => null}
            ListHeaderComponent={
              <>
                {featured.length > 0 && (
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                        ⭐ Featured Venues
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
                      All Venues
                    </Text>
                  </View>
                  <View style={styles.venuesList}>
                    {venues.map((venue) => (
                      <View key={venue.id}>{renderVenue({ item: venue })}</View>
                    ))}
                  </View>
                </View>
              </>
            }
            refreshControl={
              <RefreshControl
                refreshing={venuesQuery.isRefetching || featuredQuery.isRefetching}
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
  categoriesScroll: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.bg.tertiary,
  },
  categoryChipActive: {
    backgroundColor: colors.primary[500],
  },
  categoryChipText: {
    color: colors.text.secondary,
    fontSize: 14,
    fontWeight: '500',
  },
  categoryChipTextActive: {
    color: colors.text.primary,
    fontWeight: '600',
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
    width: 260,
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
  },
  featuredImage: {
    width: '100%',
    height: '100%',
  },
  featuredOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  featuredInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  featuredName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  featuredMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featuredRating: {
    color: colors.accent.gold,
    fontSize: 14,
    fontWeight: '600',
  },
  featuredCategory: {
    color: colors.text.secondary,
    fontSize: 12,
  },
  venuesList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  venueCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  venueImage: {
    width: '100%',
    height: 160,
  },
  featuredBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: colors.primary[500],
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  featuredBadgeText: {
    color: colors.text.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  venueInfo: {
    padding: 16,
  },
  venueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  venueName: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  ratingIcon: {
    color: colors.accent.gold,
    fontSize: 12,
  },
  ratingText: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  venueLocation: {
    fontSize: 13,
    marginBottom: 12,
  },
  venueMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryBadge: {
    backgroundColor: colors.bg.surface,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    color: colors.primary[500],
    fontSize: 12,
    fontWeight: '600',
  },
  priceRange: {
    fontSize: 13,
    fontWeight: '500',
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
  },
  tag: {
    backgroundColor: colors.bg.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    color: colors.text.secondary,
    fontSize: 11,
  },
});
