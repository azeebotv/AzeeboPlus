import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, FlatList } from 'react-native';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';

const CONTESTANTS = [
  { id: '1', name: 'Maria', image: '' },
  { id: '2', name: 'Kenny', image: '' },
  { id: '3', name: 'Nini', image: '' },
  { id: '4', name: 'Cross', image: '' },
  { id: '5', name: 'Angel', image: '' },
  { id: '6', name: 'Jerome', image: '' },
];

const CHAT_MESSAGES = [
  { id: '1', user: 'Sarah', message: 'Maria is winning!', color: '#FF6B6B' },
  { id: '2', user: 'Chidi', message: 'Vote Kenny 😍', color: '#4ECDC4' },
  { id: '3', user: 'Ada', message: 'This season is fire!', color: '#FFEAA7' },
  { id: '4', user: 'Emeka', message: 'Nini for the win', color: '#DDA0DD' },
  { id: '5', user: 'Funke', message: 'Cross is so funny 😂', color: '#45B7D1' },
];

const VOTE_PACKAGES = [
  { id: '1', votes: 100, price: 100, bonus: 0 },
  { id: '2', votes: 500, price: 450, bonus: 50 },
  { id: '3', votes: 1000, price: 850, bonus: 150 },
  { id: '4', votes: 5000, price: 4000, bonus: 1000 },
];

export default function RealityShowPage() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const isDark = colorScheme === 'dark';
  const [selectedContestant, setSelectedContestant] = useState<typeof CONTESTANTS[0] | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<typeof VOTE_PACKAGES[0]>(VOTE_PACKAGES[0]);
  const [quantity, setQuantity] = useState(1);
  const [chatMessage, setChatMessage] = useState('');
  const [showVoting, setShowVoting] = useState(false);
  const [walletBalance] = useState(5000);

  const totalVotes = selectedPackage.votes * quantity;
  const totalPrice = selectedPackage.price * quantity;
  const canAfford = walletBalance >= totalPrice;

  const handleSendMessage = () => {
    if (chatMessage.trim()) {
      setChatMessage('');
    }
  };

  const handleVote = () => {
    if (!selectedContestant || !canAfford) return;
    alert(`Voted ${totalVotes} times for ${selectedContestant.name}!`);
    setSelectedContestant(null);
    setShowVoting(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0a0a0a' : '#ffffff' }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.showTitle}>Big Brother Naija</Text>
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
          <View style={styles.viewerBadge}>
            <Text style={styles.viewerIcon}>👁️</Text>
            <Text style={styles.viewerCount}>2.4M</Text>
          </View>
        </View>
      </View>

      <View style={styles.quickVoteBar}>
        <Text style={styles.quickVoteLabel}>Quick Vote:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {CONTESTANTS.slice(0, 4).map((contestant) => (
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
          <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
            Contestants
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {CONTESTANTS.map((contestant) => (
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
          <TouchableOpacity style={styles.predictionButton} onPress={() => router.push('/prediction')}>
            <Text style={styles.predictionIcon}>🔮</Text>
            <Text style={styles.predictionText}>Predictions</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.chatSection}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
            Live Chat
          </Text>
          <View style={styles.chatMessages}>
            {CHAT_MESSAGES.map((msg) => (
              <View key={msg.id} style={styles.chatMessage}>
                <Text style={[styles.chatUser, { color: msg.color }]}>{msg.user}:</Text>
                <Text style={styles.chatText}>{msg.message}</Text>
              </View>
            ))}
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
                  {pkg.bonus > 0 && (
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
              style={[styles.voteNowButton, !canAfford && styles.disabledButton]}
              onPress={handleVote}
              disabled={!canAfford}
            >
              <Text style={styles.voteNowText}>
                {canAfford ? 'Vote Now' : 'Insufficient Balance'}
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
    backgroundColor: '#333',
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
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareIcon: {
    fontSize: 18,
  },
  videoContainer: {
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
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
    color: '#888',
    fontSize: 13,
    fontWeight: '600',
  },
  quickVoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  quickVoteInitial: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#8B5CF6',
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
    backgroundColor: '#8B5CF6',
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
    backgroundColor: '#8B5CF6',
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
    color: '#ccc',
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
    backgroundColor: '#8B5CF6',
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
    color: '#888',
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
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  packageCardSelected: {
    borderColor: '#8B5CF6',
  },
  packageVotes: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  packagePrice: {
    color: '#8B5CF6',
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
    backgroundColor: '#2a2a2a',
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
    color: '#888',
    fontSize: 14,
  },
  summaryValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  voteNowButton: {
    backgroundColor: '#8B5CF6',
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