import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';

const PLACEHOLDER_IMAGE = '';

const universes = [
  { id: 'reality', name: 'Reality', icon: '🎭', color: '#FF6B6B', route: '/watch/reality-show' },
  { id: 'creators', name: 'Creators', icon: '🎤', color: '#4ECDC4', route: '/creator-dashboard' },
  { id: 'lifestyle', name: 'Lifestyle', icon: '✨', color: '#45B7D1', route: '/lifestyle' },
  { id: 'vertical', name: 'Vertical', icon: '🏰', color: '#96CEB4', route: '/vertical-title' },
  { id: 'movies', name: 'Movies', icon: '🎬', color: '#FFEAA7', route: '/watch/movie-detail' },
  { id: 'games', name: 'Games', icon: '🎮', color: '#DDA0DD', route: '/watch/gameplay' },
  { id: 'comedy', name: 'Comedy', icon: '😂', color: '#F39C12', route: '/comedy' },
  { id: 'sports', name: 'Sports', icon: '⚽', color: '#E74C3C', route: '/sports-prediction' },
];

const featuredContent = [
  { id: '1', title: 'Big Brother Naija', universe: 'Reality', thumbnail: PLACEHOLDER_IMAGE, live: true, viewers: '12.5K' },
  { id: '2', title: 'Wardie: The Rise', universe: 'Vertical', thumbnail: PLACEHOLDER_IMAGE, duration: '2h 15m' },
  { id: '3', title: 'Nigerian Comedy Awards', universe: 'Comedy', thumbnail: PLACEHOLDER_IMAGE, duration: '45m' },
];

const trendingContent = [
  { id: '1', title: 'The Kings Daughter', universe: 'Movies', thumbnail: PLACEHOLDER_IMAGE, viewers: '8.2K' },
  { id: '2', title: 'Champions League Final', universe: 'Sports', thumbnail: PLACEHOLDER_IMAGE, viewers: '25K' },
  { id: '3', title: 'Creator Clash S3', universe: 'Creators', thumbnail: PLACEHOLDER_IMAGE, viewers: '5.1K' },
  { id: '4', title: 'Lagos Food Festival', universe: 'Lifestyle', thumbnail: PLACEHOLDER_IMAGE, viewers: '3.8K' },
];

const rewardsPreview = { points: 7850, streak: 5, dailyGoal: 3 };

