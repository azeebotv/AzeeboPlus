import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors } from '../src/theme';
import { apiClient } from '../src/api/client';
import { LoadingState, ErrorState } from '../src/components/StateContainers';

interface CharacterData {
  id: string;
  name: string;
  role: string;
  description: string;
  avatar: string;
  background: string;
  stats: { label: string; value: string }[];
  relationships: { name: string; type: string; avatar: string }[];
}

interface LoreChapter {
  id: string;
  title: string;
  summary: string;
  unlocked: boolean;
}

export default function CharacterLoreScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isDark = colorScheme === 'dark';
  const [activeTab, setActiveTab] = useState('story');
  const [character, setCharacter] = useState<CharacterData | null>(null);
  const [loreChapters, setLoreChapters] = useState<LoreChapter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!id) {
      setError('No character ID provided');
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const [charRes, loreRes] = await Promise.all([
        apiClient.get<CharacterData>(`/vertical/characters/${id}`),
        apiClient.get<LoreChapter[]>(`/vertical/characters/${id}/lore`),
      ]);
      setCharacter(charRes);
      setLoreChapters(loreRes);
    } catch {
      setError('Failed to load character data');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) {
    return <LoadingState text="Loading character..." />;
  }

  if (error || !character) {
    return <ErrorState description={error || 'Character not found'} onRetry={fetchData} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={[styles.scrollView, { backgroundColor: isDark ? colors.bg.primary : '#FFFFFF' }]}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Character Lore</Text>
          <View style={styles.shareButton}>
            <Text style={styles.shareIcon}>📤</Text>
          </View>
        </View>

        <View style={[styles.heroSection, { backgroundColor: character.background }]}>
          <View style={styles.heroAvatar}>
            <Text style={styles.heroAvatarText}>{character.avatar}</Text>
          </View>
          <Text style={styles.heroName}>{character.name}</Text>
          <Text style={styles.heroRole}>{character.role}</Text>
        </View>

        <View style={styles.tabBar}>
          {['story', 'stats', 'relationships', 'lore'].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === 'story' && (
          <View style={styles.storySection}>
            <View style={styles.storyCard}>
              <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Story</Text>
              <Text
                style={[
                  styles.storyText,
                  { color: isDark ? colors.text.secondary : colors.dark[600] },
                ]}
              >
                {character.description}
              </Text>
            </View>
          </View>
        )}

        {activeTab === 'stats' && (
          <View style={styles.statsSection}>
            <View style={styles.statsCard}>
              <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Attributes</Text>
              <View style={styles.statsList}>
                {character.stats.map((stat, index) => (
                  <View key={index} style={styles.statItem}>
                    <View style={styles.statHeader}>
                      <Text
                        style={[
                          styles.statLabel,
                          { color: isDark ? colors.text.secondary : colors.dark[600] },
                        ]}
                      >
                        {stat.label}
                      </Text>
                      <Text style={[styles.statValue, { color: colors.text.primary }]}>
                        {stat.value}
                      </Text>
                    </View>
                    <View style={styles.statBar}>
                      <View
                        style={[
                          styles.statBarFill,
                          { width: `${stat.value}%` as any, backgroundColor: character.background },
                        ]}
                      />
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {activeTab === 'relationships' && (
          <View style={styles.relationshipsSection}>
            <View style={styles.relationshipsCard}>
              <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                Relationships
              </Text>
              <View style={styles.relationshipsList}>
                {character.relationships.map((rel, index) => (
                  <TouchableOpacity key={index} style={styles.relationshipItem}>
                    <View style={styles.relAvatar}>
                      <Text style={styles.relAvatarText}>{rel.avatar}</Text>
                    </View>
                    <View style={styles.relInfo}>
                      <Text style={[styles.relName, { color: colors.text.primary }]}>
                        {rel.name}
                      </Text>
                      <Text style={styles.relType}>{rel.type}</Text>
                    </View>
                    <Text style={styles.relArrow}>›</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}

        {activeTab === 'lore' && (
          <View style={styles.loreSection}>
            <View style={styles.loreCard}>
              <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                Lore Chapters
              </Text>
              <View style={styles.loreList}>
                {loreChapters.map((chapter) => (
                  <TouchableOpacity
                    key={chapter.id}
                    style={[styles.loreItem, !chapter.unlocked && styles.loreItemLocked]}
                    disabled={!chapter.unlocked}
                  >
                    <View style={styles.loreIconContainer}>
                      <Text style={styles.loreIcon}>{chapter.unlocked ? '📖' : '🔒'}</Text>
                    </View>
                    <View style={styles.loreInfo}>
                      <Text
                        style={[
                          styles.loreTitle,
                          { color: colors.text.primary },
                          !chapter.unlocked && styles.loreTextLocked,
                        ]}
                      >
                        {chapter.title}
                      </Text>
                      <Text
                        style={[
                          styles.loreSummary,
                          { color: isDark ? colors.text.secondary : colors.dark[600] },
                          !chapter.unlocked && styles.loreTextLocked,
                        ]}
                      >
                        {chapter.summary}
                      </Text>
                    </View>
                    {chapter.unlocked && <Text style={styles.loreArrow}>›</Text>}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
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
    backgroundColor: colors.bg.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    color: colors.text.primary,
    fontSize: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bg.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareIcon: {
    fontSize: 18,
  },
  heroSection: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  heroAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroAvatarText: {
    fontSize: 64,
  },
  heroName: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  heroRole: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    fontWeight: '500',
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 8,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: colors.bg.secondary,
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: colors.primary[500],
  },
  tabText: {
    color: colors.text.secondary,
    fontSize: 13,
    fontWeight: '500',
  },
  tabTextActive: {
    color: colors.text.primary,
    fontWeight: '600',
  },
  storySection: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  storyCard: {
    backgroundColor: colors.bg.secondary,
    borderRadius: 16,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  storyText: {
    fontSize: 15,
    lineHeight: 24,
  },
  statsSection: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  statsCard: {
    backgroundColor: colors.bg.secondary,
    borderRadius: 16,
    padding: 20,
  },
  statsList: {
    gap: 20,
  },
  statItem: {
    gap: 8,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  statBar: {
    height: 8,
    backgroundColor: colors.bg.tertiary,
    borderRadius: 4,
    overflow: 'hidden',
  },
  statBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  relationshipsSection: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  relationshipsCard: {
    backgroundColor: colors.bg.secondary,
    borderRadius: 16,
    padding: 20,
  },
  relationshipsList: {
    gap: 12,
  },
  relationshipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: colors.bg.tertiary,
    borderRadius: 12,
  },
  relAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  relAvatarText: {
    fontSize: 24,
  },
  relInfo: {
    flex: 1,
  },
  relName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  relType: {
    color: colors.primary[500],
    fontSize: 12,
    fontWeight: '500',
  },
  relArrow: {
    color: colors.text.secondary,
    fontSize: 24,
  },
  loreSection: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  loreCard: {
    backgroundColor: colors.bg.secondary,
    borderRadius: 16,
    padding: 20,
  },
  loreList: {
    gap: 12,
  },
  loreItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: colors.bg.tertiary,
    borderRadius: 12,
  },
  loreItemLocked: {
    opacity: 0.5,
  },
  loreIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.primary[500] + '30',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  loreIcon: {
    fontSize: 24,
  },
  loreInfo: {
    flex: 1,
  },
  loreTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  loreSummary: {
    fontSize: 13,
  },
  loreTextLocked: {
    color: colors.text.tertiary,
  },
  loreArrow: {
    color: colors.text.secondary,
    fontSize: 24,
  },
});
