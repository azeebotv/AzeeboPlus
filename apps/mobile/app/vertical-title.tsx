import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';

const PLACEHOLDER_IMAGE = '';

const titleData = {
  id: '1',
  title: 'The Crowned',
  genre: 'Fantasy Drama',
  universe: 'Vertical',
  thumbnail: PLACEHOLDER_IMAGE,
  rating: 9.2,
  year: 2024,
  seasons: 3,
  episodes: 28,
  status: 'Ongoing',
  synopsis: 'In a realm where ancient kingdoms vie for power, a young queen must navigate the treacherous waters of court politics, betrayal, and forbidden magic to reclaim her birthright and unite the fractured land.',
  cast: ['Amara Diallo', 'Kofi Mensah', 'Zoe Williams', 'Emeka Obi'],
};

const characters = [
  { id: '1', name: 'Queen Amara', actor: 'Amara Diallo', role: 'Protagonist', avatar: '👸', description: 'The rightful heir to the throne, forced into exile as a child.' },
  { id: '2', name: 'Lord Kofi', actor: 'Kofi Mensah', role: 'Antagonist', avatar: '🗡️', description: 'The power-hungry regent who seized the throne during the civil war.' },
  { id: '3', name: 'Princess Elena', actor: 'Zoe Williams', role: 'Supporting', avatar: '👸', description: 'Amara\'s younger sister, torn between family and love.' },
  { id: '4', name: 'General Emeka', actor: 'Emeka Obi', role: 'Ally', avatar: '⚔️', description: 'Loyal commander of the royal guard, protector of the true queen.' },
];

const loreData = [
  { id: '1', title: 'The Three Kingdoms', icon: '🏰', content: 'The realm is divided into three kingdoms: the Northern Highlands, the Central Plains, and the Southern Isles. Each kingdom has its own unique culture, magic system, and ruling family.' },
  { id: '2', title: 'The Magic System', icon: '✨', content: 'Magic in this world flows from the Ancient Tree, a mystical entity that predates civilization. Users must bond with elemental spirits to channel magical abilities.' },
  { id: '3', title: 'The Prophecy', icon: '📜', content: 'An ancient prophecy speaks of a crowned one who will unite the three kingdoms and restore balance to the realm. Many believe this refers to the return of the true queen.' },
  { id: '4', title: 'The Royal Lineage', icon: '👑', content: 'The royal family of the Central Plains has ruled for over 500 years, descending from the first Emperor who unified the realm under the Ancient Tree\'s blessing.' },
];

const timeline = [
  { id: '1', episode: 'S1E1', title: 'The Exile', year: '2024', description: 'Young Princess Amara is forced to flee as Lord Kofi seizes power.' },
  { id: '2', episode: 'S1E5', title: 'The Alliance', year: '2024', description: 'Amara forms an alliance with the Northern tribes.' },
  { id: '3', episode: 'S2E1', title: 'The Return', year: '2025', description: 'After years in hiding, Amara returns to claim her birthright.' },
  { id: '4', episode: 'S3E1', title: 'The Final Battle', year: '2026', description: 'The confrontation between Amara and Kofi begins.' },
];

export default function VerticalTitleScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [isFollowing, setIsFollowing] = useState(false);

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'characters', label: 'Characters' },
    { id: 'lore', label: 'Lore' },
    { id: 'timeline', label: 'Timeline' },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#0a0a0a' : '#ffffff' }]}>
      <View style={styles.heroSection}>
        <Image source={{ uri: titleData.thumbnail }} style={styles.heroImage} />
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
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
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
            <Text style={[styles.statusBadge, { color: titleData.status === 'Ongoing' ? '#10B981' : '#888' }]}>
              {titleData.status}
            </Text>
            <Text style={[styles.synopsis, { color: colorScheme === 'dark' ? '#ffffff' : '#000000' }]}>
              {titleData.synopsis}
            </Text>
            <View style={styles.castSection}>
              <Text style={[styles.sectionTitle, { color: colorScheme === 'dark' ? '#ffffff' : '#000000' }]}>
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
                  <Text style={[styles.characterName, { color: colorScheme === 'dark' ? '#ffffff' : '#000000' }]}>
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
                  <Text style={[styles.loreTitle, { color: colorScheme === 'dark' ? '#ffffff' : '#000000' }]}>
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
                  <Text style={[styles.timelineTitle, { color: colorScheme === 'dark' ? '#ffffff' : '#000000' }]}>
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
    backgroundColor: '#8B5CF6',
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
    backgroundColor: '#333',
  },
  followButtonActive: {
    backgroundColor: '#8B5CF6',
  },
  followButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  followButtonTextActive: {},
  watchButton: {
    flex: 1,
    backgroundColor: '#8B5CF6',
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
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareIcon: {
    fontSize: 18,
  },
  tabsContainer: {
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
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
    borderBottomColor: '#8B5CF6',
  },
  tabText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#8B5CF6',
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
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  castAvatarText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  castName: {
    fontSize: 12,
    color: '#888',
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
    backgroundColor: '#2a2a2a',
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
    color: '#8B5CF6',
    fontWeight: '600',
    marginBottom: 4,
  },
  characterActor: {
    fontSize: 12,
    color: '#888',
    marginBottom: 6,
  },
  characterDescription: {
    fontSize: 13,
    color: '#aaa',
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
    backgroundColor: '#8B5CF6',
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
    color: '#888',
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
    backgroundColor: '#8B5CF6',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#333',
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
    color: '#8B5CF6',
    fontWeight: '600',
  },
  timelineYear: {
    fontSize: 12,
    color: '#666',
  },
  timelineTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  timelineDescription: {
    fontSize: 13,
    color: '#888',
  },
});
