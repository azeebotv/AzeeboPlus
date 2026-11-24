import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { LoadingState, EmptyState, ErrorState } from '../../src/components/StateContainers';
import { apiClient } from '@azeebo/react-data/api/client';
import { ApiResponse } from '@azeebo/react-data/types/api';
import { colors } from '../../src/theme';

type ListResponse<T> = T[] | ApiResponse<T[]>;

interface Comedian {
  id: string;
  name: string;
  avatar: string;
  specialCount: number;
  rating: string;
  bio: string;
}

type SortOption = 'popular' | 'name';

export default function ComediansScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const isDark = colorScheme === 'dark';
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('popular');

  const comediansQuery = useQuery({
    queryKey: ['comedy', 'comedians'],
    queryFn: async () => {
      const res = await apiClient.get<ListResponse<Comedian>>('/v1/comedy/comedians');
      return Array.isArray(res) ? res : (res?.data ?? []);
    },
    staleTime: 60_000,
  });

  const isLoading = comediansQuery.isLoading;
  const error = comediansQuery.error?.message;
  let comedians = comediansQuery.data ?? [];

  if (search) {
    comedians = comedians.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));
  }
  if (sortBy === 'name') {
    comedians = [...comedians].sort((a, b) => a.name.localeCompare(b.name));
  }

  if (isLoading)
    return (
      <SafeAreaView accessibilityLabel="Comedians Screen" style={[styles.container, { backgroundColor: isDark ? '#1A0A0A' : '#ffffff' }]}>
        <LoadingState text="Loading comedians..." />
      </SafeAreaView>
    );
  if (error)
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#1A0A0A' : '#ffffff' }]}>
        <ErrorState description={error} onRetry={() => comediansQuery.refetch()} />
      </SafeAreaView>
    );
  if (!comedians.length)
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#1A0A0A' : '#ffffff' }]}>
        <EmptyState
          icon="🎤"
          title="No comedians"
          description="Check back for featured comedians"
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
          Comedians
        </Text>
      </View>

      <View style={styles.searchRow}>
        <TextInput
          style={[
            styles.searchInput,
            { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5', color: isDark ? '#fff' : '#000' },
          ]}
          placeholder="Search comedians..."
          placeholderTextColor="#888"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <View style={styles.sortRow}>
        {(['popular', 'name'] as const).map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.sortChip, sortBy === s && styles.sortChipActive]}
            onPress={() => setSortBy(s)}
          >
            <Text style={[styles.sortText, sortBy === s && styles.sortTextActive]}>
              {s === 'popular' ? '🔥 Popular' : '📝 A-Z'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={comedians}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.comedianCard, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}
            onPress={() => router.push('/comedy/comedian-detail')}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarEmoji}>{item.avatar}</Text>
            </View>
            <View style={styles.comedianInfo}>
              <Text style={[styles.comedianName, { color: isDark ? '#fff' : '#000' }]}>
                {item.name}
              </Text>
              <Text style={styles.comedianBio} numberOfLines={1}>
                {item.bio}
              </Text>
              <View style={styles.comedianMeta}>
                <Text style={styles.metaText}>🎤 {item.specialCount} specials</Text>
                <Text style={styles.metaText}>⭐ {item.rating}</Text>
              </View>
            </View>
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
  searchRow: { paddingHorizontal: 16, marginBottom: 12 },
  searchInput: { padding: 12, borderRadius: 12, fontSize: 14 },
  sortRow: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 16, gap: 10 },
  sortChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
  },
  sortChipActive: { backgroundColor: colors.category.amber },
  sortText: { color: colors.text.secondary, fontSize: 13, fontWeight: '600' },
  sortTextActive: { color: '#000' },
  listContent: { paddingHorizontal: 16, paddingBottom: 30 },
  comedianCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.bg.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarEmoji: { fontSize: 28 },
  comedianInfo: { flex: 1 },
  comedianName: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  comedianBio: { color: colors.text.secondary, fontSize: 12, marginBottom: 6 },
  comedianMeta: { flexDirection: 'row', gap: 12 },
  metaText: { color: colors.text.secondary, fontSize: 12 },
});
