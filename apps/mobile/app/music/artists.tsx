import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { colors, radius } from '../../src/theme';
import { apiClient } from '../../src/api/client';
import { LoadingState, EmptyState, ErrorState } from '../../src/components/StateContainers';

interface Artist {
  id: string;
  name: string;
  genre: string;
  followerCount: number;
  avatar?: string;
}

export default function MusicArtistsScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const isDark = colorScheme === 'dark';
  const [search, setSearch] = useState('');

  const artistsQuery = useQuery({
    queryKey: ['music', 'artists', search],
    queryFn: async () => {
      const params = search ? `?search=${encodeURIComponent(search)}` : '';
      const res = await apiClient.get<Artist[]>(`/v1/music/artists${params}`);
      return Array.isArray(res) ? res : [];
    },
    staleTime: 60_000,
  });

  const artists = artistsQuery.data ?? [];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? colors.bg.primary : '#fff' }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Artists</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={[styles.searchInput, { backgroundColor: isDark ? colors.bg.tertiary : '#f0f0f0', color: colors.text.primary }]}
          placeholder="Search artists..."
          placeholderTextColor={colors.text.tertiary}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {artistsQuery.isLoading ? (
        <LoadingState text="Loading artists..." />
      ) : artistsQuery.error ? (
        <ErrorState description={artistsQuery.error.message} onRetry={() => artistsQuery.refetch()} />
      ) : artists.length === 0 ? (
        <EmptyState icon="🎤" title="No artists" description={search ? 'No artists match your search' : 'Artists coming soon'} />
      ) : (
        <FlatList
          data={artists}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.gridRow}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.card, { backgroundColor: isDark ? colors.bg.tertiary : '#f5f5f5' }]}
              onPress={() => router.push(`/music/${item.id}`)}
              activeOpacity={0.7}
            >
              <View style={[styles.avatar, { backgroundColor: colors.primary[500] + '20' }]}>
                <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
              </View>
              <Text style={[styles.cardName, { color: colors.text.primary }]} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.cardGenre}>{item.genre}</Text>
              <Text style={styles.cardFollowers}>{item.followerCount.toLocaleString()} followers</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 40 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.bg.tertiary, alignItems: 'center', justifyContent: 'center' },
  backIcon: { color: colors.text.primary, fontSize: 20 },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  searchContainer: { paddingHorizontal: 16, marginBottom: 12 },
  searchInput: { padding: 12, borderRadius: radius.md, fontSize: 14 },
  grid: { padding: 16 },
  gridRow: { gap: 12, marginBottom: 12 },
  card: { flex: 1, padding: 16, borderRadius: radius.lg, alignItems: 'center' },
  avatar: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  avatarText: { fontSize: 24, fontWeight: '700', color: colors.primary[500] },
  cardName: { fontSize: 14, fontWeight: '700', textAlign: 'center', marginBottom: 2 },
  cardGenre: { fontSize: 11, color: colors.primary[500], fontWeight: '600', marginBottom: 2 },
  cardFollowers: { fontSize: 11, color: colors.text.tertiary },
});
