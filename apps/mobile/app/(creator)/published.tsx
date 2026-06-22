import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { contentApi } from '../../src/api';
import { logger } from '../../src/utils/logger';
import { LoadingState, EmptyState, ErrorState } from '../../src/components/StateContainers';

interface PublishedItem {
  id: string;
  title: string;
  thumbnail: string;
  views: number;
  likes: number;
  earnings: number;
  publishedAt: string;
  type: 'video' | 'image' | 'audio';
}

export default function PublishedContentScreen() {
  const router = useRouter();
  const [content, setContent] = useState<PublishedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await contentApi.getPublishedContent();
      if (response.success && response.data) {
        // Map CreatorContent[] to PublishedItem[]
        setContent(
          response.data.map((item) => ({
            id: item.id,
            title: item.title,
            thumbnail: item.thumbnail ?? '',
            views: item.views,
            likes: item.likes,
            earnings: 0,
            publishedAt: item.publishedAt ?? item.createdAt,
            type: (item.contentType?.toLowerCase() || 'video') as 'video' | 'image' | 'audio',
          }))
        );
      }
    } catch (err) {
      logger.error('Failed to load published content', err);
      setError('Failed to load published content');
    } finally {
      setIsLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return '🎥';
      case 'image':
        return '📷';
      case 'audio':
        return '🎵';
      default:
        return '📄';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const renderContent = ({ item }: { item: PublishedItem }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/(creator)/content-detail?id=${item.id}`)}
    >
      <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />
      <View style={styles.content}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.type}>{getTypeIcon(item.type)}</Text>
        </View>
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{item.views.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Views</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{item.likes.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Likes</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>₦{item.earnings.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Earnings</Text>
          </View>
        </View>
        <Text style={styles.date}>Published {formatDate(item.publishedAt)}</Text>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <LoadingState text="Loading published content..." />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ErrorState title="Failed to load" description={error} onRetry={loadContent} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Published Content</Text>
      </View>

      {content.length === 0 ? (
        <EmptyState
          icon="📢"
          title="No published content"
          description="Your published content will appear here"
        />
      ) : (
        <FlatList
          data={content}
          keyExtractor={(item) => item.id}
          renderItem={renderContent}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#9CA3AF',
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  backButton: {
    marginRight: 16,
  },
  backButtonText: {
    fontSize: 24,
    color: '#F3F4F6',
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F3F4F6',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F3F4F6',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  listContainer: {
    padding: 16,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#1f2937',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  thumbnail: {
    width: 120,
    height: 120,
  },
  content: {
    flex: 1,
    padding: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#F3F4F6',
    marginRight: 8,
  },
  type: {
    fontSize: 18,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#F3F4F6',
  },
  statLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
  },
  date: {
    fontSize: 12,
    color: '#6B7280',
  },
});
