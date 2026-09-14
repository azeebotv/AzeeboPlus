import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useColorScheme } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { colors, radius } from '../../src/theme';
import { apiClient } from '../../src/api/client';
import { LoadingState, ErrorState } from '../../src/components/StateContainers';

interface MatchDetail {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  status: 'scheduled' | 'live' | 'finished';
  league: string;
  venue: string;
  startTime: string;
  highlights?: string[];
  stats?: {
    possession: [number, number];
    shots: [number, number];
    corners: [number, number];
  };
}

export default function SportsMatchScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const isDark = colorScheme === 'dark';
  const { id } = useLocalSearchParams<{ id: string }>();

  const matchQuery = useQuery({
    queryKey: ['sports', 'match', id],
    queryFn: async () => {
      const res = await apiClient.get<MatchDetail>(`/v1/sports/fixtures/${id}`);
      return res;
    },
    enabled: !!id,
  });

  const match = matchQuery.data;

  if (matchQuery.isLoading) return <LoadingState text="Loading match..." />;
  if (matchQuery.error)
    return (
      <ErrorState description={matchQuery.error.message} onRetry={() => matchQuery.refetch()} />
    );
  if (!match) return <ErrorState description="Match not found" />;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: isDark ? colors.bg.primary : '#fff' }]}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]} numberOfLines={1}>
          {match.league}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Scoreboard */}
        <View
          style={[styles.scoreboard, { backgroundColor: isDark ? colors.bg.tertiary : '#f5f5f5' }]}
        >
          {match.status === 'live' && (
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          )}
          <View style={styles.teams}>
            <View style={styles.team}>
              <Text style={[styles.teamName, { color: colors.text.primary }]} numberOfLines={1}>
                {match.homeTeam}
              </Text>
              <Text style={styles.teamLabel}>Home</Text>
            </View>
            <View style={styles.score}>
              <Text style={styles.scoreText}>
                {match.homeScore} - {match.awayScore}
              </Text>
              <Text style={styles.statusText}>{match.status}</Text>
            </View>
            <View style={styles.team}>
              <Text style={[styles.teamName, { color: colors.text.primary }]} numberOfLines={1}>
                {match.awayTeam}
              </Text>
              <Text style={styles.teamLabel}>Away</Text>
            </View>
          </View>
        </View>

        {/* Match Info */}
        <View
          style={[styles.section, { backgroundColor: isDark ? colors.bg.tertiary : '#f5f5f5' }]}
        >
          <InfoRow label="Venue" value={match.venue} />
          <InfoRow
            label="Kickoff"
            value={new Date(match.startTime).toLocaleString('en-NG', {
              dateStyle: 'medium',
              timeStyle: 'short',
            })}
          />
        </View>

        {/* Stats */}
        {match.stats && (
          <View
            style={[styles.section, { backgroundColor: isDark ? colors.bg.tertiary : '#f5f5f5' }]}
          >
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Match Stats</Text>
            <StatBar
              label="Possession"
              home={match.stats.possession[0]}
              away={match.stats.possession[1]}
              unit="%"
            />
            <StatBar label="Shots" home={match.stats.shots[0]} away={match.stats.shots[1]} />
            <StatBar label="Corners" home={match.stats.corners[0]} away={match.stats.corners[1]} />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function StatBar({
  label,
  home,
  away,
  unit = '',
}: {
  label: string;
  home: number;
  away: number;
  unit?: string;
}) {
  const total = home + away || 1;
  const homePct = (home / total) * 100;
  return (
    <View style={styles.statRow}>
      <Text style={styles.statHome}>
        {home}
        {unit}
      </Text>
      <View style={styles.statBarContainer}>
        <View style={[styles.statBarHome, { width: `${homePct}%` }]} />
        <Text style={styles.statLabel}>{label}</Text>
      </View>
      <Text style={styles.statAway}>
        {away}
        {unit}
      </Text>
    </View>
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
  scoreboard: { padding: 24, borderRadius: radius.lg, alignItems: 'center' },
  liveIndicator: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444' },
  liveText: { fontSize: 12, fontWeight: '700', color: '#EF4444' },
  teams: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  team: { flex: 1, alignItems: 'center' },
  teamName: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  teamLabel: { fontSize: 11, color: colors.text.tertiary },
  score: { alignItems: 'center', paddingHorizontal: 20 },
  scoreText: { fontSize: 32, fontWeight: '800', color: colors.text.primary },
  statusText: { fontSize: 11, color: colors.text.tertiary, marginTop: 4 },
  section: { padding: 16, borderRadius: radius.lg },
  sectionTitle: { fontSize: 14, fontWeight: '700', marginBottom: 12 },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2A1A1A',
  },
  infoLabel: { fontSize: 13, color: colors.text.tertiary },
  infoValue: { fontSize: 13, fontWeight: '600', color: colors.text.primary },
  statRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  statHome: {
    width: 36,
    textAlign: 'right',
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary[500],
  },
  statAway: { width: 36, textAlign: 'left', fontSize: 13, fontWeight: '600', color: '#8B5CF6' },
  statBarContainer: {
    flex: 1,
    height: 6,
    backgroundColor: colors.alphaColors.violetA20,
    borderRadius: 3,
    position: 'relative',
  },
  statBarHome: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: 6,
    backgroundColor: colors.primary[500],
    borderRadius: 3,
  },
  statLabel: {
    position: 'absolute',
    width: '100%',
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '600',
    color: colors.text.primary,
    lineHeight: 6,
  },
});
