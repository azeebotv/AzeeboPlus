import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useColorScheme } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../src/theme';
import { apiClient } from '../../src/api/client';
import { LoadingState, ErrorState } from '../../src/components/StateContainers';
import { analytics } from '../../src/utils/analytics';

interface LoreDetail {
  id: string;
  title: string;
  category: string;
  categoryIcon: string;
  content: string;
  relatedEntries: { id: string; title: string; icon: string; category: string }[];
}

export default function LoreDetailScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isDark = colorScheme === 'dark';
  const [data, setData] = useState<LoreDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!id) {
      setError('No lore ID provided');
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<LoreDetail>(`/v1/vertical/lore/${id}`);
      setData(res);
      try { analytics.verticalLoreExplored(res.id); } catch {}
    } catch {
      setError('Failed to load lore');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? colors.bg.primary : '#fff' }]}>
        <LoadingState text="Loading lore..." />
      </SafeAreaView>
    );
  }

  if (error || !data) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? colors.bg.primary : '#fff' }]}>
        <ErrorState description={error || 'Lore not found'} onRetry={fetchData} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? colors.bg.primary : '#fff' }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text.primary }]} numberOfLines={1}>
            Lore Detail
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Text style={styles.heroIconText}>{data.categoryIcon}</Text>
          </View>
          <View style={styles.badgeRow}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{data.category}</Text>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.text.primary }]}>{data.title}</Text>
          <Text style={[styles.bodyText, { color: isDark ? colors.text.secondary : '#666' }]}>
            {data.content}
          </Text>
        </View>

        {data.relatedEntries.length > 0 && (
          <View style={styles.content}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Related Lore</Text>
            {data.relatedEntries.map((entry) => (
              <TouchableOpacity
                key={entry.id}
                style={[styles.relatedCard, { backgroundColor: isDark ? colors.bg.tertiary : '#f5f5f5' }]}
                onPress={() => router.push(`/vertical/lore-detail?id=${entry.id}`)}
              >
                <View style={styles.relatedIcon}>
                  <Text style={styles.relatedIconText}>{entry.icon}</Text>
                </View>
                <View style={styles.relatedInfo}>
                  <Text style={[styles.relatedTitle, { color: colors.text.primary }]}>{entry.title}</Text>
                  <Text style={styles.relatedCategory}>{entry.category}</Text>
                </View>
                <Text style={styles.relatedArrow}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
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
  headerTitle: { fontSize: 18, fontWeight: '700', flex: 1, textAlign: 'center' },
  hero: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: colors.bg.tertiary,
  },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: colors.primary[500] + '25',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroIconText: { fontSize: 40 },
  badgeRow: { flexDirection: 'row', gap: 10 },
  categoryBadge: {
    backgroundColor: colors.primary[500],
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  categoryBadgeText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  content: { padding: 16 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 16 },
  bodyText: { fontSize: 15, lineHeight: 26 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  relatedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  relatedIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primary[500] + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  relatedIconText: { fontSize: 20 },
  relatedInfo: { flex: 1 },
  relatedTitle: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  relatedCategory: { fontSize: 12, color: colors.text.tertiary },
  relatedArrow: { color: colors.text.secondary, fontSize: 24 },
});
