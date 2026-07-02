import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { contentApi, type ContentItem } from '../../src/api';
import { logger } from '../../src/utils/logger';
import { LoadingState, ErrorState, EmptyState } from '../../src/components/StateContainers';

const { width: _width } = Dimensions.get('window');

export default function ComedyClipPlayer() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const isDark = colorScheme === 'dark';
  const [clip, setClip] = useState<ContentItem | null>(null);
  const [related, setRelated] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showComments, setShowComments] = useState(false);

  const fetchClip = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const featured = await contentApi.getFeaturedContent(1);
      if (featured.success && featured.data?.[0]) {
        const clipData = featured.data[0];
        setClip(clipData);
        const relatedRes = await contentApi.getTrendingContent(5);
        if (relatedRes.success && relatedRes.data) {
          setRelated(relatedRes.data.filter((item) => item.id !== clipData.id));
        }
      } else {
        setError('No comedy clip available');
      }
    } catch (err: any) {
      logger.error('Failed to load clip:', err);
      setError(err.message || 'Failed to load clip');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClip();
  }, []);

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#1A0A0A' : '#ffffff' }]}>
        <LoadingState text="Loading clip..." />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#1A0A0A' : '#ffffff' }]}>
        <ErrorState description={error} onRetry={fetchClip} />
      </SafeAreaView>
    );
  }

  if (!clip) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#1A0A0A' : '#ffffff' }]}>
        <EmptyState icon="😂" title="No Clip" description="No comedy clips available right now." />
      </SafeAreaView>
    );
  }

  const handleLike = () => {
    setIsLiked(!isLiked);
  };

  const handleFollow = () => {
    setIsFollowing(!isFollowing);
    Alert.alert('Success', isFollowing ? 'Unfollowed' : 'Now following Bovi!');
  };

  const handleShare = () => {
    Alert.alert('Share', 'Share this clip with friends!');
  };

  const handleComment = () => {
    setShowComments(!showComments);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#1A0A0A' : '#ffffff' }]}>
      <View style={[styles.container, { backgroundColor: isDark ? '#1A0A0A' : '#ffffff' }]}>
        <View style={styles.videoContainer}>
          <View style={styles.videoPlaceholder}>
            <Text style={styles.videoEmoji}>😂</Text>
            <View style={styles.videoControls}>
              <TouchableOpacity style={styles.playButton}>
                <Text style={styles.playIcon}>▶️</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.durationBadge}>
              <Text style={styles.durationText}>
                {clip.duration
                  ? `${Math.floor(clip.duration / 60)}:${String(clip.duration % 60).padStart(2, '0')}`
                  : '00:00'}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <Text style={[styles.title, { color: isDark ? '#ffffff' : '#1A0A0A' }]}>
              {clip.title}
            </Text>

            <View style={styles.statsRow}>
              <Text style={styles.statText}>
                📅 {new Date(clip.createdAt).toLocaleDateString()}
              </Text>
              <Text style={styles.statText}>❤️ 0</Text>
            </View>

            <View style={styles.creatorRow}>
              <View style={styles.creatorInfo}>
                <View style={styles.creatorAvatar}>
                  <Text style={styles.creatorAvatarEmoji}>{clip.creator?.avatar || '🎤'}</Text>
                </View>
                <View>
                  <Text style={[styles.creatorName, { color: isDark ? '#fff' : '#000' }]}>
                    {clip.creator?.name || 'Unknown'}
                  </Text>
                  <Text style={styles.creatorMeta}>
                    {new Date(clip.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.followButton, isFollowing && styles.followButtonActive]}
                onPress={handleFollow}
              >
                <Text
                  style={[styles.followButtonText, isFollowing && styles.followButtonTextActive]}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.description, { color: isDark ? '#ccc' : '#666' }]}>
              {clip.description}
            </Text>

            {clip.categories && clip.categories.length > 0 && (
              <View style={styles.tagsRow}>
                {clip.categories.map((cat) => (
                  <View key={cat.id} style={styles.tag}>
                    <Text style={styles.tagText}>#{cat.name}</Text>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.actionsRow}>
              <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
                <Text style={styles.actionIcon}>{isLiked ? '❤️' : '🤍'}</Text>
                <Text style={[styles.actionText, { color: isDark ? '#fff' : '#000' }]}>
                  {isLiked ? 'Liked' : 'Like'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={handleComment}>
                <Text style={styles.actionIcon}>💬</Text>
                <Text style={[styles.actionText, { color: isDark ? '#fff' : '#000' }]}>
                  Comment
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
                <Text style={styles.actionIcon}>↗️</Text>
                <Text style={[styles.actionText, { color: isDark ? '#fff' : '#000' }]}>Share</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.actionIcon}>🔖</Text>
                <Text style={[styles.actionText, { color: isDark ? '#fff' : '#000' }]}>Save</Text>
              </TouchableOpacity>
            </View>

            {showComments && (
              <View style={styles.commentsSection}>
                <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#1A0A0A' }]}>
                  Comments
                </Text>
                <View
                  style={[
                    styles.addCommentBar,
                    { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' },
                  ]}
                >
                  <TextInput
                    style={[styles.commentInput, { color: isDark ? '#fff' : '#000' }]}
                    placeholder="Add a comment..."
                    placeholderTextColor="#888"
                  />
                  <TouchableOpacity style={styles.postButton}>
                    <Text style={styles.postButtonText}>Post</Text>
                  </TouchableOpacity>
                </View>
                <Text style={[styles.commentEmpty, { color: isDark ? '#888' : '#999' }]}>
                  No comments yet
                </Text>
              </View>
            )}

            <View style={styles.relatedSection}>
              <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#1A0A0A' }]}>
                Related Clips
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.relatedList}
              >
                {related.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.relatedCard,
                      { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' },
                    ]}
                  >
                    <View style={styles.relatedThumbnail}>
                      <Text style={styles.relatedEmoji}>😂</Text>
                      {item.duration && (
                        <View style={styles.relatedDuration}>
                          <Text style={styles.relatedDurationText}>
                            {Math.floor(item.duration / 60)}:
                            {String(item.duration % 60).padStart(2, '0')}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text
                      style={[styles.relatedTitle, { color: isDark ? '#fff' : '#000' }]}
                      numberOfLines={2}
                    >
                      {item.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

import { TextInput } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  videoContainer: {
    height: 260,
    position: 'relative',
  },
  videoPlaceholder: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
  },
  commentEmpty: {
    textAlign: 'center',
    paddingVertical: 20,
    fontSize: 14,
  },
  commentAvatarEmoji: {
    fontSize: 18,
  },
  commentInfo: {
    flex: 1,
  },
  commentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  commentUser: {
    fontSize: 14,
    fontWeight: '600',
  },
  commentTime: {
    color: '#888',
    fontSize: 11,
  },
  commentText: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  commentActions: {
    flexDirection: 'row',
    gap: 16,
  },
  commentAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  commentActionIcon: {
    fontSize: 14,
  },
  commentActionText: {
    color: '#888',
    fontSize: 12,
  },
  relatedSection: {
    marginBottom: 30,
  },
  relatedList: {
    gap: 12,
  },
  relatedCard: {
    width: 160,
    borderRadius: 10,
    overflow: 'hidden',
    marginRight: 12,
  },
  relatedThumbnail: {
    height: 100,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  relatedEmoji: {
    fontSize: 40,
  },
  relatedDuration: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  relatedDurationText: {
    color: '#fff',
    fontSize: 11,
  },
  relatedTitle: {
    fontSize: 13,
    fontWeight: '600',
    padding: 10,
  },

  videoEmoji: {
    fontSize: 64,
    marginBottom: 12,
  },
  videoControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -30 }, { translateY: -30 }],
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    fontSize: 28,
  },
  durationBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  durationText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  backButton: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 20,
  },
  contentContainer: {
    padding: 16,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  statText: {
    color: '#888',
    fontSize: 13,
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  creatorInfo: {
    flex: 1,
    marginLeft: 12,
  },
  creatorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  creatorAvatarEmoji: {
    fontSize: 20,
  },
  creatorName: {
    fontSize: 14,
    fontWeight: '600',
  },
  creatorMeta: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  followButton: {
    backgroundColor: '#E8420A',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  followButtonActive: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#888',
  },
  followButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  followButtonTextActive: {
    color: '#888',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  tag: {
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    color: '#888',
    fontSize: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#2a2a2a',
  },
  actionButton: {
    alignItems: 'center',
    gap: 4,
  },
  actionIcon: {
    fontSize: 24,
  },
  actionText: {
    color: '#888',
    fontSize: 11,
  },
  commentsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  addCommentBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 14,
  },
  postButton: {
    backgroundColor: '#E8420A',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  postButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});
