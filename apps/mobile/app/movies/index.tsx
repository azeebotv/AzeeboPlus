import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, Image } from 'react-native';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';

const FEATURED_MOVIE = {
  id: '1',
  title: 'Blood Sisters 2',
  genre: 'Drama',
  rating: '4.8',
  duration: '2h 15m',
  thumbnail: '',
};

const TRENDING_MOVIES = [
  { id: '1', title: 'Avatar', genre: 'Sci-Fi', rating: '4.9', thumbnail: '' },
  { id: '2', title: 'The King', genre: 'Drama', rating: '4.7', thumbnail: '' },
  { id: '3', title: 'Lara Croft', genre: 'Action', rating: '4.5', thumbnail: '' },
  { id: '4', title: 'Queen of Tears', genre: 'Romance', rating: '4.6', thumbnail: '' },
];

const AFRICAN_CINEMA = [
  { id: '1', title: 'The Milk', genre: 'Drama', thumbnail: '' },
  { id: '2', title: 'Four Bullets', genre: 'Action', thumbnail: '' },
  { id: '3', title: 'The Rumble', genre: 'Documentary', thumbnail: '' },
];

const HOLLYWOOD_HITS = [
  { id: '1', title: 'Oppenheimer', genre: 'Drama', thumbnail: '' },
  { id: '2', title: 'Barbie', genre: 'Comedy', thumbnail: '' },
  { id: '3', title: 'Dune Part 2', genre: 'Sci-Fi', thumbnail: '' },
];

const PASSES = [
  { id: '1', name: 'Movie Pass', price: '₦2,500', period: '/month', features: ['Unlimited movies', 'HD quality', 'Download 5 films'] },
  { id: '2', name: 'Cinema Plus', price: '₦4,500', period: '/month', features: ['All movies', '4K quality', 'Unlimited downloads', 'Early access'] },
];

const CATEGORIES = ['All', 'Action', 'Drama', 'Comedy', 'Romance', 'Horror', 'Documentary'];

export default function MoviesUniverseHome() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const isDark = colorScheme === 'dark';

  const renderMovieCard = (item: typeof TRENDING_MOVIES[0], size: 'large' | 'small' = 'small') => (
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
    <ScrollView style={[styles.container, { backgroundColor: isDark ? '#0a0a0a' : '#ffffff' }]}>
      <View style={styles.header}>
        <Text style={styles.universeLabel}>🎬 Movies</Text>
        <Text style={[styles.headerTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
          Movie Universe
        </Text>
        <TouchableOpacity style={styles.searchButton} onPress={() => router.push('/(tabs)/search')}>
          <Text style={styles.searchIcon}>🔍</Text>
          <Text style={styles.searchPlaceholder}>Search movies...</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.passBanner}>
        <View style={styles.passBannerContent}>
          <Text style={styles.passBannerTitle}>🎥 Cinema Plus</Text>
          <Text style={styles.passBannerSubtitle}>Unlimited movies from ₦4,500/month</Text>
          <TouchableOpacity style={styles.passButton}>
            <Text style={styles.passButtonText}>Get Pass</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
            Featured
          </Text>
        </View>
        <TouchableOpacity
          style={styles.featuredCard}
          onPress={() => router.push(`/movies/${FEATURED_MOVIE.id}`)}
        >
          <View style={styles.featuredImagePlaceholder}>
            <Text style={styles.featuredEmoji}>🎬</Text>
            <View style={styles.featuredBadge}>
              <Text style={styles.featuredBadgeText}>NEW</Text>
            </View>
            <View style={styles.featuredMeta}>
              <Text style={styles.featuredRating}>⭐ {FEATURED_MOVIE.rating}</Text>
              <Text style={styles.featuredDuration}>{FEATURED_MOVIE.duration}</Text>
            </View>
          </View>
          <View style={styles.featuredInfo}>
            <Text style={[styles.featuredTitle, { color: isDark ? '#fff' : '#000' }]}>
              {FEATURED_MOVIE.title}
            </Text>
            <Text style={styles.featuredGenre}>{FEATURED_MOVIE.genre}</Text>
            <View style={styles.featuredActions}>
              <TouchableOpacity style={styles.playButton}>
                <Text style={styles.playIcon}>▶</Text>
                <Text style={styles.playText}>Watch</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.rentButton}>
                <Text style={styles.rentText}>Rent ₦500</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
            Trending Now
          </Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={TRENDING_MOVIES}
          renderItem={({ item }) => renderMovieCard(item, 'small')}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
        />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
            African Cinema
          </Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={AFRICAN_CINEMA}
          renderItem={({ item }) => renderMovieCard(item, 'small')}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
        />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
            Hollywood Hits
          </Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={HOLLYWOOD_HITS}
          renderItem={({ item }) => renderMovieCard(item, 'small')}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
        />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
          Available Passes
        </Text>
        <View style={styles.passesList}>
          {PASSES.map((pass) => (
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
                  <Text key={index} style={styles.passFeature}>✓ {feature}</Text>
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