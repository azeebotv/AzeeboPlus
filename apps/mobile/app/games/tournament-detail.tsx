import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { apiClient } from '@azeebo/react-data';
import { LoadingState, EmptyState, ErrorState } from '../../src/components/StateContainers';
import { colors } from '../../src/theme';

interface TournamentDetail {
  id: string;
  title: string;
  game: string;
  description: string;
  prize: string;
  entryFee: string;
  participants: number;
  maxParticipants: number;
  status: string;
  startTime: string;
  rules: string[];
  emoji: string;
}

interface LeaderboardEntry {
  id: string;
  rank: number;
  name: string;
  score: number;
  avatar: string;
}

export default function TournamentDetailScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const isDark = colorScheme === 'dark';
  const [tournament, setTournament] = useState<TournamentDetail | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [tRes, lbRes] = await Promise.all([
          apiClient.get<TournamentDetail>(`/games/tournaments/${id}`),
          apiClient.get<LeaderboardEntry[]>(`/games/tournaments/${id}/leaderboard`).catch(() => []),
        ]);
        setTournament(tRes);
        setLeaderboard(Array.isArray(lbRes) ? lbRes : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load tournament');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (isLoading)
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#1A0A0A' : '#ffffff' }]}>
        <LoadingState text="Loading tournament..." />
      </SafeAreaView>
    );
  if (error)
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#1A0A0A' : '#ffffff' }]}>
        <ErrorState description={error} onRetry={() => {}} />
      </SafeAreaView>
    );
  if (!tournament)
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#1A0A0A' : '#ffffff' }]}>
        <EmptyState icon="🏆" title="Tournament not found" />
      </SafeAreaView>
    );

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#1A0A0A' : '#ffffff' }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text
          style={[styles.headerTitle, { color: isDark ? '#ffffff' : '#1A0A0A' }]}
          numberOfLines={1}
        >
          {tournament.title}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.heroCard, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
          <Text style={styles.heroEmoji}>{tournament.emoji}</Text>
          <Text style={[styles.heroTitle, { color: isDark ? '#fff' : '#000' }]}>
            {tournament.title}
          </Text>
          <Text style={styles.heroGame}>{tournament.game}</Text>
          <Text style={styles.heroDesc}>{tournament.description}</Text>
          <View style={styles.heroMeta}>
            <Text style={styles.heroPrize}>🏆 {tournament.prize}</Text>
            <Text style={styles.heroParticipants}>
              👥 {tournament.participants}/{tournament.maxParticipants}
            </Text>
          </View>
          {tournament.status === 'upcoming' && (
            <TouchableOpacity
              style={styles.joinButton}
              onPress={() => Alert.alert('Joined!', 'You have joined the tournament')}
            >
              <Text style={styles.joinButtonText}>Join Tournament ({tournament.entryFee})</Text>
            </TouchableOpacity>
          )}
          {tournament.status === 'active' && (
            <View style={styles.liveBadge}>
              <Text style={styles.liveText}>🔴 LIVE</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>Rules</Text>
          {tournament.rules.map((rule, i) => (
            <Text key={i} style={styles.ruleText}>
              {i + 1}. {rule}
            </Text>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>
            Leaderboard
          </Text>
          {leaderboard.map((entry) => (
            <View
              key={entry.id}
              style={[styles.lbRow, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}
            >
              <Text style={styles.lbRank}>{getRankIcon(entry.rank)}</Text>
              <View style={styles.lbAvatar}>
                <Text style={styles.lbAvatarEmoji}>{entry.avatar}</Text>
              </View>
              <Text style={[styles.lbName, { color: isDark ? '#fff' : '#000' }]}>{entry.name}</Text>
              <Text style={styles.lbScore}>{entry.score.toLocaleString()} pts</Text>
            </View>
          ))}
          {leaderboard.length === 0 && <Text style={styles.emptyText}>No scores yet</Text>}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingTop: 50, gap: 12 },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bg.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { color: '#fff', fontSize: 20 },
  headerTitle: { fontSize: 20, fontWeight: '700', flex: 1 },
  content: { paddingBottom: 30 },
  heroCard: { margin: 16, padding: 20, borderRadius: 16, alignItems: 'center' },
  heroEmoji: { fontSize: 64, marginBottom: 12 },
  heroTitle: { fontSize: 22, fontWeight: '700', marginBottom: 4, textAlign: 'center' },
  heroGame: { color: colors.category.purple, fontSize: 14, marginBottom: 8 },
  heroDesc: { color: colors.text.secondary, fontSize: 13, textAlign: 'center', marginBottom: 12 },
  heroMeta: { flexDirection: 'row', gap: 20, marginBottom: 16 },
  heroPrize: { color: colors.category.purple, fontSize: 16, fontWeight: '700' },
  heroParticipants: { color: colors.text.secondary, fontSize: 14 },
  joinButton: {
    backgroundColor: colors.category.purple,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 10,
  },
  joinButtonText: { color: '#000', fontSize: 16, fontWeight: '700' },
  liveBadge: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#EF4444',
  },
  liveText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  section: { paddingHorizontal: 16, marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  ruleText: { color: colors.neutral[300], fontSize: 13, marginBottom: 8, lineHeight: 20 },
  lbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  lbRank: { width: 36, fontSize: 16, fontWeight: '700', textAlign: 'center' },
  lbAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bg.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  lbAvatarEmoji: { fontSize: 18 },
  lbName: { flex: 1, fontSize: 14, fontWeight: '600' },
  lbScore: { color: colors.category.purple, fontSize: 14, fontWeight: '700' },
  emptyText: {
    color: colors.text.secondary,
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
  },
});
