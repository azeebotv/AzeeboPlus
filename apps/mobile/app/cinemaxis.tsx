import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { LoadingState, ErrorState } from '../src/components/StateContainers';
import { apiClient } from '@azeebo/react-data/api/client';
import { colors } from '../src/theme';

interface FilmItem {
  id: string;
  title: string;
  genre: string;
  rating: string;
  thumbnail?: string;
}

export default function CinemaxisUniverseHome() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const isDark = colorScheme === 'dark';

  const filmsQuery = useQuery({
    queryKey: ['cinemaxis', 'films'],
    queryFn: async () => {
      const res = await apiClient.get<FilmItem[]>('/v1/movies/trending');
      return Array.isArray(res) ? res : ((res as { data?: FilmItem[] })?.data ?? []);
    },
    staleTime: 60_000,
  });

  const isLoading = filmsQuery.isLoading;
  const films = filmsQuery.data ?? [];
  const error = filmsQuery.error?.message || null;

  const FeaturedBanner = () => {
    if (films.length === 0) return null;
    const featured = films[0];
    return (
      <TouchableOpacity
        style={styles.featuredBanner}
        onPress={() => router.push(`/watch/${featured.id}`)}
        activeOpacity={0.9}
      >
        <View style={styles.featuredOverlay}>
          <View style={styles.featuredContent}>
            <Text style={styles.featuredTitle}>{featured.title}</Text>
            <Text style={styles.featuredGenre}>{featured.genre}</Text>
            <View style={styles.featuredBadgeRow}>
              <View style={styles.featuredBadge}>
                <Text style={styles.featuredBadgeText}>Cinemaxis Exclusive</Text>
              </View>
              <Text style={styles.featuredRating}>★ {featured.rating}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFilmItem = ({ item }: { item: FilmItem }) => (
    <TouchableOpacity
      style={styles.filmCard}
      onPress={() => router.push(`/watch/${item.id}`)}
      activeOpacity={0.8}
    >
      <View style={styles.filmThumbnail}>
        <Text style={styles.filmEmoji}>🎬</Text>
      </View>
      <View style={styles.filmInfo}>
        <Text style={styles.filmTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.filmMeta}>{item.genre}</Text>
        <View style={styles.filmRatingRow}>
          <Text style={styles.filmRating}>★ {item.rating}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={[styles.title, isDark && styles.titleDark]}>Cinemaxis</Text>
          <Text style={[styles.subtitle, isDark && styles.subtitleDark]}>
            Premium African cinema
          </Text>
        </View>

        {isLoading ? (
          <LoadingState text="Loading Cinemaxis..." />
        ) : error ? (
          <ErrorState
            title="Failed to load"
            description={error}
            onRetry={() => filmsQuery.refetch()}
          />
        ) : (
          <>
            <FeaturedBanner />

            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
                Featured Films
              </Text>
              <TouchableOpacity accessibilityRole="button" onPress={() => router.push('/movies')}>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>

            {films.length > 0 ? (
              <FlatList
                data={films.slice(1)}
                renderItem={renderFilmItem}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filmList}
              />
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No films available yet</Text>
              </View>
            )}

            <View style={styles.quickLinks}>
              <TouchableOpacity
                style={styles.quickLink}
                onPress={() => router.push('/movies/premieres')}
              >
                <Text style={styles.quickLinkEmoji}>🎬</Text>
                <Text style={styles.quickLinkText}>Premieres</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickLink}
                onPress={() => router.push('/movies/passes')}
              >
                <Text style={styles.quickLinkEmoji}>🎟️</Text>
                <Text style={styles.quickLinkText}>Passes</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickLink}
                onPress={() => router.push('/movies/watchlist')}
              >
                <Text style={styles.quickLinkEmoji}>📋</Text>
                <Text style={styles.quickLinkText}>Watchlist</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.deep,
  },
  containerDark: {
    backgroundColor: '#000',
  },
  scrollContent: {
    paddingBottom: 32,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  titleDark: {
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
  },
  subtitleDark: {
    color: 'rgba(255,255,255,0.5)',
  },
  featuredBanner: {
    height: 200,
    marginHorizontal: 16,
    borderRadius: 16,
    backgroundColor: colors.bg.deep,
    marginBottom: 24,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  featuredOverlay: {
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  featuredContent: {},
  featuredTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  featuredGenre: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 8,
  },
  featuredBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featuredBadge: {
    backgroundColor: '#a855f7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  featuredBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  featuredRating: {
    fontSize: 14,
    color: '#fbbf24',
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  sectionTitleDark: {
    color: '#fff',
  },
  seeAll: {
    fontSize: 14,
    color: '#a855f7',
    fontWeight: '600',
  },
  filmList: {
    paddingHorizontal: 12,
    paddingBottom: 16,
  },
  filmCard: {
    width: 160,
    marginHorizontal: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
  },
  filmThumbnail: {
    height: 100,
    backgroundColor: colors.bg.deep,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filmEmoji: {
    fontSize: 32,
  },
  filmInfo: {
    padding: 12,
  },
  filmTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  filmMeta: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 4,
  },
  filmRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filmRating: {
    fontSize: 12,
    color: '#fbbf24',
    fontWeight: '600',
  },
  quickLinks: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  quickLink: {
    alignItems: 'center',
    gap: 6,
  },
  quickLinkEmoji: {
    fontSize: 24,
  },
  quickLinkText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.4)',
  },
});
