import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Image } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { contentApi } from '@azeebo/react-data';
import { logger } from '@azeebo/react-data/utils/logger';
import { LoadingState, EmptyState, ErrorState } from '../../src/components/StateContainers';
import { colors } from '../../src/theme';

interface ScheduledPost {
  id: string;
  title: string;
  thumbnail: string;
  scheduledFor: string;
  type: 'video' | 'image' | 'audio';
  status: 'scheduled' | 'processing' | 'failed';
}

export default function ScheduledPostsScreen() {
  const router = useRouter();
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await contentApi.getScheduledPosts();
      if (response.success && response.data) {
        // Map CreatorContent[] to ScheduledPost[]
        setPosts(
          response.data.map((item) => ({
            id: item.id,
            title: item.title,
            thumbnail: item.thumbnail ?? '',
            scheduledFor: item.scheduledAt ?? item.createdAt,
            type: (item.contentType?.toLowerCase() || 'video') as 'video' | 'image' | 'audio',
            status: (item.status === 'scheduled' ? 'scheduled' : 'processing') as
              | 'scheduled'
              | 'processing'
              | 'failed',
          }))
        );
      }
    } catch (err) {
      logger.error('Failed to load scheduled posts', err);
      setError('Failed to load scheduled posts');
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return '#10B981';
      case 'processing':
        return '#F59E0B';
      case 'failed':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderPost = ({ item }: { item: ScheduledPost }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/(creator)/upload?id=${item.id}` as Href)}
    >
      <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />
      <View style={styles.content}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.type}>{getTypeIcon(item.type)}</Text>
        </View>
        <View style={styles.scheduleInfo}>
          <Text style={styles.scheduleLabel}>Scheduled for:</Text>
          <Text style={styles.scheduleDate}>{formatDateTime(item.scheduledFor)}</Text>
        </View>
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <LoadingState text="Loading scheduled posts..." />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ErrorState title="Failed to load" description={error} onRetry={loadPosts} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Scheduled Posts</Text>
      </View>

      {posts.length === 0 ? (
        <EmptyState
          icon="📅"
          title="No scheduled posts"
          description="Your scheduled posts will appear here"
        />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={renderPost}
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
    backgroundColor: '#1A0A0A',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: colors.light[400],
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  backButton: {
    marginRight: 16,
  },
  backButtonText: {
    fontSize: 24,
    color: colors.light[100],
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.light[100],
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
    color: colors.light[100],
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: colors.light[400],
    textAlign: 'center',
  },
  listContainer: {
    padding: 16,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.bg.tertiary,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  thumbnail: {
    width: 100,
    height: 100,
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
    color: colors.light[100],
    marginRight: 8,
  },
  type: {
    fontSize: 18,
  },
  scheduleInfo: {
    marginBottom: 8,
  },
  scheduleLabel: {
    fontSize: 12,
    color: colors.light[400],
    marginBottom: 2,
  },
  scheduleDate: {
    fontSize: 14,
    color: colors.light[100],
    fontWeight: '500',
  },
  statusContainer: {
    marginTop: 'auto',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});
