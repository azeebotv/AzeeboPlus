import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { LoadingState, EmptyState, ErrorState } from '../../src/components/StateContainers';
import { apiClient } from '../../src/api/client';
import { ApiResponse } from '../../src/types/api';
import { analytics } from '../../src/utils/analytics';
import { colors } from '../../src/theme';

type ListResponse<T> = T[] | ApiResponse<T[]>;

interface GameData {
  id: string;
  title: string;
  genre: string;
  players: string;
  emoji: string;
}
interface TournamentData {
  id: string;
  title: string;
  prize: string;
  entrants: string;
  status: string;
  emoji: string;
}
interface CategoryData {
  id: string;
  name: string;
  emoji: string;
  count: number;
}
interface PlayerData {
  id: string;
  name: string;
  score: number;
  rank: number;
  emoji: string;
}

export default function GamesUniverseHome() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const isDark = colorScheme === 'dark';
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [featuredGame, setFeaturedGame] = useState<GameData | null>(null);
  const [trendingGames, setTrendingGames] = useState<GameData[]>([]);
  const [tournaments, setTournaments] = useState<TournamentData[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [topPlayers, setTopPlayers] = useState<PlayerData[]>([]);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [featuredRes, trendingRes, tournamentsRes, catsRes, playersRes] = await Promise.all([
        apiClient.get<ListResponse<GameData>>('/v1/games/featured'),
        apiClient.get<ListResponse<GameData>>('/v1/games/trending'),
        apiClient.get<ListResponse<TournamentData>>('/v1/games/tournaments'),
        apiClient.get<ListResponse<CategoryData>>('/v1/games/categories'),
        apiClient.get<ListResponse<PlayerData>>('/v1/games/leaderboard'),
      ]);
      const featured = Array.isArray(featuredRes)
        ? featuredRes[0]
        : (featuredRes?.data?.[0] ?? null);
      setFeaturedGame(featured ?? null);
      setTrendingGames(Array.isArray(trendingRes) ? trendingRes : (trendingRes?.data ?? []));
      setTournaments(Array.isArray(tournamentsRes) ? tournamentsRes : (tournamentsRes?.data ?? []));
      setCategories(Array.isArray(catsRes) ? catsRes : (catsRes?.data ?? []));
      setTopPlayers(Array.isArray(playersRes) ? playersRes : (playersRes?.data ?? []));
      analytics.gameStarted(featured?.id ?? '', Date.now().toString());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (isLoading) return <LoadingState text="Loading games..." />;
  if (error) return <ErrorState description={error} onRetry={fetchData} />;
  if (!featuredGame && !trendingGames.length) {
    return (
      <EmptyState icon="🎮" title="No games available" description="Check back later for games" />
    );
  }

  const renderGameCard = (item: GameData) => (
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
    <ScrollView style={[styles.container, { backgroundColor: isDark ? '#1A0A0A' : '#ffffff' }]}>
      <View style={styles.header}>
        <Text style={styles.universeLabel}>🎮 Games</Text>
        <Text style={[styles.headerTitle, { color: isDark ? '#ffffff' : '#1A0A0A' }]}>
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
            <Text style={styles.featuredEmoji}>{featuredGame?.emoji ?? '🎮'}</Text>
            <View style={styles.featuredBadge}>
              <Text style={styles.featuredBadgeText}>FEATURED</Text>
            </View>
            <View style={styles.featuredOverlay}>
              <Text style={styles.featuredTitle}>{featuredGame?.title ?? 'Featured Game'}</Text>
              <Text style={styles.featuredGenre}>
                {featuredGame?.genre ?? ''}
                {featuredGame ? ` • ${featuredGame.players} players` : ''}
              </Text>
              <TouchableOpacity style={styles.featuredPlayButton}>
                <Text style={styles.featuredPlayIcon}>▶</Text>
                <Text style={styles.featuredPlayText}>Play Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.categoriesSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
        >
          {categories.map((cat) => (
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
          <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#1A0A0A' }]}>
            Trending Games
          </Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={trendingGames}
          renderItem={({ item }) => renderGameCard(item)}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
        />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#1A0A0A' }]}>
            Live Tournaments
          </Text>
        </View>
        <View style={styles.tournamentsList}>
          {tournaments.map((tournament) => (
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
              <View
                style={[styles.tournamentStatus, tournament.status === 'Live' && styles.statusLive]}
              >
                <Text
                  style={[styles.statusText, tournament.status === 'Live' && styles.statusTextLive]}
                >
                  {tournament.status}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#1A0A0A' }]}>
            Top Players This Week
          </Text>
        </View>
        <View style={styles.leaderboardList}>
          {topPlayers.map((player) => (
            <View key={player.id} style={styles.leaderboardItem}>
              <View style={[styles.rankBadge, player.rank <= 3 && styles.rankBadgeTop]}>
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
    color: colors.palette.plum,
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
    color: colors.palette.plum,
    fontSize: 20,
    fontWeight: '700',
  },
  statLabel: {
    color: colors.palette.grey500,
    fontSize: 12,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.palette.grey800,
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
    backgroundColor: colors.palette.charcoal,
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
    backgroundColor: colors.palette.plum,
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
    color: colors.palette.grey300,
    fontSize: 14,
    marginBottom: 12,
  },
  featuredPlayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.palette.plum,
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
    backgroundColor: colors.palette.grey800,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  categoryCount: {
    color: colors.palette.grey500,
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
    color: colors.palette.plum,
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
    backgroundColor: colors.palette.charcoal,
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
    color: colors.palette.grey500,
    marginBottom: 10,
  },
  playButton: {
    backgroundColor: colors.palette.plum,
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
    backgroundColor: colors.palette.charcoal,
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
    color: colors.palette.plum,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  tournamentEntrants: {
    color: colors.palette.grey500,
    fontSize: 12,
  },
  tournamentStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: colors.palette.grey800,
  },
  statusLive: {
    backgroundColor: '#EF4444',
  },
  statusText: {
    color: colors.palette.grey500,
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
    backgroundColor: colors.palette.charcoal,
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
    color: colors.palette.plum,
    fontSize: 14,
    fontWeight: '600',
  },
});
