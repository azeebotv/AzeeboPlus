import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  useColorScheme,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { realityApi } from '../../../src/api';
import type { RealityShow, RealityContestant } from '../../../src/api/engagement';
import { LoadingState, ErrorState } from '../../../src/components/StateContainers';
import { useWallet } from '../../../src/contexts/WalletContext';
import { votePackages as defaultVotePackages } from '../../../src/config/prices';

const VOTE_PACKAGES = defaultVotePackages.reality;

export default function RealityShowDetailPage() {
  const router = useRouter();
  const { showId } = useLocalSearchParams<{ showId: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { wallet } = useWallet();

  const [show, setShow] = useState<RealityShow | null>(null);
  const [contestants, setContestants] = useState<RealityContestant[]>([]);
  const [selectedContestant, setSelectedContestant] = useState<RealityContestant | null>(null);
  const [selectedPackage, setSelectedPackage] = useState(VOTE_PACKAGES[0]);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showVoting, setShowVoting] = useState(false);

  const walletBalance = wallet?.balance || 0;
  const totalVotes = selectedPackage.votes * quantity;
  const totalPrice = selectedPackage.price * quantity;
  const canAfford = walletBalance >= totalPrice;

  const loadShowData = useCallback(async () => {
    if (!showId) return;
    setIsLoading(true);
    setError(null);

    try {
      const [showRes, contestantsRes] = await Promise.all([
        realityApi.getShowDetails(showId),
        realityApi.getContestants(showId),
      ]);

      if (showRes.success && showRes.data) {
        setShow(showRes.data);
      }

      if (contestantsRes.success && contestantsRes.data) {
        setContestants(contestantsRes.data);
      }
    } catch (err) {
      setError('Failed to load show data');
    } finally {
      setIsLoading(false);
    }
  }, [showId]);

  useEffect(() => {
    loadShowData();
  }, [loadShowData]);

  const handleVote = async () => {
    if (!selectedContestant || !canAfford || !showId) return;
    setIsSubmitting(true);
    try {
      const response = await realityApi.submitVote({
        showId,
        contestantId: selectedContestant.id,
        votes: totalVotes,
      });
      if (response.success) {
        Alert.alert(
          'Vote Submitted!',
          `You voted ${totalVotes} times for ${selectedContestant.name}!`,
          [
            {
              text: 'Continue Voting',
              onPress: () => {
                setSelectedContestant(null);
                setQuantity(1);
              },
            },
            { text: 'Done', onPress: () => setShowVoting(false) },
          ]
        );
      } else {
        throw new Error(response.message || 'Vote submission failed');
      }
    } catch (err) {
      Alert.alert('Vote Failed', err instanceof Error ? err.message : 'Failed to submit vote');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingState text="Loading show..." />;
  }

  if (error || !show) {
    return (
      <ErrorState
        title="Failed to load"
        description={error || 'Show not found'}
        onRetry={loadShowData}
      />
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#1A0A0A' : '#ffffff' }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.showTitle}>{show.title}</Text>
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>{show.status.toUpperCase()}</Text>
          </View>
        </View>
      </View>

      <View style={styles.videoPlaceholder}>
        <Text style={styles.playIcon}>▶️</Text>
        <Text style={styles.streamLabel}>Stream Available</Text>
        {show.viewerCount > 0 && (
          <View style={styles.viewerBadge}>
            <Text style={styles.viewerIcon}>👁️</Text>
            <Text style={styles.viewerCount}>{show.viewerCount}</Text>
          </View>
        )}
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.infoSection}>
          <Text style={[styles.description, { color: isDark ? '#ccc' : '#666' }]}>
            {show.description}
          </Text>
          <View style={styles.statsRow}>
            <Text style={[styles.statLabel, { color: isDark ? '#888' : '#999' }]}>
              Season {show.seasonNumber}
            </Text>
            <Text style={[styles.statLabel, { color: isDark ? '#888' : '#999' }]}>
              Episode {show.episodeNumber}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>
            Contestants ({contestants.length})
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.contestantsScroll}
          >
            {contestants.map((contestant) => (
              <TouchableOpacity
                key={contestant.id}
                style={[
                  styles.contestantCard,
                  selectedContestant?.id === contestant.id && styles.contestantCardSelected,
                ]}
                onPress={() => setSelectedContestant(contestant)}
              >
                <View style={styles.contestantAvatar}>
                  <Text style={styles.contestantInitial}>{contestant.name[0]}</Text>
                </View>
                <Text style={[styles.contestantName, { color: isDark ? '#fff' : '#000' }]}>
                  {contestant.name}
                </Text>
                {contestant.votes > 0 && (
                  <Text style={styles.voteCount}>{contestant.votes} votes</Text>
                )}
                {selectedContestant?.id === contestant.id && (
                  <View style={styles.selectedBadge}>
                    <Text style={styles.checkmark}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.actionBar}>
          <TouchableOpacity
            style={[styles.voteButton, !selectedContestant && styles.disabledButton]}
            onPress={() => setShowVoting(true)}
            disabled={!selectedContestant}
          >
            <Text style={styles.voteIcon}>🗳️</Text>
            <Text style={styles.voteText}>Vote</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.predictionButton}
            onPress={() => router.push('/prediction')}
          >
            <Text style={styles.predictionIcon}>🔮</Text>
            <Text style={styles.predictionText}>Prediction</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {showVoting && (
        <View style={styles.votingModal}>
          <View style={[styles.votingContent, { backgroundColor: isDark ? '#1a1a1a' : '#ffffff' }]}>
            <View style={styles.votingHeader}>
              <Text style={[styles.votingTitle, { color: isDark ? '#fff' : '#000' }]}>
                Vote for {selectedContestant?.name}
              </Text>
              <TouchableOpacity onPress={() => setShowVoting(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.walletBalanceText}>
              Wallet Balance: ₦{walletBalance.toLocaleString()}
            </Text>

            <View style={styles.packagesGrid}>
              {VOTE_PACKAGES.map((pkg) => (
                <TouchableOpacity
                  key={pkg.id}
                  style={[
                    styles.packageCard,
                    selectedPackage.id === pkg.id && styles.packageCardSelected,
                  ]}
                  onPress={() => setSelectedPackage(pkg)}
                >
                  <Text style={styles.packageVotes}>{pkg.votes.toLocaleString()} votes</Text>
                  <Text style={styles.packagePrice}>₦{pkg.price.toLocaleString()}</Text>
                  {pkg.bonus != null && pkg.bonus > 0 && (
                    <Text style={styles.packageBonus}>+{pkg.bonus} bonus</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.quantityRow}>
              <Text style={[styles.quantityLabel, { color: isDark ? '#fff' : '#000' }]}>
                Quantity:
              </Text>
              <View style={styles.quantityControls}>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  <Text style={styles.quantityButtonText}>−</Text>
                </TouchableOpacity>
                <Text style={[styles.quantityValue, { color: isDark ? '#fff' : '#000' }]}>
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

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Votes:</Text>
              <Text style={styles.summaryValue}>{totalVotes.toLocaleString()}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Price:</Text>
              <Text style={styles.summaryValue}>₦{totalPrice.toLocaleString()}</Text>
            </View>

            <TouchableOpacity
              style={[styles.voteNowButton, (!canAfford || isSubmitting) && styles.disabledButton]}
              onPress={handleVote}
              disabled={!canAfford || isSubmitting}
            >
              <Text style={styles.voteNowText}>
                {isSubmitting ? 'Submitting...' : canAfford ? 'Vote Now' : 'Insufficient Balance'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
    backgroundColor: '#1a1a1a',
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { color: '#fff', fontSize: 20 },
  headerInfo: { flex: 1 },
  showTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  liveText: { color: '#EF4444', fontSize: 11, fontWeight: '600' },
  videoPlaceholder: {
    height: 300,
    backgroundColor: '#1A0A0A',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  playIcon: { fontSize: 48, color: '#E8420A' },
  streamLabel: { color: '#888', fontSize: 12, marginTop: 4 },
  viewerBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  viewerIcon: { fontSize: 14 },
  viewerCount: { color: '#fff', fontSize: 13, fontWeight: '600' },
  content: { flex: 1 },
  infoSection: { padding: 16 },
  description: { fontSize: 14, lineHeight: 20, marginBottom: 12 },
  statsRow: { flexDirection: 'row', gap: 16 },
  statLabel: { fontSize: 13 },
  section: { paddingHorizontal: 16, paddingBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  contestantsScroll: { flexDirection: 'row', gap: 12 },
  contestantCard: {
    alignItems: 'center',
    marginRight: 12,
    position: 'relative',
  },
  contestantCardSelected: { transform: [{ scale: 1.08 }] },
  contestantAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E8420A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  contestantInitial: { color: '#fff', fontSize: 18, fontWeight: '700' },
  contestantName: { fontSize: 12, fontWeight: '500', textAlign: 'center' },
  voteCount: { fontSize: 11, color: '#888', marginTop: 2 },
  selectedBadge: {
    position: 'absolute',
    top: 0,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: { color: '#fff', fontSize: 12, fontWeight: '700' },
  actionBar: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
  },
  voteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8420A',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  voteIcon: { fontSize: 18 },
  voteText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  disabledButton: { opacity: 0.5 },
  predictionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F59E0B',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  predictionIcon: { fontSize: 18 },
  predictionText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  votingModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  votingContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  votingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  votingTitle: { fontSize: 18, fontWeight: '700' },
  closeButton: { color: '#888', fontSize: 20 },
  walletBalanceText: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 16,
  },
  packagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  packageCard: {
    width: '48%',
    padding: 12,
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  packageCardSelected: { borderColor: '#E8420A' },
  packageVotes: { color: '#fff', fontSize: 15, fontWeight: '700' },
  packagePrice: { color: '#E8420A', fontSize: 14, fontWeight: '600' },
  packageBonus: { color: '#10B911', fontSize: 11, marginTop: 2 },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  quantityLabel: { fontSize: 14, fontWeight: '600' },
  quantityControls: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  quantityButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButtonText: { color: '#fff', fontSize: 20, fontWeight: '600' },
  quantityValue: { fontSize: 18, fontWeight: '700', minWidth: 30, textAlign: 'center' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryLabel: { color: '#888', fontSize: 14 },
  summaryValue: { color: '#fff', fontSize: 14, fontWeight: '600' },
  voteNowButton: {
    backgroundColor: '#E8420A',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  voteNowText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
