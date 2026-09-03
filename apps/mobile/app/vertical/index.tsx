import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radius } from '../../src/theme';
import { apiClient } from '../../src/api/client';

import { analytics } from '../../src/utils/analytics';

interface VerticalStats {
  titlesCount: number;
  charactersCount: number;
  storyworldsCount: number;
  loreCount: number;
  crossoversCount: number;
}

const SECTIONS = [
  { id: 'titles', label: 'Titles', icon: '📖', desc: 'Explore story titles', route: '/vertical/titles' },
  { id: 'characters', label: 'Characters', icon: '🧑', desc: 'Meet the cast', route: '/vertical/characters' },
  { id: 'storyworlds', label: 'Storyworlds', icon: '🌍', desc: 'Discover connected worlds', route: '/vertical/storyworlds' },
  { id: 'lore', label: 'Lore', icon: '📜', desc: 'Deep dive into lore', route: '/vertical/lore' },
  { id: 'crossovers', label: 'Crossovers', icon: '🔀', desc: 'Cross-universe events', route: '/vertical/crossovers' },
  { id: 'timeline', label: 'Timeline', icon: '⏳', desc: 'Chronological events', route: '/vertical/timeline' },
  { id: 'agbala', label: 'Agbala', icon: '🦁', desc: 'The Agbala storyworld', route: '/vertical/agbala' },
];

export default function VerticalHubScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const isDark = colorScheme === 'dark';
  const [stats, setStats] = useState<VerticalStats | null>(null);
  const [, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await apiClient.get<{ data: VerticalStats }>('/v1/vertical/stats');
        setStats(res?.data ?? null);
      } catch {
        // Stats are optional
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
    analytics.lifestyleFeedViewed();
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? colors.bg.primary : '#fff' }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.universeLabel, { color: colors.primary[500] }]}>📖 Vertical</Text>
          <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
            Vertical Universe
          </Text>
          {stats && (
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.primary[500] }]}>{stats.titlesCount}</Text>
                <Text style={[styles.statLabel, { color: colors.text.tertiary }]}>Titles</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.border.subtle }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.primary[500] }]}>{stats.charactersCount}</Text>
                <Text style={[styles.statLabel, { color: colors.text.tertiary }]}>Characters</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.border.subtle }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.primary[500] }]}>{stats.storyworldsCount}</Text>
                <Text style={[styles.statLabel, { color: colors.text.tertiary }]}>Worlds</Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.sectionList}>
          {SECTIONS.map((section) => (
            <TouchableOpacity
              key={section.id}
              style={[styles.sectionCard, { backgroundColor: isDark ? colors.bg.tertiary : '#f5f5f5' }]}
              onPress={() => router.push(section.route as any)}
              activeOpacity={0.7}
            >
              <View style={styles.sectionIcon}>
                <Text style={styles.sectionIconText}>{section.icon}</Text>
              </View>
              <View style={styles.sectionInfo}>
                <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>{section.label}</Text>
                <Text style={[styles.sectionDesc, { color: colors.text.tertiary }]}>{section.desc}</Text>
              </View>
              <Text style={[styles.sectionArrow, { color: colors.text.secondary }]}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: spacing.lg, paddingTop: 40 },
  universeLabel: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  headerTitle: { fontSize: 28, fontWeight: '700', marginBottom: 16 },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 24 },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '700' },
  statLabel: { fontSize: 12 },
  statDivider: { width: 1, height: 30 },
  sectionList: { padding: spacing.lg, gap: 12 },
  sectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: radius.lg,
    gap: 14,
  },
  sectionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.primary[500] + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionIconText: { fontSize: 22 },
  sectionInfo: { flex: 1 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  sectionDesc: { fontSize: 13 },
  sectionArrow: { fontSize: 24 },
});
