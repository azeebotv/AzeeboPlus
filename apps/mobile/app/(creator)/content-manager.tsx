import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Image,
  Alert,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { contentApi } from '../../src/api';
import { logger } from '../../src/utils/logger';
import { LoadingState, EmptyState, ErrorState } from '../../src/components/StateContainers';

interface ContentItem {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  status: 'draft' | 'processing' | 'published' | 'archived';
  views: number;
  earnings: number;
  createdAt: string;
  type: 'video' | 'image' | 'audio';
}

export default function ContentManagerScreen() {
  const router = useRouter();
  const [content, setContent] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'draft' | 'published' | 'archived'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await contentApi.getCreatorContent();

      if (response.success && response.data) {
        // Map CreatorContent[] to ContentItem[] interface
        setContent(
          response.data.map((item) => ({
            id: item.id,
            title: item.title,
            description: item.description,
            thumbnail: item.thumbnail ?? '',
            status: item.status as 'draft' | 'processing' | 'published' | 'archived',
            views: item.views,
            earnings: 0,
            createdAt: item.createdAt,
            type: (item.contentType?.toLowerCase() || 'video') as 'video' | 'image' | 'audio',
          }))
        );
      }
    } catch (err) {
      logger.error('Failed to load content', err);
      setError('Failed to load content');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      'Delete Content',
      'Are you sure you want to delete this content? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await contentApi.deleteContent(id);
              loadContent();
              Alert.alert('Success', 'Content deleted successfully');
            } catch (error: any) {
              Alert.alert('Error', error?.message || 'Failed to delete content');
            }
          },
        },
      ]
    );
  };

  const handlePublish = async (id: string) => {
    try {
      await contentApi.publishContent(id);
      loadContent();
      Alert.alert('Success', 'Content published successfully');
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to publish content');
    }
  };

  const filteredContent =
    filter === 'all' ? content : content.filter((item) => item.status === filter);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return '#6B7280';
      case 'processing':
        return '#F59E0B';
      case 'published':
        return '#10B981';
      case 'archived':
        return '#EF4444';
      default:
        return '#6B7280';
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

  const renderGridItem = ({ item }: { item: ContentItem }) => (
    <TouchableOpacity
      style={styles.gridItem}
      onPress={() => router.push(`/(creator)/content-detail?id=${item.id}` as any)}
    >
      <Image source={{ uri: item.thumbnail }} style={styles.gridThumbnail} />
      <View style={styles.gridOverlay}>
        <Text style={styles.gridType}>{getTypeIcon(item.type)}</Text>
      </View>
      <View style={styles.gridContent}>
        <Text style={styles.gridTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <View style={styles.gridFooter}>
          <Text style={[styles.gridStatus, { color: getStatusColor(item.status) }]}>
            {item.status}
          </Text>
          <Text style={styles.gridViews}>{item.views.toLocaleString()} views</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderListItem = ({ item }: { item: ContentItem }) => (
    <TouchableOpacity
      style={styles.listItem}
      onPress={() => router.push(`/(creator)/content-detail?id=${item.id}` as any)}
    >
      <Image source={{ uri: item.thumbnail }} style={styles.listThumbnail} />
      <View style={styles.listContent}>
        <View style={styles.listHeader}>
          <Text style={styles.listTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.listType}>{getTypeIcon(item.type)}</Text>
        </View>
        <Text style={styles.listDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.listFooter}>
          <View style={styles.listMeta}>
            <Text style={[styles.listStatus, { color: getStatusColor(item.status) }]}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
            <Text style={styles.listDate}>{formatDate(item.createdAt)}</Text>
          </View>
          <View style={styles.listActions}>
            <Text style={styles.listStats}>{item.views.toLocaleString()} views</Text>
            {item.status === 'draft' && (
              <TouchableOpacity style={styles.publishButton} onPress={() => handlePublish(item.id)}>
                <Text style={styles.publishButtonText}>Publish</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(item.id)}>
              <Text style={styles.deleteButtonText}>🗑</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <LoadingState text="Loading content..." />
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
        <Text style={styles.title}>Content Manager</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/(creator)/upload' as any)}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filters}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {(['all', 'draft', 'published', 'archived'] as const).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterButton, filter === f && styles.filterButtonActive]}
              onPress={() => setFilter(f)}
            >
              <Text
                style={[styles.filterButtonText, filter === f && styles.filterButtonTextActive]}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.viewModeToggle}>
          <TouchableOpacity
            style={[styles.viewModeButton, viewMode === 'list' && styles.viewModeButtonActive]}
            onPress={() => setViewMode('list')}
          >
            <Text style={styles.viewModeText}>☰</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewModeButton, viewMode === 'grid' && styles.viewModeButtonActive]}
            onPress={() => setViewMode('grid')}
          >
            <Text style={styles.viewModeText}>⊞</Text>
          </TouchableOpacity>
        </View>
      </View>

      {filteredContent.length === 0 ? (
        <EmptyState
          icon="📝"
          title="No content yet"
          description="Start creating amazing content for your audience"
        />
      ) : viewMode === 'grid' ? (
        <FlatList
          data={filteredContent}
          keyExtractor={(item) => item.id}
          renderItem={renderGridItem}
          numColumns={2}
          contentContainerStyle={styles.gridContainer}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          data={filteredContent}
          keyExtractor={(item) => item.id}
          renderItem={renderListItem}
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
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  filters: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1f2937',
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#8B5CF6',
  },
  filterButtonText: {
    color: '#F3F4F6',
    fontSize: 14,
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  viewModeToggle: {
    flexDirection: 'row',
    backgroundColor: '#1f2937',
    borderRadius: 8,
    padding: 2,
  },
  viewModeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  viewModeButtonActive: {
    backgroundColor: '#374151',
  },
  viewModeText: {
    fontSize: 18,
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
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  gridContainer: {
    padding: 16,
  },
  gridItem: {
    flex: 1,
    margin: 8,
    backgroundColor: '#1f2937',
    borderRadius: 12,
    overflow: 'hidden',
  },
  gridThumbnail: {
    width: '100%',
    height: 120,
  },
  gridOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridType: {
    fontSize: 16,
  },
  gridContent: {
    padding: 12,
  },
  gridTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F3F4F6',
    marginBottom: 8,
  },
  gridFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gridStatus: {
    fontSize: 12,
    fontWeight: '500',
  },
  gridViews: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  listContainer: {
    padding: 16,
  },
  listItem: {
    flexDirection: 'row',
    backgroundColor: '#1f2937',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  listThumbnail: {
    width: 100,
    height: 100,
  },
  listContent: {
    flex: 1,
    padding: 12,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  listTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#F3F4F6',
    marginRight: 8,
  },
  listType: {
    fontSize: 18,
  },
  listDescription: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  listFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  listStatus: {
    fontSize: 12,
    fontWeight: '500',
  },
  listDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  listActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  listStats: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  publishButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  publishButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  deleteButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    fontSize: 14,
  },
});
