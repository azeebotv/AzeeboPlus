import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { colors } from '../../src/theme';
import { apiClient } from '../../src/api/client';
import { LoadingState, EmptyState, ErrorState } from '../../src/components/StateContainers';
import { ApiResponse } from '../../src/types/api';
import { analytics } from '../../src/utils/analytics';

interface LoreCategory {
  id: string;
  name: string;
  icon: string;
}

interface LoreEntry {
  id: string;
  title: string;
  category: string;
  categoryId: string;
  icon: string;
  contentPreview: string;
  unlockStatus: 'unlocked' | 'locked';
}

type ListResponse<T> = T[] | ApiResponse<T[]>;

export default function LoreExplorerScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const isDark = colorScheme === 'dark';
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const categoriesQuery = useQuery({
    queryKey: ['vertical', 'lore-categories'],
    queryFn: async () => {
      const res = await apiClient.get<ListResponse<LoreCategory>>('/v1/vertical/lore/categories');
      return Array.isArray(res) ? res : (res?.data ?? []);
    },
    staleTime: 300_000,
  });

  const loreQuery = useQuery({
    queryKey: ['vertical', 'lore', activeCategory],
    queryFn: async () => {
      const endpoint = activeCategory
        ? `/v1/vertical/lore?category=${activeCategory}`
        : '/v1/vertical/lore';
      const res = await apiClient.get<ListResponse<LoreEntry>>(endpoint);
      return Array.isArray(res) ? res : (res?.data ?? []);
    },
    staleTime: 60_000,
  });

  useEffect(() => {
    if (loreQuery.isSuccess && !loreQuery.isFetching) {
              analytics.verticalLoreExplored(activeCategory || 'all');
    }
  }, [loreQuery.isSuccess, loreQuery.isFetching, activeCategory]);

  const categories = categoriesQuery.data ?? [];
  const entries = loreQuery.data ?? [];

  if (loreQuery.isLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: isDark ? colors.bg.primary : '#fff' }]}
      >
        <LoadingState text="Loading lore..." />
      </SafeAreaView>
    );
  }

  if (loreQuery.error) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: isDark ? colors.bg.primary : '#fff' }]}
      >
        <ErrorState description={loreQuery.error.message} onRetry={() => loreQuery.refetch()} />
      </SafeAreaView>
    );
  }

  if (!entries.length) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: isDark ? colors.bg.primary : '#fff' }]}
      >
        <EmptyState
          icon="📖"
          title="No lore entries"
          description="Discover the rich lore of the vertical universe"
        />
      </SafeAreaView>
    );
  }

  const renderItem = ({ item }: { item: LoreEntry }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: isDark ? colors.bg.tertiary : '#f5f5f5' }]}
      onPress={() => router.push(`/vertical/lore-detail?id=${item.id}`)}
      activeOpacity={0.7}
      disabled={item.unlockStatus === 'locked'}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardIcon}>
          <Text style={styles.cardIconText}>{item.icon}</Text>
        </View>
        <View style={styles.cardTitleWrap}>
          <Text
            style={[
              styles.cardTitle,
              {
                color: item.unlockStatus === 'locked' ? colors.text.tertiary : colors.text.primary,
              },
            ]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <Text style={styles.cardCategory}>{item.category}</Text>
        </View>
        {item.unlockStatus === 'locked' && <Text style={styles.lockIcon}>🔒</Text>}
      </View>
      <Text
        style={[styles.cardPreview, { color: isDark ? colors.text.secondary : '#666' }]}
        numberOfLines={2}
      >
        {item.contentPreview}
      </Text>
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
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Lore Explorer</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesScroll}
      >
        <TouchableOpacity
          style={[styles.categoryChip, !activeCategory && styles.categoryChipActive]}
          onPress={() => setActiveCategory(null)}
        >
          <Text style={[styles.categoryChipText, !activeCategory && styles.categoryChipTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.categoryChip, activeCategory === cat.id && styles.categoryChipActive]}
            onPress={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
          >
            <Text style={styles.categoryChipIcon}>{cat.icon}</Text>
            <Text
              style={[
                styles.categoryChipText,
                activeCategory === cat.id && styles.categoryChipTextActive,
              ]}
            >
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
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
  categoriesScroll: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 10,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.tertiary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  categoryChipActive: {
    backgroundColor: colors.primary[500],
  },
  categoryChipIcon: { fontSize: 14 },
  categoryChipText: { color: colors.text.secondary, fontSize: 13, fontWeight: '500' },
  categoryChipTextActive: { color: '#fff' },
  list: { padding: 16, gap: 12 },
  card: { borderRadius: 14, padding: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primary[500] + '25',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardIconText: { fontSize: 20 },
  cardTitleWrap: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  cardCategory: { fontSize: 12, color: colors.text.tertiary },
  lockIcon: { fontSize: 18 },
  cardPreview: { fontSize: 13, lineHeight: 20 },
});
