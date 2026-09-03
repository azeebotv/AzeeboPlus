import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useColorScheme } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors } from '../src/theme';
import { engagementApi, PredictionResult } from '../src/api/engagement';
import type { RealityShow } from '../src/types/api';
import { walletApi } from '../src/api/wallet';
import { apiClient } from '../src/api/client';
import { logger } from '../src/utils/logger';
import { LoadingState, ErrorState } from '../src/components/StateContainers';
import { analytics } from '../src/utils/analytics';

const leaderboardData = [
  { rank: 1, avatar: '👑', name: 'PredatorKing', points: 15000 },
  { rank: 2, avatar: '🦅', name: 'EagleEye', points: 12000 },
  { rank: 3, avatar: '🎯', name: 'SharpShooter', points: 10000 },
  { rank: 4, avatar: '🧠', name: 'BrainBox', points: 8500 },
  { rank: 5, avatar: '⭐', name: 'StarPlayer', points: 7200 },
];

export default function PredictionScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { predictionId } = useLocalSearchParams<{ predictionId: string }>();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [betAmount, setBetAmount] = useState(100);
  const [userPoints, setUserPoints] = useState(0);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [betSuccess, setBetSuccess] = useState(false);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [showData, setShowData] = useState<RealityShow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [predictionId]);

  const showName = showData?.name || '';

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [predictionRes, walletRes, showRes] = await Promise.all([
        engagementApi.getPredictionResults(predictionId || 'default'),
        walletApi.getBalance(),
        apiClient.get<RealityShow>('/v1/reality/shows/current').catch(() => null),
      ]);

      if (predictionRes.success && predictionRes.data) {
        setPrediction(predictionRes.data);
      }

      if (walletRes.success && walletRes.data) {
        setUserPoints(walletRes.data.balance);
      }

      if (showRes) {
        setShowData(
          Array.isArray(showRes)
            ? showRes[0]
            : ((showRes as unknown as { data?: unknown[] })?.data?.[0] ?? showRes)
        );
      }
    } catch (err) {
      logger.error('Failed to load prediction data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const predictionOptions = prediction?.options || [];
  const potentialWinnings = Math.floor(
    betAmount *
      parseFloat(
        predictionOptions.find((o) => o.id === selectedOption)?.percentage?.toString() || '1'
      )
  );

  const handlePlaceBet = () => {
    if (!selectedOption || userPoints < betAmount) return;
    setShowConfirmation(true);
  };

  const confirmBet = async () => {
    try {
      const response = await engagementApi.placeBet({
        predictionId: predictionId || 'default',
        optionId: selectedOption!,
        amount: betAmount,
      });
      if (!response.success) {
        throw new Error(response.error || 'Bet placement failed');
      }
      setUserPoints((prev) => prev - betAmount);
      setBetSuccess(true);
              analytics.realityPredictionSubmitted(showName, selectedOption || '');
      setTimeout(() => {
        setShowConfirmation(false);
        setBetSuccess(false);
        setSelectedOption(null);
        setBetAmount(100);
      }, 2000);
    } catch (err) {
      logger.error('Failed to place bet:', err);
      Alert.alert('Error', 'Failed to place bet. Please try again.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          styles.centerContent,
          { backgroundColor: colorScheme === 'dark' ? colors.bg.primary : '#FFFFFF' },
        ]}
      >
        <LoadingState text="Loading..." />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          styles.centerContent,
          { backgroundColor: colorScheme === 'dark' ? colors.bg.primary : '#FFFFFF' },
        ]}
      >
        <ErrorState title="Failed to load" description={error} onRetry={loadData} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={[
          styles.scrollView,
          { backgroundColor: colorScheme === 'dark' ? colors.bg.primary : '#FFFFFF' },
        ]}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text
            style={[
              styles.headerTitle,
              { color: colorScheme === 'dark' ? colors.text.primary : colors.bg.primary },
            ]}
          >
            Predict & Win
          </Text>
          <View style={styles.pointsBadge}>
            <Text style={styles.pointsIcon}>💰</Text>
            <Text style={styles.pointsText}>{userPoints.toLocaleString()}</Text>
          </View>
        </View>

        <View style={styles.predictionCard}>
          <View style={styles.predictionHeader}>
            <View style={styles.predictionIconContainer}>
              <Text style={styles.predictionIcon}>🎯</Text>
            </View>
            <View style={styles.predictionTitleContainer}>
              <Text
                style={[
                  styles.predictionTitle,
                  { color: colorScheme === 'dark' ? colors.text.primary : colors.bg.primary },
                ]}
              >
                Who will be evicted tonight?
              </Text>
              <Text style={styles.predictionMeta}>
                Ends in 2h 30m{showName ? ` • ${showName}` : ''}
              </Text>
            </View>
          </View>

          <View style={styles.rewardPreview}>
            <Text style={styles.rewardLabel}>🏆 Prize Pool</Text>
            <Text style={styles.rewardAmount}>500,000 Points</Text>
          </View>

          <View style={styles.optionsContainer}>
            {predictionOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionButton,
                  selectedOption === option.id && styles.optionButtonActive,
                ]}
                onPress={() => setSelectedOption(option.id)}
              >
                <View style={styles.optionAvatar}>
                  <Text style={styles.optionAvatarText}>{option.avatar}</Text>
                </View>
                <View style={styles.optionInfo}>
                  <Text
                    style={[
                      styles.optionLabel,
                      { color: colorScheme === 'dark' ? colors.text.primary : colors.bg.primary },
                    ]}
                  >
                    {option.label}
                  </Text>
                  <Text style={styles.optionOdds}>{option.odds}</Text>
                </View>
                {selectedOption === option.id && (
                  <View style={styles.checkmark}>
                    <Text style={styles.checkmarkText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.betSection}>
            <Text
              style={[
                styles.betLabel,
                { color: colorScheme === 'dark' ? colors.text.secondary : colors.dark[600] },
              ]}
            >
              Your Bet
            </Text>
            <View style={styles.betAmountSelector}>
              <TouchableOpacity
                style={styles.adjustButton}
                onPress={() => setBetAmount(Math.max(50, betAmount - 50))}
              >
                <Text style={styles.adjustButtonText}>-</Text>
              </TouchableOpacity>
              <Text
                style={[
                  styles.betAmountText,
                  { color: colorScheme === 'dark' ? colors.text.primary : colors.bg.primary },
                ]}
              >
                {betAmount} pts
              </Text>
              <TouchableOpacity
                style={styles.adjustButton}
                onPress={() => setBetAmount(betAmount + 50)}
              >
                <Text style={styles.adjustButtonText}>+</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.quickBets}>
              {[100, 500, 1000].map((amount) => (
                <TouchableOpacity
                  key={amount}
                  style={[
                    styles.quickBetButton,
                    betAmount === amount && styles.quickBetButtonActive,
                  ]}
                  onPress={() => setBetAmount(amount)}
                >
                  <Text
                    style={[styles.quickBetText, betAmount === amount && styles.quickBetTextActive]}
                  >
                    {amount}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {selectedOption && (
              <View style={styles.potentialWinnings}>
                <Text style={styles.potentialLabel}>Potential Winnings:</Text>
                <Text style={styles.potentialAmount}>{potentialWinnings.toLocaleString()} pts</Text>
              </View>
            )}

            {userPoints < betAmount && (
              <Text style={styles.insufficientPoints}>Insufficient points</Text>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.placeBetButton,
              (!selectedOption || userPoints < betAmount) && styles.placeBetButtonDisabled,
            ]}
            onPress={handlePlaceBet}
            disabled={!selectedOption || userPoints < betAmount}
          >
            <Text style={styles.placeBetText}>Place Bet</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.rulesSection}>
          <Text
            style={[
              styles.rulesTitle,
              { color: colorScheme === 'dark' ? colors.text.primary : colors.bg.primary },
            ]}
          >
            How It Works
          </Text>
          <View style={styles.ruleItem}>
            <Text style={styles.ruleNumber}>1</Text>
            <Text
              style={[
                styles.ruleText,
                { color: colorScheme === 'dark' ? colors.text.secondary : colors.dark[600] },
              ]}
            >
              Predict the outcome of live events
            </Text>
          </View>
          <View style={styles.ruleItem}>
            <Text style={styles.ruleNumber}>2</Text>
            <Text
              style={[
                styles.ruleText,
                { color: colorScheme === 'dark' ? colors.text.secondary : colors.dark[600] },
              ]}
            >
              Place your bet with points from your wallet
            </Text>
          </View>
          <View style={styles.ruleItem}>
            <Text style={styles.ruleNumber}>3</Text>
            <Text
              style={[
                styles.ruleText,
                { color: colorScheme === 'dark' ? colors.text.secondary : colors.dark[600] },
              ]}
            >
              Win multiplied points if your prediction is correct
            </Text>
          </View>
        </View>

        <View style={styles.leaderboardSection}>
          <View style={styles.sectionHeader}>
            <Text
              style={[
                styles.sectionTitle,
                { color: colorScheme === 'dark' ? colors.text.primary : colors.bg.primary },
              ]}
            >
              Leaderboard
            </Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.leaderboard}>
            {leaderboardData.map((entry) => (
              <View key={entry.rank} style={styles.leaderboardItem}>
                <View
                  style={[
                    styles.rank,
                    entry.rank === 1 && styles.rankGold,
                    entry.rank === 2 && styles.rankSilver,
                    entry.rank === 3 && styles.rankBronze,
                  ]}
                >
                  {entry.rank === 1
                    ? '🥇'
                    : entry.rank === 2
                      ? '🥈'
                      : entry.rank === 3
                        ? '🥉'
                        : entry.rank}
                </View>
                <Text style={styles.leaderboardAvatar}>{entry.avatar}</Text>
                <View style={styles.leaderboardInfo}>
                  <Text
                    style={[
                      styles.leaderboardName,
                      { color: colorScheme === 'dark' ? colors.text.primary : colors.bg.primary },
                    ]}
                  >
                    {entry.name}
                  </Text>
                </View>
                <Text style={styles.leaderboardPoints}>{entry.points.toLocaleString()}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <Modal visible={showConfirmation} transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {betSuccess ? (
              <View style={styles.successContent}>
                <Text style={styles.successIcon}>✅</Text>
                <Text
                  style={[
                    styles.successTitle,
                    { color: colorScheme === 'dark' ? colors.text.primary : colors.bg.primary },
                  ]}
                >
                  Bet Placed!
                </Text>
                <Text
                  style={[
                    styles.successMessage,
                    { color: colorScheme === 'dark' ? colors.text.secondary : colors.dark[600] },
                  ]}
                >
                  Good luck with your prediction!
                </Text>
              </View>
            ) : (
              <>
                <Text
                  style={[
                    styles.modalTitle,
                    { color: colorScheme === 'dark' ? colors.text.primary : colors.bg.primary },
                  ]}
                >
                  Confirm Bet
                </Text>
                <View style={styles.modalDetails}>
                  <Text
                    style={[
                      styles.modalDetailText,
                      { color: colorScheme === 'dark' ? colors.text.secondary : colors.dark[600] },
                    ]}
                  >
                    Prediction:{' '}
                    <Text style={styles.modalHighlight}>
                      {predictionOptions.find((o) => o.id === selectedOption)?.label}
                    </Text>
                  </Text>
                  <Text
                    style={[
                      styles.modalDetailText,
                      { color: colorScheme === 'dark' ? colors.text.secondary : colors.dark[600] },
                    ]}
                  >
                    Bet Amount:{' '}
                    <Text style={styles.modalHighlight}>{betAmount.toLocaleString()} pts</Text>
                  </Text>
                  <Text
                    style={[
                      styles.modalDetailText,
                      { color: colorScheme === 'dark' ? colors.text.secondary : colors.dark[600] },
                    ]}
                  >
                    Potential Winnings:{' '}
                    <Text style={styles.modalHighlight}>
                      {potentialWinnings.toLocaleString()} pts
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
                  <TouchableOpacity style={styles.modalConfirm} onPress={confirmBet}>
                    <Text style={styles.modalConfirmText}>Confirm</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 40,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bg.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    color: colors.text.primary,
    fontSize: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary[500],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  pointsIcon: {
    fontSize: 14,
  },
  pointsText: {
    color: colors.text.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  predictionCard: {
    margin: 16,
    backgroundColor: colors.bg.secondary,
    borderRadius: 16,
    padding: 20,
  },
  predictionHeader: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  predictionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  predictionIcon: {
    fontSize: 28,
  },
  predictionTitleContainer: {
    flex: 1,
  },
  predictionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  predictionMeta: {
    color: colors.text.secondary,
    fontSize: 12,
  },
  rewardPreview: {
    backgroundColor: colors.success[500],
    padding: 12,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  rewardLabel: {
    color: colors.text.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  rewardAmount: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: '700',
  },
  optionsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    backgroundColor: colors.bg.tertiary,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionButtonActive: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[500] + '20',
  },
  optionAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionAvatarText: {
    fontSize: 22,
  },
  optionInfo: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  optionOdds: {
    color: colors.primary[500],
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  betSection: {
    marginBottom: 20,
  },
  betLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  betAmountSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 12,
  },
  adjustButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.bg.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adjustButtonText: {
    color: colors.text.primary,
    fontSize: 24,
    fontWeight: '600',
  },
  betAmountText: {
    fontSize: 22,
    fontWeight: '700',
    minWidth: 100,
    textAlign: 'center',
  },
  quickBets: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginBottom: 12,
  },
  quickBetButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.bg.tertiary,
  },
  quickBetButtonActive: {
    backgroundColor: colors.primary[500],
  },
  quickBetText: {
    color: colors.text.secondary,
    fontSize: 14,
    fontWeight: '600',
  },
  quickBetTextActive: {
    color: colors.text.primary,
  },
  potentialWinnings: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  potentialLabel: {
    color: colors.text.secondary,
    fontSize: 12,
    marginBottom: 4,
  },
  potentialAmount: {
    color: colors.success[500],
    fontSize: 20,
    fontWeight: '700',
  },
  insufficientPoints: {
    color: colors.error[500],
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
  placeBetButton: {
    backgroundColor: colors.primary[500],
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  placeBetButtonDisabled: {
    backgroundColor: colors.bg.tertiary,
  },
  placeBetText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  rulesSection: {
    margin: 16,
    marginTop: 0,
    backgroundColor: colors.bg.secondary,
    borderRadius: 16,
    padding: 20,
  },
  rulesTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  ruleNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary[500],
    color: colors.text.primary,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 24,
  },
  ruleText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  leaderboardSection: {
    margin: 16,
    marginTop: 0,
    backgroundColor: colors.bg.secondary,
    borderRadius: 16,
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  seeAllText: {
    color: colors.primary[500],
    fontSize: 14,
    fontWeight: '500',
  },
  leaderboard: {
    gap: 12,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
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
  rankGold: {
    backgroundColor: colors.accent.gold,
  },
  rankSilver: {
    backgroundColor: colors.accent.silver,
  },
  rankBronze: {
    backgroundColor: colors.accent.bronze,
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
  },
  leaderboardPoints: {
    color: colors.primary[500],
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: colors.bg.secondary,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 350,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  modalDetails: {
    marginBottom: 20,
  },
  modalDetailText: {
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalHighlight: {
    color: colors.primary[500],
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
    color: colors.text.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  modalConfirm: {
    flex: 2,
    backgroundColor: colors.primary[500],
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalConfirmText: {
    color: colors.text.primary,
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
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  successMessage: {
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
