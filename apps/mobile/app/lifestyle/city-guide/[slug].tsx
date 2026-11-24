import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Image } from 'react-native';
import { useColorScheme } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { colors, radius } from '../../../src/theme';
import { apiClient } from '@azeebo/react-data/api/client';
import { LoadingState, ErrorState } from '../../../src/components/StateContainers';

interface CityGuideEntry {
  id: string;
  name: string;
  slug: string;
  type: string;
  description?: string | null;
  coverImage?: string | null;
  address?: string | null;
  city: string;
  country: string;
  rating?: number | null;
  priceLevel?: number | null;
  hours?: string | null;
  phone?: string | null;
  website?: string | null;
  amenities?: string[];
}

export default function CityGuideDetailScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const isDark = colorScheme === 'dark';
  const { slug } = useLocalSearchParams<{ slug: string }>();

  const entryQuery = useQuery({
    queryKey: ['lifestyle', 'city-guide', slug],
    enabled: !!slug,
    queryFn: async () => {
      // GET /v1/lifestyle/city-guide/:slug → { success, data: entry }
      const res = await apiClient.get<{ success: boolean; data?: CityGuideEntry }>(
        `/v1/lifestyle/city-guide/${encodeURIComponent(String(slug))}`
      );
      return res?.data ?? null;
    },
  });

  const entry = entryQuery.data;

  if (entryQuery.isLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: isDark ? colors.bg.primary : '#fff' }]}
      >
        <View style={styles.header}>
          <TouchableOpacity accessibilityRole="button" style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <View style={{ width: 40 }} />
        </View>
        <LoadingState text="Loading..." />
      </SafeAreaView>
    );
  }

  if (entryQuery.error || !entry) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: isDark ? colors.bg.primary : '#fff' }]}
      >
        <View style={styles.header}>
          <TouchableOpacity accessibilityRole="button" style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <View style={{ width: 40 }} />
        </View>
        <ErrorState
          description="This spot could not be found"
          onRetry={() => entryQuery.refetch()}
        />
      </SafeAreaView>
    );
  }

  const openLink = (url: string) => {
    const target = url.startsWith('http') ? url : `https://${url}`;
    Linking.openURL(target).catch(() => undefined);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: isDark ? colors.bg.primary : '#fff' }]}
    >
      <View style={styles.header}>
        <TouchableOpacity accessibilityRole="button" style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {entry.coverImage ? (
          <Image source={{ uri: entry.coverImage }} style={styles.cover} resizeMode="cover" />
        ) : (
          <View
            style={[
              styles.cover,
              styles.coverFallback,
              { backgroundColor: colors.primary[500] + '20' },
            ]}
          >
            <Text style={styles.coverEmoji}>📍</Text>
          </View>
        )}

        <Text style={[styles.title, { color: colors.text.primary }]}>{entry.name}</Text>
        <Text style={styles.meta}>
          {entry.city}, {entry.country}
          {entry.priceLevel ? ` • ${'$'.repeat(Math.min(entry.priceLevel, 4))}` : ''}
        </Text>
        {entry.rating ? (
          <Text style={styles.rating}>★ {Number(entry.rating).toFixed(1)}</Text>
        ) : null}

        {entry.description ? (
          <Text style={[styles.description, { color: colors.text.primary }]}>
            {entry.description}
          </Text>
        ) : null}

        {entry.amenities && entry.amenities.length > 0 ? (
          <View style={styles.amenityWrap}>
            {entry.amenities.map((a) => (
              <View
                key={a}
                style={[styles.amenityChip, { backgroundColor: isDark ? colors.bg.tertiary : '#f0f0f0' }]}
              >
                <Text style={[styles.amenityText, { color: colors.text.secondary }]}>{a}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <View style={[styles.infoCard, { backgroundColor: isDark ? colors.bg.tertiary : '#f5f5f5' }]}>
          {entry.address ? (
            <Text style={[styles.infoLine, { color: colors.text.primary }]}>📍 {entry.address}</Text>
          ) : null}
          {entry.hours ? (
            <Text style={[styles.infoLine, { color: colors.text.primary }]}>🕒 {entry.hours}</Text>
          ) : null}
          {entry.phone ? (
            <TouchableOpacity accessibilityRole="button" onPress={() => Linking.openURL(`tel:${entry.phone}`)}>
              <Text style={[styles.infoLine, styles.infoLink]}>📞 {entry.phone}</Text>
            </TouchableOpacity>
          ) : null}
          {entry.website ? (
            <TouchableOpacity accessibilityRole="button" onPress={() => openLink(entry.website ?? '')}>
              <Text style={[styles.infoLine, styles.infoLink]}>🌐 {entry.website}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </ScrollView>
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
  backIcon: { color: colors.text.primary, fontSize: 20 },
  body: { padding: 16, paddingTop: 0, gap: 12 },
  cover: { width: '100%', height: 180, borderRadius: radius.lg },
  coverFallback: { alignItems: 'center', justifyContent: 'center' },
  coverEmoji: { fontSize: 48 },
  title: { fontSize: 24, fontWeight: '800' },
  meta: { fontSize: 14, color: colors.text.secondary },
  rating: { fontSize: 14, color: colors.primary[600], fontWeight: '700' },
  description: { fontSize: 15, lineHeight: 22 },
  amenityWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  amenityChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  amenityText: { fontSize: 12 },
  infoCard: { borderRadius: radius.lg, padding: 14, gap: 8 },
  infoLine: { fontSize: 14 },
  infoLink: { color: colors.primary[600], textDecorationLine: 'underline' },
});
