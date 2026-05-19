import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, FlatList } from 'react-native';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';

const LIVE_SHOWS = [
  {
    id: 'bbnaija',
    title: 'Big Brother Naija',
    subtitle: 'Season 9 - Live',
    thumbnail: '',
    viewers: '2.4M',
    isLive: true,
  },
  {
    id: 'edition',
    title: 'Big Brother Naija',
    subtitle: 'All Stars - Highlights',
    thumbnail: '',
    viewers: '850K',
    isLive: false,
  },
];

const CONTESTANTS = [
  { id: '1', name: 'Maria', votes: 245000, image: '' },
  { id: '2', name: 'Kenny', votes: 198000, image: '' },
  { id: '3', name: 'Nini', votes: 187000, image: '' },
  { id: '4', name: 'Cross', votes: 156000, image: '' },
  { id: '5', name: 'Angel', votes: 142000, image: '' },
  { id: '6', name: 'Jerome', votes: 98000, image: '' },
];

const FEATURED_CONTENT = [
  { id: '1', title: 'Week 1 Highlights', duration: '45:30', thumbnail: '' },
  { id: '2', title: 'Eviction Night', duration: '1:20:00', thumbnail: '' },
  { id: '3', title: 'Head of House', duration: '32:15', thumbnail: '' },
];

