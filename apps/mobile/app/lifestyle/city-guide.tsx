import { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { colors, radius } from '../../src/theme';
import { apiClient } from '@azeebo/react-data/api/client';
import { LoadingState, EmptyState, ErrorState } from '../../src/components/StateContainers';
import { analytics } from '../../src/utils/analytics';

interface CityGuide {
  id: string;
  name: string;
  country: string;
  description: string;
  venueCount: number;
}

export default function CityGuideScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const isDark = colorScheme === 'dark';
  const citiesQuery = useQuery({
    queryKey: ['lifestyle', 'cities'],
    queryFn: async () => {
      const res = await apiClient.get<CityGuide[]>('/v1/lifestyle/cities');
      return Array.isArray(res) ? res : [];
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
        <EmptyState icon="🏙️" title="No cities" description="City guides coming soon" />
      ) : (
        <FlatList
          data={cities}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.card, { backgroundColor: isDark ? colors.bg.tertiary : '#f5f5f5' }]}
              activeOpacity={0.7}
            >
              <Text style={styles.cardIcon}>🏙️</Text>
              <View style={styles.cardInfo}>
                <Text style={[styles.cardName, { color: colors.text.primary }]}>{item.name}</Text>
                <Text style={styles.cardMeta}>
                  {item.country} • {item.venueCount} venues
                </Text>
              </View>
              <Text style={[styles.arrow, { color: colors.text.secondary }]}>›</Text>
            </TouchableOpacity>
          )}
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
    padding: 14,
    borderRadius: radius.lg,
    gap: 12,
  },
  cardIcon: { fontSize: 28 },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  cardMeta: { fontSize: 12, color: colors.text.tertiary },
  arrow: { fontSize: 24 },
});
