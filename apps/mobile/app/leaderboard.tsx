import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { engagementApi } from '../src/api';
import { logger } from '../src/utils/logger';
import { LoadingState, ErrorState } from '../src/components/StateContainers';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  displayName: string;
  avatar: string;
  points: number;
  level: number;
  streak: number;
  predictionsCorrect: number;
  badges: string[];
  isCurrentUser: boolean;
}

type TimePeriod = 'daily' | 'weekly' | 'monthly' | 'alltime';
type Category = 'overall' | 'predictions' | 'voting' | 'engagement';

export default function LeaderboardScreen() {
  const router = useRouter();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('weekly');
  const [category, setCategory] = useState<Category>('overall');

  useEffect(() => {
    loadLeaderboard();
  }, [timePeriod, category]);

  const loadLeaderboard = async () => {
    try {
      setError(null);
      const response = await engagementApi.getLeaderboard(timePeriod, category);
      if (response.success && response.data) {
        setEntries(response.data as unknown as LeaderboardEntry[]);
      }
    } catch (error) {
      logger.error('Failed to load leaderboard:', error);
      setError('Failed to load leaderboard. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadLeaderboard();
    setIsRefreshing(false);
  };

  const getRankIcon = (rank: number): string => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return `#${rank}`;
    }
  };

  const getRankColor = (rank: number): string => {
    switch (rank) {
      case 1:
        return '#FFD700';
      case 2:
        return '#C0C0C0';
      case 3:
        return '#CD7F32';
      default:
        return '#9CA3AF';
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <LoadingState text="Loading leaderboard..." />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ErrorState description={error} onRetry={loadLeaderboard} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={['#E8420A']} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Leaderboard</Text>
          <Text style={styles.subtitle}>Top performers this {timePeriod}</Text>
        </View>

        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            {(['daily', 'weekly', 'monthly', 'alltime'] as TimePeriod[]).map((period) => (
              <TouchableOpacity
                key={period}
                style={[styles.filterButton, timePeriod === period && styles.filterButtonActive]}
                onPress={() => setTimePeriod(period)}
              >
                <Text style={[styles.filterText, timePeriod === period && styles.filterTextActive]}>
                  {period === 'alltime'
                    ? 'All Time'
                    : period.charAt(0).toUpperCase() + period.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.categoryContainer}>
          {(['overall', 'predictions', 'voting', 'engagement'] as Category[]).map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryButton, category === cat && styles.categoryButtonActive]}
              onPress={() => setCategory(cat)}
            >
              <Text style={[styles.categoryText, category === cat && styles.categoryTextActive]}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.topThree}>
          {entries.slice(0, 3).map((entry) => (
            <View
              key={entry.userId}
              style={[
                styles.topCard,
                entry.rank === 1 && styles.topCardFirst,
                entry.rank === 2 && styles.topCardSecond,
                entry.rank === 3 && styles.topCardThird,
              ]}
            >
              <Text style={styles.rankIcon}>{getRankIcon(entry.rank)}</Text>
              <Image source={{ uri: entry.avatar }} style={styles.topAvatar} />
              <Text style={styles.topName}>{entry.displayName}</Text>
              <Text style={styles.topPoints}>{entry.points.toLocaleString()} pts</Text>
            </View>
          ))}
        </View>

        <View style={styles.listContainer}>
          {entries.slice(3).map((entry) => (
            <TouchableOpacity
              key={entry.userId}
              style={[styles.listItem, entry.isCurrentUser && styles.listItemCurrentUser]}
              onPress={() => router.push(`/(tabs)/profile?userId=${entry.userId}` as any)}
            >
              <Text style={[styles.rankText, { color: getRankColor(entry.rank) }]}>
                {getRankIcon(entry.rank)}
              </Text>
              <Image source={{ uri: entry.avatar }} style={styles.avatar} />
              <View style={styles.userInfo}>
                <Text style={styles.username}>{entry.displayName}</Text>
                <Text style={styles.userStats}>
                  Lvl {entry.level} • {entry.streak}🔥 • {entry.predictionsCorrect}✓
                </Text>
              </View>
              <Text style={styles.pointsText}>{entry.points.toLocaleString()}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A0A0A',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  filterContainer: {
    marginBottom: 12,
  },
  filterScroll: {
    flexDirection: 'row',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#2A2A2A',
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#E8420A',
  },
  filterText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  categoryContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  categoryButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#2A2A2A',
    alignItems: 'center',
  },
  categoryButtonActive: {
    backgroundColor: '#E8420A',
  },
  categoryText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  topThree: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    gap: 12,
    marginBottom: 24,
  },
  topCard: {
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#2A2A2A',
    flex: 1,
  },
  topCardFirst: {
    borderWidth: 2,
    borderColor: '#FFD700',
    transform: [{ scale: 1.05 }],
  },
  topCardSecond: {
    borderWidth: 2,
    borderColor: '#C0C0C0',
  },
  topCardThird: {
    borderWidth: 2,
    borderColor: '#CD7F32',
  },
  rankIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  topAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 8,
  },
  topName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 4,
  },
  topPoints: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E8420A',
  },
  listContainer: {
    gap: 8,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
  },
  listItemCurrentUser: {
    borderWidth: 2,
    borderColor: '#E8420A',
    backgroundColor: '#2D1B69',
  },
  rankText: {
    fontSize: 18,
    fontWeight: 'bold',
    width: 40,
    textAlign: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  userStats: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  pointsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E8420A',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
});
