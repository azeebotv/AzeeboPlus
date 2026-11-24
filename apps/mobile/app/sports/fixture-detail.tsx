import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { apiClient } from '@azeebo/react-data';
import { LoadingState, EmptyState, ErrorState } from '../../src/components/StateContainers';
import { colors } from '../../src/theme';

interface FixtureDetail {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  date: string;
  time: string;
  league: string;
  venue: string;
  status: string;
}

interface MatchStats {
  possession: { home: number; away: number };
  shots: { home: number; away: number };
  shotsOnTarget: { home: number; away: number };
  corners: { home: number; away: number };
  fouls: { home: number; away: number };
}

interface Prediction {
  id: string;
  label: string;
  odds: number;
  selected?: boolean;
}

type Tab = 'stats' | 'predictions' | 'lineups';

export default function FixtureDetailScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const isDark = colorScheme === 'dark';
  const [activeTab, setActiveTab] = useState<Tab>('stats');
  const [fixture, setFixture] = useState<FixtureDetail | null>(null);
  const [stats, setStats] = useState<MatchStats | null>(null);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [fixtureRes, statsRes, predsRes] = await Promise.all([
        apiClient.get<FixtureDetail>(`/sports/fixtures/${id}`).catch(() => null),
        apiClient.get<MatchStats>(`/sports/fixtures/${id}/stats`).catch(() => null),
        apiClient.get<Prediction[]>(`/sports/fixtures/${id}/predictions`).catch(() => []),
      ]);
      setFixture(fixtureRes);
      setStats(statsRes);
      setPredictions(Array.isArray(predsRes) ? predsRes : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load fixture');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  if (isLoading)
    return (
      <SafeAreaView accessibilityLabel="Fixture Detail Screen" style={[styles.container, { backgroundColor: isDark ? '#1A0A0A' : '#ffffff' }]}>
        <LoadingState text="Loading fixture..." />
      </SafeAreaView>
    );
  if (error)
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#1A0A0A' : '#ffffff' }]}>
        <ErrorState description={error} onRetry={fetchData} />
      </SafeAreaView>
    );
  if (!fixture)
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#1A0A0A' : '#ffffff' }]}>
        <EmptyState icon="⚽" title="Fixture not found" />
      </SafeAreaView>
    );

  const renderStatBar = (label: string, home: number, away: number) => {
    const total = home + away || 1;
    const homePct = (home / total) * 100;
    return (
      <View style={styles.statRow}>
        <Text style={[styles.statValue, { color: isDark ? '#fff' : '#000' }]}>{home}</Text>
        <View style={styles.statBarContainer}>
          <View style={styles.statBar}>
            <View
              style={[
                styles.statBarFill,
                { width: `${homePct}%`, backgroundColor: colors.error[500] },
              ]}
            />
          </View>
          <Text style={styles.statLabel}>{label}</Text>
          <View style={styles.statBar}>
            <View
              style={[
                styles.statBarFillRight,
                { width: `${100 - homePct}%`, backgroundColor: colors.neutral[500] },
              ]}
            />
          </View>
        </View>
        <Text style={[styles.statValue, { color: isDark ? '#fff' : '#000' }]}>{away}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#1A0A0A' : '#ffffff' }]}>
      <View style={styles.header}>
        <TouchableOpacity accessibilityRole="button" style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: isDark ? '#ffffff' : '#1A0A0A' }]}>
          Fixture Detail
        </Text>
      </View>

      <ScrollView>
        <View style={[styles.matchCard, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
          <Text style={styles.leagueText}>{fixture.league}</Text>
          <View style={styles.matchTeams}>
            <View style={styles.teamColumn}>
              <Text style={styles.teamEmoji}>🔵</Text>
              <Text style={[styles.teamName, { color: isDark ? '#fff' : '#000' }]}>
                {fixture.homeTeam}
              </Text>
            </View>
            <View style={styles.scoreColumn}>
              <Text style={[styles.scoreText, { color: isDark ? '#fff' : '#000' }]}>
                {fixture.homeScore} - {fixture.awayScore}
              </Text>
              <Text style={styles.statusText}>
                {fixture.status === 'finished' ? 'Full Time' : fixture.time}
              </Text>
            </View>
            <View style={styles.teamColumn}>
              <Text style={styles.teamEmoji}>🔴</Text>
              <Text style={[styles.teamName, { color: isDark ? '#fff' : '#000' }]}>
                {fixture.awayTeam}
              </Text>
            </View>
          </View>
          <Text style={styles.venueText}>📍 {fixture.venue}</Text>
        </View>

        <View style={styles.tabBar}>
          {(['stats', 'predictions', 'lineups'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === 'stats' && stats && (
          <View style={styles.statsSection}>
            {renderStatBar('Possession', stats.possession.home, stats.possession.away)}
            {renderStatBar('Shots', stats.shots.home, stats.shots.away)}
            {renderStatBar('On Target', stats.shotsOnTarget.home, stats.shotsOnTarget.away)}
            {renderStatBar('Corners', stats.corners.home, stats.corners.away)}
            {renderStatBar('Fouls', stats.fouls.home, stats.fouls.away)}
          </View>
        )}

        {activeTab === 'predictions' && (
          <View style={styles.predictionsSection}>
            {predictions.map((pred) => (
              <TouchableOpacity
                key={pred.id}
                style={[styles.predictionCard, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}
                onPress={() => Alert.alert('Prediction', `Place prediction on ${pred.label}?`)}
              >
                <Text style={[styles.predictionLabel, { color: isDark ? '#fff' : '#000' }]}>
                  {pred.label}
                </Text>
                <Text style={styles.predictionOdds}>{pred.odds.toFixed(2)}</Text>
              </TouchableOpacity>
            ))}
            {predictions.length === 0 && (
              <Text style={styles.emptyText}>No predictions available</Text>
            )}
          </View>
        )}

        {activeTab === 'lineups' && (
          <View style={styles.lineupsSection}>
            <Text style={styles.emptyText}>Lineups will be available before kickoff</Text>
          </View>
        )}
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
  headerTitle: { fontSize: 20, fontWeight: '700' },
  matchCard: { margin: 16, padding: 20, borderRadius: 16, alignItems: 'center' },
  leagueText: { color: colors.error[500], fontSize: 12, fontWeight: '600', marginBottom: 16 },
  matchTeams: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 16,
  },
  teamColumn: { alignItems: 'center', flex: 1 },
  teamEmoji: { fontSize: 40, marginBottom: 8 },
  teamName: { fontSize: 14, fontWeight: '700', textAlign: 'center' },
  scoreColumn: { alignItems: 'center', paddingHorizontal: 20 },
  scoreText: { fontSize: 32, fontWeight: '700', marginBottom: 4 },
  statusText: { color: colors.text.secondary, fontSize: 12 },
  venueText: { color: colors.text.secondary, fontSize: 12 },
  tabBar: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 16 },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: colors.error[500] },
  tabText: { color: colors.text.secondary, fontSize: 14, fontWeight: '600' },
  tabTextActive: { color: colors.error[500] },
  statsSection: { paddingHorizontal: 16, gap: 16 },
  statRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  statValue: { fontSize: 14, fontWeight: '700', width: 30, textAlign: 'center' },
  statBarContainer: { flex: 1, alignItems: 'center' },
  statBar: { height: 4, backgroundColor: colors.bg.tertiary, borderRadius: 2, width: '100%' },
  statBarFill: { height: 4, borderRadius: 2 },
  statBarFillRight: { height: 4, borderRadius: 2, marginLeft: 'auto' },
  statLabel: { color: colors.text.secondary, fontSize: 11, marginVertical: 4 },
  predictionsSection: { paddingHorizontal: 16, gap: 10 },
  predictionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 10,
  },
  predictionLabel: { fontSize: 14, fontWeight: '600' },
  predictionOdds: { color: colors.error[500], fontSize: 16, fontWeight: '700' },
  lineupsSection: { paddingHorizontal: 16 },
  emptyText: {
    color: colors.text.secondary,
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 30,
  },
});
