import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useColorScheme } from 'react-native';

const contestants = [
  { id: '1', name: 'Maria', status: 'active', votes: 125000, avatar: '👩' },
  { id: '2', name: 'John', status: 'active', votes: 98000, avatar: '👨' },
  { id: '3', name: 'Sarah', status: 'evicted', votes: 0, avatar: '👩' },
  { id: '4', name: 'Mike', status: 'active', votes: 87000, avatar: '👨' },
  { id: '5', name: 'Lisa', status: 'active', votes: 112000, avatar: '👩' },
  { id: '6', name: 'David', status: 'active', votes: 76000, avatar: '👨' },
];

export default function RealityShowScreen() {
  const colorScheme = useColorScheme();
  const [selectedContestant, setSelectedContestant] = useState<string | null>(null);
  const [voteAmount, setVoteAmount] = useState(1);

  const handleVote = () => {
    if (!selectedContestant) return;
    alert(`Voted ${voteAmount} times for ${contestants.find(c => c.id === selectedContestant)?.name}`);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#0a0a0a' : '#ffffff' }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colorScheme === 'dark' ? '#ffffff' : '#000000' }]}>
          Big Brother Naija
        </Text>
        <View style={styles.liveBadge}>
          <Text style={styles.liveIcon}>🔴</Text>
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      </View>

      <View style={styles.heroSection}>
        <Image source={{ uri: 'https://via.placeholder.com/400x225' }} style={styles.heroImage} />
        <View style={styles.heroOverlay}>
          <Text style={styles.heroTitle}>Live Eviction Night</Text>
          <Text style={styles.heroSubtitle}>Season 9 | Day 42</Text>
        </View>
      </View>

      <View style={styles.voteSection}>
        <Text style={[styles.sectionTitle, { color: colorScheme === 'dark' ? '#ffffff' : '#000000' }]}>
          Vote to Save
        </Text>
        
        <View style={styles.voteAmountSelector}>
          <TouchableOpacity 
            style={[styles.voteButton, voteAmount > 1 && { backgroundColor: '#8B5CF6' }]}
            onPress={() => setVoteAmount(Math.max(1, voteAmount - 1))}
          >
            <Text style={[styles.voteButtonText, voteAmount > 1 && { color: '#ffffff' }]}>-</Text>
          </TouchableOpacity>
          <Text style={[styles.voteAmountText, { color: colorScheme === 'dark' ? '#ffffff' : '#000000' }]}>
            {voteAmount} Vote{voteAmount > 1 ? 's' : ''}
          </Text>
          <TouchableOpacity 
            style={[styles.voteButton, { backgroundColor: '#8B5CF6' }]}
            onPress={() => setVoteAmount(voteAmount + 1)}
          >
            <Text style={styles.voteButtonText}>+</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.contestantsGrid}>
          {contestants.map((contestant) => (
            <TouchableOpacity
              key={contestant.id}
              onPress={() => contestant.status === 'active' && setSelectedContestant(contestant.id)}
              style={[
                styles.contestantCard,
                contestant.status === 'evicted' && { opacity: 0.5 },
                selectedContestant === contestant.id && { borderColor: '#8B5CF6', borderWidth: 2 },
              ]}
            >
              <View style={[styles.contestantAvatar, contestant.status !== 'evicted' && { backgroundColor: '#8B5CF6' }]}>
                <Text style={styles.avatarText}>{contestant.avatar}</Text>
              </View>
              <Text style={[styles.contestantName, { color: colorScheme === 'dark' ? '#ffffff' : '#000000' }]}>
                {contestant.name}
              </Text>
              {contestant.status === 'evicted' ? (
                <Text style={styles.evictedBadge}>Evicted</Text>
              ) : (
                <Text style={styles.voteCount}>{(contestant.votes / 1000).toFixed(0)}K votes</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          onPress={handleVote}
          disabled={!selectedContestant}
          style={[styles.submitVoteButton, !selectedContestant && { backgroundColor: '#ccc' }]}
        >
          <Text style={styles.submitVoteText}>Confirm Vote</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.predictionSection}>
        <Text style={[styles.sectionTitle, { color: colorScheme === 'dark' ? '#ffffff' : '#000000' }]}>
          Predictions
        </Text>
        <View style={styles.predictionCard}>
          <Text style={[styles.predictionTitle, { color: colorScheme === 'dark' ? '#ffffff' : '#000000' }]}>
            Who will be evicted tonight?
          </Text>
          <View style={styles.predictionOptions}>
            {contestants.filter(c => c.status === 'active').map((contestant) => (
              <TouchableOpacity key={contestant.id} style={styles.predictionOption}>
                <Text style={styles.predictionAvatar}>{contestant.avatar}</Text>
                <Text style={[styles.predictionName, { color: colorScheme === 'dark' ? '#ffffff' : '#000000' }]}>
                  {contestant.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.leaderboardSection}>
        <Text style={[styles.sectionTitle, { color: colorScheme === 'dark' ? '#ffffff' : '#000000' }]}>
          Vote Leaderboard
        </Text>
        <View style={styles.leaderboard}>
          {contestants.filter(c => c.status === 'active').sort((a, b) => b.votes - a.votes).map((contestant, index) => (
            <View key={contestant.id} style={styles.leaderboardItem}>
              <Text style={[styles.rank, index < 3 && styles.topRank]}>{index + 1}</Text>
              <Text style={styles.leaderboardAvatar}>{contestant.avatar}</Text>
              <Text style={[styles.leaderboardName, { color: colorScheme === 'dark' ? '#ffffff' : '#000000' }]}>
                {contestant.name}
              </Text>
              <Text style={styles.leaderboardVotes}>{(contestant.votes / 1000).toFixed(0)}K</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#1a1a1a',
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
  liveIcon: {
    fontSize: 12,
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
    marginBottom: 20,
  },
  voteButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  voteButtonText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#666',
  },
  voteAmountText: {
    fontSize: 20,
    fontWeight: '700',
    minWidth: 80,
    textAlign: 'center',
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
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  contestantAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ccc',
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
    color: '#8B5CF6',
    fontWeight: '600',
  },
  submitVoteButton: {
    backgroundColor: '#8B5CF6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitVoteText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  predictionSection: {
    padding: 16,
    paddingTop: 0,
  },
  predictionCard: {
    backgroundColor: '#f8f9fa',
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
  },
  predictionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  predictionAvatar: {
    fontSize: 20,
  },
  predictionName: {
    fontSize: 13,
    fontWeight: '500',
  },
  leaderboardSection: {
    padding: 16,
    paddingTop: 0,
    paddingBottom: 32,
  },
  leaderboard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    overflow: 'hidden',
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  rank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 12,
  },
  topRank: {
    backgroundColor: '#8B5CF6',
    color: '#fff',
  },
  leaderboardAvatar: {
    fontSize: 24,
    marginRight: 12,
  },
  leaderboardName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  leaderboardVotes: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B5CF6',
  },
});