export default function RealityUniverseHome() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const isDark = colorScheme === 'dark';

  const renderContestantCard = ({ item, index }: { item: typeof CONTESTANTS[0]; index: number }) => (
    <TouchableOpacity
      style={[styles.contestantCard, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}
      onPress={() => router.push('/vote')}
    >
      <View style={[styles.contestantRank, { backgroundColor: index < 3 ? '#8B5CF6' : '#4a4a4a' }]}>
        <Text style={styles.contestantRankText}>#{index + 1}</Text>
      </View>
      <View style={styles.contestantImagePlaceholder}>
        <Text style={styles.contestantInitial}>{item.name[0]}</Text>
      </View>
      <Text style={[styles.contestantName, { color: isDark ? '#fff' : '#000' }]}>{item.name}</Text>
      <Text style={styles.contestantVotes}>{(item.votes / 1000).toFixed(0)}K votes</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: isDark ? '#0a0a0a' : '#ffffff' }]}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.universeLabel}>🎭 Reality</Text>
          <TouchableOpacity style={styles.notificationBadge}>
            <Text style={styles.bellIcon}>🔔</Text>
            <View style={styles.badge} />
          </TouchableOpacity>
        </View>
        <Text style={[styles.headerTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
          Reality Universe
        </Text>
      </View>

      <TouchableOpacity style={styles.liveShowCard} onPress={() => router.push('/reality/bbnaija')}>
        <View style={styles.liveShowImagePlaceholder}>
          <Text style={styles.playIcon}>▶️</Text>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
          <View style={styles.viewerCount}>
            <Text style={styles.viewerIcon}>👁️</Text>
            <Text style={styles.viewerText}>2.4M watching</Text>
          </View>
        </View>
        <View style={styles.liveShowInfo}>
          <Text style={[styles.liveShowTitle, { color: isDark ? '#fff' : '#000' }]}>
            Big Brother Naija
          </Text>
          <Text style={styles.liveShowSubtitle}>Season 9 - Live Eviction</Text>
          <TouchableOpacity style={styles.watchNowButton}>
            <Text style={styles.watchNowText}>Watch Live</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      <View style={styles.voteCTA}>
        <View style={styles.voteCTAInfo}>
          <Text style={styles.voteCTAIcon}>🗳️</Text>
          <View>
            <Text style={[styles.voteCTATitle, { color: isDark ? '#fff' : '#000' }]}>
              Vote for Your Favorite
            </Text>
            <Text style={styles.voteCTASubtitle}>Support your contestant</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.voteButton} onPress={() => router.push('/vote')}>
          <Text style={styles.voteButtonText}>Vote Now</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
            Leaderboard
          </Text>
          <TouchableOpacity onPress={() => router.push('/vote')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={CONTESTANTS}
          renderItem={renderContestantCard}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.contestantsList}
        />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
            Featured Highlights
          </Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.highlightsList}>
          {FEATURED_CONTENT.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.highlightCard, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}
            >
              <View style={styles.highlightThumbnail}>
                <Text style={styles.playSmallIcon}>▶</Text>
                <View style={styles.durationBadge}>
                  <Text style={styles.durationText}>{item.duration}</Text>
                </View>
              </View>
              <Text style={[styles.highlightTitle, { color: isDark ? '#fff' : '#000' }]}>
                {item.title}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
            Past Seasons
          </Text>
        </View>
        <View style={styles.pastSeasonsList}>
          {['Season 8', 'Season 7', 'Season 6', 'Season 5'].map((season, index) => (
            <TouchableOpacity
              key={season}
              style={[styles.seasonCard, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}
            >
              <View style={styles.seasonImagePlaceholder}>
                <Text style={styles.seasonEmoji}>{['🏆', '🥈', '🥉', '🎖️'][index]}</Text>
              </View>
              <Text style={[styles.seasonTitle, { color: isDark ? '#fff' : '#000' }]}>
                BBNaija {season}
              </Text>
              <Text style={styles.seasonSubtitle}>Highlights & Clips</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/(tabs)/home')}>
          <Text style={styles.navIcon}>🏠</Text>
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/(tabs)/watch')}>
          <Text style={styles.navIcon}>📺</Text>
          <Text style={styles.navLabel}>Watch</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/vote')}>
          <Text style={styles.navIcon}>🗳️</Text>
          <Text style={[styles.navLabel, { color: '#8B5CF6' }]}>Vote</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/(tabs)/rewards')}>
          <Text style={styles.navIcon}>⭐</Text>
          <Text style={styles.navLabel}>Rewards</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/(tabs)/profile')}>
          <Text style={styles.navIcon}>👤</Text>
          <Text style={styles.navLabel}>Profile</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingTop: 50,
    backgroundColor: '#1a1a1a',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  universeLabel: {
    fontSize: 14,
    color: '#FF6B6B',
    fontWeight: '600',
  },
  notificationBadge: {
    position: 'relative',
  },
  bellIcon: {
    fontSize: 24,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EF4444',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  liveShowCard: {
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
  },
  liveShowImagePlaceholder: {
    height: 200,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  playIcon: {
    fontSize: 48,
  },
  liveBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
  liveText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  viewerCount: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 4,
  },
  viewerIcon: {
    fontSize: 12,
  },
  viewerText: {
    color: '#fff',
    fontSize: 12,
  },
  liveShowInfo: {
    padding: 16,
  },
  liveShowTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  liveShowSubtitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 12,
  },
  watchNowButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  watchNowText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  voteCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#8B5CF6',
  },
  voteCTAInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  voteCTAIcon: {
    fontSize: 32,
  },
  voteCTATitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  voteCTASubtitle: {
    fontSize: 12,
    color: '#888',
  },
  voteButton: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  voteButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  seeAllText: {
    color: '#8B5CF6',
    fontSize: 14,
    fontWeight: '600',
  },
  contestantsList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  contestantCard: {
    width: 120,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  contestantRank: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  contestantRankText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  contestantImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  contestantInitial: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  contestantName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  contestantVotes: {
    fontSize: 11,
    color: '#888',
  },
  highlightsList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  highlightCard: {
    width: 180,
    borderRadius: 12,
    overflow: 'hidden',
  },
  highlightThumbnail: {
    height: 100,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  playSmallIcon: {
    fontSize: 24,
    color: '#fff',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  durationText: {
    color: '#fff',
    fontSize: 10,
  },
  highlightTitle: {
    fontSize: 13,
    fontWeight: '600',
    padding: 10,
  },
  pastSeasonsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  seasonCard: {
    width: '47%',
    padding: 12,
    borderRadius: 12,
  },
  seasonImagePlaceholder: {
    height: 80,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  seasonEmoji: {
    fontSize: 32,
  },
  seasonTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  seasonSubtitle: {
    fontSize: 12,
    color: '#888',
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingBottom: 30,
    backgroundColor: '#1a1a1a',
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
  navItem: {
    alignItems: 'center',
  },
  navIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  navLabel: {
    fontSize: 11,
    color: '#888',
  },
});