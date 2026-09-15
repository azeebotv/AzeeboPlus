import { useState, useEffect, useRef } from 'react';
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
import { contentApi } from '@azeebo/react-data';
import { logger } from '@azeebo/react-data/utils/logger';
import { analytics } from '../../src/utils/analytics';
import { colors } from '../../src/theme';

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

  const [episode, setEpisode] = useState<Episode | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [showSubtitles, setShowSubtitles] = useState(false);
  const [selectedSubtitle, setSelectedSubtitle] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    loadEpisode();
    if (showId && episodeId) {
      analytics.realityEpisodeViewed(showId, episodeId);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
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

  const handlePlayPause = () => {
    if (isPlaying) {
      setIsPlaying(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    } else {
      setIsPlaying(true);
      timerRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= (episode?.duration || 0)) {
            setIsPlaying(false);
            if (timerRef.current) {
              clearInterval(timerRef.current);
            }
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    }
  };

  const handleSeek = (seconds: number) => {
    const newTime = Math.max(0, Math.min(currentTime + seconds, episode?.duration || 0));
    setCurrentTime(newTime);
  };

  const handleVote = () => {
    Alert.alert('Vote for Contestant', 'Would you like to use a Super Vote (2x weight)?', [
      { text: 'Regular Vote', onPress: () => submitVote(false) },
      { text: 'Super Vote', onPress: () => submitVote(true) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const submitVote = async (isSuper: boolean) => {
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
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E8420A" />
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

  const progress = (currentTime / episode.duration) * 100;

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

        <View style={styles.videoPlaceholder} onTouchEnd={() => setShowControls(!showControls)}>
          <Text style={styles.videoTitle}>{episode.title}</Text>
          <Text style={styles.videoSubtitle}>
            S{episode.seasonNumber} E{episode.episodeNumber}
          </Text>

          {isPlaying ? (
            <View style={styles.playingIndicator}>
              <View style={styles.playingBar1} />
              <View style={styles.playingBar2} />
              <View style={styles.playingBar3} />
            </View>
          ) : (
            <TouchableOpacity
              style={styles.playButton}
              onPress={handlePlayPause}
              accessibilityLabel="Play"
              accessibilityRole="button"
            >
              <Text style={styles.playButtonText}>▶</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.controlsContainer}>
          <View style={styles.progressContainer}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <View style={styles.timeContainer}>
              <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
              <Text style={styles.timeText}>{formatTime(episode.duration)}</Text>
            </View>
          </View>

          <View style={styles.controls}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => handleSeek(-10)}
              accessibilityLabel="Seek backward 10 seconds"
              accessibilityRole="button"
            >
              <Text style={styles.controlButtonText}>⏪</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.controlButtonLarge}
              onPress={handlePlayPause}
              accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
              accessibilityRole="button"
            >
              <Text style={styles.controlButtonTextLarge}>{isPlaying ? '⏸' : '▶'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => handleSeek(10)}
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
              style={styles.actionButton}
              onPress={handleVote}
              accessibilityLabel="Vote for contestant"
              accessibilityRole="button"
            >
              <Text style={styles.actionButtonText}>🗳 Vote</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.episodeInfo}>
            <Text style={styles.episodeTitle}>{episode.title}</Text>
            <Text style={styles.episodeDescription}>{episode.description}</Text>
          </View>
        </View>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: colors.light[100],
    fontSize: 18,
    marginBottom: 16,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#E8420A',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  playerContainer: {
    flex: 1,
  },
  backButtonAbsolute: {
    position: 'absolute',
    top: 60,
    left: 24,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoPlaceholder: {
    width: screenWidth,
    height: screenWidth * 0.5625,
    backgroundColor: '#1A0A0A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoTitle: {
    color: colors.light[100],
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  videoSubtitle: {
    color: colors.light[400],
    fontSize: 14,
    marginBottom: 24,
  },
  playingIndicator: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 40,
    gap: 4,
  },
  playingBar1: {
    width: 4,
    height: 20,
    backgroundColor: '#E8420A',
  },
  playingBar2: {
    width: 4,
    height: 30,
    backgroundColor: '#E8420A',
  },
  playingBar3: {
    width: 4,
    height: 25,
    backgroundColor: '#E8420A',
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(139, 92, 246, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButtonText: {
    color: '#fff',
    fontSize: 32,
  },
  controlsContainer: {
    flex: 1,
    backgroundColor: '#1A0A0A',
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressTrack: {
    height: 4,
    backgroundColor: colors.bg.tertiary,
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#E8420A',
    borderRadius: 2,
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
    gap: 32,
    marginBottom: 24,
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.bg.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlButtonLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E8420A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlButtonText: {
    fontSize: 20,
  },
  controlButtonTextLarge: {
    fontSize: 28,
    color: '#fff',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: colors.bg.tertiary,
    borderRadius: 8,
    alignItems: 'center',
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
    color: '#E8420A',
    fontSize: 20,
    fontWeight: 'bold',
  },
});
