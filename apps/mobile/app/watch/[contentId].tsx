import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
  useColorScheme,
  Alert,
} from 'react-native';
import { VideoView } from 'expo-video';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAzeeboVideoPlayer } from '../../src/hooks/useVideoPlayer';
import { useFlags } from '../../src/contexts/FlagsContext';
import { contentApi, type ContentItem } from '../../src/api';
import { logger } from '../../src/utils/logger';
import { LoadingState, ErrorState, EmptyState } from '../../src/components/StateContainers';
import { colors } from '../../src/theme';

export default function WatchScreen() {
  const router = useRouter();
  const { contentId } = useLocalSearchParams<{ contentId: string }>();
  const colorScheme = useColorScheme();
  const { isEnabled } = useFlags();

  // Live viewport — updates when the device rotates into fullscreen landscape.
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isLandscape = windowWidth > windowHeight;

  const [content, setContent] = useState<ContentItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [relatedContent, setRelatedContent] = useState<ContentItem[]>([]);

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
    Alert.alert('Video Complete', 'Thanks for watching!');
  }, []);

  const {
    isPlaying,
    isBuffering,
    isFullscreen,
    currentTime,
    duration,
    showControls,
    error: playerError,
    player,
    togglePlay,
    seek,
    seekForward,
    seekBackward,
    toggleFullscreen,
    setShowControls,
    formatTime,
  } = useAzeeboVideoPlayer({
    contentId: contentId || '',
    initialProgress: content?.watchProgress ?? 0,
    onProgressUpdate: handleProgressUpdate,
    onComplete: handleComplete,
    // mobile_autoplay (on by default): auto-start playback when ready; off
    // keeps the conservative tap-to-play behavior.
    autoPlay: isEnabled('mobile_autoplay'),
  });

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
    seek(time);
  };

  // Measured width of the seek bar — using the screen width minus a guess was
  // off by the container padding and made end-of-video seeks overshoot.
  const [seekBarWidth, setSeekBarWidth] = useState(0);

  const handleVideoPress = () => {
    setShowControls(true);
    togglePlay();
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
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#000' : '#fff' }]}
      >
        <ErrorState
          description={error || playerError || 'Failed to load video'}
          onRetry={fetchContent}
        />
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

  const displayDuration = duration || content.duration || 3600;
  const progressPercent = displayDuration > 0 ? (currentTime / displayDuration) * 100 : 0;

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
        <TouchableOpacity
          style={[styles.videoPlaceholder, { backgroundColor: '#000' }]}
          onPress={handleVideoPress}
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
              <TouchableOpacity style={styles.playButton} onPress={togglePlay}>
                <Text style={styles.playIcon}>▶️</Text>
              </TouchableOpacity>
            </View>
          )}

          {isBuffering && (
            <View style={styles.playOverlay}>
              <View style={styles.bufferingIndicator} />
            </View>
          )}

          {showControls && (
            <View style={[styles.controlsOverlay, isLandscape && styles.controlsOverlayLandscape]}>
              <View style={[styles.topControls, isLandscape && styles.topControlsLandscape]}>
                <TouchableOpacity
                  onPress={() => (isFullscreen ? toggleFullscreen() : router.back())}
                >
                  <Text style={styles.controlText}>✕</Text>
                </TouchableOpacity>
                <Text style={styles.videoTitle} numberOfLines={1}>
                  {content.title}
                </Text>
                <TouchableOpacity onPress={toggleFullscreen}>
                  <Text style={styles.controlText}>{isFullscreen ? '⊠' : '⛶'}</Text>
                </TouchableOpacity>
              </View>

              <View style={[styles.centerControls, isLandscape && styles.centerControlsLandscape]}>
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

              <View style={[styles.bottomControls, isLandscape && styles.bottomControlsLandscape]}>
                <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
                <TouchableOpacity
                  style={styles.progressBar}
                  onLayout={(e) => setSeekBarWidth(e.nativeEvent.layout.width)}
                  onPress={(e) => {
                    if (seekBarWidth <= 0) return;
                    const x = e.nativeEvent.locationX;
                    const percent = Math.min(Math.max(x / seekBarWidth, 0), 1);
                    handleSeek(percent * displayDuration);
                  }}
                  activeOpacity={0.8}
                >
                  <View style={styles.progressBackground}>
                    <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
                  </View>
                </TouchableOpacity>
                <Text style={styles.timeText}>{formatTime(displayDuration)}</Text>
              </View>
            </View>
          )}
        </TouchableOpacity>
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
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionIcon}>👍</Text>
            <Text style={styles.actionLabel}>Like</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionIcon}>💬</Text>
            <Text style={styles.actionLabel}>Comment</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionIcon}>↗️</Text>
            <Text style={styles.actionLabel}>Share</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionIcon}>➕</Text>
            <Text style={styles.actionLabel}>Save</Text>
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
          <View style={[styles.creatorAvatar, { backgroundColor: '#E8420A' }]}>
            <Text style={styles.creatorInitial}>{content.creator?.name?.charAt(0) || 'A'}</Text>
          </View>
          <View style={styles.creatorInfo}>
            <Text style={[styles.creatorName, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>
              {content.creator?.name || 'Unknown Creator'}
            </Text>
            <Text style={styles.subscriberText}>View Profile</Text>
          </View>
          <TouchableOpacity style={styles.subscribeButton}>
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
    </SafeAreaView>
  );
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
    backgroundColor: 'rgba(139, 92, 246, 0.8)',
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
    borderTopColor: '#E8420A',
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
    backgroundColor: 'rgba(139, 92, 246, 0.9)',
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
    backgroundColor: '#E8420A',
    borderRadius: 2,
  },
  contentInfo: {
    flex: 1,
    padding: 16,
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
    color: colors.palette.grey600,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.palette.grey150,
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
    color: colors.palette.grey600,
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
    color: '#fff',
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
    color: colors.palette.grey600,
  },
  subscribeButton: {
    backgroundColor: '#E8420A',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  subscribeButtonText: {
    color: '#fff',
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
});
