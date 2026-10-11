import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
  Alert,
  Linking,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { contentApi } from '@azeebo/react-data';
import { logger } from '@azeebo/react-data/utils/logger';
import { colors } from '../../src/theme';
import { brand } from '@azeebo/design-tokens';

interface Contestant {
  id: string;
  name: string;
  age: number;
  location: string;
  bio: string;
  avatar: string;
  coverImage: string;
  socialLinks: {
    instagram?: string;
    twitter?: string;
    tiktok?: string;
  };
  stats: {
    votes: number;
    rank: number;
    episodes: number;
  };
  isFavorite: boolean;
}

export default function ContestantProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const contestantId = params.id as string;

  const [contestant, setContestant] = useState<Contestant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVoting, setIsVoting] = useState(false);

  useEffect(() => {
    loadContestant();
  }, [contestantId]);

  const loadContestant = async () => {
    try {
      const response = await contentApi.getContestant(contestantId);

      if (response.success && response.data) {
        // Map API Contestant to UI Contestant interface
        setContestant({
          id: response.data.id,
          name: response.data.name,
          age: 0,
          location: '',
          bio: response.data.description || '',
          avatar: response.data.avatar,
          coverImage: '',
          socialLinks: {},
          stats: {
            votes: response.data.votes,
            rank: response.data.rank,
            episodes: 0,
          },
          isFavorite: false,
        });
      }
    } catch (error) {
      logger.error('Failed to load contestant', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVote = async () => {
    if (!contestant) return;

    Alert.alert('Vote for Contestant', `Would you like to vote for ${contestant.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Regular Vote',
        onPress: () => submitVote(false),
      },
      {
        text: 'Super Vote (2x)',
        onPress: () => submitVote(true),
      },
    ]);
  };

  const submitVote = async (isSuper: boolean) => {
    setIsVoting(true);
    try {
      await contentApi.vote({
        contestantId,
        isSuperVote: isSuper,
      });

      Alert.alert(
        'Success',
        `Your ${isSuper ? 'Super ' : ''}vote for ${contestant?.name} has been submitted!`
      );
      loadContestant();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to submit vote';
      Alert.alert('Error', message);
    } finally {
      setIsVoting(false);
    }
  };

  const handleSocialLink = (url: string | undefined) => {
    if (url) {
      Linking.openURL(url);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={brand.flame} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!contestant) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Contestant not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.coverContainer}>
          <Image source={{ uri: contestant.coverImage }} style={styles.coverImage} />
          <TouchableOpacity style={styles.backButtonAbsolute} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.profileContainer}>
          <Image source={{ uri: contestant.avatar }} style={styles.avatar} />

          <View style={styles.header}>
            <Text style={styles.name}>{contestant.name}</Text>
            <Text style={styles.location}>
              📍 {contestant.location} • Age {contestant.age}
            </Text>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{contestant.stats.votes.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Votes</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>#{contestant.stats.rank}</Text>
              <Text style={styles.statLabel}>Rank</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{contestant.stats.episodes}</Text>
              <Text style={styles.statLabel}>Episodes</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.voteButton, isVoting && styles.voteButtonDisabled]}
            onPress={handleVote}
            disabled={isVoting}
          >
            {isVoting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.voteButtonText}>🗳 Vote for {contestant.name}</Text>
            )}
          </TouchableOpacity>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.bio}>{contestant.bio}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Social Media</Text>
            <View style={styles.socialLinks}>
              {contestant.socialLinks.instagram && (
                <TouchableOpacity
                  style={styles.socialButton}
                  onPress={() => handleSocialLink(contestant.socialLinks.instagram)}
                >
                  <Text style={styles.socialButtonText}>📷 Instagram</Text>
                </TouchableOpacity>
              )}
              {contestant.socialLinks.twitter && (
                <TouchableOpacity
                  style={styles.socialButton}
                  onPress={() => handleSocialLink(contestant.socialLinks.twitter)}
                >
                  <Text style={styles.socialButtonText}>🐦 Twitter</Text>
                </TouchableOpacity>
              )}
              {contestant.socialLinks.tiktok && (
                <TouchableOpacity
                  style={styles.socialButton}
                  onPress={() => handleSocialLink(contestant.socialLinks.tiktok)}
                >
                  <Text style={styles.socialButtonText}>🎵 TikTok</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
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
    backgroundColor: brand.flame,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  coverContainer: {
    height: 200,
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  backButtonAbsolute: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileContainer: {
    marginTop: -50,
    backgroundColor: '#1A0A0A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.2)',
    marginTop: -50,
  },
  header: {
    marginTop: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.light[100],
  },
  location: {
    fontSize: 14,
    color: colors.light[400],
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.bg.tertiary,
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: brand.flame,
  },
  statLabel: {
    fontSize: 12,
    color: colors.light[400],
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  voteButton: {
    backgroundColor: brand.flame,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  voteButtonDisabled: {
    opacity: 0.6,
  },
  voteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.light[100],
    marginBottom: 12,
  },
  bio: {
    fontSize: 14,
    color: colors.light[400],
    lineHeight: 22,
  },
  socialLinks: {
    gap: 8,
  },
  socialButton: {
    backgroundColor: colors.bg.tertiary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  socialButtonText: {
    color: colors.light[100],
    fontSize: 14,
    fontWeight: '500',
  },
});
