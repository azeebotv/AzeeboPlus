import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { apiClient } from '@azeebo/react-data/api/client';
import { LoadingState, EmptyState, ErrorState } from '../src/components/StateContainers';
import { useWallet } from '@azeebo/react-data/contexts/WalletContext';
import { votePackages as defaultVotePackages } from '../src/config/prices';
import { realityApi } from '@azeebo/react-data/api/engagement';
import type { RealityShow, RealityContestant } from '@azeebo/react-data/api/engagement';
import { colors } from '../src/theme';
import { brand } from '@azeebo/design-tokens';

const VOTE_PACKAGES = defaultVotePackages.reality;

export default function VotePage() {
  const router = useRouter();
  const { showId } = useLocalSearchParams<{ showId: string }>();
  const { wallet } = useWallet();

  const [selectedShow, setSelectedShow] = useState<RealityShow | null>(null);
  const [contestants, setContestants] = useState<RealityContestant[]>([]);
  const [selectedContestant, setSelectedContestant] = useState<RealityContestant | null>(null);
  const [selectedPackage, setSelectedPackage] = useState(VOTE_PACKAGES[0]);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const walletBalance = wallet?.balance || 0;
  const totalVotes = selectedPackage.votes * quantity;
  const totalPrice = selectedPackage.price * quantity;
  const canAfford = walletBalance >= totalPrice;

  const loadVoteData = async () => {
    if (!showId) return;
    setIsLoading(true);
    setError(null);

    try {
      const [showRes, contestantsRes] = await Promise.all([
        apiClient.get<RealityShow>(`/api/v1/reality/shows/${showId}`),
        apiClient.get<RealityContestant[]>(`/api/v1/reality/shows/${showId}/contestants`),
      ]);

      setSelectedShow(Array.isArray(showRes) ? showRes[0] : (showRes as RealityShow));
      setContestants(
        Array.isArray(contestantsRes)
          ? contestantsRes
          : ((contestantsRes as { data?: RealityContestant[] })?.data ?? [])
      );
    } catch (err) {
      setError('Failed to load voting data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadVoteData();
  }, [showId]);

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
            { text: 'Back to Show', onPress: () => router.back() },
          ]
        );
      } else {
        throw new Error(response.message || 'Vote submission failed');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit vote';
      Alert.alert('Vote Failed', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingState text="Loading voting options..." />;
  }

  if (error || !selectedShow) {
    return (
      <ErrorState
        title="Failed to load"
        description={error || 'Show not found'}
        onRetry={loadVoteData}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Back"
          accessibilityHint="Navigates to previous screen"
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vote</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadVoteData} />}
      >
        <Text style={styles.showTitle}>{selectedShow.title}</Text>
        <Text style={styles.viewerCount}>{selectedShow.viewerCount} viewers</Text>

        <Text style={styles.sectionTitle}>Select Contestant</Text>
        <View style={styles.contestantList}>
          {contestants.length === 0 ? (
            <EmptyState
              icon="🗳️"
              title="No active contestants"
              description="Voting is closed or no contestants are currently up for eviction."
            />
          ) : (
            contestants.map((contestant) => (
              <TouchableOpacity
                key={contestant.id}
                style={[
                  styles.contestantItem,
                  selectedContestant?.id === contestant.id && styles.contestantSelected,
                ]}
                onPress={() => setSelectedContestant(contestant)}
                accessibilityRole="button"
                accessibilityLabel={`Vote for ${contestant.name}, rank ${contestant.rank}`}
                accessibilityState={{ selected: selectedContestant?.id === contestant.id }}
              >
                <View style={styles.contestantAvatar}>
                  <Text style={styles.contestantInitial}>{contestant.name[0]}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.contestantName}>{contestant.name}</Text>
                  <Text style={styles.contestantRank}>#{contestant.rank}</Text>
                </View>
                {selectedContestant?.id === contestant.id && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            ))
          )}
        </View>

        <Text style={styles.sectionTitle}>Vote Package</Text>
        <View style={styles.packageGrid}>
          {VOTE_PACKAGES.map((pkg) => (
            <TouchableOpacity
              key={pkg.id}
              style={[styles.packageCard, selectedPackage.id === pkg.id && styles.packageSelected]}
              onPress={() => setSelectedPackage(pkg)}
              accessibilityRole="button"
              accessibilityLabel={`${pkg.votes} votes, ₦${pkg.price.toLocaleString()}`}
              accessibilityState={{ selected: selectedPackage.id === pkg.id }}
            >
              <Text style={styles.packageVotes}>{pkg.votes} votes</Text>
              <Text style={styles.packagePrice}>₦{pkg.price.toLocaleString()}</Text>
              {(pkg.bonus ?? 0) > 0 && <Text style={styles.packageBonus}>+{pkg.bonus} bonus</Text>}
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Quantity</Text>
        <View style={styles.quantityRow}>
          <TouchableOpacity
            style={styles.quantityBtn}
            onPress={() => setQuantity(Math.max(1, quantity - 1))}
            accessibilityRole="button"
            accessibilityLabel="Decrease quantity"
          >
            <Text style={styles.quantityText}>-</Text>
          </TouchableOpacity>
          <Text style={styles.quantityValue}>{quantity}</Text>
          <TouchableOpacity
            style={styles.quantityBtn}
            onPress={() => setQuantity(quantity + 1)}
            accessibilityRole="button"
            accessibilityLabel="Increase quantity"
          >
            <Text style={styles.quantityText}>+</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total: {totalVotes.toLocaleString()} votes</Text>
          <Text style={styles.summaryPrice}>₦{totalPrice.toLocaleString()}</Text>
        </View>

        <Text style={styles.balanceLabel}>Wallet: ₦{walletBalance.toLocaleString()}</Text>

        <TouchableOpacity
          style={[
            styles.voteButton,
            (!selectedContestant || !canAfford || isSubmitting) && styles.disabledBtn,
          ]}
          onPress={handleVote}
          disabled={!selectedContestant || !canAfford || isSubmitting}
          accessibilityRole="button"
          accessibilityLabel={
            isSubmitting
              ? 'Submitting vote'
              : canAfford
                ? `Vote now for ${totalVotes.toLocaleString()} votes`
                : 'Insufficient balance'
          }
          accessibilityState={{ disabled: !selectedContestant || !canAfford || isSubmitting }}
        >
          <Text style={styles.voteText}>
            {isSubmitting ? 'Submitting...' : canAfford ? 'Vote Now' : 'Insufficient Balance'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.primary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
    backgroundColor: colors.bg.secondary,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.bg.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { color: '#fff', fontSize: 20 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '600', marginLeft: 'auto' },
  content: { padding: 16 },
  showTitle: { color: '#fff', fontSize: 24, fontWeight: '700', marginBottom: 8 },
  viewerCount: { color: colors.text.secondary, fontSize: 14, marginBottom: 24 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '600', marginBottom: 12 },
  contestantList: { marginBottom: 24 },
  contestantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#140808',
    borderRadius: 12,
    marginBottom: 8,
    borderColor: '#2A1A1A',
    borderWidth: 1,
  },
  contestantSelected: { backgroundColor: 'rgba(232,66,10,0.15)' },
  contestantAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: brand.flame,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contestantInitial: { color: '#fff', fontSize: 18, fontWeight: '700' },
  contestantName: { color: '#fff', fontSize: 16, fontWeight: '600' },
  contestantRank: { color: colors.text.secondary, fontSize: 12, marginTop: 2 },
  checkmark: { color: '#10B981', fontSize: 20, fontWeight: '700' },
  packageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  packageCard: {
    flex: 1,
    minWidth: '48%',
    padding: 16,
    backgroundColor: colors.bg.tertiary,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  packageSelected: { borderColor: brand.flame },
  packageVotes: { color: '#fff', fontSize: 18, fontWeight: '700' },
  packagePrice: { color: brand.flame, fontSize: 14, fontWeight: '600', marginTop: 4 },
  packageBonus: { color: colors.category.green, fontSize: 12, marginTop: 2 },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    gap: 24,
  },
  quantityBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.bg.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityText: { color: '#fff', fontSize: 24, fontWeight: '700' },
  quantityValue: { fontSize: 24, fontWeight: '700', color: '#fff' },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#140808',
    borderRadius: 12,
    marginBottom: 16,
  },
  summaryLabel: { color: colors.text.secondary, fontSize: 14 },
  summaryPrice: { color: '#fff', fontSize: 14, fontWeight: '600' },
  balanceLabel: {
    color: colors.category.green,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  voteButton: {
    backgroundColor: brand.flame,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  disabledBtn: { opacity: 0.5 },
  voteText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
