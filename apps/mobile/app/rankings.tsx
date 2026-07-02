import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { engagementApi } from '../src/api';
import { logger } from '../src/utils/logger';
import { LoadingState, ErrorState } from '../src/components/StateContainers';

interface RankingCategory {
  id: string;
  name: string;
  icon: string;
  entries: Array<{
    rank: number;
    userId: string;
    displayName: string;
    avatar: string;
    score: number;
    change: number;
  }>;
}

export default function RankingsScreen() {
  const router = useRouter();
  const [categories, setCategories] = useState<RankingCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('overall');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRankings();
  }, []);

  const loadRankings = async () => {
    try {
      setError(null);
      const response = await engagementApi.getRankings();
      if (response.success && response.data) {
        setCategories(response.data);
      }
    } catch (error) {
      logger.error('Failed to load rankings:', error);
      setError('Failed to load rankings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadRankings();
    setIsRefreshing(false);
  };

  const selectedData = categories.find((c) => c.id === selectedCategory);

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <LoadingState text="Loading rankings..." />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ErrorState description={error} onRetry={loadRankings} />
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
          <Text style={styles.title}>Rankings</Text>
          <Text style={styles.subtitle}>Extended leaderboard across categories</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryButton,
                selectedCategory === category.id && styles.categoryButtonActive,
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Text style={styles.categoryIcon}>{category.icon}</Text>
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === category.id && styles.categoryTextActive,
                ]}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {selectedData && (
          <View style={styles.rankingsContainer}>
            <View style={styles.topThree}>
              {selectedData.entries.slice(0, 3).map((entry, index) => (
                <View
                  key={entry.userId}
                  style={[
                    styles.topCard,
                    index === 0 && styles.topCardFirst,
                    index === 1 && styles.topCardSecond,
                    index === 2 && styles.topCardThird,
                  ]}
                >
                  <Text style={styles.rankIcon}>
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                  </Text>
                  <Text style={styles.topName}>{entry.displayName}</Text>
                  <Text style={styles.topScore}>{entry.score.toLocaleString()}</Text>
                  {entry.change !== 0 && (
                    <Text
                      style={[
                        styles.changeText,
                        entry.change > 0 ? styles.changeUp : styles.changeDown,
                      ]}
                    >
                      {entry.change > 0 ? '↑' : '↓'} {Math.abs(entry.change)}
                    </Text>
                  )}
                </View>
              ))}
            </View>

            {selectedData.entries.slice(3).map((entry) => (
              <TouchableOpacity
                key={entry.userId}
                style={styles.listItem}
                onPress={() => router.push(`/(tabs)/profile?userId=${entry.userId}` as any)}
              >
                <Text style={styles.rankText}>#{entry.rank}</Text>
                <Text style={styles.listName}>{entry.displayName}</Text>
                <Text style={styles.listScore}>{entry.score.toLocaleString()}</Text>
                {entry.change !== 0 && (
                  <Text
                    style={[
                      styles.changeTextSmall,
                      entry.change > 0 ? styles.changeUp : styles.changeDown,
                    ]}
                  >
                    {entry.change > 0 ? '↑' : '↓'}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
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
  categoryScroll: {
    marginBottom: 20,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#2A2A2A',
    marginRight: 8,
  },
  categoryButtonActive: {
    backgroundColor: '#E8420A',
  },
  categoryIcon: {
    fontSize: 18,
    marginRight: 6,
  },
  categoryText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  rankingsContainer: {
    gap: 12,
  },
  topThree: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    gap: 12,
    marginBottom: 20,
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
  topName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 4,
  },
  topScore: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E8420A',
  },
  changeText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  changeUp: {
    color: '#10B981',
  },
  changeDown: {
    color: '#EF4444',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
  },
  rankText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#9CA3AF',
    width: 40,
  },
  listName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  listScore: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E8420A',
    marginRight: 8,
  },
  changeTextSmall: {
    fontSize: 14,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
});
