import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useColorScheme } from 'react-native';
import { apiClient } from '../../src/api';
import { logger } from '../../src/utils/logger';
import { LoadingState, ErrorState, EmptyState } from '../../src/components/StateContainers';

interface SportsMatch {
  id: string;
  league: string;
  homeTeam: { name: string; logo: string; score: number | null };
  awayTeam: { name: string; logo: string; score: number | null };
  date: string;
  time: string;
  status: 'upcoming' | 'live' | 'completed';
  odds?: { home: string; draw: string; away: string };
  minute?: number;
}

interface BetEntry {
  id: string;
  match: string;
  prediction: string;
  stake: string;
  potentialWin: string;
  status: string;
}

export default function SportsPredictionScreen() {
  const colorScheme = useColorScheme();
  const [activeTab, setActiveTab] = useState('upcoming');
  const [matches, setMatches] = useState<SportsMatch[]>([]);
  const [bets, setBets] = useState<BetEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null);
  const [selectedBet, setSelectedBet] = useState<string | null>(null);
  const [betAmount, setBetAmount] = useState('');

  const tabs = [
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'live', label: 'Live' },
    { id: 'results', label: 'Results' },
    { id: 'my-bets', label: 'My Bets' },
  ];

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const matchesRes = await apiClient.get<SportsMatch[]>('/sports/matches');
      setMatches(Array.isArray(matchesRes) ? matchesRes : []);
      const betsRes = await apiClient.get<BetEntry[]>('/sports/predictions').catch(() => []);
      setBets(Array.isArray(betsRes) ? betsRes : []);
    } catch (err: any) {
      logger.error('Failed to load sports data:', err);
      setError(err.message || 'Failed to load sports data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleBet = () => {
    if (selectedMatch && selectedBet && betAmount) {
      apiClient
        .post('/sports/predictions', {
          matchId: selectedMatch,
          selection: selectedBet,
          amount: parseFloat(betAmount),
        })
        .then(() => {
          alert(`Bet placed: ${selectedBet} with ₦${betAmount}`);
          setSelectedMatch(null);
          setSelectedBet(null);
          setBetAmount('');
        })
        .catch((err: any) => alert(err.message || 'Failed to place bet'));
    }
  };

  const upcomingMatches = matches.filter((m) => m.status === 'upcoming');
  const inProgressMatches = matches.filter((m) => m.status === 'live');
  const pastMatches = matches.filter((m) => m.status === 'completed');

  if (isLoading) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: colorScheme === 'dark' ? '#0a0a0a' : '#ffffff' },
        ]}
      >
        <LoadingState text="Loading sports..." />
      </View>
    );
  }

  if (error) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: colorScheme === 'dark' ? '#0a0a0a' : '#ffffff' },
        ]}
      >
        <ErrorState description={error} onRetry={fetchData} />
      </View>
    );
  }

  if (matches.length === 0) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: colorScheme === 'dark' ? '#0a0a0a' : '#ffffff' },
        ]}
      >
        <EmptyState
          icon="⚽"
          title="No Matches"
          description="No sports matches available right now."
        />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colorScheme === 'dark' ? '#0a0a0a' : '#ffffff' },
      ]}
    >
      <View style={styles.header}>
        <Text
          style={[styles.headerTitle, { color: colorScheme === 'dark' ? '#ffffff' : '#000000' }]}
        >
          Sports Predictions ⚽
        </Text>
        <View style={styles.balanceBadge}>
          <Text style={styles.balanceLabel}>Wallet:</Text>
          <Text style={styles.balanceAmount}>₦2,500</Text>
        </View>
      </View>

      <View style={styles.tabsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabs}
        >
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, activeTab === tab.id && styles.tabActive]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
                {tab.label}
              </Text>
              {tab.id === 'live' && (
                <View style={styles.liveIndicator}>
                  <View style={styles.liveDot} />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.content}>
        {activeTab === 'upcoming' && (
          <View style={styles.matchesList}>
            {upcomingMatches.map((match) => (
              <TouchableOpacity
                key={match.id}
                style={[styles.matchCard, selectedMatch === match.id && styles.matchCardSelected]}
                onPress={() => setSelectedMatch(selectedMatch === match.id ? null : match.id)}
              >
                <View style={styles.matchHeader}>
                  <Text style={styles.league}>{match.league}</Text>
                  <Text style={styles.matchTime}>
                    {match.date} • {match.time}
                  </Text>
                </View>
                <View style={styles.matchTeams}>
                  <View style={styles.team}>
                    <Text style={styles.teamLogo}>{match.homeTeam.logo}</Text>
                    <Text
                      style={[
                        styles.teamName,
                        { color: colorScheme === 'dark' ? '#ffffff' : '#000000' },
                      ]}
                    >
                      {match.homeTeam.name}
                    </Text>
                  </View>
                  <View style={styles.vs}>
                    <Text style={styles.vsText}>VS</Text>
                  </View>
                  <View style={styles.team}>
                    <Text style={styles.teamLogo}>{match.awayTeam.logo}</Text>
                    <Text
                      style={[
                        styles.teamName,
                        { color: colorScheme === 'dark' ? '#ffffff' : '#000000' },
                      ]}
                    >
                      {match.awayTeam.name}
                    </Text>
                  </View>
                </View>
                {selectedMatch === match.id && (
                  <View style={styles.bettingSection}>
                    <Text style={styles.bettingTitle}>Place Your Bet</Text>
                    <View style={styles.betOptions}>
                      <TouchableOpacity
                        style={[
                          styles.betOption,
                          selectedBet === 'home' && styles.betOptionSelected,
                        ]}
                        onPress={() => setSelectedBet('home')}
                      >
                        <Text style={styles.betTeam}>{match.homeTeam.name}</Text>
                        <Text style={styles.betOdds}>@{match.odds.home}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.betOption,
                          selectedBet === 'draw' && styles.betOptionSelected,
                        ]}
                        onPress={() => setSelectedBet('draw')}
                      >
                        <Text style={styles.betTeam}>Draw</Text>
                        <Text style={styles.betOdds}>@{match.odds.draw}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.betOption,
                          selectedBet === 'away' && styles.betOptionSelected,
                        ]}
                        onPress={() => setSelectedBet('away')}
                      >
                        <Text style={styles.betTeam}>{match.awayTeam.name}</Text>
                        <Text style={styles.betOdds}>@{match.odds.away}</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.betInputContainer}>
                      <Text style={styles.betInputLabel}>Stake Amount</Text>
                      <TextInput
                        style={[
                          styles.betInput,
                          { color: colorScheme === 'dark' ? '#ffffff' : '#000000' },
                        ]}
                        placeholder="₦0.00"
                        placeholderTextColor="#666"
                        value={betAmount}
                        onChangeText={setBetAmount}
                        keyboardType="numeric"
                      />
                    </View>
                    {betAmount && (
                      <View style={styles.potentialWin}>
                        <Text style={styles.potentialWinLabel}>Potential Win:</Text>
                        <Text style={styles.potentialWinAmount}>
                          ₦
                          {parseFloat(betAmount) *
                            parseFloat(
                              selectedBet === 'home'
                                ? match.odds.home
                                : selectedBet === 'draw'
                                  ? match.odds.draw
                                  : match.odds.away
                            ).toFixed(2)}
                        </Text>
                      </View>
                    )}
                    <TouchableOpacity style={styles.placeBetButton} onPress={handleBet}>
                      <Text style={styles.placeBetButtonText}>Place Bet</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {activeTab === 'live' && (
          <View style={styles.matchesList}>
            {inProgressMatches.map((match) => (
              <View key={match.id} style={styles.matchCard}>
                <View style={styles.matchHeader}>
                  <Text style={styles.league}>{match.league}</Text>
                  <View style={styles.liveBadge}>
                    <View style={styles.livePulse} />
                    <Text style={styles.liveText}>LIVE</Text>
                  </View>
                </View>
                <View style={styles.matchTeams}>
                  <View style={styles.team}>
                    <Text style={styles.teamLogo}>{match.homeTeam.logo}</Text>
                    <Text
                      style={[
                        styles.teamName,
                        { color: colorScheme === 'dark' ? '#ffffff' : '#000000' },
                      ]}
                    >
                      {match.homeTeam.name}
                    </Text>
                    <Text style={styles.teamScore}>{match.homeTeam.score}</Text>
                  </View>
                  <View style={styles.scoreVs}>
                    <Text style={styles.scoreTime}>{match.minute}'</Text>
                  </View>
                  <View style={styles.team}>
                    <Text style={styles.teamLogo}>{match.awayTeam.logo}</Text>
                    <Text
                      style={[
                        styles.teamName,
                        { color: colorScheme === 'dark' ? '#ffffff' : '#000000' },
                      ]}
                    >
                      {match.awayTeam.name}
                    </Text>
                    <Text style={styles.teamScore}>{match.awayTeam.score}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'results' && (
          <View style={styles.matchesList}>
            {pastMatches.map((match) => (
              <View key={match.id} style={styles.matchCard}>
                <View style={styles.matchHeader}>
                  <Text style={styles.league}>{match.league}</Text>
                  <Text style={styles.matchTime}>
                    {match.date} • {match.time}
                  </Text>
                </View>
                <View style={styles.matchTeams}>
                  <View style={styles.team}>
                    <Text style={styles.teamLogo}>{match.homeTeam.logo}</Text>
                    <Text
                      style={[
                        styles.teamName,
                        { color: colorScheme === 'dark' ? '#ffffff' : '#000000' },
                      ]}
                    >
                      {match.homeTeam.name}
                    </Text>
                    <Text style={styles.teamScore}>{match.homeTeam.score}</Text>
                  </View>
                  <View style={styles.scoreVs}>
                    <Text style={styles.scoreText}>
                      {match.homeTeam.score} - {match.awayTeam.score}
                    </Text>
                  </View>
                  <View style={styles.team}>
                    <Text style={styles.teamLogo}>{match.awayTeam.logo}</Text>
                    <Text
                      style={[
                        styles.teamName,
                        { color: colorScheme === 'dark' ? '#ffffff' : '#000000' },
                      ]}
                    >
                      {match.awayTeam.name}
                    </Text>
                    <Text style={styles.teamScore}>{match.awayTeam.score}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'my-bets' && (
          <View style={styles.betsList}>
            {bets.length === 0 ? (
              <Text style={{ color: '#888', textAlign: 'center', padding: 20 }}>
                No bets placed yet
              </Text>
            ) : (
              bets.map((prediction) => (
                <View key={prediction.id} style={styles.betCard}>
                  <View style={styles.betHeader}>
                    <Text
                      style={[
                        styles.betMatch,
                        { color: colorScheme === 'dark' ? '#ffffff' : '#000000' },
                      ]}
                    >
                      {prediction.match}
                    </Text>
                    <View
                      style={[
                        styles.betStatus,
                        prediction.status === 'pending' && styles.statusPending,
                      ]}
                    >
                      <Text style={styles.betStatusText}>{prediction.status.toUpperCase()}</Text>
                    </View>
                  </View>
                  <View style={styles.betDetails}>
                    <View style={styles.betDetail}>
                      <Text style={styles.betLabel}>Prediction:</Text>
                      <Text style={styles.betValue}>{prediction.prediction}</Text>
                    </View>
                    <View style={styles.betDetail}>
                      <Text style={styles.betLabel}>Stake:</Text>
                      <Text style={styles.betValue}>{prediction.stake}</Text>
                    </View>
                    <View style={styles.betDetail}>
                      <Text style={styles.betLabel}>Potential Win:</Text>
                      <Text style={styles.betValue}>{prediction.potentialWin}</Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 40,
    backgroundColor: '#1a1a1a',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  balanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  balanceLabel: {
    fontSize: 12,
    color: '#888',
  },
  balanceAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10B981',
  },
  tabsContainer: {
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    gap: 4,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#10B981',
  },
  tabText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#10B981',
  },
  liveIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  content: {
    flex: 1,
    padding: 12,
  },
  matchesList: {
    gap: 12,
  },
  matchCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
  },
  matchCardSelected: {
    borderWidth: 2,
    borderColor: '#10B981',
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  league: {
    fontSize: 12,
    color: '#888',
    fontWeight: '600',
  },
  matchTime: {
    fontSize: 12,
    color: '#888',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  livePulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
    animation: 'pulse 1s infinite',
  },
  liveText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  matchTeams: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  team: {
    alignItems: 'center',
    flex: 1,
  },
  teamLogo: {
    fontSize: 28,
    marginBottom: 4,
  },
  teamName: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  teamScore: {
    fontSize: 20,
    fontWeight: '700',
    color: '#10B981',
  },
  vs: {
    paddingHorizontal: 12,
  },
  vsText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#888',
  },
  scoreVs: {
    paddingHorizontal: 12,
  },
  scoreText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  scoreTime: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EF4444',
  },
  bettingSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
  bettingTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },
  betOptions: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  betOption: {
    flex: 1,
    padding: 10,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  betOptionSelected: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: '#10B981',
  },
  betTeam: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  betOdds: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10B981',
  },
  betInputContainer: {},
  betInputLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 6,
  },
  betInput: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  potentialWin: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  potentialWinLabel: {
    fontSize: 14,
    color: '#888',
  },
  potentialWinAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10B981',
  },
  placeBetButton: {
    backgroundColor: '#10B981',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  placeBetButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  betsList: {
    gap: 12,
  },
  betCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
  },
  betHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  betMatch: {
    fontSize: 14,
    fontWeight: '700',
  },
  betStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusPending: {
    backgroundColor: '#F59E0B',
  },
  betStatusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  betDetails: {
    gap: 8,
  },
  betDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  betLabel: {
    fontSize: 13,
    color: '#888',
  },
  betValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
});
