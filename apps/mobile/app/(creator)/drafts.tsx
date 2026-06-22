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
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { contentApi } from '../../src/api';
import { logger } from '../../src/utils/logger';
import { LoadingState, EmptyState, ErrorState } from '../../src/components/StateContainers';

interface Draft {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  lastSaved: string;
  type: 'video' | 'image' | 'audio';
  progress: number;
}

export default function DraftsScreen() {
  const router = useRouter();
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDrafts();
  }, []);

  const loadDrafts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await contentApi.getDrafts();
      if (response.success && response.data) {
        // Map CreatorContent[] to Draft[] interface
        setDrafts(
          response.data.map((item) => ({
            id: item.id,
            title: item.title,
            description: item.description,
            thumbnail: item.thumbnail ?? '',
            lastSaved: item.updatedAt ?? item.createdAt ?? '',
            type: (item.contentType?.toLowerCase() || 'video') as 'video' | 'image' | 'audio',
            progress: item.status === 'draft' ? 50 : 100,
          }))
        );
      }
    } catch (err) {
      logger.error('Failed to load drafts', err);
      setError('Failed to load drafts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Draft', 'Are you sure you want to delete this draft?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await contentApi.deleteDraft(id);
            loadDrafts();
          } catch (error: any) {
            Alert.alert('Error', error?.message || 'Failed to delete draft');
          }
        },
      },
    ]);
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
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const renderDraft = ({ item }: { item: Draft }) => (
    <TouchableOpacity
      style={styles.draftCard}
      onPress={() => router.push(`/(creator)/upload?id=${item.id}` as any)}
    >
      <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />
      <View style={styles.draftContent}>
        <View style={styles.draftHeader}>
          <Text style={styles.draftTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.draftType}>{getTypeIcon(item.type)}</Text>
        </View>
        <Text style={styles.draftDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.draftFooter}>
          <View style={styles.progressContainer}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${item.progress}%` }]} />
            </View>
            <Text style={styles.progressText}>{item.progress}% complete</Text>
          </View>
          <View style={styles.draftActions}>
            <Text style={styles.lastSaved}>Saved {formatDate(item.lastSaved)}</Text>
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
        <LoadingState text="Loading drafts..." />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ErrorState title="Failed to load" description={error} onRetry={loadDrafts} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Drafts</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/(creator)/upload' as any)}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {drafts.length === 0 ? (
        <EmptyState
          icon="📝"
          title="No drafts yet"
          description="Your saved drafts will appear here"
        />
      ) : (
        <FlatList
          data={drafts}
          keyExtractor={(item) => item.id}
          renderItem={renderDraft}
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
  listContainer: {
    padding: 16,
  },
  draftCard: {
    flexDirection: 'row',
    backgroundColor: '#1f2937',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  thumbnail: {
    width: 100,
    height: 120,
  },
  draftContent: {
    flex: 1,
    padding: 12,
  },
  draftHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  draftTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#F3F4F6',
    marginRight: 8,
  },
  draftType: {
    fontSize: 18,
  },
  draftDescription: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 12,
  },
  draftFooter: {
    flex: 1,
    justifyContent: 'space-between',
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressTrack: {
    height: 4,
    backgroundColor: '#374151',
    borderRadius: 2,
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#8B5CF6',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  draftActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastSaved: {
    fontSize: 10,
    color: '#6B7280',
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
