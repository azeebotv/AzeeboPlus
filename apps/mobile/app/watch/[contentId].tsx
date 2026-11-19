import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
  useColorScheme,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { VideoView } from 'expo-video';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAzeeboVideoPlayer } from '../../src/hooks/useVideoPlayer';
import { useAuth } from '@azeebo/react-data/contexts/AuthContext';
import { useFlags } from '@azeebo/react-data/contexts/FlagsContext';
import { contentApi, apiClient, type ContentItem } from '@azeebo/react-data';
import { logger } from '@azeebo/react-data/utils/logger';
import { LoadingState, ErrorState, EmptyState } from '../../src/components/StateContainers';
import { VideoGestureLayer } from '../../src/components/video/VideoGestureLayer';
import { PlayerSettingsSheet } from '../../src/components/video/PlayerSettingsSheet';
import { usePlayerPreferences } from '../../src/hooks/usePlayerPreferences';
import { NativeShareService } from '../../src/utils/nativeShare';
import { useTranslation } from 'react-i18next';
import { colors } from '../../src/theme';

export default function WatchScreen() {
  const router = useRouter();
  const { contentId } = useLocalSearchParams<{ contentId: string }>();
  const colorScheme = useColorScheme();
  const { t } = useTranslation();
  const { isEnabled } = useFlags();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  // Live viewport — updates when the device rotates into fullscreen landscape.
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isLandscape = windowWidth > windowHeight;

  const [content, setContent] = useState<ContentItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [relatedContent, setRelatedContent] = useState<ContentItem[]>([]);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [saved, setSaved] = useState(false);

  // Like state (optimistic, same as the web watch page — the content service
  // has no like endpoint, so the count lives client-side per session).
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  // Comments sheet — backed by the real content-service comments endpoints
  // (GET/POST /v1/content/:id/comments).
  const [commentsVisible, setCommentsVisible] = useState(false);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentDraft, setCommentDraft] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);
  const commentsOpenedOnce = useRef(false);

  // Persisted playback preferences (quality / speed / autoplay-next).
  const {
    preferences,
    hydrated: prefsHydrated,
    setQuality,
    setPlaybackSpeed,
    setAutoplayNext,
  } = usePlayerPreferences();

  const handleProgressUpdate = useCallback(
    async (progress: number) => {
      if (contentId) {
        try {
          // Persist the actual playback position so Continue Watching shows
          // a real resume point instead of a placeholder.
          await contentApi.addToWatchHistory(contentId, progress);
        } catch (err) {
          logger.error('Failed to update watch progress', err);
        }
      }
    },
    [contentId]
  );

  const handleComplete = useCallback(() => {
    // YouTube-style autoplay-next: replace (not push) so Back from the next
    // video exits the player instead of replaying the finished one. Skipped
    // while preferences are still hydrating to avoid a stale default firing.
    if (prefsHydrated && preferences.autoplayNext && relatedContent.length > 0) {
      router.replace(`/watch/${relatedContent[0].id}`);
      return;
    }
    Alert.alert('Video Complete', 'Thanks for watching!');
  }, [prefsHydrated, preferences.autoplayNext, relatedContent, router]);

  const {
    isPlaying,
    isBuffering,
    isFullscreen,
    currentTime,
    duration,
    showControls,
    error: playerError,
    errorKind: playerErrorKind,
    player,
    togglePlay,
    seek,
    seekForward,
    seekBackward,
    toggleFullscreen,
    setShowControls,
    formatTime,
    isMiniVisible,
  } = useAzeeboVideoPlayer({
    contentId: contentId || '',
    initialProgress: content?.watchProgress ?? 0,
    onProgressUpdate: handleProgressUpdate,
    onComplete: handleComplete,
    // mobile_autoplay (on by default): auto-start playback when ready; off
    // keeps the conservative tap-to-play behavior.
    autoPlay: isEnabled('mobile_autoplay'),
    title: content?.title,
    ownerPath: `/watch/${contentId}`,
    screenKey: contentId ? `/watch/${contentId}` : 'watch',
  });

  // Apply the persisted playback speed. Re-applied when `content` changes
  // (source swap after autoplay-next) in case the native player resets its
  // rate on replaceAsync.
  useEffect(() => {
    player.playbackRate = preferences.playbackSpeed;
  }, [player, preferences.playbackSpeed, content]);

  const fetchContent = useCallback(async () => {
    if (!contentId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await contentApi.getContentById(contentId);
      if (response.success && response.data) {
        setContent(response.data);
      } else {
        setError('Content not found');
      }

      const relatedResponse = await contentApi.getTrendingContent(5);
      if (relatedResponse.success && relatedResponse.data) {
        setRelatedContent(relatedResponse.data.filter((item) => item.id !== contentId));
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load content';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [contentId]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  const handleSeek = (time: number) => {
    // No duration yet — the progress bar is not tappable/meaningful.
    if (displayDuration <= 0) return;
    seek(time);
  };

  const loadComments = useCallback(async () => {
    if (!contentId) return;
    setCommentsLoading(true);
    try {
      const res = await apiClient.get<{
        success: boolean;
        data: CommentItem[];
      }>(`/v1/content/${contentId}/comments?limit=50`);
      setComments(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      logger.error('Failed to load comments', err);
      setComments([]);
    } finally {
      setCommentsLoading(false);
    }
  }, [contentId]);

  const openComments = useCallback(() => {
    setCommentsVisible(true);
    if (!commentsOpenedOnce.current) {
      commentsOpenedOnce.current = true;
      void loadComments();
    }
  }, [loadComments]);

  const postComment = useCallback(async () => {
    const text = commentDraft.trim();
    if (!text || !contentId || isPostingComment) return;
    setIsPostingComment(true);
    try {
      await apiClient.post(`/v1/content/${contentId}/comments`, { text });
      setCommentDraft('');
      await loadComments();
    } catch (err) {
      logger.error('Failed to post comment', err);
      Alert.alert(
        'Comment failed',
        err instanceof Error ? err.message : 'Could not post your comment. Try again.'
      );
    } finally {
      setIsPostingComment(false);
    }
  }, [commentDraft, contentId, isPostingComment, loadComments]);

  const toggleLike = useCallback(() => {
    setIsLiked((prev) => {
      setLikeCount((count) => (prev ? Math.max(0, count - 1) : count + 1));
      return !prev;
    });
  }, []);

  // Guest gate (parity with the TV home screen): signed-out users hitting a
  // watch route (guest homepage, shared links) previously got a raw
  // "Failed to load video" — and the failed token refresh could clear a
  // session they didn't have. Route to sign-in instead.
  if (!authLoading && !isAuthenticated) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#000' : '#fff' }]}
      >
        <EmptyState
          icon="🔒"
          title="Sign in to watch"
          description="Create a free account or sign in to stream this content."
          actionLabel="Sign In"
          onAction={() => router.replace('/(auth)/login')}
        />
      </SafeAreaView>
    );
  }

  // Measured width of the seek bar — using the screen width minus a guess was
  // off by the container padding and made end-of-video seeks overshoot.
  const [seekBarWidth, setSeekBarWidth] = useState(0);

  // Surface tap toggles the custom controls; playback toggles live on the
  // center button / play overlay. Double-tap-to-seek and the brightness /
  // volume edge swipes are handled inside VideoGestureLayer.
  const handleSurfaceTap = () => {
    setShowControls(!showControls);
  };

  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#000' : '#fff' }]}
      >
        <LoadingState text="Loading content..." />
      </SafeAreaView>
    );
  }

  if (error || playerError) {
    // M4: an entitlement denial (403 from the signed-url endpoint) is not a
    // failure — it's a paywall. Route to the Premium screen instead of a
    // retry button that can never succeed.
    const isEntitlement = playerErrorKind === 'entitlement' && !error;
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#000' : '#fff' }]}
      >
        {isEntitlement ? (
          <EmptyState
            icon="💎"
            title={t('common.premium')}
            description={playerError || t('common.errorEntitlement')}
            actionLabel="See Premium plans"
            onAction={() => router.push('/premium')}
          />
        ) : (
          <ErrorState
            description={error || playerError || t('common.error')}
            onRetry={fetchContent}
          />
        )}
      </SafeAreaView>
    );
  }

  if (!content) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#000' : '#fff' }]}
      >
        <EmptyState
          icon="📺"
          title="Content not found"
          description="The content you're looking for doesn't exist or has been removed."
        />
      </SafeAreaView>
    );
  }

  // A fake fallback duration made every seek land at the wrong position when
  // metadata was missing — use 0 and disable the bar until the player reports
  // the real duration (parity with the TV watch screen).
  const displayDuration = duration || content.duration || 0;
  const progressPercent =
    displayDuration > 0 ? Math.min((currentTime / displayDuration) * 100, 100) : 0;

  // Embedded (non-fullscreen) video keeps a 16:9 box that fits the current
  // orientation — sized from the short edge so landscape never overflows.
  const embeddedWidth = Math.min(windowWidth, (windowHeight * 16) / 9);
  const embeddedHeight = (embeddedWidth * 9) / 16;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#000' : '#fff' }]}
      // No safe-area edges in fullscreen so the video covers the entire screen
      // (status bar is hidden by the player hook).
      edges={isFullscreen ? [] : ['top']}
    >
      {!isFullscreen && (
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={[styles.backText, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>
            ← Back
          </Text>
        </TouchableOpacity>
      )}

      <View
        style={[
          styles.videoContainer,
          isFullscreen
            ? styles.videoContainerFullscreen
            : { width: embeddedWidth, height: embeddedHeight },
        ]}
      >
        <View style={[styles.videoPlaceholder, { backgroundColor: '#000' }]}>
          {isMiniVisible ? (
            // The mini overlay owns the video surface while minimized —
            // rendering a second VideoView here would detach it from the
            // overlay card.
            <View style={styles.miniYieldNotice}>
              <Text style={styles.miniYieldText}>Playing in mini player — tap it to return</Text>
            </View>
          ) : (
            <VideoGestureLayer
              player={player}
              onSingleTap={handleSurfaceTap}
              onSeekBack={() => seekBackward(10)}
              onSeekForward={() => seekForward(10)}
            >
              <VideoView
                style={StyleSheet.absoluteFill}
                player={player}
                contentFit="contain"
                nativeControls={false}
              />
            </VideoGestureLayer>
          )}

          {!isPlaying && !isBuffering && (
            <View style={styles.playOverlay} pointerEvents="box-none">
              <TouchableOpacity style={styles.playButton} onPress={togglePlay}>
                <Text style={styles.playIcon}>▶️</Text>
              </TouchableOpacity>
            </View>
          )}

          {isBuffering && (
            <View style={styles.playOverlay} pointerEvents="box-none">
              <View style={styles.bufferingIndicator} />
            </View>
          )}

          {showControls && (
            <View
              style={[styles.controlsOverlay, isLandscape && styles.controlsOverlayLandscape]}
              pointerEvents="box-none"
            >
              <View
                style={[styles.topControls, isLandscape && styles.topControlsLandscape]}
                pointerEvents="box-none"
              >
                <TouchableOpacity
                  onPress={() => (isFullscreen ? toggleFullscreen() : router.back())}
                >
                  <Text style={styles.controlText}>✕</Text>
                </TouchableOpacity>
                <Text style={styles.videoTitle} numberOfLines={1}>
                  {content.title}
                </Text>
                <TouchableOpacity
                  onPress={() => setSettingsVisible(true)}
                  accessibilityLabel="Playback settings"
                >
                  <Text style={styles.controlText}>⚙️</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={toggleFullscreen}>
                  <Text style={styles.controlText}>{isFullscreen ? '⊠' : '⛶'}</Text>
                </TouchableOpacity>
              </View>

              <View
                style={[styles.centerControls, isLandscape && styles.centerControlsLandscape]}
                pointerEvents="box-none"
              >
                <TouchableOpacity style={styles.seekButton} onPress={() => seekBackward(10)}>
                  <Text style={[styles.seekText, isLandscape && styles.seekTextLandscape]}>
                    -10s
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.mainPlayButton, isLandscape && styles.mainPlayButtonLandscape]}
                  onPress={togglePlay}
                >
                  <Text style={[styles.mainPlayIcon, isLandscape && styles.mainPlayIconLandscape]}>
                    {isPlaying ? '⏸️' : '▶️'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.seekButton} onPress={() => seekForward(10)}>
                  <Text style={[styles.seekText, isLandscape && styles.seekTextLandscape]}>
                    +10s
                  </Text>
                </TouchableOpacity>
              </View>

              <View
                style={[styles.bottomControls, isLandscape && styles.bottomControlsLandscape]}
                pointerEvents="box-none"
              >
                <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
                <TouchableOpacity
                  style={styles.progressBar}
                  onLayout={(e) => setSeekBarWidth(e.nativeEvent.layout.width)}
                  onPress={(e) => {
                    if (seekBarWidth <= 0 || displayDuration <= 0) return;
                    const x = e.nativeEvent.locationX;
                    const percent = Math.min(Math.max(x / seekBarWidth, 0), 1);
                    handleSeek(percent * displayDuration);
                  }}
                  activeOpacity={0.8}
                  disabled={displayDuration <= 0}
                >
                  <View style={styles.progressBackground}>
                    <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
                  </View>
                </TouchableOpacity>
                <Text style={styles.timeText}>{formatTime(displayDuration)}</Text>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* Info pane is hidden in fullscreen so the rotated layout only
          contains the player. */}
      <ScrollView
        style={[styles.contentInfo, isFullscreen && styles.contentInfoHidden]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>
          {content.title}
        </Text>

        <View style={styles.metaRow}>
          {content.universe && <Text style={styles.metaText}>📺 {content.universe.name}</Text>}
          <Text style={styles.metaText}>📅 {new Date(content.createdAt).toLocaleDateString()}</Text>
          {content.isPremium && <Text style={styles.metaText}>💎 Premium</Text>}
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={toggleLike}
            accessibilityRole="button"
            accessibilityLabel={isLiked ? 'Unlike' : 'Like'}
          >
            <Text style={styles.actionIcon}>{isLiked ? '❤️' : '👍'}</Text>
            <Text style={styles.actionLabel}>
              {likeCount > 0 ? `${likeCount} ` : ''}
              {isLiked ? 'Liked' : 'Like'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={openComments}
            accessibilityRole="button"
            accessibilityLabel="Comment"
          >
            <Text style={styles.actionIcon}>💬</Text>
            <Text style={styles.actionLabel}>Comment</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() =>
              void NativeShareService.shareWithFallback({
                title: content.title,
                message: content.description || `Watch "${content.title}" on Azeebo+`,
                url: `https://azeebo.plus/watch/${content.id}`,
              })
            }
            accessibilityRole="button"
            accessibilityLabel="Share"
          >
            <Text style={styles.actionIcon}>↗️</Text>
            <Text style={styles.actionLabel}>Share</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              if (saved) return;
              setSaved(true);
              void contentApi.saveContent(content.id).catch(() => setSaved(false));
            }}
            accessibilityRole="button"
            accessibilityLabel={saved ? 'Saved' : 'Save'}
          >
            <Text style={styles.actionIcon}>{saved ? '✅' : '➕'}</Text>
            <Text style={styles.actionLabel}>{saved ? 'Saved' : 'Save'}</Text>
          </TouchableOpacity>
        </View>

        <View
          style={[
            styles.descriptionSection,
            { borderColor: colorScheme === 'dark' ? '#333' : '#eee' },
          ]}
        >
          <Text style={[styles.description, { color: colorScheme === 'dark' ? '#ccc' : '#666' }]}>
            {content.description}
          </Text>
        </View>

        <View style={styles.creatorSection}>
          <View style={[styles.creatorAvatar, { backgroundColor: colors.primary[500] }]}>
            <Text style={styles.creatorInitial}>{content.creator?.name?.charAt(0) || 'A'}</Text>
          </View>
          <View style={styles.creatorInfo}>
            <Text style={[styles.creatorName, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>
              {content.creator?.name || 'Unknown Creator'}
            </Text>
            <Text style={styles.subscriberText}>View Profile</Text>
          </View>
          <TouchableOpacity
            style={styles.subscribeButton}
            accessibilityRole="button"
            accessibilityLabel={`Subscribe to ${content.creator?.name || 'creator'}`}
          >
            <Text style={styles.subscribeButtonText}>Subscribe</Text>
          </TouchableOpacity>
        </View>

        {relatedContent.length > 0 && (
          <View style={styles.episodesSection}>
            <Text
              style={[styles.sectionTitle, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}
            >
              More to Explore
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {relatedContent.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.episodeCard}
                  onPress={() => router.push(`/watch/${item.id}`)}
                  accessibilityRole="button"
                  accessibilityLabel={`Watch ${item.title}`}
                >
                  <View style={[styles.episodeThumbnail, { backgroundColor: '#1a1a1a' }]}>
                    <Text style={styles.episodeEmoji}>📺</Text>
                    {item.duration && (
                      <View style={styles.durationBadge}>
                        <Text style={styles.durationText}>{formatTime(item.duration)}</Text>
                      </View>
                    )}
                  </View>
                  <Text
                    style={[
                      styles.episodeTitle,
                      { color: colorScheme === 'dark' ? '#fff' : '#000' },
                    ]}
                    numberOfLines={2}
                  >
                    {item.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>

      <PlayerSettingsSheet
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
        preferences={preferences}
        onQualityChange={setQuality}
        onSpeedChange={setPlaybackSpeed}
        onAutoplayNextChange={setAutoplayNext}
      />

      {/* Comments sheet — real backend-backed comment thread. */}
      <Modal
        visible={commentsVisible}
        animationType="slide"
        onRequestClose={() => setCommentsVisible(false)}
      >
        <SafeAreaView
          style={[styles.commentsSafe, { backgroundColor: colorScheme === 'dark' ? '#000' : '#fff' }]}
        >
          <KeyboardAvoidingView
            style={styles.commentsContainer}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View
              style={[
                styles.commentsHeader,
                { borderBottomColor: colorScheme === 'dark' ? '#333' : '#eee' },
              ]}
            >
              <Text style={[styles.commentsTitle, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>
                Comments
              </Text>
              <TouchableOpacity
                onPress={() => setCommentsVisible(false)}
                accessibilityLabel="Close comments"
              >
                <Text
                  style={{ fontSize: 22, color: colorScheme === 'dark' ? '#fff' : '#000' }}
                >
                  ✕
                </Text>
              </TouchableOpacity>
            </View>

            {commentsLoading ? (
              <View style={styles.commentsLoadingWrap}>
                <ActivityIndicator color={colors.primary[500]} />
              </View>
            ) : comments.length === 0 ? (
              <View style={styles.commentsLoadingWrap}>
                <Text style={{ color: colors.text.secondary, textAlign: 'center' }}>
                  No comments yet. Be the first!
                </Text>
              </View>
            ) : (
              <FlatList
                data={comments}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.commentsList}
                renderItem={({ item }) => (
                  <View style={styles.commentRow}>
                    <View style={[styles.commentAvatar, { backgroundColor: colors.primary[500] }]}>
                      <Text style={styles.commentAvatarText}>
                        {(item.userName || 'A').charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.commentBody}>
                      <View style={styles.commentMetaRow}>
                        <Text
                          style={[
                            styles.commentAuthor,
                            { color: colorScheme === 'dark' ? '#fff' : '#000' },
                          ]}
                        >
                          {item.userName || 'Anonymous'}
                        </Text>
                        <Text style={styles.commentTime}>
                          {new Date(item.timestamp).toLocaleDateString()}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.commentText,
                          { color: colorScheme === 'dark' ? '#ccc' : '#444' },
                        ]}
                      >
                        {item.content}
                      </Text>
                    </View>
                  </View>
                )}
              />
            )}

            <View
              style={[
                styles.commentComposer,
                { borderTopColor: colorScheme === 'dark' ? '#333' : '#eee' },
              ]}
            >
              <TextInput
                style={[
                  styles.commentInput,
                  {
                    backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#f5f5f5',
                    color: colorScheme === 'dark' ? '#fff' : '#000',
                  },
                ]}
                placeholder="Add a comment..."
                placeholderTextColor={colors.text.tertiary}
                value={commentDraft}
                onChangeText={setCommentDraft}
                multiline
                maxLength={1000}
              />
              <TouchableOpacity
                style={[
                  styles.commentSend,
                  (!commentDraft.trim() || isPostingComment) && styles.commentSendDisabled,
                ]}
                onPress={postComment}
                disabled={!commentDraft.trim() || isPostingComment}
                accessibilityLabel="Post comment"
              >
                {isPostingComment ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.commentSendText}>Post</Text>
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

interface CommentItem {
  id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: string;
  likes: number;
  likedByCurrentUser: boolean;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  backButton: {
    padding: 16,
  },
  backText: {
    fontSize: 16,
    fontWeight: '600',
  },
  // Embedded size is injected at render time from useWindowDimensions()
  // (16:9 box that fits the current orientation).
  videoContainer: {
    backgroundColor: '#000',
  },
  videoContainerFullscreen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
    height: '100%',
  },
  videoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.alpha.primary20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: {
    fontSize: 32,
  },
  bufferingIndicator: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.2)',
    borderTopColor: colors.primary[500],
  },
  controlsOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  // ── Landscape (fullscreen) control layout ────────────────
  controlsOverlayLandscape: {
    padding: 24,
    paddingVertical: 16,
  },
  topControlsLandscape: {
    paddingHorizontal: 8,
  },
  centerControlsLandscape: {
    gap: 56,
  },
  seekTextLandscape: {
    fontSize: 18,
  },
  mainPlayButtonLandscape: {
    width: 84,
    height: 84,
    borderRadius: 42,
  },
  mainPlayIconLandscape: {
    fontSize: 38,
  },
  bottomControlsLandscape: {
    paddingHorizontal: 8,
    gap: 12,
  },
  contentInfoHidden: {
    display: 'none',
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  controlText: {
    fontSize: 24,
    color: '#fff',
  },
  videoTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    marginHorizontal: 16,
  },
  centerControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 32,
  },
  seekButton: {
    padding: 8,
  },
  seekText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  mainPlayButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(232, 66, 10, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainPlayIcon: {
    fontSize: 28,
  },
  bottomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeText: {
    color: '#fff',
    fontSize: 12,
    minWidth: 45,
  },
  progressBar: {
    flex: 1,
    height: 20,
    justifyContent: 'center',
  },
  progressBackground: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary[500],
    borderRadius: 2,
  },
  contentInfo: {
    flex: 1,
    padding: 16,
  },
  miniYieldNotice: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniYieldText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  metaText: {
    fontSize: 13,
    color: colors.text.tertiary,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.neutral[200],
  },
  actionButton: {
    alignItems: 'center',
    gap: 4,
  },
  actionIcon: {
    fontSize: 24,
  },
  actionLabel: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
  descriptionSection: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  creatorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  creatorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  creatorInitial: {
    color: colors.text.primary,
    fontSize: 20,
    fontWeight: '600',
  },
  creatorInfo: {
    flex: 1,
  },
  creatorName: {
    fontSize: 16,
    fontWeight: '600',
  },
  subscriberText: {
    fontSize: 13,
    color: colors.text.tertiary,
  },
  subscribeButton: {
    backgroundColor: colors.primary[500],
    paddingHorizontal: 20,
    paddingVertical: 10,
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: 20,
  },
  subscribeButtonText: {
    color: colors.text.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  episodesSection: {
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  episodeCard: {
    width: 140,
    marginRight: 12,
  },
  episodeThumbnail: {
    width: 140,
    height: 79,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    position: 'relative',
  },
  episodeEmoji: {
    fontSize: 28,
  },
  durationBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  durationText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '500',
  },
  episodeTitle: {
    fontSize: 13,
    fontWeight: '500',
  },
  // ── Comments sheet ─────────────────────────────────────────
  commentsSafe: {
    flex: 1,
  },
  commentsContainer: {
    flex: 1,
  },
  commentsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  commentsLoadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  commentsList: {
    padding: 16,
    gap: 16,
  },
  commentRow: {
    flexDirection: 'row',
    gap: 10,
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentAvatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  commentBody: {
    flex: 1,
    gap: 2,
  },
  commentMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  commentAuthor: {
    fontSize: 13,
    fontWeight: '600',
  },
  commentTime: {
    fontSize: 11,
    color: colors.text.tertiary,
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
  },
  commentComposer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    padding: 12,
    borderTopWidth: 1,
  },
  commentInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
  },
  commentSend: {
    backgroundColor: colors.primary[500],
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
  },
  commentSendDisabled: {
    opacity: 0.5,
  },
  commentSendText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
