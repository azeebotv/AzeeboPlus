import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useColorScheme } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { colors, radius } from '../../src/theme';
import { apiClient } from '../../src/api/client';
import { LoadingState, ErrorState } from '../../src/components/StateContainers';

interface GameDetail {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  reward: number;
  playCount: number;
  rules: string[];
  highScore?: number;
}

export default function GameDetailScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const isDark = colorScheme === 'dark';
  const { id } = useLocalSearchParams<{ id: string }>();

  const gameQuery = useQuery({
    queryKey: ['games', 'detail', id],
    queryFn: async () => {
      const res = await apiClient.get<GameDetail>(`/v1/games/${id}`);
      return res;
    },
    enabled: !!id,
  });

  const game = gameQuery.data;

  if (gameQuery.isLoading) return <LoadingState text="Loading game..." />;
  if (gameQuery.error)
    return <ErrorState description={gameQuery.error.message} onRetry={() => gameQuery.refetch()} />;
  if (!game) return <ErrorState description="Game not found" />;

  const difficultyColor =
    game.difficulty === 'easy' ? '#10B981' : game.difficulty === 'medium' ? '#F59E0B' : '#EF4444';

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: isDark ? colors.bg.primary : '#fff' }]}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]} numberOfLines={1}>
          {game.title}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Game Info Card */}
        <View
          style={[styles.heroCard, { backgroundColor: isDark ? colors.bg.tertiary : '#f5f5f5' }]}
        >
          <View style={styles.badges}>
            <View style={[styles.badge, { backgroundColor: difficultyColor + '20' }]}>
              <Text style={[styles.badgeText, { color: difficultyColor }]}>{game.difficulty}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: colors.primary[500] + '20' }]}>
              <Text style={[styles.badgeText, { color: colors.primary[500] }]}>
                {game.category}
              </Text>
            </View>
          </View>
          <Text style={[styles.description, { color: isDark ? colors.text.secondary : '#666' }]}>
            {game.description}
          </Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{game.playCount.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Plays</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#F59E0B' }]}>₦{game.reward}</Text>
              <Text style={styles.statLabel}>Reward</Text>
            </View>
            {game.highScore && (
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: '#10B981' }]}>
                  {game.highScore.toLocaleString()}
                </Text>
                <Text style={styles.statLabel}>High Score</Text>
              </View>
            )}
          </View>
        </View>

        {/* Rules */}
        {game.rules.length > 0 && (
          <View
            style={[styles.section, { backgroundColor: isDark ? colors.bg.tertiary : '#f5f5f5' }]}
          >
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>How to Play</Text>
            {game.rules.map((rule, i) => (
              <View key={i} style={styles.ruleRow}>
                <Text style={styles.ruleNumber}>{i + 1}</Text>
                <Text style={[styles.ruleText, { color: isDark ? colors.text.secondary : '#666' }]}>
                  {rule}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Play Button */}
        <TouchableOpacity
          style={styles.playButton}
          onPress={() => router.push(`/games/${game.id}`)}
          activeOpacity={0.8}
        >
          <Text style={styles.playButtonText}>🎮 Play Now</Text>
        </TouchableOpacity>
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
  content: { padding: 16, gap: 16 },
  heroCard: { padding: 20, borderRadius: radius.lg },
  badges: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  description: { fontSize: 14, lineHeight: 22, marginBottom: 16 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '700', color: colors.text.primary },
  statLabel: { fontSize: 11, color: colors.text.tertiary, marginTop: 2 },
  section: { padding: 16, borderRadius: radius.lg },
  sectionTitle: { fontSize: 14, fontWeight: '700', marginBottom: 12 },
  ruleRow: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  ruleNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary[500] + '20',
    textAlign: 'center',
    lineHeight: 24,
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary[500],
    overflow: 'hidden',
  },
  ruleText: { flex: 1, fontSize: 13, lineHeight: 20 },
  playButton: {
    padding: 18,
    borderRadius: radius.lg,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    marginTop: 8,
  },
  playButtonText: { fontSize: 18, fontWeight: '700', color: '#fff' },
});
