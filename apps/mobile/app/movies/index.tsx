import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LoadingState, EmptyState, ErrorState } from '../../src/components/StateContainers';
import { apiClient } from '../../src/api/client';
import { moviePassPrice, rentPrice } from '../../src/config/prices';
import type { Movie, SubscriptionPlan } from '../../src/types/api';
import { analytics } from '../../src/utils/analytics';

interface MovieItem {
  id: string;
  title: string;
  genre: string;
  rating: string;
  thumbnail?: string;
}
interface MovieDetail extends MovieItem {
  duration?: string;
}
interface PassData {
  id: string;
  name: string;
  price: string;
  period: string;
  features: string[];
}

export default function MoviesUniverseHome() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const isDark = colorScheme === 'dark';
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [featuredMovie, setFeaturedMovie] = useState<MovieDetail | null>(null);
  const [trendingMovies, setTrendingMovies] = useState<MovieItem[]>([]);
  const [africanCinema, setAfricanCinema] = useState<MovieItem[]>([]);
  const [hollywoodHits, setHollywoodHits] = useState<MovieItem[]>([]);
  const [passes, setPasses] = useState<PassData[]>([]);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [featuredRes, trendingRes, africanRes, hollywoodRes, passesRes] = await Promise.all([
        apiClient.get<Movie>('/v1/movies/featured'),
        apiClient.get<Movie[]>('/v1/movies/trending'),
        apiClient.get<Movie[]>('/v1/movies/african'),
        apiClient.get<Movie[]>('/v1/movies/hollywood'),
        apiClient.get<SubscriptionPlan[]>('/v1/movies/passes'),
      ]);
      const featured = Array.isArray(featuredRes)
        ? featuredRes[0]
        : ((featuredRes as unknown as { data?: unknown[] })?.data?.[0] ?? null);
      setFeaturedMovie(featured ?? null);
      setTrendingMovies(
        Array.isArray(trendingRes)
          ? trendingRes
          : ((trendingRes as unknown as { data?: unknown[] })?.data ?? [])
      );
      setAfricanCinema(
        Array.isArray(africanRes)
          ? africanRes
          : ((africanRes as unknown as { data?: unknown[] })?.data ?? [])
      );
      setHollywoodHits(
        Array.isArray(hollywoodRes)
          ? hollywoodRes
          : ((hollywoodRes as unknown as { data?: unknown[] })?.data ?? [])
      );
      setPasses(
        Array.isArray(passesRes)
          ? passesRes
          : ((passesRes as unknown as { data?: unknown[] })?.data ?? [])
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!isLoading && featuredMovie) {
      try {
        analytics.movieViewed(featuredMovie.id);
      } catch {}
    }
  }, [isLoading, featuredMovie]);

  if (isLoading)
    return (
      <SafeAreaView style={styles.container}>
        <LoadingState text="Loading movies..." />
      </SafeAreaView>
    );
  if (error)
    return (
      <SafeAreaView style={styles.container}>
        <ErrorState description={error} onRetry={fetchData} />
      </SafeAreaView>
    );
  if (!featuredMovie && !trendingMovies.length) {
    return (
      <SafeAreaView style={styles.container}>
        <EmptyState
          icon="🎬"
          title="No movies available"
          description="Check back later for movies"
        />
      </SafeAreaView>
    );
  }

  const renderMovieCard = (item: MovieItem, size: 'large' | 'small' = 'small') => (
    <TouchableOpacity
      key={item.id}
      style={[styles.movieCard, size === 'large' && styles.movieCardLarge]}
      onPress={() => router.push(`/movies/${item.id}`)}
    >
      <View style={[styles.movieThumbnail, size === 'large' && styles.movieThumbnailLarge]}>
        <Text style={styles.movieEmoji}>🎬</Text>
        <View style={styles.ratingBadge}>
          <Text style={styles.ratingText}>⭐ {item.rating}</Text>
        </View>
      </View>
      <Text style={[styles.movieTitle, { color: isDark ? '#fff' : '#000' }]} numberOfLines={1}>
        {item.title}
      </Text>
      <Text style={styles.movieGenre}>{item.genre}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={[{ flex: 1 }, { backgroundColor: isDark ? '#1A0A0A' : '#ffffff' }]}>
        <View style={styles.header}>
          <Text style={styles.universeLabel}>🎬 Movies</Text>
          <Text style={[styles.headerTitle, { color: isDark ? '#ffffff' : '#1A0A0A' }]}>
            Movie Universe
          </Text>
          <TouchableOpacity
            style={styles.searchButton}
            onPress={() => router.push('/(tabs)/search')}
          >
            <Text style={styles.searchIcon}>🔍</Text>
            <Text style={styles.searchPlaceholder}>Search movies...</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.passBanner}>
          <View style={styles.passBannerContent}>
            <Text style={styles.passBannerTitle}>🎥 Cinema Plus</Text>
            <Text style={styles.passBannerSubtitle}>
              Unlimited movies from {moviePassPrice.label}
            </Text>
            <TouchableOpacity style={styles.passButton}>
              <Text style={styles.passButtonText}>Get Pass</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#1A0A0A' }]}>
              Featured
            </Text>
          </View>
          <TouchableOpacity
            style={styles.featuredCard}
            onPress={() => router.push(`/movies/${featuredMovie?.id ?? '1'}`)}
          >
            <View style={styles.featuredImagePlaceholder}>
              <Text style={styles.featuredEmoji}>🎬</Text>
              <View style={styles.featuredBadge}>
                <Text style={styles.featuredBadgeText}>NEW</Text>
              </View>
              <View style={styles.featuredMeta}>
                <Text style={styles.featuredRating}>⭐ {featuredMovie?.rating ?? '0.0'}</Text>
                <Text style={styles.featuredDuration}>{featuredMovie?.duration ?? ''}</Text>
              </View>
            </View>
            <View style={styles.featuredInfo}>
              <Text style={[styles.featuredTitle, { color: isDark ? '#fff' : '#000' }]}>
                {featuredMovie?.title ?? 'Featured Movie'}
              </Text>
              <Text style={styles.featuredGenre}>{featuredMovie?.genre ?? ''}</Text>
              <View style={styles.featuredActions}>
                <TouchableOpacity style={styles.playButton}>
                  <Text style={styles.playIcon}>▶</Text>
                  <Text style={styles.playText}>Watch</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.rentButton}>
                  <Text style={styles.rentText}>Rent ₦{rentPrice.toLocaleString()}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#1A0A0A' }]}>
              Trending Now
            </Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={trendingMovies}
            renderItem={({ item }) => renderMovieCard(item, 'small')}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#1A0A0A' }]}>
              African Cinema
            </Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={africanCinema}
            renderItem={({ item }) => renderMovieCard(item, 'small')}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#1A0A0A' }]}>
              Hollywood Hits
            </Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={hollywoodHits}
            renderItem={({ item }) => renderMovieCard(item, 'small')}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#1A0A0A' }]}>
            Available Passes
          </Text>
          <View style={styles.passesList}>
            {passes.map((pass) => (
              <TouchableOpacity key={pass.id} style={styles.passCard}>
                <View style={styles.passHeader}>
                  <Text style={[styles.passName, { color: isDark ? '#fff' : '#000' }]}>
                    {pass.name}
                  </Text>
                  <View style={styles.passPriceTag}>
                    <Text style={styles.passPrice}>{pass.price}</Text>
                    <Text style={styles.passPeriod}>{pass.period}</Text>
                  </View>
                </View>
                <View style={styles.passFeatures}>
                  {pass.features.map((feature, index) => (
                    <Text key={index} style={styles.passFeature}>
                      ✓ {feature}
                    </Text>
                  ))}
                </View>
                <TouchableOpacity style={styles.subscribeButton}>
                  <Text style={styles.subscribeButtonText}>Subscribe</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem} onPress={() => router.push('/(tabs)/home')}>
            <Text style={styles.navIcon}>🏠</Text>
            <Text style={styles.navLabel}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => router.push('/(tabs)/watch')}>
            <Text style={styles.navIcon}>📺</Text>
            <Text style={[styles.navLabel, { color: '#FFEAA7' }]}>Watch</Text>
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
    color: '#FFEAA7',
    fontWeight: '600',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 16,
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  searchIcon: {
    fontSize: 18,
  },
  searchPlaceholder: {
    fontSize: 15,
    color: '#888',
  },
  passBanner: {
    marginHorizontal: 16,
    marginBottom: 20,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    overflow: 'hidden',
  },
  passBannerContent: {
    padding: 20,
    backgroundColor: '#2a2a2a',
  },
  passBannerTitle: {
    color: '#FFEAA7',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  passBannerSubtitle: {
    color: '#888',
    fontSize: 14,
    marginBottom: 12,
  },
  passButton: {
    backgroundColor: '#FFEAA7',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  passButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
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
    color: '#FFEAA7',
    fontSize: 14,
    fontWeight: '600',
  },
  horizontalList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  movieCard: {
    width: 130,
  },
  movieCardLarge: {
    width: 160,
  },
  movieThumbnail: {
    height: 180,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    position: 'relative',
  },
  movieThumbnailLarge: {
    height: 220,
  },
  movieEmoji: {
    fontSize: 40,
  },
  ratingBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ratingText: {
    color: '#FFEAA7',
    fontSize: 11,
    fontWeight: '600',
  },
  movieTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  movieGenre: {
    fontSize: 12,
    color: '#888',
  },
  featuredCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
  },
  featuredImagePlaceholder: {
    height: 200,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  featuredEmoji: {
    fontSize: 64,
  },
  featuredBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#FFEAA7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  featuredBadgeText: {
    color: '#000',
    fontSize: 11,
    fontWeight: '700',
  },
  featuredMeta: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    gap: 12,
  },
  featuredRating: {
    color: '#FFEAA7',
    fontSize: 13,
    fontWeight: '600',
  },
  featuredDuration: {
    color: '#fff',
    fontSize: 13,
  },
  featuredInfo: {
    padding: 16,
  },
  featuredTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  featuredGenre: {
    color: '#888',
    fontSize: 14,
    marginBottom: 12,
  },
  featuredActions: {
    flexDirection: 'row',
    gap: 12,
  },
  playButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFEAA7',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  playIcon: {
    fontSize: 14,
  },
  playText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
  },
  rentButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFEAA7',
    paddingVertical: 10,
    borderRadius: 8,
  },
  rentText: {
    color: '#FFEAA7',
    fontSize: 14,
    fontWeight: '600',
  },
  passesList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  passCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FFEAA7',
  },
  passHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  passName: {
    fontSize: 18,
    fontWeight: '700',
  },
  passPriceTag: {
    alignItems: 'flex-end',
  },
  passPrice: {
    color: '#FFEAA7',
    fontSize: 20,
    fontWeight: '700',
  },
  passPeriod: {
    color: '#888',
    fontSize: 12,
  },
  passFeatures: {
    marginBottom: 12,
  },
  passFeature: {
    color: '#ccc',
    fontSize: 13,
    marginBottom: 4,
  },
  subscribeButton: {
    backgroundColor: '#FFEAA7',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  subscribeButtonText: {
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
