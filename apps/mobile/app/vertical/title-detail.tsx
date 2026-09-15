import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useColorScheme } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../src/theme';
import { apiClient } from '@azeebo/react-data/api/client';
import { LoadingState, ErrorState } from '../../src/components/StateContainers';
import { analytics } from '../../src/utils/analytics';

interface TitleDetail {
  id: string;
  title: string;
  genre: string;
  description: string;
  status: string;
  emoji: string;
  characters: { id: string; name: string; avatar: string; role: string }[];
  episodes: { id: string; title: string; episodeNumber: number; seasonNumber: number }[];
}

export default function TitleDetailScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isDark = colorScheme === 'dark';
  const [activeTab, setActiveTab] = useState('overview');
  const [data, setData] = useState<TitleDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!id) {
      setError('No title ID');
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const res = await apiClient.get<TitleDetail>(`/v1/vertical/titles/${id}`);
      setData(res);
      analytics.verticalTitleViewed(res.id);
    } catch {
      setError('Failed to load title');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'characters', label: 'Characters' },
    { id: 'episodes', label: 'Episodes' },
  ];

  if (isLoading)
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: isDark ? colors.bg.primary : '#fff' }]}
      >
        <LoadingState text="Loading..." />
      </SafeAreaView>
    );
  if (error || !data)
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: isDark ? colors.bg.primary : '#fff' }]}
      >
        <ErrorState description={error || 'Not found'} onRetry={fetchData} />
      </SafeAreaView>
    );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: isDark ? colors.bg.primary : '#fff' }]}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text.primary }]} numberOfLines={1}>
            {data.title}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.hero}>
          <Text style={styles.heroEmoji}>{data.emoji}</Text>
          <Text style={[styles.heroTitle, { color: colors.text.primary }]}>{data.title}</Text>
          <Text style={[styles.heroGenre, { color: colors.primary[500] }]}>{data.genre}</Text>
          <View style={[styles.statusBadge, data.status === 'active' && styles.statusActive]}>
            <Text style={[styles.statusText, data.status === 'active' && styles.statusTextActive]}>
              {data.status}
            </Text>
          </View>
          <Text style={[styles.heroDesc, { color: isDark ? colors.text.secondary : '#666' }]}>
            {data.description}
          </Text>
        </View>

        <View style={styles.tabsBar}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, activeTab === tab.id && styles.tabActive]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.content}>
          {activeTab === 'overview' && (
            <View>
              <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>About</Text>
              <Text style={[styles.aboutText, { color: isDark ? colors.text.secondary : '#666' }]}>
                {data.description}
              </Text>
              <View style={styles.infoGrid}>
                <View
                  style={[
                    styles.infoItem,
                    { backgroundColor: isDark ? colors.bg.tertiary : '#f5f5f5' },
                  ]}
                >
                  <Text style={[styles.infoValue, { color: colors.text.primary }]}>
                    {data.characters.length}
                  </Text>
                  <Text style={[styles.infoLabel, { color: colors.text.tertiary }]}>
                    Characters
                  </Text>
                </View>
                <View
                  style={[
                    styles.infoItem,
                    { backgroundColor: isDark ? colors.bg.tertiary : '#f5f5f5' },
                  ]}
                >
                  <Text style={[styles.infoValue, { color: colors.text.primary }]}>
                    {data.episodes.length}
                  </Text>
                  <Text style={[styles.infoLabel, { color: colors.text.tertiary }]}>Episodes</Text>
                </View>
              </View>
            </View>
          )}

          {activeTab === 'characters' && (
            <View>
              {data.characters.map((char) => (
                <TouchableOpacity
                  key={char.id}
                  style={[
                    styles.listItem,
                    { backgroundColor: isDark ? colors.bg.tertiary : '#f5f5f5' },
                  ]}
                  onPress={() => router.push(`/vertical/character-detail?id=${char.id}`)}
                >
                  <Text style={styles.listEmoji}>{char.avatar}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.listTitle, { color: colors.text.primary }]}>
                      {char.name}
                    </Text>
                    <Text style={styles.listSub}>{char.role}</Text>
                  </View>
                  <Text style={[styles.listArrow, { color: colors.text.secondary }]}>›</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {activeTab === 'episodes' && (
            <View>
              {data.episodes.map((ep) => (
                <View
                  key={ep.id}
                  style={[
                    styles.listItem,
                    { backgroundColor: isDark ? colors.bg.tertiary : '#f5f5f5' },
                  ]}
                >
                  <View style={[styles.epNumber, { backgroundColor: colors.primary[500] + '25' }]}>
                    <Text style={[styles.epNumberText, { color: colors.primary[500] }]}>
                      E{ep.episodeNumber}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.listTitle, { color: colors.text.primary }]}>
                      {ep.title}
                    </Text>
                    <Text style={styles.listSub}>Season {ep.seasonNumber}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

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
  hero: { padding: 16, alignItems: 'center', paddingBottom: 24 },
  heroEmoji: { fontSize: 64, marginBottom: 12 },
  heroTitle: { fontSize: 28, fontWeight: '700', marginBottom: 4, textAlign: 'center' },
  heroGenre: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: colors.bg.tertiary,
    marginBottom: 12,
  },
  statusActive: { backgroundColor: colors.alpha.success25 },
  statusText: { fontSize: 12, fontWeight: '600', color: colors.text.tertiary },
  statusTextActive: { color: '#22C55E' },
  heroDesc: { fontSize: 14, lineHeight: 22, textAlign: 'center' },
  tabsBar: {
    flexDirection: 'row',
    backgroundColor: colors.bg.tertiary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
    paddingHorizontal: 12,
  },
  tab: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: colors.primary[500] },
  tabText: { color: colors.text.tertiary, fontSize: 14, fontWeight: '600' },
  tabTextActive: { color: colors.primary[500] },
  content: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  aboutText: { fontSize: 14, lineHeight: 22, marginBottom: 16 },
  infoGrid: { flexDirection: 'row', gap: 12 },
  infoItem: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center' },
  infoValue: { fontSize: 24, fontWeight: '700', marginBottom: 4 },
  infoLabel: { fontSize: 12 },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    gap: 12,
  },
  listEmoji: { fontSize: 24 },
  listTitle: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  listSub: { fontSize: 12, color: colors.text.tertiary },
  listArrow: { fontSize: 24 },
  epNumber: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  epNumberText: { fontSize: 13, fontWeight: '700' },
});
