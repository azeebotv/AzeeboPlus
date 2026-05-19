import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';

const FEATURED_GAME = {
  id: '1',
  title: 'Azeebo Quest',
  genre: 'Adventure',
  players: '12.5K',
  emoji: '🎮',
};

const TRENDING_GAMES = [
  { id: '1', title: 'Speed Kings', genre: 'Racing', players: '8.2K', emoji: '🏎️' },
  { id: '2', title: 'Puzzle Master', genre: 'Puzzle', players: '6.8K', emoji: '🧩' },
  { id: '3', title: 'Battle Arena', genre: 'Fighting', players: '9.1K', emoji: '⚔️' },
  { id: '4', title: 'Word Wizard', genre: 'Word', players: '4.5K', emoji: '✏️' },
];

const TOURNAMENTS = [
  { id: '1', title: 'Azeebo Cup', prize: '₦500,000', entrants: '2.4K', status: 'Live', emoji: '🏆' },
  { id: '2', title: 'Speed Challenge', prize: '₦100,000', entrants: '890', status: 'Tomorrow', emoji: '🏁' },
  { id: '3', title: 'Puzzle Championship', prize: '₦75,000', entrants: '456', status: 'Soon', emoji: '🧩' },
];

const GAME_CATEGORIES = [
  { id: '1', name: 'All Games', emoji: '🎮', count: 48 },
  { id: '2', name: 'Action', emoji: '⚔️', count: 12 },
  { id: '3', name: 'Puzzle', emoji: '🧩', count: 8 },
  { id: '4', name: 'Racing', emoji: '🏎️', count: 6 },
  { id: '5', name: 'Word', emoji: '✏️', count: 5 },
];

const TOP_PLAYERS = [
  { id: '1', name: 'GamerKing', score: 24500, rank: 1, emoji: '👑' },
  { id: '2', name: 'ProPlayer', score: 23200, rank: 2, emoji: '🥈' },
  { id: '3', name: 'ChampionX', score: 21800, rank: 3, emoji: '🥉' },
  { id: '4', name: 'GameMaster', score: 19500, rank: 4, emoji: '🎮' },
];

