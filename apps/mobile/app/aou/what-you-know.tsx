import { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@azeebo/react-data/api/client';
import { LoadingState, ErrorState, EmptyState } from '../../src/components/StateContainers';
import { colors } from '../../src/theme';

interface KnowledgeUnit {
  id: string;
  title: string;
  category: string;
  unlocked: boolean;
  unlockedAt?: string;
  description?: string;
}

interface WhatYouKnowResponse {
  units: KnowledgeUnit[];
  totalUnlocked: number;
  totalUnits: number;
}

export default function WhatYouKnowScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const isDark = colorScheme === 'dark';

  const {
    data,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery<WhatYouKnowResponse>({
    queryKey: ['mobile', 'aou', 'what-you-know'],
    queryFn: async () => {
      const res = await apiClient.get<WhatYouKnowResponse | { data: WhatYouKnowResponse }>(
        '/v1/knowledge/what-you-know'
      );
      if ('data' in res && res.data) {
        return res.data;
      }
      return res as WhatYouKnowResponse;
    },
  });

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: isDark ? colors.bg.primary : '#fff' }]}
      >
        <LoadingState text="Accessing Knowledge Codex..." />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: isDark ? colors.bg.primary : '#fff' }]}
      >
        <ErrorState
          title="Codex Unavailable"
          description="Could not load your unlocked knowledge. Please try again."
          onRetry={refetch}
        />
      </SafeAreaView>
    );
  }

  const units = data?.units ?? [];
  const totalUnlocked = data?.totalUnlocked ?? 0;
  const totalUnits = data?.totalUnits ?? (units.length || 1);
  const completionPercent = Math.round((totalUnlocked / totalUnits) * 100);

  // Group by category
  const categories = units.reduce(
    (acc, unit) => {
      const cat = unit.category || 'General Lore';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(unit);
      return acc;
    },
    {} as Record<string, KnowledgeUnit[]>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: isDark ? colors.bg.primary : '#0a0a0f' }]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={onRefresh}
            tintColor={colors.primary[500]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
            What You Know
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Hero Progress Banner */}
        <View style={styles.heroCard}>
          <Text style={styles.eyebrow}>AGBALÁ CANONICAL CODEX</Text>
          <Text style={styles.heroTitle}>Your Unlocked Lore</Text>
          <Text style={styles.heroSubtitle}>
            Spoiler-safe compendium of revelations and ancient truths unlocked through your viewing.
          </Text>

          <View style={styles.progressRow}>
            <View style={styles.progressBarBackground}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${Math.min(100, Math.max(5, completionPercent))}%` },
                ]}
              />
            </View>
            <Text style={styles.percentText}>{completionPercent}%</Text>
          </View>
          <Text style={styles.statsCaption}>
            {totalUnlocked} of {totalUnits} revelations unlocked
          </Text>
        </View>

        {/* Units List */}
        {Object.keys(categories).length === 0 ? (
          <EmptyState
            icon="book-outline"
            title="Codex Empty"
            description="Watch episodes and participate in story quests to unlock canonical knowledge units."
          />
        ) : (
          <View style={styles.content}>
            {Object.entries(categories).map(([category, items]) => (
              <View key={category} style={styles.categorySection}>
                <View style={styles.categoryHeader}>
                  <Text style={styles.categoryIcon}>✨</Text>
                  <Text style={styles.categoryTitle}>{category.toUpperCase()}</Text>
                </View>

                {items.map((item) => (
                  <View
                    key={item.id}
                    style={[
                      styles.unitCard,
                      {
                        backgroundColor: item.unlocked
                          ? isDark
                            ? colors.bg.tertiary
                            : '#1a1a24'
                          : isDark
                          ? colors.bg.secondary + '40'
                          : '#12121a',
                        borderColor: item.unlocked
                          ? colors.primary[500] + '40'
                          : colors.border.subtle,
                      },
                    ]}
                  >
                    <View style={styles.unitHeader}>
                      <Text
                        style={[
                          styles.unitTitle,
                          { color: item.unlocked ? colors.text.primary : colors.text.tertiary },
                        ]}
                      >
                        {item.title}
                      </Text>
                      <View
                        style={[
                          styles.badge,
                          {
                            backgroundColor: item.unlocked
                              ? colors.primary[500] + '25'
                              : 'rgba(255,255,255,0.06)',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.badgeText,
                            {
                              color: item.unlocked
                                ? colors.primary[500]
                                : colors.text.tertiary,
                            },
                          ]}
                        >
                          {item.unlocked ? '✓ Unlocked' : '🔒 Locked'}
                        </Text>
                      </View>
                    </View>

                    {item.unlocked ? (
                      item.description ? (
                        <Text style={styles.unitDesc}>{item.description}</Text>
                      ) : null
                    ) : (
                      <Text style={styles.unitLockedDesc}>
                        Watch corresponding episodes to reveal this canonical truth.
                      </Text>
                    )}

                    {item.unlocked && item.unlockedAt && (
                      <Text style={styles.unlockedDate}>
                        Unlocked on {new Date(item.unlockedAt).toLocaleDateString()}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  heroCard: {
    margin: 16,
    padding: 20,
    borderRadius: 16,
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '800',
    color: '#F59E0B',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 13,
    color: colors.text.secondary,
    lineHeight: 18,
    marginBottom: 16,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  progressBarBackground: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 4,
  },
  percentText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F59E0B',
  },
  statsCaption: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
  content: {
    paddingHorizontal: 16,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  categoryIcon: {
    fontSize: 16,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text.primary,
    letterSpacing: 1,
  },
  unitCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  unitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  unitTitle: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  unitDesc: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.text.secondary,
    marginBottom: 8,
  },
  unitLockedDesc: {
    fontSize: 12,
    fontStyle: 'italic',
    color: colors.text.tertiary,
  },
  unlockedDate: {
    fontSize: 11,
    color: colors.text.tertiary,
    marginTop: 4,
  },
});
