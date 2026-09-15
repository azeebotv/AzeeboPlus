import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  BackHandler,
  DeviceEventEmitter,
} from 'react-native';
import { VideoView } from 'expo-video';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { useTVVideoPlayer } from '../../src/hooks/useTVVideoPlayer';
import { useFlags } from '@azeebo/react-data/contexts/FlagsContext';
import { tvFlags } from '@azeebo/feature-flags/registries';
import { contentApi, type ContentItem } from '@azeebo/react-data';
import { LoadingState, ErrorState } from '../../src/components/StateContainers';
import { logger } from '@azeebo/react-data/utils/logger';
import { colors, tvTypography, tvSpacing, tvRadius } from '../../src/theme';

/**
 * TV watch screen — fullscreen playback with remote-friendly controls.
 *
 * D-pad mapping:
 *  - Select / Enter: play-pause
 *  - Left / Right: seek ∓10s
 *  - Back: exit player
 * Controls overlay auto-hides after 4s of playback; any key press shows it.
 */
export default function TVWatchScreen() {
  const router = useRouter();
  const { contentId } = useLocalSearchParams<{ contentId: string }>();
  const { t } = useTranslation();
  // tv_autoplay gates auto-start so ops can disable it without a release
  // (asymmetry noted in the audit: mobile gates on mobile_autoplay, TV was
  // hard-wired to always autoplay).
  const { isEnabled } = useFlags();

  const [content, setContent] = useState<ContentItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(true);
  // Timestamp of the last user interaction (any remote key or surface press).
  // The auto-hide timer depends on THIS, not on currentTime — depending on the
  // clock tore the 4s timer down every second and hid controls mid-lookup.
  const [lastInteractionAt, setLastInteractionAt] = useState(Date.now());

  const handleProgressUpdate = useCallback(
    async (position: number) => {
      if (!contentId) return;
      try {
        await contentApi.addToWatchHistory(contentId, position);
      } catch (err) {
        logger.error('Failed to update watch progress', err);
      }
    },
    [contentId]
  );

  const {
    player,
    isPlaying,
    isBuffering,
    error: playerError,
    errorKind: playerErrorKind,
    currentTime,
    duration,
    handleDPad,
    togglePlay,
    formatTime,
  } = useTVVideoPlayer({
    contentId: contentId || '',
    initialProgress: content?.watchProgress ?? 0,
    autoPlay: isEnabled(tvFlags.autoplay),
    onProgressUpdate: handleProgressUpdate,
  });

  const fetchContent = useCallback(async () => {
    if (!contentId) return;
    setIsLoading(true);
    setFetchError(null);
    try {
      const response = await contentApi.getContentById(contentId);
      if (response.success && response.data) {
        setContent(response.data);
      } else {
        setFetchError('Content not found');
      }
    } catch (err: unknown) {
      setFetchError(err instanceof Error ? err.message : 'Failed to load content');
    } finally {
      setIsLoading(false);
    }
  }, [contentId]);

  useEffect(() => {
    void fetchContent();
  }, [fetchContent]);

  // Auto-hide controls 4s after the LAST USER INTERACTION while playing.
  useEffect(() => {
    if (!isPlaying || !showControls) return;
    const elapsed = Date.now() - lastInteractionAt;
    const remaining = Math.max(0, 4000 - elapsed);
    const timer = setTimeout(() => setShowControls(false), remaining);
    return () => clearTimeout(timer);
  }, [isPlaying, showControls, lastInteractionAt]);

  // Hardware Back exits the player.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      router.back();
      return true;
    });
    return () => sub.remove();
  }, [router]);

  // Remote D-pad / media keys (Android TV, Fire TV). Key names arrive via
  // DeviceEventEmitter 'keyDown' events; map them to transport actions.
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('keyDown', (evt: { eventKeyName?: string }) => {
      setShowControls(true);
      setLastInteractionAt(Date.now());
      handleDPad(evt.eventKeyName || '');
    });
    return () => sub.remove();
  }, [handleDPad]);

  const displayDuration = duration || content?.duration || 0;
  const progressPercent =
    displayDuration > 0 ? Math.min((currentTime / displayDuration) * 100, 100) : 0;

  if (isLoading) {
    return <LoadingState text="Loading content..." />;
  }

  if (fetchError || playerError) {
    // M4: an entitlement denial (403 from the signed-url endpoint) is a
    // paywall, not a failure. There is no purchase surface on TV, so explain
    // the upgrade path instead of offering a retry that can never succeed.
    const isEntitlement = !fetchError && playerErrorKind === 'entitlement';
    if (isEntitlement) {
      return (
        <ErrorState
          description={`${t('common.errorEntitlement')} Subscribe on the Azeebo+ mobile app or at azeeboplus.com, then sign in here again to watch.`}
        />
      );
    }
    return (
      <ErrorState
        description={fetchError || playerError || 'Failed to load video'}
        onRetry={fetchError ? fetchContent : undefined}
      />
    );
  }

  if (!content) {
    return <ErrorState description="Content not found" onRetry={fetchContent} />;
  }

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={() => {
          setShowControls(true);
          setLastInteractionAt(Date.now());
          togglePlay();
        }}
        accessibilityRole="button"
        accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
      >
        <VideoView
          style={StyleSheet.absoluteFill}
          player={player}
          contentFit="contain"
          // Native transport controls also respond to the remote; our overlay
          // complements them with brand-styled seek feedback.
          nativeControls={false}
        />
      </Pressable>

      {isBuffering && (
        <View style={styles.bufferingOverlay} pointerEvents="none">
          <ActivityIndicator size="large" color={colors.primary[500]} />
        </View>
      )}

      {showControls && (
        <View style={styles.controlsOverlay} pointerEvents="box-none">
          <View style={styles.topBar}>
            <Text style={styles.title} numberOfLines={1}>
              {content.title}
            </Text>
            {content.universe?.name ? (
              <Text style={styles.universe}>{content.universe.name}</Text>
            ) : null}
          </View>

          <View style={styles.bottomBar} pointerEvents="none">
            <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
            </View>
            <Text style={styles.timeText}>{formatTime(displayDuration)}</Text>
          </View>

          <View style={styles.hintBar} pointerEvents="none">
            <Text style={styles.hintText}>◉ Play/Pause</Text>
            <Text style={styles.hintText}>◀ ▶ Seek 10s</Text>
            <Text style={styles.hintText}>⎋ Back to exit</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  bufferingOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlsOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: tvSpacing.xxl,
    paddingVertical: tvSpacing.lg,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  title: {
    color: colors.text.primary,
    fontSize: tvTypography.fontSize.xl,
    fontWeight: tvTypography.fontWeight.bold,
    flex: 1,
    marginRight: tvSpacing.lg,
  },
  universe: {
    color: colors.primary[500],
    fontSize: tvTypography.fontSize.base,
    fontWeight: tvTypography.fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tvSpacing.lg,
    paddingHorizontal: tvSpacing.xxl,
    paddingVertical: tvSpacing.lg,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  timeText: {
    color: colors.text.primary,
    fontSize: tvTypography.fontSize.sm,
    fontVariant: ['tabular-nums'],
    minWidth: 70,
    textAlign: 'center',
  },
  progressTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.25)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary[500],
    borderRadius: 4,
  },
  hintBar: {
    position: 'absolute',
    bottom: 80,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: tvSpacing.xl,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: tvSpacing.lg,
    paddingVertical: tvSpacing.sm,
    borderRadius: tvRadius.pill,
  },
  hintText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: tvTypography.fontSize.sm,
  },
});