export default function GamesUniverseHome() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const isDark = colorScheme === 'dark';

  const renderGameCard = (item: typeof TRENDING_GAMES[0]) => (
    <TouchableOpacity
      key={item.id}
      style={[styles.gameCard, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}
      onPress={() => router.push(`/games/${item.id}`)}
    >
      <View style={styles.gameThumbnail}>
        <Text style={styles.gameEmoji}>{item.emoji}</Text>
        <View style={styles.playerBadge}>
          <Text style={styles.playerCount}>👥 {item.players}</Text>
        </View>
      </View>
      <Text style={[styles.gameTitle, { color: isDark ? '#fff' : '#000' }]}>{item.title}</Text>
      <Text style={styles.gameGenre}>{item.genre}</Text>
      <TouchableOpacity style={styles.playButton}>
        <Text style={styles.playButtonText}>Play</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: isDark ? '#0a0a0a' : '#ffffff' }]}>
      <View style={styles.header}>
        <Text style={styles.universeLabel}>🎮 Games</Text>
        <Text style={[styles.headerTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
          Game Universe
        </Text>
        <View style={styles.headerStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>48</Text>
            <Text style={styles.statLabel}>Games</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>2.4K</Text>
            <Text style={styles.statLabel}>Online</Text>
          </View>
        </View>
      </View>

      <View style={styles.featuredSection}>
        <TouchableOpacity style={styles.featuredGame} onPress={() => router.push('/games/1')}>
          <View style={styles.featuredImagePlaceholder}>
            <Text style={styles.featuredEmoji}>{FEATURED_GAME.emoji}</Text>
            <View style={styles.featuredBadge}>
              <Text style={styles.featuredBadgeText}>FEATURED</Text>
            </View>
            <View style={styles.featuredOverlay}>
              <Text style={styles.featuredTitle}>{FEATURED_GAME.title}</Text>
              <Text style={styles.featuredGenre}>{FEATURED_GAME.genre} • {FEATURED_GAME.players} players</Text>
              <TouchableOpacity style={styles.featuredPlayButton}>
                <Text style={styles.featuredPlayIcon}>▶</Text>
                <Text style={styles.featuredPlayText}>Play Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.categoriesSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesList}>
          {GAME_CATEGORIES.map((cat) => (
            <TouchableOpacity key={cat.id} style={styles.categoryChip}>
              <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
              <Text style={styles.categoryName}>{cat.name}</Text>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryCount}>{cat.count}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
            Trending Games
          </Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={TRENDING_GAMES}
          renderItem={({ item }) => renderGameCard(item)}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
        />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
            Live Tournaments
          </Text>
        </View>
        <View style={styles.tournamentsList}>
          {TOURNAMENTS.map((tournament) => (
            <TouchableOpacity key={tournament.id} style={styles.tournamentCard}>
              <View style={styles.tournamentLeft}>
                <Text style={styles.tournamentEmoji}>{tournament.emoji}</Text>
              </View>
              <View style={styles.tournamentInfo}>
                <Text style={[styles.tournamentTitle, { color: isDark ? '#fff' : '#000' }]}>
                  {tournament.title}
                </Text>
                <Text style={styles.tournamentPrize}>Prize: {tournament.prize}</Text>
                <Text style={styles.tournamentEntrants}>👥 {tournament.entrants} entrants</Text>
              </View>
              <View style={[
                styles.tournamentStatus,
                tournament.status === 'Live' && styles.statusLive,
              ]}>
                <Text style={[
                  styles.statusText,
                  tournament.status === 'Live' && styles.statusTextLive,
                ]}>
                  {tournament.status}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
            Top Players This Week
          </Text>
        </View>
        <View style={styles.leaderboardList}>
          {TOP_PLAYERS.map((player) => (
            <View key={player.id} style={styles.leaderboardItem}>
              <View style={[
                styles.rankBadge,
                player.rank <= 3 && styles.rankBadgeTop,
              ]}>
                <Text style={styles.rankEmoji}>{player.emoji}</Text>
              </View>
              <Text style={[styles.playerName, { color: isDark ? '#fff' : '#000' }]}>
                {player.name}
              </Text>
              <Text style={styles.playerScore}>{player.score.toLocaleString()} pts</Text>
            </View>
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
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/(tabs)/create')}>
          <Text style={styles.navIcon}>✨</Text>
          <Text style={styles.navLabel}>Create</Text>
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
  },
  universeLabel: {
    fontSize: 14,
    color: '#DDA0DD',
    fontWeight: '600',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 16,
  },
  headerStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    color: '#DDA0DD',
    fontSize: 20,
    fontWeight: '700',
  },
  statLabel: {
    color: '#888',
    fontSize: 12,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#333',
  },
  featuredSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  featuredGame: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  featuredImagePlaceholder: {
    height: 200,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  featuredEmoji: {
    fontSize: 64,
  },
  featuredBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#DDA0DD',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  featuredBadgeText: {
    color: '#000',
    fontSize: 10,
    fontWeight: '700',
  },
  featuredOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  featuredTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  featuredGenre: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 12,
  },
  featuredPlayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DDA0DD',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
    gap: 6,
  },
  featuredPlayIcon: {
    fontSize: 12,
  },
  featuredPlayText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
  },
  categoriesSection: {
    marginBottom: 20,
  },
  categoriesList: {
    paddingHorizontal: 16,
    gap: 10,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
  },
  categoryEmoji: {
    fontSize: 16,
  },
  categoryName: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
  },
  categoryBadge: {
    backgroundColor: '#333',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  categoryCount: {
    color: '#888',
    fontSize: 11,
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
    color: '#DDA0DD',
    fontSize: 14,
    fontWeight: '600',
  },
  horizontalList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  gameCard: {
    width: 150,
    padding: 12,
    borderRadius: 12,
  },
  gameThumbnail: {
    height: 100,
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    position: 'relative',
  },
  gameEmoji: {
    fontSize: 36,
  },
  playerBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  playerCount: {
    color: '#fff',
    fontSize: 10,
  },
  gameTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  gameGenre: {
    fontSize: 12,
    color: '#888',
    marginBottom: 10,
  },
  playButton: {
    backgroundColor: '#DDA0DD',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  playButtonText: {
    color: '#000',
    fontSize: 13,
    fontWeight: '600',
  },
  tournamentsList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  tournamentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 14,
    borderRadius: 12,
    gap: 12,
  },
  tournamentLeft: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tournamentEmoji: {
    fontSize: 24,
  },
  tournamentInfo: {
    flex: 1,
  },
  tournamentTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  tournamentPrize: {
    color: '#DDA0DD',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  tournamentEntrants: {
    color: '#888',
    fontSize: 12,
  },
  tournamentStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#333',
  },
  statusLive: {
    backgroundColor: '#EF4444',
  },
  statusText: {
    color: '#888',
    fontSize: 12,
    fontWeight: '600',
  },
  statusTextLive: {
    color: '#fff',
  },
  leaderboardList: {
    paddingHorizontal: 16,
    backgroundColor: '#1a1a1a',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 8,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    gap: 12,
  },
  rankBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankBadgeTop: {
    backgroundColor: '#1a1a1a',
  },
  rankEmoji: {
    fontSize: 18,
  },
  playerName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  playerScore: {
    color: '#DDA0DD',
    fontSize: 14,
    fontWeight: '600',
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