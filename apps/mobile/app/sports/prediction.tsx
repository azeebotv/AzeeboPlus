import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { apiClient } from '@azeebo/react-data';
import { engagementApi } from '@azeebo/react-data/api/engagement';
import { logger } from '@azeebo/react-data/utils/logger';
import { LoadingState, ErrorState, EmptyState } from '../../src/components/StateContainers';
import { colors } from '../../src/theme';

interface MatchInfo {
  home: string;
  away: string;
  league: string;
  time: string;
  emojiHome: string;
  emojiAway: string;
}

interface PredictionOption {
  id: string;
  label: string;
  odds: number;
}

interface ScoreOption {
  id: string;
  label: string;
  odds: number;
}

export default function SportsPredictionPage() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const isDark = colorScheme === 'dark';
  const [matchInfo, setMatchInfo] = useState<MatchInfo | null>(null);
  const [predictionOptions, setPredictionOptions] = useState<PredictionOption[]>([]);
  const [scoreOptions, setScoreOptions] = useState<ScoreOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stake, setStake] = useState('1000');
  const [selectedPrediction, setSelectedPrediction] = useState<string | null>(null);
  const [selectedScore, setSelectedScore] = useState<string | null>(null);
  const [extraSelections, setExtraSelections] = useState<Record<string, string>>({});
  const [potentialWin, setPotentialWin] = useState(0);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [matchRes, optsRes, scoresRes] = await Promise.all([
        apiClient.get<MatchInfo>('/sports/current-match').catch(() => null),
        apiClient.get<PredictionOption[]>('/sports/prediction-options').catch(() => []),
        apiClient.get<ScoreOption[]>('/sports/score-options').catch(() => []),
      ]);
      setMatchInfo(matchRes);
      setPredictionOptions(Array.isArray(optsRes) ? optsRes : []);
      setScoreOptions(Array.isArray(scoresRes) ? scoresRes : []);
    } catch (err: unknown) {
      logger.error('Failed to load prediction data:', err);
      const message = err instanceof Error ? err.message : 'Failed to load prediction data';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <SafeAreaView accessibilityLabel="Prediction Screen" style={[styles.container, { backgroundColor: isDark ? '#1A0A0A' : '#ffffff' }]}>
        <LoadingState text="Loading predictions..." />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#1A0A0A' : '#ffffff' }]}>
        <ErrorState description={error} onRetry={fetchData} />
      </SafeAreaView>
    );
  }

  if (!matchInfo) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#1A0A0A' : '#ffffff' }]}>
        <EmptyState
          icon="⚽"
          title="No Match"
          description="No match currently available for predictions."
        />
      </SafeAreaView>
    );
  }

  const calculateWin = (predId: string | null, scoreId: string | null) => {
    if (!predId) {
      setPotentialWin(0);
      return;
    }
    const pred = predictionOptions.find((p) => p.id === predId);
    const score = scoreOptions.find((s) => s.id === scoreId);
    const stakeNum = parseFloat(stake) || 0;

    let odds = pred?.odds || 1;
    if (score) {
      odds *= score.odds / 5;
    }

    const extraOdds = Object.values(extraSelections).reduce((acc, _val) => acc * 1.1, 1);
    odds *= extraOdds;

    setPotentialWin(stakeNum * odds);
  };

  const handlePredictionSelect = (id: string) => {
    const newSelection = selectedPrediction === id ? null : id;
    setSelectedPrediction(newSelection);
    calculateWin(newSelection, selectedScore);
  };

  const handleScoreSelect = (id: string) => {
    const newSelection = selectedScore === id ? null : id;
    setSelectedScore(newSelection);
    calculateWin(selectedPrediction, newSelection);
  };

  const handleExtraSelect = (predId: string, option: string) => {
    const newSelections = { ...extraSelections };
    if (newSelections[predId] === option) {
      delete newSelections[predId];
    } else {
      newSelections[predId] = option;
    }
    setExtraSelections(newSelections);
    calculateWin(selectedPrediction, selectedScore);
  };

  const handleStakeChange = (value: string) => {
    setStake(value);
    setTimeout(() => calculateWin(selectedPrediction, selectedScore), 0);
  };

  const handleSubmit = async () => {
    if (!selectedPrediction) {
      Alert.alert('Error', 'Please select a prediction');
      return;
    }

    Alert.alert(
      'Confirm Prediction',
      `Are you sure you want to place this prediction?\n\nStake: ₦${stake}\nPotential Win: ₦${potentialWin.toFixed(0)}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              await engagementApi.placeBet({
                predictionId: selectedPrediction,
                optionId: selectedScore || selectedPrediction,
                amount: parseFloat(stake) || 0,
              });
              Alert.alert('Success', 'Your prediction has been placed!', [
                { text: 'OK', onPress: () => router.back() },
              ]);
            } catch (error: unknown) {
              logger.error('Failed to place prediction:', error);
              const message = error instanceof Error ? error.message : 'Failed to place prediction';
              Alert.alert('Error', message);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#1A0A0A' : '#ffffff' }]}>
      <ScrollView style={[styles.container, { backgroundColor: isDark ? '#1A0A0A' : '#ffffff' }]}>
        <View style={styles.header}>
          <TouchableOpacity accessibilityRole="button" style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: isDark ? '#ffffff' : '#1A0A0A' }]}>
            Make Prediction
          </Text>
        </View>

        <View style={[styles.matchHeader, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
          <View style={styles.matchLeague}>
            <Text style={styles.leagueText}>{matchInfo.league}</Text>
            <Text style={styles.matchTime}>{matchInfo.time}</Text>
          </View>
          <View style={styles.matchTeamsRow}>
            <View style={styles.teamColumn}>
              <Text style={styles.teamEmojiLarge}>{matchInfo.emojiHome}</Text>
              <Text style={[styles.teamNameLarge, { color: isDark ? '#fff' : '#000' }]}>
                {matchInfo.home}
              </Text>
            </View>
            <View style={styles.vsContainer}>
              <Text style={styles.vsText}>VS</Text>
            </View>
            <View style={[styles.teamColumn, styles.teamColumnRight]}>
              <Text style={styles.teamEmojiLarge}>{matchInfo.emojiAway}</Text>
              <Text style={[styles.teamNameLarge, { color: isDark ? '#fff' : '#000' }]}>
                {matchInfo.away}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#1A0A0A' }]}>
            Match Result
          </Text>
          <View style={styles.predictionRow}>
            {predictionOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.predictionCard,
                  { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' },
                  selectedPrediction === option.id && styles.predictionCardSelected,
                ]}
                onPress={() => handlePredictionSelect(option.id)}
              >
                <Text style={[styles.predictionLabel, { color: isDark ? '#fff' : '#000' }]}>
                  {option.label}
                </Text>
                <Text style={styles.predictionOdds}>{option.odds.toFixed(2)}</Text>
                {selectedPrediction === option.id && (
                  <View style={styles.selectedCheck}>
                    <Text style={styles.checkMark}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#1A0A0A' }]}>
            Correct Score (Optional)
          </Text>
          <View style={styles.scoreGrid}>
            {scoreOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.scoreCard,
                  { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' },
                  selectedScore === option.id && styles.scoreCardSelected,
                ]}
                onPress={() => handleScoreSelect(option.id)}
              >
                <Text style={[styles.scoreLabel, { color: isDark ? '#fff' : '#000' }]}>
                  {option.label}
                </Text>
                <Text style={styles.scoreOdds}>@{option.odds.toFixed(1)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#1A0A0A' }]}>
            Extra Predictions
          </Text>
          {[
            {
              id: 'btts_yes',
              label: 'Both Teams to Score',
              options: ['Yes', 'No'],
              odds: { yes: 1.8, no: 1.9 } as Record<string, number>,
            },
            {
              id: 'over_25',
              label: 'Over 2.5 Goals',
              options: ['Over', 'Under'],
              odds: { over: 2.0, under: 1.8 } as Record<string, number>,
            },
          ].map((extra) => (
            <View
              key={extra.id}
              style={[styles.extraCard, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}
            >
              <Text style={[styles.extraTitle, { color: isDark ? '#fff' : '#000' }]}>
                {extra.label}
              </Text>
              <View style={styles.extraOptions}>
                <TouchableOpacity
                  style={[
                    styles.extraOption,
                    extraSelections[extra.id] === extra.options[0] && styles.extraOptionSelected,
                  ]}
                  onPress={() => handleExtraSelect(extra.id, extra.options[0])}
                >
                  <Text style={styles.extraOptionText}>{extra.options[0]}</Text>
                  <Text style={styles.extraOdds}>
                    @
                    {(extra.odds as Record<string, number>)[
                      extra.options[0].toLowerCase() as string
                    ] || 1.8}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.extraOption,
                    extraSelections[extra.id] === extra.options[1] && styles.extraOptionSelected,
                  ]}
                  onPress={() => handleExtraSelect(extra.id, extra.options[1])}
                >
                  <Text style={styles.extraOptionText}>{extra.options[1]}</Text>
                  <Text style={styles.extraOdds}>
                    @
                    {(extra.odds as Record<string, number>)[
                      extra.options[1].toLowerCase() as string
                    ] || 1.9}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.stakeSection}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#1A0A0A' }]}>
            Your Stake
          </Text>
          <View style={styles.stakeInputRow}>
            <View style={[styles.stakeInput, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
              <Text style={styles.currencySymbol}>₦</Text>
              <TextInput
                style={[styles.stakeInputText, { color: isDark ? '#fff' : '#000' }]}
                value={stake}
                onChangeText={handleStakeChange}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#666"
              />
            </View>
            <View style={styles.quickStakes}>
              {['500', '1000', '2500', '5000'].map((amount) => (
                <TouchableOpacity
                  key={amount}
                  style={[
                    styles.quickStakeButton,
                    { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' },
                  ]}
                  onPress={() => handleStakeChange(amount)}
                >
                  <Text style={[styles.quickStakeText, { color: isDark ? '#fff' : '#000' }]}>
                    ₦{amount}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <View
          style={[styles.potentialWinCard, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}
        >
          <Text style={styles.potentialWinLabel}>Potential Win</Text>
          <Text style={styles.potentialWinAmount}>₦{potentialWin.toFixed(0)}</Text>
        </View>

        <View style={styles.submitSection}>
          <TouchableOpacity
            style={[styles.submitButton, !selectedPrediction && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={!selectedPrediction}
          >
            <Text style={styles.submitButtonText}>Place Prediction</Text>
          </TouchableOpacity>
          <Text style={styles.termsText}>
            By placing this prediction, you agree to our Terms & Conditions
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  matchHeader: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  matchLeague: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  leagueText: {
    color: colors.error[500],
    fontSize: 12,
    fontWeight: '600',
  },
  matchTime: {
    color: colors.text.secondary,
    fontSize: 12,
  },
  matchTeamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  teamColumn: {
    alignItems: 'center',
  },
  teamColumnRight: {
    alignItems: 'center',
  },
  teamEmojiLarge: {
    fontSize: 48,
    marginBottom: 8,
  },
  teamNameLarge: {
    fontSize: 16,
    fontWeight: '700',
  },
  vsContainer: {
    paddingHorizontal: 20,
  },
  vsText: {
    color: colors.text.secondary,
    fontSize: 18,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  predictionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  predictionCard: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  predictionCardSelected: {
    borderColor: colors.error[500],
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
  },
  predictionLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  predictionOdds: {
    color: colors.error[500],
    fontSize: 16,
    fontWeight: '700',
  },
  selectedCheck: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.error[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  scoreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  scoreCard: {
    width: '23%',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  scoreCardSelected: {
    borderColor: colors.error[500],
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
  },
  scoreLabel: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  scoreOdds: {
    color: colors.text.secondary,
    fontSize: 10,
  },
  extraCard: {
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
  },
  extraTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  extraOptions: {
    flexDirection: 'row',
    gap: 10,
  },
  extraOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 8,
    backgroundColor: colors.bg.tertiary,
    gap: 8,
  },
  extraOptionSelected: {
    backgroundColor: colors.error[500],
  },
  extraOptionText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  extraOdds: {
    color: colors.neutral[300],
    fontSize: 11,
  },
  stakeSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  stakeInputRow: {
    gap: 12,
  },
  stakeInput: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    gap: 8,
  },
  currencySymbol: {
    color: colors.error[500],
    fontSize: 20,
    fontWeight: '700',
  },
  stakeInputText: {
    fontSize: 24,
    fontWeight: '700',
    flex: 1,
  },
  quickStakes: {
    flexDirection: 'row',
    gap: 8,
  },
  quickStakeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  quickStakeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  potentialWinCard: {
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  potentialWinLabel: {
    color: colors.text.secondary,
    fontSize: 14,
    marginBottom: 4,
  },
  potentialWinAmount: {
    color: '#10B981',
    fontSize: 32,
    fontWeight: '700',
  },
  submitSection: {
    paddingHorizontal: 16,
    marginBottom: 30,
  },
  submitButton: {
    backgroundColor: colors.error[500],
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  termsText: {
    color: colors.text.secondary,
    fontSize: 11,
    textAlign: 'center',
  },
});
