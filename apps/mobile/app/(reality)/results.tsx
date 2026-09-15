import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { contentApi } from '@azeebo/react-data';
import { logger } from '@azeebo/react-data/utils/logger';
import { analytics } from '../../src/utils/analytics';
import { colors } from '../../src/theme';

interface ContestantResult {
  id: string;
  name: string;
  avatar: string;
  votes: number;
  percentage: number;
  rank: number;
  isWinner?: boolean;
  isEvicted?: boolean;
}

interface EpisodeResult {
  id: string;
  episodeNumber: number;
  seasonNumber: number;
  title: string;
  date: string;
  contestants: ContestantResult[];
  winner?: ContestantResult;
  evicted?: ContestantResult;
}

export default function ResultsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const contentId = params.id as string;

  const [results, setResults] = useState<EpisodeResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEpisode, setSelectedEpisode] = useState<string | null>(null);

  useEffect(() => {
    loadResults();
    analytics.realityLeaderboardViewed(contentId);
  }, [contentId]);

  const loadResults = async () => {
    try {
      const response = await contentApi.getResults(contentId);

      if (response.success && response.data && response.data.length > 0) {
        const data = response.data;
        const contestants: ContestantResult[] = data.map((v) => ({
          id: v.contestantId ?? `id-${v.rank ?? 0}`,
          name: v.contestantName ?? `Contestant ${v.rank ?? 0}`,
          avatar: '',
          votes: v.totalVotes ?? 0,
          percentage: v.percentage ?? 0,
          rank: v.rank ?? 0,
        }));

        const topRanked = [...contestants].sort((a, b) => a.rank - b.rank);
        const bottomRanked = [...contestants].sort((a, b) => b.rank - a.rank);

        setResults([
          {
            id: contentId,
            episodeNumber: 1,
            seasonNumber: 1,
            title: 'Current Episode',
            date: new Date().toISOString(),
            contestants,
            winner: topRanked.length > 0 ? { ...topRanked[0], isWinner: true } : undefined,
            evicted: bottomRanked.length > 0 ? { ...bottomRanked[0], isEvicted: true } : undefined,
          },
        ]);
        setSelectedEpisode(contentId);
      }
    } catch (error) {
      logger.error('Failed to load results', error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedResult = results.find((r) => r.id === selectedEpisode);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E8420A" />
          <Text style={styles.loadingText}>Loading results...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Results</Text>
          <Text style={styles.subtitle}>Episode Rankings</Text>
        </View>
      </View>

      <View style={styles.episodeSelector}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {results.map((result) => (
            <TouchableOpacity
              key={result.id}
              style={[
                styles.episodeButton,
                selectedEpisode === result.id && styles.episodeButtonActive,
              ]}
              onPress={() => setSelectedEpisode(result.id)}
            >
              <Text
                style={[
                  styles.episodeButtonText,
                  selectedEpisode === result.id && styles.episodeButtonTextActive,
                ]}
              >
                E{result.episodeNumber}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {selectedResult && (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <View style={styles.episodeInfo}>
            <Text style={styles.episodeTitle}>{selectedResult.title}</Text>
            <Text style={styles.episodeDate}>
              {new Date(selectedResult.date).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
          </View>

          {selectedResult.winner && (
            <View style={styles.winnerCard}>
              <Text style={styles.winnerLabel}>🏆 Winner</Text>
              <View style={styles.winnerContent}>
                <Image source={{ uri: selectedResult.winner.avatar }} style={styles.winnerAvatar} />
                <View style={styles.winnerInfo}>
                  <Text style={styles.winnerName}>{selectedResult.winner.name}</Text>
                  <Text style={styles.winnerVotes}>
                    {selectedResult.winner.votes.toLocaleString()} votes (
                    {selectedResult.winner.percentage}%)
                  </Text>
                </View>
              </View>
            </View>
          )}

          {selectedResult.evicted && (
            <View style={styles.evictedCard}>
              <Text style={styles.evictedLabel}>🚪 Evicted</Text>
              <View style={styles.evictedContent}>
                <Image
                  source={{ uri: selectedResult.evicted.avatar }}
                  style={styles.evictedAvatar}
                />
                <View style={styles.evictedInfo}>
                  <Text style={styles.evictedName}>{selectedResult.evicted.name}</Text>
                  <Text style={styles.evictedVotes}>
                    {selectedResult.evicted.votes.toLocaleString()} votes (
                    {selectedResult.evicted.percentage}%)
                  </Text>
                </View>
              </View>
            </View>
          )}

          <View style={styles.rankingsSection}>
            <Text style={styles.rankingsTitle}>Full Rankings</Text>
            {selectedResult.contestants
              .sort((a, b) => a.rank - b.rank)
              .map((contestant) => (
                <View
                  key={contestant.id}
                  style={[
                    styles.contestantRow,
                    contestant.isWinner && styles.contestantRowWinner,
                    contestant.isEvicted && styles.contestantRowEvicted,
                  ]}
                >
                  <View style={styles.rankBadge}>
                    <Text style={styles.rankText}>#{contestant.rank}</Text>
                  </View>
                  <Image source={{ uri: contestant.avatar }} style={styles.contestantAvatar} />
                  <View style={styles.contestantInfo}>
                    <Text style={styles.contestantName}>{contestant.name}</Text>
                    <Text style={styles.contestantVotes}>
                      {contestant.votes.toLocaleString()} votes ({contestant.percentage}%)
                    </Text>
                  </View>
                  {contestant.isWinner && <Text style={styles.badge}>🏆</Text>}
                  {contestant.isEvicted && <Text style={styles.badge}>🚪</Text>}
                </View>
              ))}
          </View>
        </ScrollView>
      )}
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
    color: colors.light[100],
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.light[100],
  },
  subtitle: {
    fontSize: 14,
    color: colors.light[400],
  },
  episodeSelector: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  episodeButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.bg.tertiary,
    marginRight: 8,
  },
  episodeButtonActive: {
    backgroundColor: '#E8420A',
  },
  episodeButtonText: {
    color: colors.light[100],
    fontSize: 14,
    fontWeight: '500',
  },
  episodeButtonTextActive: {
    color: '#fff',
  },
  content: {
    padding: 24,
  },
  episodeInfo: {
    marginBottom: 24,
  },
  episodeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.light[100],
    marginBottom: 4,
  },
  episodeDate: {
    fontSize: 14,
    color: colors.light[400],
  },
  winnerCard: {
    backgroundColor: colors.bg.tertiary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  winnerLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 12,
  },
  winnerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  winnerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  winnerInfo: {
    flex: 1,
  },
  winnerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.light[100],
    marginBottom: 4,
  },
  winnerVotes: {
    fontSize: 14,
    color: colors.light[400],
  },
  evictedCard: {
    backgroundColor: colors.bg.tertiary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#EF4444',
  },
  evictedLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#EF4444',
    marginBottom: 12,
  },
  evictedContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  evictedAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
    opacity: 0.6,
  },
  evictedInfo: {
    flex: 1,
  },
  evictedName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.light[100],
    marginBottom: 4,
  },
  evictedVotes: {
    fontSize: 14,
    color: colors.light[400],
  },
  rankingsSection: {
    marginTop: 8,
  },
  rankingsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.light[100],
    marginBottom: 16,
  },
  contestantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.tertiary,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  contestantRowWinner: {
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  contestantRowEvicted: {
    borderWidth: 2,
    borderColor: '#EF4444',
    opacity: 0.7,
  },
  rankBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rankText: {
    color: colors.light[100],
    fontSize: 14,
    fontWeight: 'bold',
  },
  contestantAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  contestantInfo: {
    flex: 1,
  },
  contestantName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.light[100],
    marginBottom: 2,
  },
  contestantVotes: {
    fontSize: 12,
    color: colors.light[400],
  },
  badge: {
    fontSize: 24,
  },
});
