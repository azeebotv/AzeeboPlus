import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { LoadingState, EmptyState, ErrorState } from '../src/components/StateContainers';
import { apiClient } from '../src/api/client';

interface LiveMatch { id: string; home: string; away: string; score: string; status: string; time: string; league: string; }
interface UpcomingMatch { id: string; home: string; away: string; date: string; league: string; emoji: string; }
interface SportCategory { id: string; name: string; emoji: string; }
interface PredictionLeague { id: string; name: string; participants: string; prize: string; }

export default function SportsUniverseHome() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const isDark = colorScheme === 'dark';
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liveMatches, setLiveMatches] = useState<LiveMatch[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<UpcomingMatch[]>([]);
  const [categories, setCategories] = useState<SportCategory[]>([]);
  const [predictionLeagues, setPredictionLeagues] = useState<PredictionLeague[]>([]);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [liveRes, upcomingRes, catsRes, leaguesRes] = await Promise.all([
        apiClient.get<any>('/v1/sports/live'),
        apiClient.get<any>('/v1/sports/upcoming'),
        apiClient.get<any>('/v1/sports/categories'),
        apiClient.get<any>('/v1/sports/prediction-leagues'),
      ]);
      setLiveMatches(Array.isArray(liveRes) ? liveRes : liveRes?.data ?? []);
      setUpcomingMatches(Array.isArray(upcomingRes) ? upcomingRes : upcomingRes?.data ?? []);
      setCategories(Array.isArray(catsRes) ? catsRes : catsRes?.data ?? []);
      setPredictionLeagues(Array.isArray(leaguesRes) ? leaguesRes : leaguesRes?.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (isLoading) return <LoadingState text="Loading sports events..." />;
  if (error) return <ErrorState description={error} onRetry={fetchData} />;
  if (!liveMatches.length && !upcomingMatches.length) {
    return <EmptyState icon="⚽" title="No events available" description="Check back later for sports events" />;
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: isDark ? '#0a0a0a' : '#ffffff' }]}>
      <View style={styles.header}>
        <Text style={styles.universeLabel}>⚽ Sports</Text>
        <Text style={[styles.headerTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
          Sports Universe
        </Text>
      </View>

      <View style={styles.categoryScroll}>
        {categories.map((cat) => (
          <TouchableOpacity key={cat.id} style={styles.categoryChip}>
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
                  <Text style={[styles.teamName, { color: isDark ? '#fff' : '#000' }]}>{match.home}</Text>
                </View>
                <View style={styles.scoreDisplay}>
                  <Text style={[styles.scoreText, { color: isDark ? '#fff' : '#000' }]}>{match.score}</Text>
                </View>
                <View style={[styles.teamInfo, styles.teamInfoRight]}>
                  <Text style={[styles.teamName, { color: isDark ? '#fff' : '#000' }]}>{match.away}</Text>
                  <Text style={styles.teamEmoji}>🔴</Text>
                </View>
              </View>
              <View style={styles.matchActions}>
                <TouchableOpacity style={styles.watchButton}>
                  <Text style={styles.watchButtonText}>Watch Live</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.predictButton}>
                  <Text style={styles.predictButtonText}>Predict</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
            Upcoming Matches
          </Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.upcomingList}>
          {upcomingMatches.map((match) => (
            <TouchableOpacity
              key={match.id}
              style={[styles.upcomingCard, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}
              onPress={() => router.push('/sports/prediction')}
            >
              <Text style={styles.upcomingEmoji}>{match.emoji}</Text>
              <View style={styles.upcomingInfo}>
                <Text style={[styles.upcomingTeams, { color: isDark ? '#fff' : '#000' }]}>
                  {match.home} vs {match.away}
                </Text>
                <Text style={styles.upcomingDate}>{match.date}</Text>
                <Text style={styles.upcomingLeague}>{match.league}</Text>
              </View>
              <TouchableOpacity style={styles.remindButton}>
                <Text style={styles.remindIcon}>🔔</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
            Prediction Leagues
          </Text>
        </View>
        <View style={styles.predictionList}>
          {predictionLeagues.map((league) => (
            <TouchableOpacity
              key={league.id}
              style={[styles.predictionCard, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}
              onPress={() => router.push('/sports/prediction')}
            >
              <View style={styles.predictionInfo}>
                <Text style={[styles.predictionName, { color: isDark ? '#fff' : '#000' }]}>{league.name}</Text>
                <View style={styles.predictionMeta}>
                  <Text style={styles.predictionParticipants}>👥 {league.participants}</Text>
                  <Text style={styles.predictionPrize}>🏆 {league.prize}</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.joinButton}>
                <Text style={styles.joinButtonText}>Join</Text>
              </TouchableOpacity>
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