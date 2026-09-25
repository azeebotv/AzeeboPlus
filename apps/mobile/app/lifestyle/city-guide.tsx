import { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image } from 'react-native';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { colors, radius } from '../../src/theme';
import { apiClient } from '@azeebo/react-data/api/client';
import { LoadingState, EmptyState, ErrorState } from '../../src/components/StateContainers';
import { analytics } from '../../src/utils/analytics';

interface CityGuideEntry {
  id: string;
  name: string;
  slug: string;
  type: string;
  description?: string | null;
  coverImage?: string | null;
  city: string;
  country: string;
  rating?: number | null;
  priceLevel?: number | null;
}

const TYPE_ICONS: Record<string, string> = {
  restaurant: '🍽️',
  bar: '🍸',
  hotel: '🏨',
  attraction: '📸',
  venue: '🎪',
  park: '🌳',
  shop: '🛍️',
  beach: '🏖️',
};

export default function CityGuideScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const isDark = colorScheme === 'dark';

  const citiesQuery = useQuery({
    queryKey: ['lifestyle', 'city-guide'],
    queryFn: async () => {
      // GET /v1/lifestyle/city-guide (published entries) →
      // { success, data: { items: [...], page, limit, total, totalPages } }
      const res = await apiClient.get<{
        success: boolean;
        data?: { items?: CityGuideEntry[] };
      }>('/v1/lifestyle/city-guide?limit=50');
      return res?.data?.items ?? [];
    },
    staleTime: 300_000,
  });

  useEffect(() => {
    analytics.lifestyleFeedViewed();
  }, []);

  const cities = citiesQuery.data ?? [];

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: isDark ? colors.bg.primary : '#fff' }]}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>City Guide</Text>
        <View style={{ width: 40 }} />
      </View>

      <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
        Discover the best spots across Africa
      </Text>

      {citiesQuery.isLoading ? (
        <LoadingState text="Loading cities..." />
      ) : citiesQuery.error ? (
        <ErrorState description={citiesQuery.error.message} onRetry={() => citiesQuery.refetch()} />
      ) : cities.length === 0 ? (
        <EmptyState
          icon="🏙️"
          title="No spots yet"
          description="City guide entries appear as they're published"
        />
      ) : (
        <FlatList
          data={cities}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const icon = TYPE_ICONS[item.type] ?? '📍';
            return (
              <TouchableOpacity
                style={[styles.card, { backgroundColor: isDark ? colors.bg.tertiary : '#f5f5f5' }]}
                activeOpacity={0.7}
                onPress={() =>
                  router.push(`/lifestyle/city-guide/${encodeURIComponent(item.slug)}`)
                }
                accessibilityRole="button"
                accessibilityLabel={`${item.name} in ${item.city}`}
              >
                {item.coverImage ? (
                  <Image source={{ uri: item.coverImage }} style={styles.cardImage} />
                ) : (
                  <View
                    style={[styles.cardImage, styles.cardImageFallback, { backgroundColor: colors.primary[500] + '20' }]}
                  >
                    <Text style={styles.cardIcon}>{icon}</Text>
                  </View>
                )}
                <View style={styles.cardInfo}>
                  <Text style={[styles.cardName, { color: colors.text.primary }]} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.cardMeta} numberOfLines={1}>
                    {item.city}, {item.country}
                    {item.priceLevel ? ` • ${'$'.repeat(Math.min(item.priceLevel, 4))}` : ''}
                  </Text>
                  {item.rating ? (
                    <Text style={styles.cardRating}>
                      ★ {Number(item.rating).toFixed(1)}
                    </Text>
                  ) : null}
                </View>
                <Text style={[styles.arrow, { color: colors.text.secondary }]}>›</Text>
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={styles.list}
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
  subtitle: { paddingHorizontal: 16, paddingBottom: 12, fontSize: 14 },
  list: { padding: 16, gap: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: radius.lg,
    gap: 12,
  },
  cardImage: { width: 56, height: 56, borderRadius: 12 },
  cardImageFallback: { alignItems: 'center', justifyContent: 'center' },
  cardIcon: { fontSize: 24 },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  cardMeta: { fontSize: 12, color: colors.text.tertiary },
  cardRating: { fontSize: 12, color: colors.primary[600], marginTop: 2, fontWeight: '600' },
  arrow: { fontSize: 22 },
});
