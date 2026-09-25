import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useColorScheme } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { realityApi } from '@azeebo/react-data/api/engagement';
import { walletApi } from '@azeebo/react-data/api/wallet';
import { apiClient } from '@azeebo/react-data/api/client';
import { logger } from '@azeebo/react-data/utils/logger';
import { ApiResponse } from '@azeebo/react-data/types/api';
import { defaultImages, colors } from '../../src/theme';

const PLACEHOLDER_IMAGE = defaultImages.thumbnail;

interface ShowData {
  id: string;
  name: string;
  subtitle?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  viewerCount?: number;
  status?: string;
}

interface ShowContestant {
  id: string;
  name: string;
  avatar: string;
  votes: number;
  status: string;
}

export default function RealityShowScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { showId } = useLocalSearchParams<{ showId: string }>();
  const [selectedContestant, setSelectedContestant] = useState<string | null>(null);
  const [voteAmount, setVoteAmount] = useState(1);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [voteSuccess, setVoteSuccess] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [totalVotes, setTotalVotes] = useState(0);
  const [contestants, setContestants] = useState<ShowContestant[]>([]);
  const [showData, setShowData] = useState<ShowData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [showId]);

  const showName = showData?.name || 'Reality Show';
  const heroTitle = showData?.heroTitle || showData?.subtitle || '';
  const heroSubtitle = showData?.heroSubtitle || '';
  const viewerCount = showData?.viewerCount ? `${showData.viewerCount} watching` : '';

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [contestantsRes, walletRes, showRes] = await Promise.all([
        realityApi.getContestants(showId || 'default'),
        walletApi.getBalance(),
        apiClient
          .get<ShowData[] | ApiResponse<ShowData[]>>('/v1/reality/shows/current')
          .catch(() => null),
      ]);

      if (contestantsRes.success && contestantsRes.data) {
        setContestants(contestantsRes.data as unknown as ShowContestant[]);
        setTotalVotes(
          contestantsRes.data.reduce(
            (sum: number, c: { votes?: number }) => sum + (c.votes || 0),
            0
          )
        );
      }

      if (walletRes.success && walletRes.data) {
        setWalletBalance(walletRes.data.balance);
      }

      if (showRes) {
        setShowData(
          (Array.isArray(showRes)
            ? showRes[0]
            : (showRes?.data?.[0] ?? showRes)) as unknown as ShowData
        );
      }
    } catch (err) {
      logger.error('Failed to load reality show data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const voteCost = voteAmount * 100;

  const handleVote = () => {
    if (!selectedContestant || walletBalance < voteCost) return;
    setShowConfirmation(true);
  };

  const confirmVote = async () => {
    try {
      const response = await realityApi.submitVote({
        showId: showId || 'default',
        contestantId: selectedContestant,
        votes: voteAmount,
      });
      if (!response.success) {
        throw new Error(response.error || 'Vote submission failed');
      }
      setWalletBalance((prev) => prev - voteCost);
      const contestant = contestants.find((c) => c.id === selectedContestant);
      if (contestant) {
        contestant.votes += voteAmount;
        setTotalVotes((prev) => prev + voteAmount);
      }
      setVoteSuccess(true);
      setTimeout(() => {
        setShowConfirmation(false);
        setVoteSuccess(false);
        setSelectedContestant(null);
        setVoteAmount(1);
      }, 2000);
    } catch (err) {
      logger.error('Failed to submit vote:', err);
      Alert.alert('Error', 'Failed to submit vote. Please try again.');
    }
  };

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          styles.centerContent,
          { backgroundColor: colorScheme === 'dark' ? '#1A0A0A' : '#ffffff' },
        ]}
      >
        <ActivityIndicator size="large" color="#E8420A" />
        <Text
          style={[styles.loadingText, { color: colorScheme === 'dark' ? '#ffffff' : '#1A0A0A' }]}
        >
          Loading...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View
        style={[
          styles.container,
          styles.centerContent,
          { backgroundColor: colorScheme === 'dark' ? '#1A0A0A' : '#ffffff' },
        ]}
      >
        <Text style={[styles.errorText, { color: '#ef4444' }]}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={[
        styles.container,
        { backgroundColor: colorScheme === 'dark' ? '#1A0A0A' : '#ffffff' },
      ]}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text
          style={[styles.headerTitle, { color: colorScheme === 'dark' ? '#ffffff' : '#1A0A0A' }]}
        >
          {showName}
        </Text>
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      </View>

      <View style={styles.heroSection}>
        <Image source={{ uri: PLACEHOLDER_IMAGE }} style={styles.heroImage} />
        <View style={styles.heroOverlay}>
          {heroTitle ? <Text style={styles.heroTitle}>{heroTitle}</Text> : null}
          {heroSubtitle ? <Text style={styles.heroSubtitle}>{heroSubtitle}</Text> : null}
        </View>
        {viewerCount ? (
          <View style={styles.viewerCount}>
            <Text style={styles.viewerIcon}>👥</Text>
            <Text style={styles.viewerText}>{viewerCount}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.walletBar}>
        <View style={styles.walletInfo}>
          <Text style={styles.walletLabel}>Wallet Balance</Text>
          <Text style={styles.walletAmount}>₦{walletBalance.toLocaleString()}</Text>
        </View>
        <TouchableOpacity style={styles.fundButton}>
          <Text style={styles.fundText}>Fund Wallet</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.voteSection}>
        <Text
          style={[styles.sectionTitle, { color: colorScheme === 'dark' ? '#ffffff' : '#1A0A0A' }]}
        >
          Vote to Save
        </Text>

        <View style={styles.voteAmountSelector}>
          <TouchableOpacity
            style={[styles.voteButton, voteAmount > 1 && { backgroundColor: '#E8420A' }]}
            onPress={() => setVoteAmount(Math.max(1, voteAmount - 1))}
          >
            <Text style={[styles.voteButtonText, voteAmount > 1 && { color: '#ffffff' }]}>-</Text>
          </TouchableOpacity>
          <Text
            style={[
              styles.voteAmountText,
              { color: colorScheme === 'dark' ? '#ffffff' : '#1A0A0A' },
            ]}
          >
            {voteAmount} Vote{voteAmount > 1 ? 's' : ''}
          </Text>
          <TouchableOpacity
            style={[styles.voteButton, { backgroundColor: '#E8420A' }]}
            onPress={() => setVoteAmount(voteAmount + 1)}
          >
            <Text style={styles.voteButtonText}>+</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.priceInfo}>
          <Text style={styles.priceText}>
            Total: <Text style={styles.priceAmount}>₦{voteCost}</Text>
          </Text>
          {walletBalance < voteCost && (
            <Text style={styles.insufficientFunds}>Insufficient funds</Text>
          )}
        </View>

        <View style={styles.contestantsGrid}>
          {contestants.map((contestant) => (
            <TouchableOpacity
              key={contestant.id}
              onPress={() => contestant.status === 'active' && setSelectedContestant(contestant.id)}
              style={[
                styles.contestantCard,
                contestant.status === 'evicted' && { opacity: 0.5 },
                selectedContestant === contestant.id && { borderColor: '#E8420A', borderWidth: 2 },
              ]}
            >
              <View
                style={[
                  styles.contestantAvatar,
                  contestant.status !== 'evicted' && { backgroundColor: '#E8420A' },
                ]}
              >
                <Text style={styles.avatarText}>{contestant.avatar}</Text>
              </View>
              <Text
                style={[
                  styles.contestantName,
                  { color: colorScheme === 'dark' ? '#ffffff' : '#1A0A0A' },
                ]}
              >
                {contestant.name}
              </Text>
              {contestant.status === 'evicted' ? (
                <Text style={styles.evictedBadge}>Evicted</Text>
              ) : (
                <Text style={styles.voteCount}>{(contestant.votes / 1000).toFixed(0)}K</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          onPress={handleVote}
          disabled={!selectedContestant || walletBalance < voteCost}
          style={[
            styles.submitVoteButton,
            !selectedContestant && { backgroundColor: colors.bg.tertiary },
          ]}
        >
          <Text style={styles.submitVoteText}>Confirm Vote</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.leaderboardSection}>
        <Text
          style={[styles.sectionTitle, { color: colorScheme === 'dark' ? '#ffffff' : '#1A0A0A' }]}
        >
          Vote Leaderboard
        </Text>
        <View style={styles.leaderboard}>
          {contestants
            .filter((c) => c.status === 'active')
            .sort((a, b) => b.votes - a.votes)
            .map((contestant, index) => (
              <View key={contestant.id} style={styles.leaderboardItem}>
                <View style={[styles.rank, index < 3 && styles.topRank]}>
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                </View>
                <Text style={styles.leaderboardAvatar}>{contestant.avatar}</Text>
                <View style={styles.leaderboardInfo}>
                  <Text
                    style={[
                      styles.leaderboardName,
                      { color: colorScheme === 'dark' ? '#ffffff' : '#1A0A0A' },
                    ]}
                  >
                    {contestant.name}
                  </Text>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${(contestant.votes / totalVotes) * 100}%` },
                      ]}
                    />
                  </View>
                </View>
                <Text style={styles.leaderboardVotes}>{(contestant.votes / 1000).toFixed(0)}K</Text>
              </View>
            ))}
        </View>
      </View>

      <View style={styles.predictionSection}>
        <Text
          style={[styles.sectionTitle, { color: colorScheme === 'dark' ? '#ffffff' : '#1A0A0A' }]}
        >
          Predictions
        </Text>
        <TouchableOpacity style={styles.predictionCard} onPress={() => router.push('/prediction')}>
          <Text
            style={[
              styles.predictionTitle,
              { color: colorScheme === 'dark' ? '#ffffff' : '#1A0A0A' },
            ]}
          >
            Who will be evicted tonight?
          </Text>
          <View style={styles.predictionOptions}>
            {contestants
              .filter((c) => c.status === 'active')
              .slice(0, 4)
              .map((contestant) => (
                <TouchableOpacity key={contestant.id} style={styles.predictionOption}>
                  <Text style={styles.predictionAvatar}>{contestant.avatar}</Text>
                  <Text
                    style={[
                      styles.predictionName,
                      { color: colorScheme === 'dark' ? '#ffffff' : '#1A0A0A' },
                    ]}
                  >
                    {contestant.name}
                  </Text>
                </TouchableOpacity>
              ))}
          </View>
          <Text style={styles.predictionHint}>Tap to predict →</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showConfirmation} transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {voteSuccess ? (
              <View style={styles.successContent}>
                <Text style={styles.successIcon}>✅</Text>
                <Text style={styles.successTitle}>Vote Successful!</Text>
                <Text style={styles.successMessage}>
                  Your {voteAmount} vote{voteAmount > 1 ? 's' : ''} for{' '}
                  {contestants.find((c) => c.id === selectedContestant)?.name} have been counted.
                </Text>
              </View>
            ) : (
              <>
                <Text style={styles.modalTitle}>Confirm Vote</Text>
                <View style={styles.modalDetails}>
                  <Text style={styles.modalDetailText}>
                    You are voting{' '}
                    <Text style={styles.modalHighlight}>
                      {voteAmount} time{voteAmount > 1 ? 's' : ''}
                    </Text>{' '}
                    for{' '}
                    <Text style={styles.modalHighlight}>
                      {contestants.find((c) => c.id === selectedContestant)?.name}
                    </Text>
                  </Text>
                  <Text style={styles.modalDetailText}>
                    Total cost: <Text style={styles.modalHighlight}>₦{voteCost}</Text>
                  </Text>
                  <Text style={styles.modalDetailText}>
                    Wallet balance after:{' '}
                    <Text style={styles.modalHighlight}>
                      ₦{(walletBalance - voteCost).toLocaleString()}
                    </Text>
                  </Text>
                </View>
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.modalCancel}
                    onPress={() => setShowConfirmation(false)}
                  >
                    <Text style={styles.modalCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.modalConfirm} onPress={confirmVote}>
                    <Text style={styles.modalConfirmText}>Confirm</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 40,
    backgroundColor: '#1a1a1a',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bg.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    color: '#fff',
    fontSize: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ffffff',
  },
  liveText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  heroSection: {
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: 225,
    resizeMode: 'cover',
  },
  heroOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  heroTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  heroSubtitle: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.8,
  },
  viewerCount: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  viewerIcon: {
    fontSize: 14,
  },
  viewerText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  walletBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: colors.bg.tertiary,
  },
  walletInfo: {
    flex: 1,
  },
  walletLabel: {
    color: colors.text.secondary,
    fontSize: 12,
    marginBottom: 4,
  },
  walletAmount: {
    color: '#E8420A',
    fontSize: 20,
    fontWeight: '700',
  },
  fundButton: {
    backgroundColor: '#E8420A',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  fundText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  voteSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  voteAmountSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 12,
  },
  voteButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  voteButtonText: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text.tertiary,
  },
  voteAmountText: {
    fontSize: 20,
    fontWeight: '700',
    minWidth: 100,
    textAlign: 'center',
  },
  priceInfo: {
    textAlign: 'center',
    marginBottom: 20,
  },
  priceText: {
    color: colors.text.secondary,
    fontSize: 14,
  },
  priceAmount: {
    color: '#E8420A',
    fontWeight: '700',
  },
  insufficientFunds: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
  },
  contestantsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  contestantCard: {
    width: '30%',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  contestantAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.neutral[300],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  avatarText: {
    fontSize: 24,
  },
  contestantName: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  evictedBadge: {
    fontSize: 11,
    color: '#EF4444',
    fontWeight: '600',
  },
  voteCount: {
    fontSize: 12,
    color: '#E8420A',
    fontWeight: '600',
  },
  submitVoteButton: {
    backgroundColor: '#E8420A',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitVoteText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  leaderboardSection: {
    padding: 16,
    paddingTop: 0,
  },
  leaderboard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    overflow: 'hidden',
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.bg.tertiary,
  },
  rank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.bg.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 12,
  },
  topRank: {
    backgroundColor: '#E8420A',
    color: '#fff',
  },
  leaderboardAvatar: {
    fontSize: 24,
    marginRight: 12,
  },
  leaderboardInfo: {
    flex: 1,
  },
  leaderboardName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.bg.tertiary,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#E8420A',
    borderRadius: 2,
  },
  leaderboardVotes: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E8420A',
  },
  predictionSection: {
    padding: 16,
    paddingTop: 0,
  },
  predictionCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
  },
  predictionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  predictionOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  predictionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
    backgroundColor: colors.bg.tertiary,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.neutral[800],
  },
  predictionAvatar: {
    fontSize: 20,
  },
  predictionName: {
    fontSize: 13,
    fontWeight: '500',
  },
  predictionHint: {
    color: '#E8420A',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'right',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 350,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  modalDetails: {
    marginBottom: 20,
  },
  modalDetailText: {
    color: colors.neutral[400],
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalHighlight: {
    color: '#E8420A',
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancel: {
    flex: 1,
    backgroundColor: colors.bg.tertiary,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  modalConfirm: {
    flex: 2,
    backgroundColor: '#E8420A',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalConfirmText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  successContent: {
    alignItems: 'center',
  },
  successIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  successTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  successMessage: {
    color: colors.neutral[400],
    fontSize: 14,
    textAlign: 'center',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#E8420A',
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
