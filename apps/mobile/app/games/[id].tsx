import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useColorScheme } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { apiClient } from '@azeebo/react-data';
import type { Game, GameLevel, LeaderboardEntry, Achievement } from '@azeebo/react-data/types/api';
import { LoadingState, EmptyState, ErrorState } from '../../src/components/StateContainers';
import { analytics } from '../../src/utils/analytics';
import { colors } from '../../src/theme';

export default function GameplayPage() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const isDark = colorScheme === 'dark';
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentScore, setCurrentScore] = useState(0);
  const [game, setGame] = useState<Game | null>(null);
  const [controls, setControls] = useState<{ id: string; label: string; icon: string }[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [levels, setLevels] = useState<GameLevel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGameData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [gameRes, levelsRes, leaderboardRes, achievementsRes] = await Promise.all([
        apiClient.get<Game>(`/games/${id}`),
        apiClient.get<GameLevel[]>(`/games/${id}/levels`),
        apiClient.get<LeaderboardEntry[]>(`/games/${id}/leaderboard`),
        apiClient.get<Achievement[]>(`/games/${id}/achievements`),
      ]);
      setGame(gameRes);
      analytics.gameStarted(String(id), 'session_' + Date.now());
      setLevels(levelsRes || []);
      setLeaderboard(leaderboardRes || []);
      setAchievements(achievementsRes || []);
      setControls([
        { id: '1', label: 'Move', icon: '⬆️' },
        { id: '2', label: 'Jump', icon: '⬆️' },
        { id: '3', label: 'Attack', icon: '⚔️' },
        { id: '4', label: 'Special', icon: '✨' },
      ]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load game data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGameData();
  }, [id]);

  const handlePlay = () => {
    setIsPlaying(true);
    setCurrentScore(0);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleGameOver = () => {
    setIsPlaying(false);
    Alert.alert('Game Over', `Score: ${currentScore.toLocaleString()}`);
  };

  if (isLoading) {
    return <LoadingState text="Loading game..." />;
  }

  if (error) {
    return <ErrorState title="Failed to load game" description={error} onRetry={fetchGameData} />;
  }

  if (!game) {
    return (
      <EmptyState icon="🎮" title="Game not found" description="This game could not be found" />
    );
  }

  if (isPlaying) {
    return (
      <View style={styles.gameContainer}>
        <View style={styles.gameHeader}>
          <TouchableOpacity onPress={handlePause}>
            <Text style={styles.pauseIcon}>⏸️</Text>
          </TouchableOpacity>
          <View style={styles.gameStats}>
            <Text style={styles.gameScore}>Score: {currentScore.toLocaleString()}</Text>
            <Text style={styles.gameHighScore}>Best: {(game.highScore || 0).toLocaleString()}</Text>
          </View>
        </View>

        <View style={styles.gameArea}>
          <View style={styles.gamePlaceholder}>
            <Text style={styles.gameEmoji}>{game.emoji || '🎮'}</Text>
            <Text style={styles.gameStatus}>Playing {game.title}</Text>
            <View style={styles.scoreButtons}>
              <TouchableOpacity
                style={styles.scoreButton}
                onPress={() => setCurrentScore((prev) => prev + 100)}
              >
                <Text style={styles.scoreButtonText}>+100</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.scoreButton, styles.scoreButtonSpecial]}
                onPress={() => setCurrentScore((prev) => prev + 500)}
              >
                <Text style={styles.scoreButtonText}>+500</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.gameOverButton} onPress={handleGameOver}>
              <Text style={styles.gameOverText}>End Game</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.controlsArea}>
          <View style={styles.dpad}>
            <TouchableOpacity style={styles.dpadButton}>
              <Text style={styles.dpadIcon}>⬆️</Text>
            </TouchableOpacity>
            <View style={styles.dpadRow}>
              <TouchableOpacity style={styles.dpadButton}>
                <Text style={styles.dpadIcon}>⬅️</Text>
              </TouchableOpacity>
              <View style={styles.dpadCenter} />
              <TouchableOpacity style={styles.dpadButton}>
                <Text style={styles.dpadIcon}>➡️</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.dpadButton}>
              <Text style={styles.dpadIcon}>⬇️</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.actionButtons}>
            {controls.slice(2).map((control) => (
              <TouchableOpacity key={control.id} style={styles.actionButton}>
                <Text style={styles.actionIcon}>{control.icon}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#1A0A0A' : '#ffffff' }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={[styles.gameTitle, { color: isDark ? '#fff' : '#000' }]}>{game.title}</Text>
          <Text style={styles.gameGenre}>{game.genre || ''}</Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.gamePreview}>
          <View style={styles.previewPlaceholder}>
            <Text style={styles.previewEmoji}>{game.emoji || '🎮'}</Text>
            <TouchableOpacity style={styles.playButton} onPress={handlePlay}>
              <Text style={styles.playIcon}>▶</Text>
              <Text style={styles.playText}>Play Now</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.scoreBoard}>
            <View style={styles.scoreItem}>
              <Text style={styles.scoreLabel}>High Score</Text>
              <Text style={styles.scoreValue}>{(game.highScore || 0).toLocaleString()}</Text>
            </View>
            <View style={styles.scoreDivider} />
            <View style={styles.scoreItem}>
              <Text style={styles.scoreLabel}>Your Best</Text>
              <Text style={[styles.scoreValue, styles.yourScore]}>
                {(game.yourBest || 0).toLocaleString()}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#1A0A0A' }]}>
            Select Level
          </Text>
          <View style={styles.levelsList}>
            {levels.map((level) => (
              <TouchableOpacity
                key={level.id}
                style={[styles.levelCard, !level.unlocked && styles.levelLocked]}
                disabled={!level.unlocked}
              >
                <View style={styles.levelInfo}>
                  <Text style={[styles.levelName, { color: isDark ? '#fff' : '#000' }]}>
                    {level.unlocked ? level.name : '🔒 ' + level.name}
                  </Text>
                  <Text style={styles.levelDifficulty}>{level.difficulty || ''}</Text>
                </View>
                <View style={styles.levelStars}>
                  {[1, 2, 3].map((star) => (
                    <Text key={star} style={styles.starIcon}>
                      {star <= (level.stars || 0) ? '⭐' : '☆'}
                    </Text>
                  ))}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#1A0A0A' }]}>
            Global Leaderboard
          </Text>
          <View style={styles.leaderboardList}>
            {leaderboard.map((player) => (
              <View
                key={player.id}
                style={[styles.leaderboardItem, player.isYou && styles.leaderboardItemYou]}
              >
                <View style={[styles.rankBadge, player.rank <= 3 && styles.rankBadgeTop]}>
                  <Text
                    style={[
                      styles.rankText,
                      player.rank === 1 && styles.rankGold,
                      player.rank === 2 && styles.rankSilver,
                      player.rank === 3 && styles.rankBronze,
                    ]}
                  >
                    {player.rank}
                  </Text>
                </View>
                <Text style={[styles.playerName, { color: isDark ? '#fff' : '#000' }]}>
                  {player.isYou ? 'You' : player.name}
                </Text>
                <Text style={styles.playerScore}>{player.score.toLocaleString()}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#1A0A0A' }]}>
            Achievements
          </Text>
          <View style={styles.achievementsList}>
            {achievements.map((achievement) => (
              <View
                key={achievement.id}
                style={[styles.achievementCard, !achievement.earned && styles.achievementLocked]}
              >
                <View
                  style={[
                    styles.achievementIcon,
                    !achievement.earned && styles.achievementIconLocked,
                  ]}
                >
                  <Text style={styles.achievementEmoji}>
                    {achievement.earned ? achievement.emoji : '🔒'}
                  </Text>
                </View>
                <View style={styles.achievementInfo}>
                  <Text style={[styles.achievementTitle, { color: isDark ? '#fff' : '#000' }]}>
                    {achievement.title}
                  </Text>
                  <Text style={styles.achievementDesc}>{achievement.description}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bg.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    color: '#fff',
    fontSize: 20,
  },
  headerInfo: {
    flex: 1,
  },
  gameTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  gameGenre: {
    color: colors.text.secondary,
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  gamePreview: {
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
  },
  previewPlaceholder: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg.tertiary,
  },
  previewEmoji: {
    fontSize: 80,
    marginBottom: 16,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.category.purple,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    gap: 8,
  },
  playIcon: {
    fontSize: 16,
    color: '#000',
  },
  playText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  scoreBoard: {
    flexDirection: 'row',
    padding: 16,
  },
  scoreItem: {
    flex: 1,
    alignItems: 'center',
  },
  scoreDivider: {
    width: 1,
    backgroundColor: colors.bg.tertiary,
  },
  scoreLabel: {
    color: colors.text.secondary,
    fontSize: 13,
    marginBottom: 4,
  },
  scoreValue: {
    color: colors.category.purple,
    fontSize: 20,
    fontWeight: '700',
  },
  yourScore: {
    color: '#fff',
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  levelsList: {
    gap: 10,
  },
  levelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1a1a1a',
    padding: 14,
    borderRadius: 10,
  },
  levelLocked: {
    opacity: 0.5,
  },
  levelInfo: {
    flex: 1,
  },
  levelName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  levelDifficulty: {
    color: colors.text.secondary,
    fontSize: 12,
  },
  levelStars: {
    flexDirection: 'row',
    gap: 4,
  },
  starIcon: {
    fontSize: 16,
  },
  leaderboardList: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    overflow: 'hidden',
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.bg.tertiary,
  },
  leaderboardItemYou: {
    backgroundColor: colors.bg.tertiary,
  },
  rankBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.bg.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankBadgeTop: {
    backgroundColor: colors.category.purple,
  },
  rankText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  rankGold: {
    color: '#000',
  },
  rankSilver: {
    color: '#000',
  },
  rankBronze: {
    color: '#000',
  },
  playerName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  playerScore: {
    color: colors.category.purple,
    fontSize: 14,
    fontWeight: '600',
  },
  achievementsList: {
    gap: 10,
  },
  achievementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 12,
    borderRadius: 10,
    gap: 12,
  },
  achievementLocked: {
    opacity: 0.5,
  },
  achievementIcon: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: colors.bg.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievementIconLocked: {
    backgroundColor: '#1a1a1a',
  },
  achievementEmoji: {
    fontSize: 24,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  achievementDesc: {
    color: colors.text.secondary,
    fontSize: 12,
  },
  gameContainer: {
    flex: 1,
    backgroundColor: '#1A0A0A',
  },
  gameHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
    gap: 16,
  },
  pauseIcon: {
    fontSize: 28,
  },
  gameStats: {
    flex: 1,
    alignItems: 'center',
  },
  gameScore: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  gameHighScore: {
    color: colors.text.secondary,
    fontSize: 12,
  },
  gameArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gamePlaceholder: {
    alignItems: 'center',
  },
  gameEmoji: {
    fontSize: 100,
    marginBottom: 20,
  },
  gameStatus: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
  },
  scoreButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  scoreButton: {
    backgroundColor: colors.category.purple,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  scoreButtonSpecial: {
    backgroundColor: colors.category.highlight,
  },
  scoreButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
  },
  gameOverButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  gameOverText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  controlsArea: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    paddingBottom: 40,
  },
  dpad: {
    alignItems: 'center',
    gap: 4,
  },
  dpadRow: {
    flexDirection: 'row',
    gap: 4,
  },
  dpadButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.bg.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dpadCenter: {
    width: 50,
    height: 50,
  },
  dpadIcon: {
    fontSize: 24,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.category.purple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIcon: {
    fontSize: 28,
  },
});
