import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
  FlatList,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { realityApi } from '../../src/api/engagement';
import { logger } from '../../src/utils/logger';

interface EpisodeData {
  id: string;
  title?: string;
  description?: string;
  episodeNumber?: number;
  seasonNumber?: number;
  duration?: number;
  thumbnail?: string;
  releaseDate?: string;
  createdAt?: string;
  isLocked?: boolean;
}

interface EpisodesResponse {
  title?: string;
  episodes?: EpisodeData[];
}

interface Episode {
  id: string;
  title: string;
  description: string;
  episodeNumber: number;
  seasonNumber: number;
  duration: number;
  thumbnail: string;
  releaseDate: string;
  isLocked: boolean;
}

interface Season {
  seasonNumber: number;
  episodes: Episode[];
}

export default function EpisodesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const showId = params.showId as string;

  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(true);
  const [showTitle, setShowTitle] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadEpisodes();
  }, [showId]);

  const loadEpisodes = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await realityApi.getEpisodes(showId || 'default');
      
      if (response.success && response.data) {
        const data = response.data as EpisodesResponse;
        setShowTitle(data.title || 'Reality Show');
        
        // Group episodes by season
        const episodesBySeason: { [key: number]: Episode[] } = {};
        if (data.episodes && Array.isArray(data.episodes)) {
          data.episodes.forEach((ep: EpisodeData) => {
            const seasonNum = ep.seasonNumber || 1;
            if (!episodesBySeason[seasonNum]) {
              episodesBySeason[seasonNum] = [];
            }
            episodesBySeason[seasonNum].push({
              id: ep.id,
              title: ep.title || `Episode ${ep.episodeNumber}`,
              description: ep.description || '',
              episodeNumber: ep.episodeNumber || 0,
              seasonNumber: seasonNum,
              duration: ep.duration || 0,
              thumbnail: ep.thumbnail || '',
              releaseDate: ep.releaseDate || ep.createdAt || '',
              isLocked: ep.isLocked || false,
            });
          });
        }
        
        const seasonsList = Object.entries(episodesBySeason).map(([seasonNum, episodes]) => ({
          seasonNumber: parseInt(seasonNum),
          episodes: episodes.sort((a, b) => a.episodeNumber - b.episodeNumber),
        }));
        
        setSeasons(seasonsList);
      }
    } catch (err) {
      logger.error('Failed to load episodes:', err);
      setError('Failed to load episodes. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleEpisodePress = (episode: Episode) => {
    if (episode.isLocked) {
      return;
    }
    router.push(`/(reality)/episode?id=${episode.id}&showId=${showId}`);
  };

  const currentSeason = seasons.find((s) => s.seasonNumber === selectedSeason);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={styles.loadingText}>Loading episodes...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadEpisodes}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>{contentTitle}</Text>
          <Text style={styles.subtitle}>Episodes</Text>
        </View>
      </View>

      <View style={styles.seasonSelector}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {seasons.map((season) => (
            <TouchableOpacity
              key={season.seasonNumber}
              style={[
                styles.seasonButton,
                selectedSeason === season.seasonNumber && styles.seasonButtonActive,
              ]}
              onPress={() => setSelectedSeason(season.seasonNumber)}
            >
              <Text
                style={[
                  styles.seasonButtonText,
                  selectedSeason === season.seasonNumber && styles.seasonButtonTextActive,
                ]}
              >
                Season {season.seasonNumber}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={currentSeason?.episodes || []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.episodeCard,
              item.isLocked && styles.episodeCardLocked,
            ]}
            onPress={() => handleEpisodePress(item)}
            disabled={item.isLocked}
          >
            <Image
              source={{ uri: item.thumbnail }}
              style={styles.episodeThumbnail}
            />
            {item.isLocked && (
              <View style={styles.lockOverlay}>
                <Text style={styles.lockIcon}>🔒</Text>
              </View>
            )}
            <View style={styles.episodeContent}>
              <View style={styles.episodeHeader}>
                <Text style={styles.episodeNumber}>
                  E{item.episodeNumber.toString().padStart(2, '0')}
                </Text>
                <Text style={styles.episodeDuration}>
                  {formatDuration(item.duration)}
                </Text>
              </View>
              <Text style={styles.episodeTitle}>{item.title}</Text>
              <Text style={styles.episodeDescription} numberOfLines={2}>
                {item.description}
              </Text>
              <Text style={styles.episodeDate}>
                {formatDate(item.releaseDate)}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.episodesList}
        showsVerticalScrollIndicator={false}
      />
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
  },
  backButton: {
    marginRight: 16,
  },
  backButtonText: {
    fontSize: 24,
    color: '#F3F4F6',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F3F4F6',
  },
  subtitle: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  seasonSelector: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  seasonButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#1f2937',
    marginRight: 8,
  },
  seasonButtonActive: {
    backgroundColor: '#8B5CF6',
  },
  seasonButtonText: {
    color: '#F3F4F6',
    fontSize: 14,
    fontWeight: '500',
  },
  seasonButtonTextActive: {
    color: '#fff',
  },
  episodesList: {
    padding: 24,
  },
  episodeCard: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  episodeCardLocked: {
    opacity: 0.6,
  },
  episodeThumbnail: {
    width: 140,
    height: 100,
  },
  lockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockIcon: {
    fontSize: 32,
  },
  episodeContent: {
    flex: 1,
    padding: 12,
  },
  episodeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  episodeNumber: {
    fontSize: 12,
    color: '#8B5CF6',
    fontWeight: '600',
  },
  episodeDuration: {
    fontSize: 12,
    color: '#6B7280',
  },
  episodeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F3F4F6',
    marginBottom: 4,
  },
  episodeDescription: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 8,
    lineHeight: 16,
  },
  episodeDate: {
    fontSize: 11,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
