import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useColorScheme } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, defaultImages } from '../../src/theme';
import { apiClient } from '../../src/api/client';
import { LoadingState, ErrorState } from '../../src/components/StateContainers';
import { analytics } from '../../src/utils/analytics';

const PLACEHOLDER_AVATAR = defaultImages.avatar;

interface CharacterDetail {
  id: string;
  name: string;
  description: string;
  avatar: string;
  heroImage: string;
  role: string;
  background: string;
  relationships: { id: string; name: string; type: string; avatar: string }[];
  appearances: { id: string; title: string; emoji: string; episodeCount: number }[];
  timelineEvents: { id: string; date: string; title: string; description: string }[];
}

export default function CharacterDetailScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isDark = colorScheme === 'dark';
  const [activeTab, setActiveTab] = useState('overview');
  const [data, setData] = useState<CharacterDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'relationships', label: 'Relationships' },
    { id: 'appearances', label: 'Appearances' },
    { id: 'timeline', label: 'Timeline' },
  ];

  const fetchData = useCallback(async () => {
    if (!id) {
      setError('No character ID provided');
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<CharacterDetail>(`/v1/vertical/characters/${id}`);
      setData(res);
              analytics.verticalCharacterViewed(res.id);
    } catch {
      setError('Failed to load character');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: isDark ? colors.bg.primary : '#fff' }]}
      >
        <LoadingState text="Loading character..." />
      </SafeAreaView>
    );
  }

  if (error || !data) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: isDark ? colors.bg.primary : '#fff' }]}
      >
        <ErrorState description={error || 'Character not found'} onRetry={fetchData} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: isDark ? colors.bg.primary : '#fff' }]}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          <Image source={{ uri: data.heroImage || PLACEHOLDER_AVATAR }} style={styles.heroImage} />
          <View style={styles.heroOverlay}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.heroContent}>
            <View style={styles.avatarWrap}>
              <Image source={{ uri: data.avatar || PLACEHOLDER_AVATAR }} style={styles.avatar} />
            </View>
            <Text style={styles.charName}>{data.name}</Text>
            <Text style={styles.charRole}>{data.role}</Text>
          </View>
        </View>

        <View style={styles.tabsBar}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabs}
          >
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
          </ScrollView>
        </View>

        <View style={styles.content}>
          {activeTab === 'overview' && (
            <View>
              <Text style={[styles.bodyText, { color: isDark ? colors.text.secondary : '#666' }]}>
                {data.description}
              </Text>
              {data.background && (
                <View style={styles.infoCard}>
                  <Text style={[styles.infoLabel, { color: colors.text.secondary }]}>
                    Background
                  </Text>
                  <Text style={[styles.infoValue, { color: colors.text.primary }]}>
                    {data.background}
                  </Text>
                </View>
              )}
            </View>
          )}

          {activeTab === 'relationships' && (
            <View>
              {data.relationships.map((rel) => (
                <TouchableOpacity
                  key={rel.id}
                  style={[
                    styles.relCard,
                    { backgroundColor: isDark ? colors.bg.tertiary : '#f5f5f5' },
                  ]}
                  onPress={() => router.push(`/vertical/character-detail?id=${rel.id}`)}
                >
                  <Image
                    source={{ uri: rel.avatar || PLACEHOLDER_AVATAR }}
                    style={styles.relAvatar}
                  />
                  <View style={styles.relInfo}>
                    <Text style={[styles.relName, { color: colors.text.primary }]}>{rel.name}</Text>
                    <Text style={styles.relType}>{rel.type}</Text>
                  </View>
                  <Text style={styles.relArrow}>›</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {activeTab === 'appearances' && (
            <View>
              {data.appearances.map((app) => (
                <TouchableOpacity
                  key={app.id}
                  style={[
                    styles.appearCard,
                    { backgroundColor: isDark ? colors.bg.tertiary : '#f5f5f5' },
                  ]}
                  onPress={() => router.push(`/vertical-title?id=${app.id}`)}
                >
                  <Text style={styles.appearEmoji}>{app.emoji}</Text>
                  <View style={styles.appearInfo}>
                    <Text style={[styles.appearTitle, { color: colors.text.primary }]}>
                      {app.title}
                    </Text>
                    <Text style={styles.appearCount}>{app.episodeCount} episodes</Text>
                  </View>
                  <Text style={styles.appearArrow}>›</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {activeTab === 'timeline' && (
            <View>
              {data.timelineEvents.map((event, index) => (
                <View key={event.id} style={styles.tlItem}>
                  <View style={styles.tlMarker}>
                    <View style={styles.tlDot} />
                    {index < data.timelineEvents.length - 1 && <View style={styles.tlLine} />}
                  </View>
                  <View style={styles.tlContent}>
                    <Text style={styles.tlDate}>{event.date}</Text>
                    <Text style={[styles.tlTitle, { color: colors.text.primary }]}>
                      {event.title}
                    </Text>
                    <Text
                      style={[styles.tlDesc, { color: isDark ? colors.text.secondary : '#666' }]}
                    >
                      {event.description}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  heroSection: { position: 'relative' },
  heroImage: { width: '100%', height: 260, resizeMode: 'cover' },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingTop: 40,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { color: '#fff', fontSize: 20 },
  heroContent: {
    alignItems: 'center',
    marginTop: -40,
    paddingHorizontal: 16,
  },
  avatarWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 4,
    borderColor: colors.bg.primary,
    overflow: 'hidden',
    marginBottom: 12,
  },
  avatar: { width: '100%', height: '100%', resizeMode: 'cover' },
  charName: { fontSize: 24, fontWeight: '700', color: colors.text.primary, textAlign: 'center' },
  charRole: { fontSize: 14, color: colors.primary[500], fontWeight: '600', marginTop: 4 },
  tabsBar: {
    backgroundColor: colors.bg.tertiary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  tabs: { paddingHorizontal: 12, gap: 4 },
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
  bodyText: { fontSize: 15, lineHeight: 24, marginBottom: 16 },
  infoCard: {
    backgroundColor: colors.bg.tertiary,
    borderRadius: 12,
    padding: 16,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: { fontSize: 14, lineHeight: 22 },
  relCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  relAvatar: { width: 48, height: 48, borderRadius: 24, marginRight: 12 },
  relInfo: { flex: 1 },
  relName: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  relType: { fontSize: 12, color: colors.primary[500], fontWeight: '500' },
  relArrow: { color: colors.text.secondary, fontSize: 24 },
  appearCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  appearEmoji: { fontSize: 28, marginRight: 12 },
  appearInfo: { flex: 1 },
  appearTitle: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  appearCount: { fontSize: 12, color: colors.text.tertiary },
  appearArrow: { color: colors.text.secondary, fontSize: 24 },
  tlItem: { flexDirection: 'row', gap: 16 },
  tlMarker: { alignItems: 'center' },
  tlDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.primary[500] },
  tlLine: { width: 2, flex: 1, backgroundColor: colors.bg.surface, marginVertical: 8 },
  tlContent: { flex: 1, paddingBottom: 20 },
  tlDate: { fontSize: 12, color: colors.text.tertiary, marginBottom: 4 },
  tlTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  tlDesc: { fontSize: 13, lineHeight: 18 },
});
