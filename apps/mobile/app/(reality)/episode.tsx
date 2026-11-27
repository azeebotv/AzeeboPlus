import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VideoView } from 'expo-video';
import { contentApi } from '@azeebo/react-data';
import { logger } from '@azeebo/react-data/utils/logger';
import { useFlags } from '@azeebo/react-data/contexts/FlagsContext';
import { useAzeeboVideoPlayer } from '../../src/hooks/useVideoPlayer';
import { analytics } from '../../src/utils/analytics';
import { colors } from '../../src/theme';
import { brand } from '@azeebo/design-tokens';

const { width: screenWidth } = Dimensions.get('window');

interface Episode {
  id: string;
  title: string;
  description: string;
  episodeNumber: number;
  seasonNumber: number;
  duration: number;
  videoUrl: string;
  subtitles?: Array<{ language: string; url: string }>;
}

export default function EpisodePlayerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const episodeId = params.id as string;
  const showId = params.showId as string;

  const { isEnabled } = useFlags();
  const votingEnabled = isEnabled('reality_voting_enabled');

  const [episode, setEpisode] = useState<Episode | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSubtitles, setShowSubtitles] = useState(false);
  const [selectedSubtitle, setSelectedSubtitle] = useState<string | null>(null);
  const [controlsVisible, setControlsVisible] = useState(true);

  const {
    player,
    isPlaying,
    currentTime,
    duration: playerDuration,
    togglePlay,
    seek,
    error: playerError,
  } = useAzeeboVideoPlayer({
    contentId: episodeId,
    title: episode?.title,
    ownerPath: `/episode?id=${episodeId}${showId ? `&showId=${showId}` : ''}`,
  });

  useEffect(() => {
    loadEpisode();
    if (showId && episodeId) {
      analytics.realityEpisodeViewed(showId, episodeId);
    }
  }, [episodeId]);

  const loadEpisode = async () => {
    try {
      const response = await contentApi.getEpisode(episodeId);
      if (response.success && response.data) {
        setEpisode(response.data as Episode);
      }
    } catch (error) {
      logger.error('Failed to load episode', error);
      Alert.alert('Error', 'Failed to load episode. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVote = () => {
    if (!votingEnabled) {
      Alert.alert(
        'Voting Inactive',
        'Reality voting is currently locked pending official universe activation gates.'
      );
      return;
    }

    Alert.alert('Vote for Contestant', 'Would you like to use a Super Vote (2x weight)?', [
      { text: 'Regular Vote', onPress: () => submitVote(false) },
      { text: 'Super Vote', onPress: () => submitVote(true) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const submitVote = async (isSuper: boolean) => {
    if (!votingEnabled) return;
    try {
      await contentApi.vote({
        episodeId,
        isSuperVote: isSuper,
      });
      Alert.alert('Success', `Your ${isSuper ? 'Super ' : ''}vote has been submitted!`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to submit vote';
      Alert.alert('Error', message);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView accessibilityLabel="Episode Screen" style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={brand.flame} />
          <Text style={styles.loadingText}>Loading episode...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!episode) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Episode not found</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const effectiveDuration = playerDuration > 0 ? playerDuration : episode.duration || 1;
  const progress = Math.min(100, Math.max(0, (currentTime / effectiveDuration) * 100));

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.playerContainer}>
        <TouchableOpacity
          style={styles.backButtonAbsolute}
          onPress={() => router.back()}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={1}
          style={styles.videoSurface}
          onPress={() => setControlsVisible((prev) => !prev)}
        >
          <VideoView
            player={player}
            style={styles.videoPlayer}
            contentFit="contain"
            nativeControls={false}
          />

          {playerError && (
            <View style={styles.playerErrorOverlay}>
              <Text style={styles.playerErrorText}>{playerError}</Text>
            </View>
          )}

          {!isPlaying && !playerError && (
            <View style={styles.playOverlay}>
              <TouchableOpacity
                style={styles.playButton}
                onPress={togglePlay}
                accessibilityLabel="Play"
                accessibilityRole="button"
              >
                <Text style={styles.playButtonText}>▶</Text>
              </TouchableOpacity>
            </View>
          )}
        </TouchableOpacity>

        {controlsVisible && (
          <View style={styles.controlsContainer}>
            <View style={styles.progressContainer}>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${progress}%` }]} />
              </View>
              <View style={styles.timeContainer}>
                <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
                <Text style={styles.timeText}>{formatTime(effectiveDuration)}</Text>
              </View>
            </View>

            <View style={styles.controls}>
              <TouchableOpacity
                style={styles.controlButton}
                onPress={() => seek(-10)}
                accessibilityLabel="Seek backward 10 seconds"
                accessibilityRole="button"
              >
                <Text style={styles.controlButtonText}>⏪</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.controlButtonLarge}
                onPress={togglePlay}
                accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
                accessibilityRole="button"
              >
                <Text style={styles.controlButtonTextLarge}>{isPlaying ? '⏸' : '▶'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.controlButton}
                onPress={() => seek(10)}
                accessibilityLabel="Seek forward 10 seconds"
                accessibilityRole="button"
              >
                <Text style={styles.controlButtonText}>⏩</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => setShowSubtitles(true)}
                accessibilityLabel="Open subtitles"
                accessibilityRole="button"
              >
                <Text style={styles.actionButtonText}>💬 Subtitles</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, !votingEnabled && styles.actionButtonDisabled]}
                onPress={handleVote}
                accessibilityLabel="Vote for contestant"
                accessibilityRole="button"
              >
                <Text style={styles.actionButtonText}>
                  {votingEnabled ? '🗳 Vote' : '🔒 Voting Locked'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.episodeInfo}>
              <Text style={styles.episodeTitle}>{episode.title}</Text>
              <Text style={styles.episodeDescription}>{episode.description}</Text>
            </View>
          </View>
        )}
      </View>

      <Modal
        visible={showSubtitles}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSubtitles(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Subtitles</Text>
              <TouchableOpacity
                onPress={() => setShowSubtitles(false)}
                accessibilityLabel="Close subtitles menu"
                accessibilityRole="button"
              >
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView>
              <TouchableOpacity
                style={styles.subtitleOption}
                onPress={() => {
                  setSelectedSubtitle(null);
                  setShowSubtitles(false);
                }}
                accessibilityLabel="Turn subtitles off"
                accessibilityRole="button"
                accessibilityState={{ selected: !selectedSubtitle }}
              >
                <Text style={styles.subtitleText}>Off</Text>
                {!selectedSubtitle && <Text style={styles.subtitleCheck}>✓</Text>}
              </TouchableOpacity>

              {episode.subtitles?.map((subtitle) => (
                <TouchableOpacity
                  key={subtitle.language}
                  style={styles.subtitleOption}
                  onPress={() => {
                    setSelectedSubtitle(subtitle.language);
                    setShowSubtitles(false);
                  }}
                  accessibilityLabel={`Enable ${subtitle.language} subtitles`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: selectedSubtitle === subtitle.language }}
                >
                  <Text style={styles.subtitleText}>{subtitle.language}</Text>
                  {selectedSubtitle === subtitle.language && (
                    <Text style={styles.subtitleCheck}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.light[400],
    fontSize: 16,
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: colors.light[100],
    fontSize: 18,
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: brand.flame,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: colors.light[100],
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButtonAbsolute: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerContainer: {
    flex: 1,
  },
  videoSurface: {
    width: screenWidth,
    height: screenWidth * (9 / 16),
    backgroundColor: '#000',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlayer: {
    width: '100%',
    height: '100%',
  },
  playOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  playerErrorOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  playerErrorText: {
    color: '#FF6B6B',
    fontSize: 14,
    textAlign: 'center',
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: brand.flame,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonText: {
    color: colors.light[100],
    fontSize: 28,
    marginLeft: 4,
  },
  controlsContainer: {
    flex: 1,
    padding: 16,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: brand.flame,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    color: colors.light[400],
    fontSize: 12,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    gap: 24,
  },
  controlButton: {
    padding: 12,
  },
  controlButtonText: {
    fontSize: 24,
  },
  controlButtonLarge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtonTextLarge: {
    fontSize: 24,
    color: colors.light[100],
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionButtonText: {
    color: colors.light[100],
    fontSize: 14,
    fontWeight: '500',
  },
  episodeInfo: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    paddingTop: 16,
  },
  episodeTitle: {
    color: colors.light[100],
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  episodeDescription: {
    color: colors.light[400],
    fontSize: 14,
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.bg.tertiary,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.2)',
  },
  modalTitle: {
    color: colors.light[100],
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalClose: {
    color: colors.light[400],
    fontSize: 24,
  },
  subtitleOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.2)',
  },
  subtitleText: {
    color: colors.light[100],
    fontSize: 16,
  },
  subtitleCheck: {
    color: brand.flame,
    fontSize: 20,
    fontWeight: 'bold',
  },
});
