import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { colors, radius } from '../../src/theme';
import { apiClient } from '../../src/api/client';
import { LoadingState, EmptyState, ErrorState } from '../../src/components/StateContainers';
import { analytics } from '../../src/utils/analytics';

interface Character {
  id: string;
  name: string;
  avatar: string;
  role: string;
  universe: string;
}

export default function CharactersListScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const isDark = colorScheme === 'dark';
  const [search, setSearch] = useState('');

  const charactersQuery = useQuery({
    queryKey: ['vertical', 'characters', search],
    queryFn: async () => {
      const endpoint = search
        ? `/v1/vertical/characters?q=${encodeURIComponent(search)}`
        : '/v1/vertical/characters';
      const res = await apiClient.get<Character[]>(endpoint);
      return Array.isArray(res) ? res : [];
    },
    staleTime: 60_000,
  });

  useEffect(() => {
    analytics.lifestyleFeedViewed();
  }, []);

  const characters = charactersQuery.data ?? [];

  const renderItem = ({ item }: { item: Character }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: isDark ? colors.bg.tertiary : '#f5f5f5' }]}
      onPress={() => router.push(`/vertical/character-detail?id=${item.id}`)}
      activeOpacity={0.7}
    >
      <View style={[styles.avatar, { backgroundColor: colors.primary[500] + '20' }]}>
        <Text style={styles.avatarText}>{item.avatar || item.name[0]}</Text>
      </View>
      <View style={styles.cardInfo}>
        <Text style={[styles.cardName, { color: colors.text.primary }]} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.cardRole}>{item.role}</Text>
      </View>
      <Text style={[styles.arrow, { color: colors.text.secondary }]}>›</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: isDark ? colors.bg.primary : '#fff' }]}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Characters</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.searchBar}>
        <TextInput
          style={[
            styles.searchInput,
            {
              color: colors.text.primary,
              borderColor: colors.border.default,
              backgroundColor: colors.bg.tertiary,
            },
          ]}
          placeholder="Search characters..."
          placeholderTextColor={colors.text.tertiary}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {charactersQuery.isLoading ? (
        <LoadingState text="Loading characters..." />
      ) : charactersQuery.error ? (
        <ErrorState
          description={charactersQuery.error.message}
          onRetry={() => charactersQuery.refetch()}
        />
      ) : characters.length === 0 ? (
        <EmptyState icon="🧑" title="No characters found" description="Check back later" />
      ) : (
        <FlatList
          data={characters}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
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
  searchBar: { paddingHorizontal: 16, paddingBottom: 12 },
  searchInput: { padding: 12, borderRadius: 12, borderWidth: 1, fontSize: 14 },
  list: { padding: 16, gap: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: radius.lg,
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 20, fontWeight: '700', color: colors.primary[500] },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  cardRole: { fontSize: 12, color: colors.text.tertiary },
  arrow: { fontSize: 24 },
});
