import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { realityApi } from '@azeebo/react-data';
import { apiClient } from '@azeebo/react-data/api/client';
import { useWallet } from '@azeebo/react-data/contexts/WalletContext';
import { LoadingState, EmptyState, ErrorState } from '../../src/components/StateContainers';
import { votePackages as defaultVotePackages } from '../../src/config/prices';
import type { Contestant, RealityShow } from '@azeebo/react-data/types/api';
import { colors } from '../../src/theme';
import { brand } from '@azeebo/design-tokens';

const VOTE_PACKAGES = defaultVotePackages.reality;

export default function RealityShowPage() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const isDark = colorScheme === 'dark';
  const { wallet } = useWallet();
  const [contestants, setContestants] = useState<Contestant[]>([]);
  const [chatMessages, _setChatMessages] = useState<
    { id: string; user: string; message: string; color: string }[]
  >([]);
  const [selectedContestant, setSelectedContestant] = useState<Contestant | null>(null);
  const [selectedPackage, setSelectedPackage] = useState(VOTE_PACKAGES[0]);
  const [quantity, setQuantity] = useState(1);
  const [chatMessage, setChatMessage] = useState('');
  const [showVoting, setShowVoting] = useState(false);
  const [showData, setShowData] = useState<RealityShow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const walletBalance = wallet?.balance || 0;

  const totalVotes = selectedPackage.votes * quantity;
  const totalPrice = selectedPackage.price * quantity;
  const canAfford = walletBalance >= totalPrice;

  useEffect(() => {
    loadShowData();
  }, []);

  const showName = showData?.name || 'Reality Show';
  const viewerCount = showData?.viewerCount ? `${showData.viewerCount}` : '';

  const loadShowData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [contestantsRes, showRes] = await Promise.all([
        realityApi.getContestants('current'),
        apiClient.get<RealityShow>('/v1/reality/shows/current').catch(() => null),
      ]);
      if (contestantsRes.success && contestantsRes.data) {
        setContestants(contestantsRes.data);
      }
      if (showRes) {
        setShowData(
          Array.isArray(showRes)
            ? showRes[0]
            : ((showRes as unknown as { data?: unknown[] })?.data?.[0] ?? showRes)
        );
      }
    } catch (err) {
      setError('Failed to load show data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = () => {
    if (chatMessage.trim()) {
      setChatMessage('');
    }
  };

  const handleVote = async () => {
    if (!selectedContestant || !canAfford || !showData?.id) return;
    setIsSubmitting(true);
    try {
      const response = await realityApi.submitVote({
        showId: showData.id,
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

  if (error) {
    return <ErrorState title="Failed to load" description={error} onRetry={loadShowData} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#1A0A0A' : '#ffffff' }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.showTitle}>{showName}</Text>
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.shareButton}>
          <Text style={styles.shareIcon}>📤</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.videoContainer}>
        <View style={styles.videoPlaceholder}>
          <Text style={styles.playIcon}>▶️</Text>
          <Text style={styles.liveStreamText}>Live Stream</Text>
          {viewerCount ? (
            <View style={styles.viewerBadge}>
              <Text style={styles.viewerIcon}>👁️</Text>
              <Text style={styles.viewerCount}>{viewerCount}</Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.quickVoteBar}>
        <Text style={styles.quickVoteLabel}>Quick Vote:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {contestants.slice(0, 4).map((contestant: Contestant) => (
            <TouchableOpacity
              key={contestant.id}
              style={styles.quickVoteButton}
              onPress={() => router.push('/vote')}
            >
              <Text style={styles.quickVoteInitial}>{contestant.name[0]}</Text>
              <Text style={styles.quickVoteName}>{contestant.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.contentArea}>
        <View style={styles.contestantsSection}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#1A0A0A' }]}>
            Contestants
          </Text>
          {contestants.length === 0 ? (
            <EmptyState
              title="No contestants"
              description="No contestants available yet."
              icon="people-outline"
            />
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {contestants.map((contestant: Contestant) => (
                <TouchableOpacity
                  key={contestant.id}
                  style={[
                    styles.contestantCard,
                    selectedContestant?.id === contestant.id && styles.contestantCardSelected,
                  ]}
                  onPress={() => setSelectedContestant(contestant)}
                >
                  <View style={styles.contestantImagePlaceholder}>
                    <Text style={styles.contestantInitial}>{contestant.name[0]}</Text>
                  </View>
                  <Text style={[styles.contestantName, { color: isDark ? '#fff' : '#000' }]}>
                    {contestant.name}
                  </Text>
                  {selectedContestant?.id === contestant.id && (
                    <View style={styles.selectedBadge}>
                      <Text style={styles.checkmark}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        <View style={styles.actionBar}>
          <TouchableOpacity
            style={[styles.fullVoteButton, !selectedContestant && styles.disabledButton]}
            onPress={() => setShowVoting(true)}
            disabled={!selectedContestant}
          >
            <Text style={styles.fullVoteIcon}>🗳️</Text>
            <Text style={styles.fullVoteText}>Full Voting</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.predictionButton}
            onPress={() => router.push('/prediction')}
          >
            <Text style={styles.predictionIcon}>🔮</Text>
            <Text style={styles.predictionText}>Predictions</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.chatSection}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#1A0A0A' }]}>
            Live Chat
          </Text>
          <View style={styles.chatMessages}>
            {chatMessages.map(
              (msg: { id: string; user: string; message: string; color: string }) => (
                <View key={msg.id} style={styles.chatMessage}>
                  <Text style={[styles.chatUser, { color: msg.color }]}>{msg.user}:</Text>
                  <Text style={styles.chatText}>{msg.message}</Text>
                </View>
              )
            )}
          </View>
          <View style={styles.chatInput}>
            <TextInput
              style={[styles.chatTextInput, { backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5' }]}
              placeholder="Say something..."
              placeholderTextColor="#666"
              value={chatMessage}
              onChangeText={setChatMessage}
            />
            <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
              <Text style={styles.sendIcon}>➤</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
    backgroundColor: colors.bg.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    color: '#fff',
    fontSize: 20,
  },
  headerInfo: {
    flex: 1,
  },
  showTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  liveText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '600',
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bg.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareIcon: {
    fontSize: 18,
  },
  videoContainer: {
    aspectRatio: 16 / 9,
    backgroundColor: '#1A0A0A',
  },
  videoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    fontSize: 64,
    marginBottom: 8,
  },
  liveStreamText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  viewerBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  viewerIcon: {
    fontSize: 14,
  },
  viewerCount: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  quickVoteBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#1a1a1a',
    gap: 12,
  },
  quickVoteLabel: {
    color: colors.text.secondary,
    fontSize: 13,
    fontWeight: '600',
  },
  quickVoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.tertiary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  quickVoteInitial: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: brand.flame,
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 24,
  },
  quickVoteName: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  contentArea: {
    flex: 1,
    padding: 16,
  },
  contestantsSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  contestantCard: {
    width: 80,
    alignItems: 'center',
    marginRight: 12,
    position: 'relative',
  },
  contestantCardSelected: {
    transform: [{ scale: 1.05 }],
  },
  contestantImagePlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: brand.flame,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  contestantInitial: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  contestantName: {
    fontSize: 12,
    fontWeight: '500',
  },
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
  checkmark: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  actionBar: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  fullVoteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: brand.flame,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  fullVoteIcon: {
    fontSize: 18,
  },
  fullVoteText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
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
  predictionIcon: {
    fontSize: 18,
  },
  predictionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  chatSection: {
    flex: 1,
  },
  chatMessages: {
    flex: 1,
    marginBottom: 12,
  },
  chatMessage: {
    flexDirection: 'row',
    marginBottom: 8,
    gap: 4,
  },
  chatUser: {
    fontSize: 13,
    fontWeight: '600',
  },
  chatText: {
    fontSize: 13,
    color: colors.neutral[300],
    flex: 1,
  },
  chatInput: {
    flexDirection: 'row',
    gap: 8,
  },
  chatTextInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    fontSize: 14,
    color: '#fff',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: brand.flame,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendIcon: {
    color: '#fff',
    fontSize: 18,
  },
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
  votingTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeButton: {
    color: colors.text.secondary,
    fontSize: 20,
  },
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
    backgroundColor: colors.bg.tertiary,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  packageCardSelected: {
    borderColor: brand.flame,
  },
  packageVotes: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  packagePrice: {
    color: brand.flame,
    fontSize: 14,
    fontWeight: '600',
  },
  packageBonus: {
    color: '#10B981',
    fontSize: 11,
    marginTop: 2,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  quantityLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  quantityButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bg.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  quantityValue: {
    fontSize: 18,
    fontWeight: '700',
    minWidth: 30,
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    color: colors.text.secondary,
    fontSize: 14,
  },
  summaryValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  voteNowButton: {
    backgroundColor: brand.flame,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  voteNowText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
