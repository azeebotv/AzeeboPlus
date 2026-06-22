import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { LoadingState, EmptyState, ErrorState } from '../src/components/StateContainers';
import { apiClient } from '../src/api/client';

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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [featuredSeries, setFeaturedSeries] = useState<FeaturedSeries[]>([]);
  const [verticalContent, setVerticalContent] = useState<VerticalItem[]>([]);
  const [genres, setGenres] = useState<GenreItem[]>([]);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [seriesRes, contentRes, genresRes] = await Promise.all([
        apiClient.get<any>('/v1/vertical/featured'),
        apiClient.get<any>('/v1/vertical/series'),
        apiClient.get<any>('/v1/vertical/genres'),
      ]);
      setFeaturedSeries(Array.isArray(seriesRes) ? seriesRes : (seriesRes?.data ?? []));
      setVerticalContent(Array.isArray(contentRes) ? contentRes : (contentRes?.data ?? []));
      setGenres(Array.isArray(genresRes) ? genresRes : (genresRes?.data ?? []));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (isLoading) return <LoadingState text="Loading vertical series..." />;
  if (error) return <ErrorState description={error} onRetry={fetchData} />;
  if (!featuredSeries.length && !verticalContent.length) {
    return (
      <EmptyState
        icon="🏰"
        title="No series available"
        description="Check back later for vertical content"
      />
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: isDark ? '#0a0a0a' : '#ffffff' }]}>
      <View style={styles.header}>
        <Text style={styles.universeLabel}>🏰 Vertical</Text>
        <Text style={[styles.headerTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
          Vertical Universe
        </Text>
        <Text style={styles.headerSubtitle}>Premium series in vertical format</Text>
      </View>

      <View style={styles.genreScroll}>
        {genres.map((genre) => (
          <TouchableOpacity key={genre.id} style={styles.genreChip}>
            <Text style={styles.genreEmoji}>{genre.emoji}</Text>
            <Text style={styles.genreName}>{genre.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
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
                <TouchableOpacity style={styles.watchButton}>
                  <Text style={styles.watchButtonText}>Watch</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
        />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
            Nigerian Series
          </Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.verticalGrid}>
          {verticalContent.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.verticalCard, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}
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
            <Text style={styles.passSubtitle}>Access all Nigerian series from ₦2,000/month</Text>
            <TouchableOpacity style={styles.passButton}>
              <Text style={styles.passButtonText}>Get Pass</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/(tabs)/home')}>
          <Text style={styles.navIcon}>🏠</Text>
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/(tabs)/watch')}>
          <Text style={styles.navIcon}>📺</Text>
          <Text style={styles.navLabel}>Watch</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/(tabs)/create')}>
          <Text style={styles.navIcon}>✨</Text>
          <Text style={styles.navLabel}>Create</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/(tabs)/rewards')}>
          <Text style={styles.navIcon}>⭐</Text>
          <Text style={styles.navLabel}>Rewards</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/(tabs)/profile')}>
          <Text style={styles.navIcon}>👤</Text>
          <Text style={styles.navLabel}>Profile</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
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
    color: '#96CEB4',
    fontWeight: '600',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: '#888',
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
    color: '#96CEB4',
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
    backgroundColor: '#2a2a2a',
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
    color: '#FFEAA7',
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
    color: '#888',
    fontSize: 12,
    marginBottom: 10,
  },
  watchButton: {
    backgroundColor: '#96CEB4',
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
    backgroundColor: '#2a2a2a',
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
    color: '#96CEB4',
    fontSize: 12,
    fontWeight: '500',
  },
  verticalRating: {
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ratingSmall: {
    color: '#FFEAA7',
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
    borderColor: '#96CEB4',
  },
  passContent: {
    alignItems: 'center',
  },
  passTitle: {
    color: '#96CEB4',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  passSubtitle: {
    color: '#888',
    fontSize: 14,
    marginBottom: 16,
  },
  passButton: {
    backgroundColor: '#96CEB4',
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
