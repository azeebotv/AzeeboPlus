import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { contentApi } from '../src/api';
import { logger } from '../src/utils/logger';
import { LoadingState, ErrorState, EmptyState } from '../src/components/StateContainers';

interface Recommendation {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  type: 'content' | 'creator' | 'universe';
  reason: string;
  score: number;
}

export default function RecommendationsScreen() {
  const router = useRouter();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    try {
      setError(null);
      const response = await contentApi.getRecommendations(filter !== 'all' ? filter : undefined);
      if (response.success && response.data) {
        setRecommendations(response.data);
      }
    } catch (error) {
      logger.error('Failed to load recommendations:', error);
      setError('Failed to load recommendations. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadRecommendations();
    setIsRefreshing(false);
  };

  const renderRecommendation = ({ item }: { item: Recommendation }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => {
        if (item.type === 'content') {
          router.push(`/content/${item.id}` as any);
        } else if (item.type === 'creator') {
          router.push(`/profile/${item.id}` as any);
        }
      }}
    >
      <View style={styles.thumbnailContainer}>
        <Text style={styles.typeBadge}>{item.type.toUpperCase()}</Text>
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.reason}>{item.reason}</Text>
        <View style={styles.scoreContainer}>
          <View style={styles.scoreBar}>
            <View style={[styles.scoreFill, { width: `${item.score}%` }]} />
          </View>
          <Text style={styles.scoreText}>{item.score}% match</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <LoadingState text="Loading recommendations..." />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ErrorState description={error} onRetry={loadRecommendations} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Recommended For You</Text>
        <Text style={styles.subtitle}>Personalized suggestions based on your activity</Text>
      </View>

      <View style={styles.filterContainer}>
        {['all', 'content', 'creator', 'universe'].map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterButton, filter === f && styles.filterButtonActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={recommendations}
        renderItem={renderRecommendation}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={['#8B5CF6']} />
        }
        ListEmptyComponent={
          <EmptyState
            icon="🎯"
            title="No recommendations yet"
            description="Interact with more content to get personalized suggestions"
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  header: {
    padding: 16,
    paddingTop: 60,
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
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1F2937',
  },
  filterButtonActive: {
    backgroundColor: '#8B5CF6',
  },
  filterText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  thumbnailContainer: {
    height: 120,
    backgroundColor: '#374151',
    justifyContent: 'flex-end',
    padding: 8,
  },
  typeBadge: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  cardContent: {
    padding: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  reason: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scoreBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#374151',
    borderRadius: 3,
    overflow: 'hidden',
  },
  scoreFill: {
    height: '100%',
    backgroundColor: '#8B5CF6',
    borderRadius: 3,
  },
  scoreText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
});
