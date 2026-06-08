import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useColorScheme } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors, universeColors } from '@azeebo/design-tokens';
import { realityApi } from '../src/api/engagement';
import { walletApi } from '../src/api/wallet';
import { logger } from '../src/utils/logger';
import { LoadingState, EmptyState, ErrorState } from '../src/components/StateContainers';

const PLACEHOLDER_IMAGE = '';

interface VotePackage {
  id: string;
  votes: number;
  price: number;
  bonus?: number;
  label: string;
}

const votePackages: VotePackage[] = [
  { id: '1', votes: 10, price: 100, label: '10 Votes' },
  { id: '2', votes: 50, price: 450, bonus: 5, label: '50 Votes + 5 Bonus' },
  { id: '3', votes: 100, price: 850, bonus: 15, label: '100 Votes + 15 Bonus' },
  { id: '4', votes: 500, price: 4000, bonus: 100, label: '500 Votes + 100 Bonus' },
];

export default function VoteScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { showId } = useLocalSearchParams<{ showId: string }>();
  const isDark = colorScheme === 'dark';

  const [selectedContestant, setSelectedContestant] = useState<any | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<VotePackage>(votePackages[0]);
  const [quantity, setQuantity] = useState(1);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [voteSuccess, setVoteSuccess] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [contestants, setContestants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [showId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [contestantsRes, walletRes] = await Promise.all([
        realityApi.getContestants(showId || 'default'),
        walletApi.getBalance(),
      ]);
      
      if (contestantsRes.success && contestantsRes.data) {
        setContestants(contestantsRes.data);
      }
      
      if (walletRes.success && walletRes.data) {
        setWalletBalance(walletRes.data.balance);
      }
    } catch (err) {
      logger.error('Failed to load vote data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const totalVotes = selectedPackage.votes * quantity + (selectedPackage.bonus ? selectedPackage.bonus * quantity : 0);
  const totalPrice = selectedPackage.price * quantity;
  const canAfford = walletBalance >= totalPrice;

  const handleVote = () => {
    if (!canAfford) return;
    setShowConfirmation(true);
  };

  const confirmVote = async () => {
    try {
      const response = await realityApi.submitVote({
        showId: showId || 'default',
        contestantId: selectedContestant?.id,
        votes: totalVotes,
      });
      if (!response.success) {
        throw new Error(response.error?.message || 'Vote submission failed');
      }
      setShowConfirmation(false);
      setVoteSuccess(true);
      setTimeout(() => setVoteSuccess(false), 3000);
    } catch (err) {
      logger.error('Failed to submit vote:', err);
      Alert.alert('Error', 'Failed to submit vote. Please try again.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent, { backgroundColor: isDark ? colors.dark[900] : colors.light[50] }]}>
        <LoadingState text="Loading..." />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent, { backgroundColor: isDark ? colors.dark[900] : colors.light[50] }]}>
        <ErrorState title="Failed to load" description={error} onRetry={loadData} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? colors.dark[900] : colors.light[50] }]}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: isDark ? colors.text.primary : colors.dark[900] }]}>
            Vote
          </Text>
          <View style={styles.walletBadge}>
            <Text style={styles.walletIcon}>💰</Text>
            <Text style={styles.walletBalance}>{walletBalance.toLocaleString()}</Text>
          </View>
        </View>

        <View style={styles.showInfo}>
          <Text style={[styles.showTitle, { color: isDark ? colors.text.primary : colors.dark[900] }]}>
            Big Brother Naija Season 9
          </Text>
          <Text style={styles.votingEnds}>Voting ends in 2 days</Text>
        </View>

        <View style={styles.contestantsSection}>
          <Text style={[styles.sectionTitle, { color: isDark ? colors.text.primary : colors.dark[900] }]}>
            Choose Your Contestant
          </Text>
          <View style={styles.contestantsList}>
            {contestants.map((contestant) => (
              <TouchableOpacity
                key={contestant.id}
                style={[
                  styles.contestantCard,
                  { backgroundColor: isDark ? colors.dark[800] : colors.light[100] },
                  selectedContestant?.id === contestant.id && styles.contestantCardSelected,
                  contestant.eliminated && styles.contestantCardEliminated,
                ]}
                onPress={() => setSelectedContestant(contestant)}
                disabled={contestant.eliminated}
              >
                <View style={styles.rankBadge}>
                  <Text style={styles.rankText}>#{contestant.rank}</Text>
                </View>
                <Text style={styles.contestantAvatar}>{contestant.avatar}</Text>
                <View style={styles.contestantInfo}>
                  <Text style={[styles.contestantName, { color: isDark ? colors.text.primary : colors.dark[900] }]}>
                    {contestant.name}
                  </Text>
                  <Text style={styles.contestantDescription}>{contestant.description}</Text>
                  <Text style={styles.contestantVotes}>{contestant.votes.toLocaleString()} votes</Text>
                </View>
                {selectedContestant?.id === contestant.id && (
                  <View style={styles.selectedIndicator}>
                    <Text style={styles.selectedIcon}>✓</Text>
                  </View>
                )}
                {contestant.eliminated && (
                  <View style={styles.eliminatedOverlay}>
                    <Text style={styles.eliminatedText}>ELIMINATED</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {selectedContestant && (
          <View style={styles.voteSection}>
            <Text style={[styles.sectionTitle, { color: isDark ? colors.text.primary : colors.dark[900] }]}>
              Select Vote Package
            </Text>
            <View style={styles.packagesGrid}>
              {votePackages.map((pkg) => (
                <TouchableOpacity
                  key={pkg.id}
                  style={[
                    styles.packageCard,
                    { backgroundColor: isDark ? colors.dark[800] : colors.light[100] },
                    selectedPackage.id === pkg.id && styles.packageCardSelected,
                  ]}
                  onPress={() => setSelectedPackage(pkg)}
                >
                  <Text style={[styles.packageVotes, { color: isDark ? colors.text.primary : colors.dark[900] }]}>
                    {pkg.votes} Votes
                  </Text>
                  {pkg.bonus && (
                    <View style={styles.bonusBadge}>
                      <Text style={styles.bonusText}>+{pkg.bonus} Bonus</Text>
                    </View>
                  )}
                  <Text style={styles.packagePrice}>₦{pkg.price.toLocaleString()}</Text>
                  <Text style={styles.packageLabel}>{pkg.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.quantitySection}>
              <Text style={[styles.quantityLabel, { color: isDark ? colors.text.primary : colors.dark[900] }]}>
                Quantity
              </Text>
              <View style={styles.quantityControls}>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  <Text style={styles.quantityButtonText}>−</Text>
                </TouchableOpacity>
                <Text style={[styles.quantityValue, { color: isDark ? colors.text.primary : colors.dark[900] }]}>
                  {quantity}
                </Text>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => setQuantity(quantity + 1)}
                >
                  <Text style={styles.quantityButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={[styles.summaryCard, { backgroundColor: isDark ? colors.dark[800] : colors.light[100] }]}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Votes</Text>
                <Text style={[styles.summaryValue, { color: isDark ? colors.text.primary : colors.dark[900] }]}>
                  {totalVotes.toLocaleString()}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Price per package</Text>
                <Text style={styles.summaryPrice}>₦{selectedPackage.price.toLocaleString()}</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryTotalLabel, { color: isDark ? colors.text.primary : colors.dark[900] }]}>
                  Total
                </Text>
                <Text style={styles.summaryTotal}>₦{totalPrice.toLocaleString()}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.walletLabel}>Wallet Balance</Text>
                <Text style={[styles.walletValue, !canAfford && styles.walletInsufficient]}>
                  ₦{walletBalance.toLocaleString()}
                </Text>
              </View>
            </View>

            {!canAfford && (
              <TouchableOpacity
                style={styles.fundWalletButton}
                onPress={() => router.push('/(tabs)/wallet')}
              >
                <Text style={styles.fundWalletText}>Fund Wallet</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.voteButton,
                (!selectedContestant || !canAfford) && styles.voteButtonDisabled,
              ]}
              onPress={handleVote}
              disabled={!selectedContestant || !canAfford}
            >
              <Text style={styles.voteButtonText}>
                {selectedContestant ? 'Vote Now' : 'Select a Contestant'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <Modal visible={showConfirmation} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? colors.dark[800] : '#ffffff' }]}>
            <Text style={[styles.modalTitle, { color: isDark ? colors.text.primary : colors.dark[900] }]}>
              Confirm Your Vote
            </Text>

            <View style={styles.confirmDetails}>
              <View style={styles.confirmRow}>
                <Text style={styles.confirmLabel}>Contestant</Text>
                <Text style={[styles.confirmValue, { color: isDark ? colors.text.primary : colors.dark[900] }]}>
                  {selectedContestant?.name}
                </Text>
              </View>
              <View style={styles.confirmRow}>
                <Text style={styles.confirmLabel}>Votes</Text>
                <Text style={[styles.confirmValue, { color: isDark ? colors.text.primary : colors.dark[900] }]}>
                  {totalVotes.toLocaleString()}
                </Text>
              </View>
              <View style={styles.confirmRow}>
                <Text style={styles.confirmLabel}>Total Cost</Text>
                <Text style={[styles.confirmValue, { color: colors.primary[500] }]}>
                  ₦{totalPrice.toLocaleString()}
                </Text>
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowConfirmation(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmButton} onPress={confirmVote}>
                <Text style={styles.confirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={voteSuccess} transparent animationType="fade">
        <View style={styles.successOverlay}>
          <View style={styles.successContent}>
            <Text style={styles.successIcon}>✓</Text>
            <Text style={styles.successTitle}>Vote Successful!</Text>
            <Text style={styles.successMessage}>
              You voted for {selectedContestant?.name} with {totalVotes} votes
            </Text>
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
    paddingTop: 8,
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
    fontSize: 20,
    color: colors.text.primary,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  walletBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[500] + '20',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  walletIcon: {
    fontSize: 16,
  },
  walletBalance: {
    color: colors.primary[500],
    fontSize: 14,
    fontWeight: '700',
  },
  showInfo: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  showTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  votingEnds: {
    color: colors.text.secondary,
    fontSize: 14,
  },
  contestantsSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  contestantsList: {
    gap: 12,
  },
  contestantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    position: 'relative',
  },
  contestantCardSelected: {
    borderWidth: 2,
    borderColor: colors.primary[500],
  },
  contestantCardEliminated: {
    opacity: 0.5,
  },
  rankBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bg.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rankText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text.primary,
  },
  contestantAvatar: {
    fontSize: 36,
    marginRight: 12,
  },
  contestantInfo: {
    flex: 1,
  },
  contestantName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  contestantDescription: {
    fontSize: 13,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  contestantVotes: {
    fontSize: 12,
    color: colors.primary[500],
    fontWeight: '600',
  },
  selectedIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedIcon: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  eliminatedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eliminatedText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  voteSection: {
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  packagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  packageCard: {
    width: '47%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  packageCardSelected: {
    borderWidth: 2,
    borderColor: colors.primary[500],
  },
  packageVotes: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  bonusBadge: {
    backgroundColor: colors.success[500],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  bonusText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
  },
  packagePrice: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary[500],
    marginBottom: 4,
  },
  packageLabel: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  quantitySection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  quantityLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  quantityButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.bg.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButtonText: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text.primary,
  },
  quantityValue: {
    fontSize: 24,
    fontWeight: '700',
    minWidth: 40,
    textAlign: 'center',
  },
  summaryCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  summaryPrice: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: colors.bg.tertiary,
    marginVertical: 8,
  },
  summaryTotalLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  summaryTotal: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary[500],
  },
  walletLabel: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  walletValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.success[500],
  },
  walletInsufficient: {
    color: colors.error[500],
  },
  fundWalletButton: {
    backgroundColor: colors.primary[500],
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  fundWalletText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  voteButton: {
    backgroundColor: colors.primary[500],
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  voteButtonDisabled: {
    backgroundColor: colors.bg.tertiary,
  },
  voteButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 24,
  },
  confirmDetails: {
    marginBottom: 24,
  },
  confirmRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  confirmLabel: {
    fontSize: 15,
    color: colors.text.secondary,
  },
  confirmValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: colors.bg.secondary,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  successOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successContent: {
    backgroundColor: colors.success[500],
    padding: 32,
    borderRadius: 20,
    alignItems: 'center',
  },
  successIcon: {
    fontSize: 48,
    color: '#ffffff',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  successMessage: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
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