export default function WatchScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [selectedUniverse, setSelectedUniverse] = useState('reality');

  return (
    <ScrollView style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#0a0a0a' : '#ffffff' }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colorScheme === 'dark' ? '#ffffff' : '#000000' }]}>Watch</Text>
        <TouchableOpacity style={styles.searchButton}>
          <Text style={styles.searchIcon}>🔍</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.universeSwitcher}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.universeScroll}>
          {universes.map((universe) => (
            <TouchableOpacity
              key={universe.id}
              onPress={() => {
                setSelectedUniverse(universe.id);
                router.push(universe.route);
              }}
              style={[
                styles.universeButton,
                selectedUniverse === universe.id && { backgroundColor: universe.color },
              ]}
            >
              <Text style={styles.universeIcon}>{universe.icon}</Text>
              <Text style={[styles.universeName, selectedUniverse === universe.id && { color: '#ffffff' }]}>
                {universe.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.rewardsStrip}>
        <TouchableOpacity style={styles.rewardItem} onPress={() => router.push('/(tabs)/rewards')}>
          <Text style={styles.rewardIcon}>⭐</Text>
          <View style={styles.rewardInfo}>
            <Text style={styles.rewardValue}>{rewardsPreview.points.toLocaleString()}</Text>
            <Text style={styles.rewardLabel}>Points</Text>
          </View>
        </TouchableOpacity>
        <View style={styles.rewardDivider} />
        <TouchableOpacity style={styles.rewardItem} onPress={() => router.push('/(tabs)/rewards')}>
          <Text style={styles.rewardIcon}>🔥</Text>
          <View style={styles.rewardInfo}>
            <Text style={styles.rewardValue}>{rewardsPreview.streak}</Text>
            <Text style={styles.rewardLabel}>Day Streak</Text>
          </View>
        </TouchableOpacity>
        <View style={styles.rewardDivider} />
        <TouchableOpacity style={styles.rewardItem} onPress={() => router.push('/(tabs)/rewards')}>
          <Text style={styles.rewardIcon}>🎯</Text>
          <View style={styles.rewardInfo}>
            <Text style={styles.rewardValue}>{rewardsPreview.dailyGoal}/5</Text>
            <Text style={styles.rewardLabel}>Daily Goal</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.featuredSection}>
        <Text style={[styles.sectionTitle, { color: colorScheme === 'dark' ? '#ffffff' : '#000000' }]}>
          Featured
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.featuredScroll}>
          {featuredContent.map((content) => (
            <TouchableOpacity key={content.id} style={styles.featuredCard}>
              <Image source={{ uri: content.thumbnail }} style={styles.featuredThumbnail} />
              <View style={styles.featuredOverlay}>
                {content.live && (
                  <View style={styles.liveBadge}>
                    <Text style={styles.liveText}>🔴 LIVE</Text>
                    <Text style={styles.viewersText}>{content.viewers} watching</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.featuredTitle, { color: colorScheme === 'dark' ? '#ffffff' : '#000000' }]}>
                {content.title}
              </Text>
              {!content.live && (
                <Text style={styles.featuredDuration}>{content.duration}</Text>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.continueSection}>
        <Text style={[styles.sectionTitle, { color: colorScheme === 'dark' ? '#ffffff' : '#000000' }]}>
          Continue Watching
        </Text>
        <View style={styles.continueList}>
          {[1, 2, 3].map((i) => (
            <TouchableOpacity key={i} style={styles.continueItem}>
              <Image source={{ uri: PLACEHOLDER_IMAGE }} style={styles.continueThumbnail} />
              <View style={styles.continueInfo}>
                <Text style={[styles.continueTitle, { color: colorScheme === 'dark' ? '#ffffff' : '#000000' }]}>
                  Content Title {i}
                </Text>
                <Text style={styles.continueProgress}>Watched 45%</Text>
              </View>
              <View style={styles.continueProgressBar}>
                <View style={[styles.continueProgressFill, { width: '45%' }]} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.popularSection}>
        <Text style={[styles.sectionTitle, { color: colorScheme === 'dark' ? '#ffffff' : '#000000' }]}>
          Trending Now
        </Text>
        <View style={styles.popularGrid}>
          {trendingContent.map((content) => (
            <TouchableOpacity key={content.id} style={styles.popularItem}>
              <Image source={{ uri: content.thumbnail }} style={styles.popularThumbnail} />
              <View style={styles.popularOverlay}>
                <Text style={styles.popularUniverse}>{content.universe}</Text>
              </View>
              <Text style={[styles.popularTitle, { color: colorScheme === 'dark' ? '#ffffff' : '#000000' }]}>
                {content.title}
              </Text>
              <Text style={styles.popularViewers}>{content.viewers} watching</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchIcon: {
    fontSize: 18,
  },
  universeSwitcher: {
    marginBottom: 20,
  },
  universeScroll: {
    flexDirection: 'row',
    gap: 12,
  },
  universeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
  },
  universeIcon: {
    fontSize: 18,
  },
  universeName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  rewardsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#8B5CF6',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rewardIcon: {
    fontSize: 24,
  },
  rewardInfo: {
    alignItems: 'flex-start',
  },
  rewardValue: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  rewardLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    fontWeight: '500',
  },
  rewardDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  featuredSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  featuredScroll: {
    flexDirection: 'row',
    gap: 16,
  },
  featuredCard: {
    width: 180,
  },
  featuredThumbnail: {
    width: 180,
    height: 100,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  featuredOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  liveText: {
    color: '#FF6B6B',
    fontSize: 12,
    fontWeight: '700',
  },
  viewersText: {
    color: '#ffffff',
    fontSize: 11,
  },
  featuredTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 4,
  },
  featuredDuration: {
    fontSize: 12,
    color: '#888',
  },
  continueSection: {
    marginBottom: 24,
  },
  continueList: {
    gap: 12,
  },
  continueItem: {
    flexDirection: 'row',
    gap: 12,
  },
  continueThumbnail: {
    width: 100,
    height: 56,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  continueInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  continueTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  continueProgress: {
    fontSize: 12,
    color: '#888',
  },
  continueProgressBar: {
    position: 'absolute',
    bottom: 0,
    left: 112,
    right: 0,
    height: 3,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
  },
  continueProgressFill: {
    height: '100%',
    backgroundColor: '#8B5CF6',
    borderRadius: 2,
  },
  popularSection: {},
  popularGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  popularItem: {
    width: '48%',
  },
  popularThumbnail: {
    width: '100%',
    height: 96,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  popularTitle: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 6,
  },
  popularOverlay: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  popularUniverse: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
  popularViewers: {
    color: '#888',
    fontSize: 11,
    marginTop: 2,
  },
});
