import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { LoadingState, EmptyState, ErrorState } from '../../src/components/StateContainers';
import { apiClient } from '@azeebo/react-data/api/client';
import { ApiResponse } from '@azeebo/react-data/types/api';
import { colors } from '../../src/theme';

type ListResponse<T> = T[] | ApiResponse<T[]>;

interface Special {
  id: string;
  title: string;
  comedian: string;
  duration: string;
  rating: string;
  genre: string;
  emoji: string;
}

const GENRES = ['All', 'Stand-up', 'Sketch', 'Improv', 'Roast'];

export default function SpecialsScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const isDark = colorScheme === 'dark';
  const [selectedGenre, setSelectedGenre] = useState('All');

  const specialsQuery = useQuery({
    queryKey: ['comedy', 'specials', selectedGenre],
    queryFn: async () => {
      const res = await apiClient.get<ListResponse<Special>>('/v1/comedy/specials');
      return Array.isArray(res) ? res : (res?.data ?? []);
    },
    staleTime: 60_000,
  });

  const isLoading = specialsQuery.isLoading;
  const error = specialsQuery.error?.message;
  const allSpecials = specialsQuery.data ?? [];
  const specials =
    selectedGenre === 'All' ? allSpecials : allSpecials.filter((s) => s.genre === selectedGenre);

  if (isLoading)
    return (
      <SafeAreaView accessibilityLabel="Specials Screen" style={[styles.container, { backgroundColor: isDark ? '#1A0A0A' : '#ffffff' }]}>
        <LoadingState text="Loading specials..." />
      </SafeAreaView>
    );
  if (error)
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#1A0A0A' : '#ffffff' }]}>
        <ErrorState description={error} onRetry={() => specialsQuery.refetch()} />
      </SafeAreaView>
    );
  if (!specials.length)
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#1A0A0A' : '#ffffff' }]}>
        <EmptyState
          icon="🎤"
          title="No specials"
          description="Check back for new comedy specials"
        />
      </SafeAreaView>
    );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#1A0A0A' : '#ffffff' }]}>
      <View style={styles.header}>
        <TouchableOpacity accessibilityRole="button" style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: isDark ? '#ffffff' : '#1A0A0A' }]}>
          Specials
        </Text>
      </View>

      <FlatList
        horizontal
        data={GENRES}
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.genreBar}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.genreChip, selectedGenre === item && styles.genreChipActive]}
            onPress={() => setSelectedGenre(item)}
          >
            <Text style={[styles.genreText, selectedGenre === item && styles.genreTextActive]}>
              {item}
            </Text>
          </TouchableOpacity>
        )}
      />

      <FlatList
        data={specials}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.gridContent}
        columnWrapperStyle={styles.gridRow}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.specialCard, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}
            onPress={() => router.push('/comedy/special-detail')}
          >
            <View style={styles.specialThumbnail}>
              <Text style={styles.specialEmoji}>{item.emoji}</Text>
              <View style={styles.ratingBadge}>
                <Text style={styles.ratingText}>⭐ {item.rating}</Text>
              </View>
              <View style={styles.durationBadge}>
                <Text style={styles.durationText}>{item.duration}</Text>
              </View>
            </View>
            <Text
              style={[styles.specialTitle, { color: isDark ? '#fff' : '#000' }]}
              numberOfLines={1}
            >
              {item.title}
            </Text>
            <Text style={styles.specialComedian}>{item.comedian}</Text>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingTop: 50, gap: 12 },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bg.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { color: '#fff', fontSize: 20 },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  genreBar: { paddingHorizontal: 16, paddingBottom: 16, gap: 10 },
  genreChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    marginRight: 10,
  },
  genreChipActive: { backgroundColor: colors.category.amber },
  genreText: { color: colors.text.secondary, fontSize: 13, fontWeight: '600' },
  genreTextActive: { color: '#000' },
  gridContent: { paddingHorizontal: 16, paddingBottom: 30 },
  gridRow: { gap: 12, marginBottom: 12 },
  specialCard: { flex: 1, borderRadius: 12, overflow: 'hidden', maxWidth: '48%' },
  specialThumbnail: {
    height: 160,
    backgroundColor: colors.bg.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  specialEmoji: { fontSize: 50 },
  ratingBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ratingText: { color: colors.category.amber, fontSize: 11, fontWeight: '600' },
  durationBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  durationText: { color: '#fff', fontSize: 11 },
  specialTitle: { fontSize: 14, fontWeight: '600', padding: 10, paddingBottom: 2 },
  specialComedian: {
    color: colors.text.secondary,
    fontSize: 12,
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
});
