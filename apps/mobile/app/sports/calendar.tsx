'use client';

import { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@azeebo/react-data/api/client';
import { ApiResponse } from '@azeebo/react-data/types/api';
import { colors } from '../../src/theme';
import { LoadingState, EmptyState } from '../../src/components/StateContainers';

interface FixtureMatch {
  id: string;
  homeTeam: string;
  homeLogo?: string;
  awayTeam: string;
  awayLogo?: string;
  league: string;
  time: string;
  date: string;
  venue: string;
  broadcaster?: string;
  status: string;
  score?: string;
  homeScore?: number;
  awayScore?: number;
  odds?: { home: number; draw: number; away: number };
}

type ListResponse<T> = T[] | ApiResponse<T[]>;

export default function SportsCalendarScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [selectedLeague, setSelectedLeague] = useState('all');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [reminders, setReminders] = useState<Record<string, boolean>>({});

  const fixturesQuery = useQuery({
    queryKey: ['sports', 'calendar-fixtures'],
    queryFn: async () => {
      try {
        const res = await apiClient.get<ListResponse<FixtureMatch>>('/api/sports/fixtures');
        const list = Array.isArray(res) ? res : (res?.data ?? []);
        if (list.length > 0) return list;
      } catch {
        // Try fallback route
      }
      const v1Res = await apiClient.get<ListResponse<FixtureMatch>>('/v1/sports/fixtures');
      return Array.isArray(v1Res) ? v1Res : (v1Res?.data ?? []);
    },
    staleTime: 30_000,
  });

  const fixtures = fixturesQuery.data ?? [];

  const availableDates = useMemo(() => {
    const dates = Array.from(new Set(fixtures.map((f) => f.date).filter(Boolean)));
    dates.sort();
    return dates;
  }, [fixtures]);

  const activeDate = selectedDate || availableDates[0] || new Date().toISOString().split('T')[0];

  const leagues = useMemo(() => {
    const fromFixtures = Array.from(
      new Set(fixtures.map((f) => f.league).filter((l): l is string => Boolean(l)))
    );
    const standard = ['NPFL', 'EPL', 'CAF', 'LA LIGA'];
    const merged = Array.from(new Set([...fromFixtures, ...standard]));
    return [{ id: 'all', name: 'All Leagues' }, ...merged.map((l) => ({ id: l, name: l }))];
  }, [fixtures]);

  const filteredMatches = fixtures.filter((f) => {
    const matchesDate = !f.date || f.date === activeDate;
    const matchesLeague = selectedLeague === 'all' || f.league?.toUpperCase() === selectedLeague.toUpperCase();
    return matchesDate && matchesLeague;
  });

  const toggleReminder = (matchId: string, matchTitle: string) => {
    const nextState = !reminders[matchId];
    setReminders((prev) => ({ ...prev, [matchId]: nextState }));
    if (nextState) {
      Alert.alert('Reminder Set', `You will receive a notification before ${matchTitle} kicks off!`);
    }
  };

  const themeStyles = createStyles(isDark);

  if (fixturesQuery.isLoading) {
    return <LoadingState text="Loading match calendar..." />;
  }

  return (
    <SafeAreaView style={themeStyles.container} edges={['top']}>
      {/* Header */}
      <View style={themeStyles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={themeStyles.backButton}
          accessibilityLabel="Back"
          accessibilityRole="button"
        >
          <Text style={themeStyles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={themeStyles.headerTitle}>Match Calendar</Text>
        <TouchableOpacity
          onPress={() => router.push('/sports/fixtures')}
          style={themeStyles.headerAction}
        >
          <Text style={themeStyles.headerActionText}>All</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={themeStyles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Date Selector Row */}
        {availableDates.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={themeStyles.datesRow}
          >
            {availableDates.map((d) => {
              const isActive = d === activeDate;
              const dateObj = new Date(d);
              const dayName = isNaN(dateObj.getTime())
                ? d
                : dateObj.toLocaleDateString('en-US', { weekday: 'short' });
              const dayNum = isNaN(dateObj.getTime())
                ? ''
                : dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });

              return (
                <TouchableOpacity
                  key={d}
                  style={[themeStyles.dateCard, isActive && themeStyles.dateCardActive]}
                  onPress={() => setSelectedDate(d)}
                >
                  <Text style={[themeStyles.dayName, isActive && themeStyles.dayTextActive]}>{dayName}</Text>
                  <Text style={[themeStyles.dayNum, isActive && themeStyles.dayTextActive]}>{dayNum || d}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* League Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={themeStyles.leaguesRow}
        >
          {leagues.map((lg) => {
            const isActive = selectedLeague === lg.id;
            return (
              <TouchableOpacity
                key={lg.id}
                style={[themeStyles.leaguePill, isActive && themeStyles.leaguePillActive]}
                onPress={() => setSelectedLeague(lg.id)}
              >
                <Text style={[themeStyles.leaguePillText, isActive && themeStyles.leaguePillTextActive]}>
                  {lg.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Match Fixtures List */}
        <View style={themeStyles.fixturesList}>
          {filteredMatches.length === 0 ? (
            <EmptyState
              icon="⚽"
              title="No matches scheduled"
              description="No games found for this date and league filter."
            />
          ) : (
            filteredMatches.map((match) => {
              const isReminded = reminders[match.id];
              const scoreText =
                match.score ||
                (match.homeScore !== undefined && match.awayScore !== undefined
                  ? `${match.homeScore} - ${match.awayScore}`
                  : null);

              return (
                <TouchableOpacity
                  key={match.id}
                  style={themeStyles.matchCard}
                  onPress={() => router.push(`/sports/match?id=${match.id}`)}
                  activeOpacity={0.7}
                >
                  {/* Top Bar: League, Status, Reminder Bell */}
                  <View style={themeStyles.matchTopBar}>
                    <View style={themeStyles.leagueBadge}>
                      <Text style={themeStyles.leagueBadgeText}>{match.league || 'LEAGUE'}</Text>
                    </View>
                    <View style={themeStyles.statusContainer}>
                      {match.status === 'live' ? (
                        <View style={themeStyles.liveIndicator}>
                          <View style={themeStyles.liveDot} />
                          <Text style={themeStyles.liveText}>LIVE</Text>
                        </View>
                      ) : (
                        <Text style={themeStyles.timeText}>{match.time || '16:00'}</Text>
                      )}
                      <TouchableOpacity
                        onPress={() => toggleReminder(match.id, `${match.homeTeam} vs ${match.awayTeam}`)}
                        style={themeStyles.bellButton}
                      >
                        <Text style={themeStyles.bellIcon}>{isReminded ? '🔔' : '🔕'}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Teams & Score */}
                  <View style={themeStyles.teamsContainer}>
                    <View style={themeStyles.teamRow}>
                      <Text style={themeStyles.teamName} numberOfLines={1}>{match.homeTeam}</Text>
                      {scoreText ? (
                        <Text style={themeStyles.scoreText}>{match.homeScore ?? '-'}</Text>
                      ) : null}
                    </View>
                    <View style={themeStyles.teamRow}>
                      <Text style={themeStyles.teamName} numberOfLines={1}>{match.awayTeam}</Text>
                      {scoreText ? (
                        <Text style={themeStyles.scoreText}>{match.awayScore ?? '-'}</Text>
                      ) : null}
                    </View>
                  </View>

                  {/* Bottom: Venue & Odds */}
                  <View style={themeStyles.matchFooter}>
                    <Text style={themeStyles.venueText} numberOfLines={1}>
                      📍 {match.venue || 'Stadium'} {match.broadcaster ? `• 📺 ${match.broadcaster}` : ''}
                    </Text>
                    {match.odds ? (
                      <View style={themeStyles.oddsRow}>
                        <Text style={themeStyles.oddsText}>1: {match.odds.home}</Text>
                        <Text style={themeStyles.oddsText}>X: {match.odds.draw}</Text>
                        <Text style={themeStyles.oddsText}>2: {match.odds.away}</Text>
                      </View>
                    ) : null}
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(isDark: boolean) {
  const bg = isDark ? '#030712' : '#F9FAFB';
  const cardBg = isDark ? '#111827' : '#FFFFFF';
  const border = isDark ? '#1F2937' : '#E5E7EB';
  const textPrimary = isDark ? '#F9FAFB' : '#111827';
  const textSecondary = isDark ? '#9CA3AF' : '#6B7280';

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: bg,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: border,
    },
    backButton: {
      padding: 8,
      marginRight: 8,
    },
    backButtonText: {
      fontSize: 22,
      color: textPrimary,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: textPrimary,
      flex: 1,
    },
    headerAction: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 6,
      backgroundColor: isDark ? '#1F2937' : '#E5E7EB',
    },
    headerActionText: {
      fontSize: 12,
      fontWeight: '600',
      color: textPrimary,
    },
    scrollContent: {
      paddingBottom: 40,
    },
    datesRow: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 8,
    },
    dateCard: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 10,
      backgroundColor: cardBg,
      borderWidth: 1,
      borderColor: border,
      alignItems: 'center',
      minWidth: 70,
    },
    dateCardActive: {
      backgroundColor: colors.primary[500],
      borderColor: colors.primary[500],
    },
    dayName: {
      fontSize: 11,
      color: textSecondary,
      fontWeight: '600',
      marginBottom: 2,
    },
    dayNum: {
      fontSize: 13,
      color: textPrimary,
      fontWeight: '700',
    },
    dayTextActive: {
      color: '#FFFFFF',
    },
    leaguesRow: {
      paddingHorizontal: 16,
      paddingBottom: 12,
      gap: 8,
    },
    leaguePill: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      backgroundColor: cardBg,
      borderWidth: 1,
      borderColor: border,
    },
    leaguePillActive: {
      backgroundColor: colors.primary[500],
      borderColor: colors.primary[500],
    },
    leaguePillText: {
      fontSize: 12,
      color: textSecondary,
      fontWeight: '600',
    },
    leaguePillTextActive: {
      color: '#FFFFFF',
    },
    fixturesList: {
      paddingHorizontal: 16,
      gap: 12,
    },
    matchCard: {
      backgroundColor: cardBg,
      borderRadius: 14,
      padding: 16,
      borderWidth: 1,
      borderColor: border,
    },
    matchTopBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    leagueBadge: {
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    leagueBadgeText: {
      color: '#3B82F6',
      fontSize: 10,
      fontWeight: '700',
    },
    statusContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    timeText: {
      fontSize: 12,
      color: textSecondary,
      fontWeight: '600',
    },
    liveIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(239, 68, 68, 0.15)',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      gap: 4,
    },
    liveDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: '#EF4444',
    },
    liveText: {
      color: '#EF4444',
      fontSize: 10,
      fontWeight: '800',
    },
    bellButton: {
      padding: 4,
    },
    bellIcon: {
      fontSize: 14,
    },
    teamsContainer: {
      gap: 8,
      marginBottom: 12,
    },
    teamRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    teamName: {
      fontSize: 15,
      fontWeight: '700',
      color: textPrimary,
      flex: 1,
    },
    scoreText: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.primary[500],
      marginLeft: 12,
    },
    matchFooter: {
      borderTopWidth: 1,
      borderTopColor: border,
      paddingTop: 10,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    venueText: {
      fontSize: 11,
      color: textSecondary,
      flex: 1,
      marginRight: 8,
    },
    oddsRow: {
      flexDirection: 'row',
      gap: 6,
    },
    oddsText: {
      fontSize: 10,
      color: textSecondary,
      backgroundColor: isDark ? '#1F2937' : '#F3F4F6',
      paddingHorizontal: 5,
      paddingVertical: 2,
      borderRadius: 4,
    },
  });
}
