import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useColorScheme } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiClient } from '@azeebo/react-data/api/client';
import { LoadingState, ErrorState } from '../src/components/StateContainers';
import { analytics } from '../src/utils/analytics';
import { defaultImages, colors } from '../src/theme';

const PLACEHOLDER_IMAGE = defaultImages.thumbnail;

interface TitleData {
  id: string;
  title: string;
  genre: string;
  universe: string;
  thumbnail: string;
  rating: number;
  year: number;
  seasons: number;
  episodes: number;
  status: string;
  synopsis: string;
  cast: string[];
}

interface CharacterItem {
  id: string;
  name: string;
  actor: string;
  role: string;
  avatar: string;
  description: string;
}

interface LoreItem {
  id: string;
  title: string;
  icon: string;
  content: string;
}

interface TimelineItem {
  id: string;
  episode: string;
  title: string;
  year: string;
  description: string;
}

export default function VerticalTitleScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isDark = colorScheme === 'dark';
  const [activeTab, setActiveTab] = useState('overview');
  const [isFollowing, setIsFollowing] = useState(false);
  const [titleData, setTitleData] = useState<TitleData | null>(null);
  const [characters, setCharacters] = useState<CharacterItem[]>([]);
  const [loreData, setLoreData] = useState<LoreItem[]>([]);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'characters', label: 'Characters' },
    { id: 'lore', label: 'Lore' },
    { id: 'timeline', label: 'Timeline' },
  ];

  const fetchData = useCallback(async () => {
    if (!id) {
      setError('No title ID provided');
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const [titleRes, charsRes, loreRes, timelineRes] = await Promise.all([
        apiClient.get<TitleData>(`/vertical/titles/${id}`),
        apiClient.get<CharacterItem[]>(`/vertical/titles/${id}/characters`),
        apiClient.get<LoreItem[]>(`/vertical/titles/${id}/lore`),
        apiClient.get<TimelineItem[]>(`/vertical/titles/${id}/timeline`),
      ]);
      setTitleData(titleRes);
      analytics.verticalTitleViewed(titleRes.id);
      setCharacters(charsRes);
      setLoreData(loreRes);
      setTimeline(timelineRes);
    } catch {
      setError('Failed to load title data');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingState text="Loading title..." />
      </SafeAreaView>
    );
  }

  if (error || !titleData) {
    return (
      <SafeAreaView style={styles.container}>
        <ErrorState description={error || 'Title not found'} onRetry={fetchData} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={[{ flex: 1 }, { backgroundColor: isDark ? '#1A0A0A' : '#ffffff' }]}>
        <View style={styles.heroSection}>
          <Image
            source={{ uri: titleData.thumbnail || PLACEHOLDER_IMAGE }}
            style={styles.heroImage}
          />
          <View style={styles.heroOverlay}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
            <View style={styles.heroContent}>
              <View style={styles.badges}>
                <View style={styles.genreBadge}>
                  <Text style={styles.genreText}>{titleData.genre}</Text>
                </View>
                <View style={styles.ratingBadge}>
                  <Text style={styles.ratingText}>⭐ {titleData.rating}</Text>
                </View>
              </View>
              <Text style={styles.heroTitle}>{titleData.title}</Text>
              <View style={styles.metaRow}>
                <Text style={styles.metaText}>{titleData.year}</Text>
                <Text style={styles.metaDot}>•</Text>
                <Text style={styles.metaText}>{titleData.seasons} Seasons</Text>
                <Text style={styles.metaDot}>•</Text>
                <Text style={styles.metaText}>{titleData.episodes} Episodes</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.followButton, isFollowing && styles.followButtonActive]}
            onPress={() => setIsFollowing(!isFollowing)}
          >
            <Text style={[styles.followButtonText, isFollowing && styles.followButtonTextActive]}>
              {isFollowing ? '✓ Following' : '+ Follow'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.watchButton}>
            <Text style={styles.watchButtonText}>▶ Watch Now</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shareButton}>
            <Text style={styles.shareIcon}>↗️</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tabsContainer}>
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
              <Text
                style={[
                  styles.statusBadge,
                  { color: titleData.status === 'Ongoing' ? '#10B981' : '#888' },
                ]}
              >
                {titleData.status}
              </Text>
              <Text style={[styles.synopsis, { color: isDark ? '#ffffff' : '#1A0A0A' }]}>
                {titleData.synopsis}
              </Text>
              <View style={styles.castSection}>
                <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#1A0A0A' }]}>
                  Cast
                </Text>
                <View style={styles.castList}>
                  {titleData.cast.map((actor, index) => (
                    <View key={index} style={styles.castItem}>
                      <View style={styles.castAvatar}>
                        <Text style={styles.castAvatarText}>{actor[0]}</Text>
                      </View>
                      <Text style={styles.castName}>{actor}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}

          {activeTab === 'characters' && (
            <View style={styles.charactersList}>
              {characters.map((character) => (
                <TouchableOpacity key={character.id} style={styles.characterCard}>
                  <View style={styles.characterAvatar}>
                    <Text style={styles.characterAvatarText}>{character.avatar}</Text>
                  </View>
                  <View style={styles.characterInfo}>
                    <Text style={[styles.characterName, { color: isDark ? '#ffffff' : '#1A0A0A' }]}>
                      {character.name}
                    </Text>
                    <Text style={styles.characterRole}>{character.role}</Text>
                    <Text style={styles.characterActor}>Played by {character.actor}</Text>
                    <Text style={styles.characterDescription}>{character.description}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {activeTab === 'lore' && (
            <View style={styles.loreList}>
              {loreData.map((item) => (
                <View key={item.id} style={styles.loreCard}>
                  <View style={styles.loreIcon}>
                    <Text style={styles.loreIconText}>{item.icon}</Text>
                  </View>
                  <View style={styles.loreContent}>
                    <Text style={[styles.loreTitle, { color: isDark ? '#ffffff' : '#1A0A0A' }]}>
                      {item.title}
                    </Text>
                    <Text style={styles.loreText}>{item.content}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {activeTab === 'timeline' && (
            <View style={styles.timeline}>
              {timeline.map((item, index) => (
                <View key={item.id} style={styles.timelineItem}>
                  <View style={styles.timelineMarker}>
                    <View style={styles.timelineDot} />
                    {index < timeline.length - 1 && <View style={styles.timelineLine} />}
                  </View>
                  <View style={styles.timelineContent}>
                    <View style={styles.timelineHeader}>
                      <Text style={styles.timelineEpisode}>{item.episode}</Text>
                      <Text style={styles.timelineYear}>{item.year}</Text>
                    </View>
                    <Text style={[styles.timelineTitle, { color: isDark ? '#ffffff' : '#1A0A0A' }]}>
                      {item.title}
                    </Text>
                    <Text style={styles.timelineDescription}>{item.description}</Text>
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
  container: {
    flex: 1,
  },
  heroSection: {
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: 280,
    resizeMode: 'cover',
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
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
  backIcon: {
    color: '#fff',
    fontSize: 20,
  },
  heroContent: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  genreBadge: {
    backgroundColor: '#E8420A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  genreText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  ratingBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  ratingText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
  },
  metaDot: {
    color: 'rgba(255,255,255,0.5)',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    padding: 16,
    backgroundColor: '#1a1a1a',
  },
  followButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: colors.bg.tertiary,
  },
  followButtonActive: {
    backgroundColor: '#E8420A',
  },
  followButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  followButtonTextActive: {},
  watchButton: {
    flex: 1,
    backgroundColor: '#E8420A',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  watchButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  shareButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: colors.bg.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareIcon: {
    fontSize: 18,
  },
  tabsContainer: {
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: colors.bg.tertiary,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    gap: 4,
  },
  tab: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#E8420A',
  },
  tabText: {
    color: colors.text.secondary,
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#E8420A',
  },
  content: {
    padding: 16,
  },
  statusBadge: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12,
  },
  synopsis: {
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 20,
  },
  castSection: {},
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  castList: {
    flexDirection: 'row',
    gap: 16,
  },
  castItem: {
    alignItems: 'center',
  },
  castAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.bg.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  castAvatarText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#E8420A',
  },
  castName: {
    fontSize: 12,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  charactersList: {
    gap: 16,
  },
  characterCard: {
    flexDirection: 'row',
    gap: 16,
    padding: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
  },
  characterAvatar: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: colors.bg.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  characterAvatarText: {
    fontSize: 28,
  },
  characterInfo: {
    flex: 1,
  },
  characterName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  characterRole: {
    fontSize: 12,
    color: '#E8420A',
    fontWeight: '600',
    marginBottom: 4,
  },
  characterActor: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: 6,
  },
  characterDescription: {
    fontSize: 13,
    color: colors.neutral[400],
    lineHeight: 18,
  },
  loreList: {
    gap: 16,
  },
  loreCard: {
    flexDirection: 'row',
    gap: 16,
    padding: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
  },
  loreIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#E8420A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loreIconText: {
    fontSize: 22,
  },
  loreContent: {
    flex: 1,
  },
  loreTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  loreText: {
    fontSize: 13,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  timeline: {},
  timelineItem: {
    flexDirection: 'row',
    gap: 16,
  },
  timelineMarker: {
    alignItems: 'center',
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E8420A',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: colors.bg.tertiary,
    marginVertical: 8,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 24,
  },
  timelineHeader: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  timelineEpisode: {
    fontSize: 12,
    color: '#E8420A',
    fontWeight: '600',
  },
  timelineYear: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
  timelineTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  timelineDescription: {
    fontSize: 13,
    color: colors.text.secondary,
  },
});
