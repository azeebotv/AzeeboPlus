import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { VideoView } from 'expo-video';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { useAzeeboVideoPlayer } from '../../src/hooks/useVideoPlayer';
import { contentApi, type ContentItem } from '@azeebo/react-data';
import { logger } from '@azeebo/react-data/utils/logger';
import { LoadingState, ErrorState, EmptyState } from '../../src/components/StateContainers';
import { analytics } from '../../src/utils/analytics';
import { colors } from '../../src/theme';
import { brand } from '@azeebo/design-tokens';

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

  const { isPlaying, isBuffering, currentTime, duration, player, togglePlay, formatTime } =
    useAzeeboVideoPlayer({
      contentId: clip?.id || '',
      title: clip?.title,
      ownerPath: '/comedy/player',
      screenKey: '/comedy/player',
    });

  const fetchClip = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const featured = await contentApi.getFeaturedContent(1);
      if (featured.success && featured.data?.[0]) {
        const clipData = featured.data[0];
        setClip(clipData);
        analytics.comedyClipViewed(clipData.id);
        const relatedRes = await contentApi.getTrendingContent(5);
        if (relatedRes.success && relatedRes.data) {
          setRelated(relatedRes.data.filter((item) => item.id !== clipData.id));
        }
      } else {
        setError('No comedy clip available');
      }
    } catch (err: unknown) {
      logger.error('Failed to load clip:', err);
      const message = err instanceof Error ? err.message : 'Failed to load clip';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClip();
  }, [fetchClip]);

  const handleLike = useCallback(() => {
    setIsLiked((prev) => !prev);
  }, []);

  const handleFollow = useCallback(() => {
    setIsFollowing((prev) => {
      Alert.alert('Success', prev ? 'Unfollowed' : 'Now following!');
      return !prev;
    });
  }, []);

  const handleShare = useCallback(() => {
    Alert.alert('Share', 'Share this clip with friends!');
  }, []);

  const handleComment = useCallback(() => {
    setShowComments((prev) => !prev);
  }, []);

  if (isLoading) {
    return (
      <SafeAreaView accessibilityLabel="Player Screen" style={[styles.container, { backgroundColor: isDark ? '#1A0A0A' : '#ffffff' }]}>
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#1A0A0A' : '#ffffff' }]}>
      <View style={[styles.container, { backgroundColor: isDark ? '#1A0A0A' : '#ffffff' }]}>
        <View style={styles.videoContainer}>
          <TouchableOpacity
            style={styles.videoPlaceholder}
            onPress={togglePlay}
            activeOpacity={0.9}
          >
            <VideoView
              style={StyleSheet.absoluteFill}
              player={player}
              contentFit="contain"
              nativeControls={false}
            />

            {!isPlaying && !isBuffering && (
              <View style={styles.playOverlay}>
                <TouchableOpacity accessibilityRole="button" style={styles.playButton} onPress={togglePlay}>
                  <Text style={styles.playIcon}>▶️</Text>
                </TouchableOpacity>
              </View>
            )}

            {isBuffering && (
              <View style={styles.playOverlay}>
                <View style={styles.bufferingIndicator} />
              </View>
            )}

            <View style={styles.durationBadge}>
              <Text style={styles.durationText}>
                {duration > 0
                  ? `${Math.floor(duration / 60)}:${String(Math.floor(duration % 60)).padStart(2, '0')}`
                  : clip.duration
                    ? `${Math.floor(clip.duration / 60)}:${String(clip.duration % 60).padStart(2, '0')}`
                    : '00:00'}
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" style={styles.backButton} onPress={() => router.back()}>
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
              {duration > 0 && (
                <Text style={styles.statText}>
                  ⏱️ {formatTime(currentTime)} / {formatTime(duration)}
                </Text>
              )}
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
              <TouchableOpacity accessibilityRole="button" style={styles.actionButton} onPress={handleLike}>
                <Text style={styles.actionIcon}>{isLiked ? '❤️' : '🤍'}</Text>
                <Text style={[styles.actionText, { color: isDark ? '#fff' : '#000' }]}>
                  {isLiked ? 'Liked' : 'Like'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity accessibilityRole="button" style={styles.actionButton} onPress={handleComment}>
                <Text style={styles.actionIcon}>💬</Text>
                <Text style={[styles.actionText, { color: isDark ? '#fff' : '#000' }]}>
                  Comment
                </Text>
              </TouchableOpacity>
              <TouchableOpacity accessibilityRole="button" style={styles.actionButton} onPress={handleShare}>
                <Text style={styles.actionIcon}>↗️</Text>
                <Text style={[styles.actionText, { color: isDark ? '#fff' : '#000' }]}>Share</Text>
              </TouchableOpacity>
              <TouchableOpacity accessibilityRole="button" style={styles.actionButton}>
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
                  <TouchableOpacity accessibilityRole="button" style={styles.postButton}>
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
    backgroundColor: '#000',
    justifyContent: 'center',
  },
  playOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
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
  bufferingIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.2)',
    borderTopColor: brand.flame,
  },
  commentEmpty: {
    textAlign: 'center',
    paddingVertical: 20,
    fontSize: 14,
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
    backgroundColor: colors.bg.tertiary,
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
  videoControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
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
    zIndex: 10,
  },
  backIcon: {
    fontSize: 20,
    color: '#fff',
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
    color: colors.text.secondary,
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
    backgroundColor: colors.bg.tertiary,
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
    color: colors.text.secondary,
    fontSize: 12,
    marginTop: 2,
  },
  followButton: {
    backgroundColor: brand.flame,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  followButtonActive: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.neutral[500],
  },
  followButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  followButtonTextActive: {
    color: colors.text.secondary,
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
    backgroundColor: colors.bg.tertiary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    color: colors.text.secondary,
    fontSize: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.bg.tertiary,
  },
  actionButton: {
    alignItems: 'center',
    gap: 4,
  },
  actionIcon: {
    fontSize: 24,
  },
  actionText: {
    color: colors.text.secondary,
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
    backgroundColor: colors.bg.tertiary,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 14,
  },
  postButton: {
    backgroundColor: brand.flame,
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
