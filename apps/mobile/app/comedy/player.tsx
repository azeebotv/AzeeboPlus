import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { useColorScheme } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { contentApi, type ContentItem, type Recommendation } from '../../src/api';
import { logger } from '../../src/utils/logger';
import { LoadingState, ErrorState, EmptyState } from '../../src/components/StateContainers';

const { width } = Dimensions.get('window');

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
          setRelated(relatedRes.data.filter(item => item.id !== clipData.id));
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
      <View style={[styles.container, { backgroundColor: isDark ? '#0a0a0a' : '#ffffff' }]}>
        <LoadingState text="Loading clip..." />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? '#0a0a0a' : '#ffffff' }]}>
        <ErrorState description={error} onRetry={fetchClip} />
      </View>
    );
  }

  if (!clip) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? '#0a0a0a' : '#ffffff' }]}>
        <EmptyState icon="😂" title="No Clip" description="No comedy clips available right now." />
      </View>
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
    <View style={[styles.container, { backgroundColor: isDark ? '#0a0a0a' : '#ffffff' }]}>
      <View style={styles.videoContainer}>
        <View style={styles.videoPlaceholder}>
          <Text style={styles.videoEmoji}>😂</Text>
          <View style={styles.videoControls}>
            <TouchableOpacity style={styles.playButton}>
              <Text style={styles.playIcon}>▶️</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>{clip.duration ? `${Math.floor(clip.duration / 60)}:${String(clip.duration % 60).padStart(2, '0')}` : '00:00'}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={[styles.title, { color: isDark ? '#ffffff' : '#000000' }]}>
            {clip.title}
          </Text>

          <View style={styles.statsRow}>
            <Text style={styles.statText}>📅 {new Date(clip.createdAt).toLocaleDateString()}</Text>
            <Text style={styles.statText}>❤️ 0</Text>
          </View>

          <View style={styles.creatorRow}>
            <View style={styles.creatorInfo}>
              <View style={styles.creatorAvatar}>
                <Text style={styles.creatorAvatarEmoji}>{CLIP_DATA.creatorAvatar}</Text>
              </View>
              <View>
                <Text style={[styles.creatorName, { color: isDark ? '#fff' : '#000' }]}>{clip.creator?.name || 'Unknown'}</Text>
                <Text style={styles.creatorMeta}>{new Date(clip.createdAt).toLocaleDateString()}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.followButton, isFollowing && styles.followButtonActive]}
              onPress={handleFollow}
            >
              <Text style={[styles.followButtonText, isFollowing && styles.followButtonTextActive]}>
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
              <Text style={[styles.actionText, { color: isDark ? '#fff' : '#000' }]}>Comment</Text>
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
              <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
                Comments
              </Text>
              <View style={[styles.addCommentBar, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
                <TextInput
                  style={[styles.commentInput, { color: isDark ? '#fff' : '#000' }]}
                  placeholder="Add a comment..."
                  placeholderTextColor="#888"
                />
                <TouchableOpacity style={styles.postButton}>
                  <Text style={styles.postButtonText}>Post</Text>
                </TouchableOpacity>
              </View>
              <Text style={[styles.commentEmpty, { color: isDark ? '#888' : '#999' }]}>No comments yet</Text>
            </View>
          )}

          <View style={styles.relatedSection}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
              Related Clips
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.relatedList}>
              {related.map((item) => (
                <TouchableOpacity key={item.id} style={[styles.relatedCard, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
                  <View style={styles.relatedThumbnail}>
                    <Text style={styles.relatedEmoji}>😂</Text>
                    {item.duration && (
                    <View style={styles.relatedDuration}>
                      <Text style={styles.relatedDurationText}>{Math.floor(item.duration / 60)}:{String(item.duration % 60).padStart(2, '0')}</Text>
                    </View>
                    )}
                  </View>
                  <Text style={[styles.relatedTitle, { color: isDark ? '#fff' : '#000' }]} numberOfLines={2}>
                    {item.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/(tabs)/home')}>
          <Text style={styles.navIcon}>🏠</Text>
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/(tabs)/watch')}>
          <Text style={styles.navIcon}>📺</Text>
          <Text style={[styles.navLabel, { color: '#F39C12' }]}>Watch</Text>
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
    </View>
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