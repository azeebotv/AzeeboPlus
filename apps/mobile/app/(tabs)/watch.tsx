import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useColorScheme } from 'react-native';

const universes = [
  { id: 'reality', name: 'Reality', icon: '🎭', color: '#FF6B6B' },
  { id: 'creators', name: 'Creators', icon: '🎤', color: '#4ECDC4' },
  { id: 'lifestyle', name: 'Lifestyle', icon: '✨', color: '#45B7D1' },
  { id: 'vertical', name: 'Vertical', icon: '🏰', color: '#96CEB4' },
  { id: 'movies', name: 'Movies', icon: '🎬', color: '#FFEAA7' },
  { id: 'games', name: 'Games', icon: '🎮', color: '#DDA0DD' },
  { id: 'comedy', name: 'Comedy', icon: '😂', color: '#F39C12' },
  { id: 'sports', name: 'Sports', icon: '⚽', color: '#E74C3C' },
];

const featuredContent = [
  { id: '1', title: 'Big Brother Naija S9', universe: 'reality', thumbnail: 'https://via.placeholder.com/300x168', live: true, viewers: '2.5M' },
  { id: '2', title: 'Davido Live Concert', universe: 'creators', thumbnail: 'https://via.placeholder.com/300x168', live: false, duration: '2:30:00' },
  { id: '3', title: 'Fashion Week Highlights', universe: 'lifestyle', thumbnail: 'https://via.placeholder.com/300x168', live: false, duration: '45:00' },
  { id: '4', title: 'Game of Thrones Recap', universe: 'vertical', thumbnail: 'https://via.placeholder.com/300x168', live: false, duration: '15:30' },
];

export default function WatchScreen() {
  const colorScheme = useColorScheme();
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
              onPress={() => setSelectedUniverse(universe.id)}
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
              <Image source={{ uri: `https://via.placeholder.com/120x68` }} style={styles.continueThumbnail} />
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
          {[1, 2, 3, 4].map((i) => (
            <TouchableOpacity key={i} style={styles.popularItem}>
              <Image source={{ uri: `https://via.placeholder.com/160x90` }} style={styles.popularThumbnail} />
              <Text style={[styles.popularTitle, { color: colorScheme === 'dark' ? '#ffffff' : '#000000' }]}>
                Video {i}
              </Text>
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
});
