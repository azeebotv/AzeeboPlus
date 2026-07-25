import { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { LoadingState, EmptyState, ErrorState } from '../src/components/StateContainers';
import { apiClient } from '../src/api/client';
import { ApiResponse } from '../src/types/api';
import { analytics } from '../src/utils/analytics';

type ListResponse<T> = T[] | ApiResponse<T[]>;

interface LiveMatch {
  id: string;
  home: string;
  away: string;
  score: string;
  status: string;
  time: string;
  league: string;
}
interface UpcomingMatch {
  id: string;
  home: string;
  away: string;
  date: string;
  league: string;
  emoji: string;
}
interface SportCategory {
  id: string;
  name: string;
  emoji: string;
}
interface PredictionLeague {
  id: string;
  name: string;
  participants: string;
  prize: string;
}

export default function SportsUniverseHome() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const isDark = colorScheme === 'dark';

  const liveQuery = useQuery({
    queryKey: ['sports', 'live'],
    queryFn: async () => {
      const res = await apiClient.get<ListResponse<LiveMatch>>('/v1/sports/live');
      return Array.isArray(res) ? res : (res?.data ?? []);
    },
    staleTime: 30_000,
  });

  const upcomingQuery = useQuery({
    queryKey: ['sports', 'upcoming'],
    queryFn: async () => {
      const res = await apiClient.get<ListResponse<UpcomingMatch>>('/v1/sports/upcoming');
      return Array.isArray(res) ? res : (res?.data ?? []);
    },
    staleTime: 60_000,
  });

  const categoriesQuery = useQuery({
    queryKey: ['sports', 'categories'],
    queryFn: async () => {
      const res = await apiClient.get<ListResponse<SportCategory>>('/v1/sports/categories');
      return Array.isArray(res) ? res : (res?.data ?? []);
    },
    staleTime: 60_000,
  });

  const leaguesQuery = useQuery({
    queryKey: ['sports', 'prediction-leagues'],
    queryFn: async () => {
      const res = await apiClient.get<ListResponse<PredictionLeague>>(
        '/v1/sports/prediction-leagues'
      );
      return Array.isArray(res) ? res : (res?.data ?? []);
    },
    staleTime: 60_000,
  });

  const isLoading =
    liveQuery.isLoading ||
    upcomingQuery.isLoading ||
    categoriesQuery.isLoading ||
    leaguesQuery.isLoading;
  const error =
    liveQuery.error?.message ||
    upcomingQuery.error?.message ||
    categoriesQuery.error?.message ||
    leaguesQuery.error?.message;

  useEffect(() => {
    if (liveQuery.data && liveQuery.data.length > 0) {
      try {
        analytics.sportsFixtureViewed(liveQuery.data[0].id);
      } catch {}
    }
  }, [liveQuery.data]);

  const liveMatches = liveQuery.data ?? [];
  const upcomingMatches = upcomingQuery.data ?? [];
  const categories = categoriesQuery.data ?? [];
  const predictionLeagues = leaguesQuery.data ?? [];

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#1A0A0A' : '#ffffff' }]}>
        <LoadingState text="Loading sports events..." />
      </SafeAreaView>
    );
  }
  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#1A0A0A' : '#ffffff' }]}>
        <ErrorState
          description={error}
          onRetry={() => {
            liveQuery.refetch();
            upcomingQuery.refetch();
            categoriesQuery.refetch();
            leaguesQuery.refetch();
          }}
        />
      </SafeAreaView>
    );
  }
  if (!liveMatches.length && !upcomingMatches.length) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#1A0A0A' : '#ffffff' }]}>
        <EmptyState
          icon="⚽"
          title="No events available"
          description="Check back later for sports events"
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#1A0A0A' : '#ffffff' }]}>
      <ScrollView style={[styles.container, { backgroundColor: isDark ? '#1A0A0A' : '#ffffff' }]}>
        <View style={styles.header}>
          <Text style={styles.universeLabel}>⚽ Sports</Text>
          <Text style={[styles.headerTitle, { color: isDark ? '#ffffff' : '#1A0A0A' }]}>
            Sports Universe
          </Text>
        </View>

        <View style={styles.categoryScroll}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={styles.categoryChip}
              accessibilityLabel={`Filter by ${cat.name}`}
              accessibilityRole="button"
            >
              <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
              <Text style={styles.categoryName}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.liveSection}>
          <View style={styles.liveHeader}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE NOW</Text>
          </View>
          <View style={styles.liveMatches}>
            {liveMatches.map((match) => (
              <TouchableOpacity
                key={match.id}
                style={[styles.matchCard, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}
                onPress={() => router.push('/sports/prediction')}
                accessibilityLabel={`${match.home} vs ${match.away}`}
                accessibilityRole="button"
              >
                <View style={styles.matchLeague}>
                  <Text style={styles.leagueName}>{match.league}</Text>
                  <View style={styles.liveBadge}>
                    <View style={styles.liveIndicator} />
                    <Text style={styles.liveBadgeText}>{match.time}</Text>
                  </View>
                </View>
                <View style={styles.matchTeams}>
                  <View style={styles.teamInfo}>
                    <Text style={styles.teamEmoji}>🔵</Text>
                    <Text style={[styles.teamName, { color: isDark ? '#fff' : '#000' }]}>
                      {match.home}
                    </Text>
                  </View>
                  <View style={styles.scoreDisplay}>
                    <Text style={[styles.scoreText, { color: isDark ? '#fff' : '#000' }]}>
                      {match.score}
                    </Text>
                  </View>
                  <View style={[styles.teamInfo, styles.teamInfoRight]}>
                    <Text style={[styles.teamName, { color: isDark ? '#fff' : '#000' }]}>
                      {match.away}
                    </Text>
                    <Text style={styles.teamEmoji}>🔴</Text>
                  </View>
                </View>
                <View style={styles.matchActions}>
                  <TouchableOpacity
                    style={styles.watchButton}
                    accessibilityLabel={`Watch ${match.home} vs ${match.away} live`}
                    accessibilityRole="button"
                  >
                    <Text style={styles.watchButtonText}>Watch Live</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.predictButton}
                    accessibilityLabel={`Predict outcome for ${match.home} vs ${match.away}`}
                    accessibilityRole="button"
                  >
                    <Text style={styles.predictButtonText}>Predict</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#1A0A0A' }]}>
              Upcoming Matches
            </Text>
            <TouchableOpacity
              accessibilityLabel="See all upcoming matches"
              accessibilityRole="button"
            >
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.upcomingList}>
            {upcomingMatches.map((match) => (
              <TouchableOpacity
                key={match.id}
                style={[styles.upcomingCard, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}
                onPress={() => router.push('/sports/prediction')}
                accessibilityLabel={`${match.home} vs ${match.away} on ${match.date}`}
                accessibilityRole="button"
              >
                <Text style={styles.upcomingEmoji}>{match.emoji}</Text>
                <View style={styles.upcomingInfo}>
                  <Text style={[styles.upcomingTeams, { color: isDark ? '#fff' : '#000' }]}>
                    {match.home} vs {match.away}
                  </Text>
                  <Text style={styles.upcomingDate}>{match.date}</Text>
                  <Text style={styles.upcomingLeague}>{match.league}</Text>
                </View>
                <TouchableOpacity
                  style={styles.remindButton}
                  accessibilityLabel={`Set reminder for ${match.home} vs ${match.away}`}
                  accessibilityRole="button"
                >
                  <Text style={styles.remindIcon}>🔔</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#1A0A0A' }]}>
              Prediction Leagues
            </Text>
          </View>
          <View style={styles.predictionList}>
            {predictionLeagues.map((league) => (
              <TouchableOpacity
                key={league.id}
                style={[styles.predictionCard, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}
                onPress={() => router.push('/sports/prediction')}
                accessibilityLabel={`${league.name} prediction league`}
                accessibilityRole="button"
              >
                <View style={styles.predictionInfo}>
                  <Text style={[styles.predictionName, { color: isDark ? '#fff' : '#000' }]}>
                    {league.name}
                  </Text>
                  <View style={styles.predictionMeta}>
                    <Text style={styles.predictionParticipants}>👥 {league.participants}</Text>
                    <Text style={styles.predictionPrize}>🏆 {league.prize}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.joinButton}
                  accessibilityLabel={`Join ${league.name}`}
                  accessibilityRole="button"
                >
                  <Text style={styles.joinButtonText}>Join</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
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
    color: '#E74C3C',
    fontWeight: '600',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  categoryScroll: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 20,
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
  liveSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  liveHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  liveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E74C3C',
  },
  liveText: {
    color: '#E74C3C',
    fontSize: 14,
    fontWeight: '700',
  },
  liveMatches: {
    gap: 12,
  },
  matchCard: {
    padding: 16,
    borderRadius: 12,
  },
  matchLeague: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  leagueName: {
    color: '#888',
    fontSize: 12,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E74C3C',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 4,
  },
  liveIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
  liveBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  matchTeams: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  teamInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  teamInfoRight: {
    justifyContent: 'flex-end',
  },
  teamEmoji: {
    fontSize: 24,
  },
  teamName: {
    fontSize: 14,
    fontWeight: '600',
  },
  scoreDisplay: {
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  scoreText: {
    fontSize: 24,
    fontWeight: '700',
  },
  matchActions: {
    flexDirection: 'row',
    gap: 10,
  },
  watchButton: {
    flex: 1,
    backgroundColor: '#E74C3C',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  watchButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  predictButton: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  predictButtonText: {
    color: '#fff',
    fontSize: 13,
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
    color: '#E74C3C',
    fontSize: 14,
    fontWeight: '600',
  },
  upcomingList: {
    paddingHorizontal: 16,
    gap: 10,
  },
  upcomingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    gap: 12,
  },
  upcomingEmoji: {
    fontSize: 28,
  },
  upcomingInfo: {
    flex: 1,
  },
  upcomingTeams: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  upcomingDate: {
    color: '#E74C3C',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  upcomingLeague: {
    color: '#888',
    fontSize: 11,
  },
  remindButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  remindIcon: {
    fontSize: 18,
  },
  predictionList: {
    paddingHorizontal: 16,
    gap: 10,
  },
  predictionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    gap: 12,
  },
  predictionInfo: {
    flex: 1,
  },
  predictionName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  predictionMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  predictionParticipants: {
    color: '#888',
    fontSize: 12,
  },
  predictionPrize: {
    color: '#E74C3C',
    fontSize: 12,
    fontWeight: '600',
  },
  joinButton: {
    backgroundColor: '#E74C3C',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});
