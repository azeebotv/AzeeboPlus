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
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { contentApi, walletApi } from '../../src/api';
import { logger } from '../../src/utils/logger';
import { analytics } from '../../src/utils/analytics';
import { LoadingState, ErrorState } from '../../src/components/StateContainers';
import { getVotePackages } from '../../src/config/prices';
import type { VotePackage } from '../../src/types/api';

interface Contestant {
  id: string;
  name: string;
  avatar: string;
  votes: number;
  rank: number;
}

export default function SuperVoteScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const episodeId = params.episodeId as string;

  const [contestants, setContestants] = useState<Contestant[]>([]);
  const [selectedContestant, setSelectedContestant] = useState<string | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);

  const [votePackages, setVotePackages] = useState<VotePackage[]>([]);

  useEffect(() => {
    loadData();
    getVotePackages('superVote').then((pkgs) => setVotePackages(pkgs)).catch(() => {});
  }, [episodeId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [contestantsResponse, walletResponse] = await Promise.all([
        contentApi.getContestants(episodeId),
        walletApi.getBalance(),
      ]);

      if (contestantsResponse.success && contestantsResponse.data) {
        setContestants(contestantsResponse.data);
      }

      if (walletResponse.success && walletResponse.data) {
        setWalletBalance(walletResponse.data.balance);
      }
    } catch (err) {
      logger.error('Failed to load data', err);
      setError('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVote = async () => {
    if (!selectedContestant || !selectedPackage) {
      Alert.alert('Error', 'Please select a contestant and vote package');
      return;
    }

    const package_ = votePackages.find((p) => p.id === selectedPackage);
    if (!package_) return;

    if (walletBalance < package_.price) {
      Alert.alert(
        'Insufficient Balance',
        `You need ₦${package_.price.toLocaleString()} but your balance is ₦${walletBalance.toLocaleString()}. Please add funds to your wallet.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Add Funds',
            onPress: () => router.push('/(tabs)/wallet/add-funds'),
          },
        ]
      );
      return;
    }

    Alert.alert(
      'Confirm Super Vote',
      `Purchase ${package_.votes} Super Vote(s) for ₦${package_.price.toLocaleString()} and vote for ${contestants.find((c) => c.id === selectedContestant)?.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => submitVote(package_),
        },
      ]
    );
  };

  const submitVote = async (package_: VotePackage) => {
    setIsVoting(true);
    try {
      await contentApi.superVote({
        contestantId: selectedContestant!,
        episodeId,
        voteCount: package_.votes,
      });

      try {
        analytics.realitySupervoteCreated(
          episodeId,
          selectedContestant!,
          package_.votes,
          package_.price
        );
      } catch {}

      Alert.alert(
        'Success!',
        `Your ${package_.votes} Super Vote(s) have been submitted! Each vote counts as 2x.`,
        [
          {
            text: 'OK',
            onPress: () => {
              setSelectedContestant(null);
              setSelectedPackage(null);
              loadData();
            },
          },
        ]
      );
    } catch (error: unknown) {
      Alert.alert(
        'Error',
        (error instanceof Error ? error.message : null) || 'Failed to submit super vote'
      );
    } finally {
      setIsVoting(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <LoadingState text="Loading..." />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ErrorState title="Failed to load" description={error} onRetry={loadData} />
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
          <Text style={styles.title}>Super Vote</Text>
          <Text style={styles.subtitle}>2x Voting Power</Text>
        </View>
        <View style={styles.balanceContainer}>
          <Text style={styles.balanceLabel}>Balance</Text>
          <Text style={styles.balanceValue}>₦{walletBalance.toLocaleString()}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Contestant</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {contestants.map((contestant) => (
              <TouchableOpacity
                key={contestant.id}
                style={[
                  styles.contestantCard,
                  selectedContestant === contestant.id && styles.contestantCardSelected,
                ]}
                onPress={() => setSelectedContestant(contestant.id)}
              >
                <Image source={{ uri: contestant.avatar }} style={styles.contestantAvatar} />
                <Text style={styles.contestantName}>{contestant.name}</Text>
                <Text style={styles.contestantRank}>
                  Rank #{contestant.rank} • {contestant.votes.toLocaleString()} votes
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Vote Package</Text>
          {votePackages.map((package_) => (
            <TouchableOpacity
              key={package_.id}
              style={[
                styles.packageCard,
                selectedPackage === package_.id && styles.packageCardSelected,
                package_.isPopular && styles.packageCardPopular,
              ]}
              onPress={() => setSelectedPackage(package_.id)}
            >
              {package_.isPopular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularText}>Most Popular</Text>
                </View>
              )}
              <View style={styles.packageHeader}>
                <View>
                  <Text style={styles.packageName}>{package_.name}</Text>
                  <Text style={styles.packageDescription}>{package_.description}</Text>
                </View>
                <Text style={styles.packagePrice}>₦{package_.price.toLocaleString()}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.voteButton,
              (!selectedContestant || !selectedPackage || isVoting) && styles.voteButtonDisabled,
            ]}
            onPress={handleVote}
            disabled={!selectedContestant || !selectedPackage || isVoting}
          >
            {isVoting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.voteButtonText}>🗳 Submit Super Vote</Text>
            )}
          </TouchableOpacity>
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
    color: '#9CA3AF',
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
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
    color: '#E8420A',
  },
  balanceContainer: {
    alignItems: 'flex-end',
  },
  balanceLabel: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  balanceValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F3F4F6',
  },
  section: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F3F4F6',
    marginBottom: 16,
  },
  contestantCard: {
    width: 140,
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  contestantCardSelected: {
    borderColor: '#E8420A',
  },
  contestantAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 8,
  },
  contestantName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F3F4F6',
    marginBottom: 4,
  },
  contestantRank: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  packageCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  packageCardSelected: {
    borderColor: '#E8420A',
  },
  packageCardPopular: {
    borderColor: '#E8420A',
    backgroundColor: '#2d1f5e',
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    right: 12,
    backgroundColor: '#E8420A',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  packageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  packageName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F3F4F6',
    marginBottom: 4,
  },
  packageDescription: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  packagePrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E8420A',
  },
  footer: {
    padding: 24,
    paddingBottom: 32,
  },
  voteButton: {
    backgroundColor: '#E8420A',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  voteButtonDisabled: {
    opacity: 0.5,
  },
  voteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
