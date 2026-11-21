import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { apiClient } from '@azeebo/react-data/api/client';
import {
  FocusableButton,
  FocusableCard,
} from '../src/components/Focusable';
import { LoadingState, ErrorState } from '../src/components/StateContainers';
import { colors, tvTypography, tvSpacing } from '../src/theme';

interface GameQuestion {
  id: string;
  question: string;
  options: string[];
  category?: string;
  points: number;
}

export default function TVGamesScreen() {
  const router = useRouter();
  const [questions, setQuestions] = useState<GameQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTriviaQuestions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<{ success: boolean; data: GameQuestion[] }>('/api/games/trivia');
      if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
        setQuestions(res.data);
      } else {
        const fallbackRes = await apiClient.get<{ questions: GameQuestion[] }>('/games/trivia');
        if (fallbackRes?.questions?.length > 0) {
          setQuestions(fallbackRes.questions);
        }
      }
    } catch {
      setError('Unable to load trivia questions');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTriviaQuestions();
  }, [loadTriviaQuestions]);

  const handleSelectOption = (idx: number) => {
    if (answered) return;
    setSelectedOpt(idx);
    setAnswered(true);
    // Add points
    setScore((prev) => prev + (questions[currentIdx]?.points || 100));
  };

  const handleNextQuestion = () => {
    setSelectedOpt(null);
    setAnswered(false);
    if (currentIdx < questions.length - 1) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      setCurrentIdx(0);
    }
  };

  if (isLoading && questions.length === 0) {
    return <LoadingState text="Loading Azeebo TV Arcade..." />;
  }

  if (error && questions.length === 0) {
    return <ErrorState description={error} onRetry={() => void loadTriviaQuestions()} />;
  }

  const q = questions[currentIdx];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.topBar}>
        <FocusableButton
          title="← Back to Home"
          variant="secondary"
          onPress={() => router.push('/' as Href)}
          hasTVPreferredFocus
        />
        <View style={styles.scoreBadge}>
          <Text style={styles.scoreText}>🏆 SCORE: {score} PTS</Text>
        </View>
      </View>

      <View style={styles.heroSection}>
        <Text style={styles.title}>Games & Live Trivia</Text>
        <Text style={styles.subtitle}>
          Play live along with your TV remote, answer quiz questions in real time, and climb the national leaderboard.
        </Text>
      </View>

      {q && (
        <View style={styles.triviaContainer}>
          <View style={styles.questionHeader}>
            <Text style={styles.questionCategory}>{q.category || 'POP CULTURE'} • {q.points || 100} PTS</Text>
            <Text style={styles.questionCounter}>Question {currentIdx + 1} of {questions.length}</Text>
          </View>

          <Text style={styles.questionText}>{q.question}</Text>

          <View style={styles.optionsGrid}>
            {q.options.map((opt, idx) => {
              const isSelected = selectedOpt === idx;
              return (
                <FocusableCard
                  key={`${q.id}-${idx}`}
                  style={[
                    styles.optionCard,
                    isSelected && styles.optionCardSelected,
                  ]}
                  onPress={() => handleSelectOption(idx)}
                >
                  <Text style={styles.optionIndex}>{String.fromCharCode(65 + idx)}</Text>
                  <Text style={styles.optionLabel}>{opt}</Text>
                </FocusableCard>
              );
            })}
          </View>

          {answered && (
            <View style={styles.nextContainer}>
              <FocusableButton
                title={currentIdx < questions.length - 1 ? "Next Question →" : "Play Again ↻"}
                variant="primary"
                onPress={handleNextQuestion}
              />
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  content: {
    padding: tvSpacing.xxl,
    paddingBottom: tvSpacing.section,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tvSpacing.xl,
  },
  scoreBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  scoreText: {
    color: '#F59E0B',
    fontSize: tvTypography.fontSize.xl,
    fontWeight: '800',
  },
  heroSection: {
    marginBottom: tvSpacing.xl,
  },
  title: {
    fontSize: tvTypography.fontSize.xxl,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: tvSpacing.sm,
  },
  subtitle: {
    fontSize: tvTypography.fontSize.xl,
    color: colors.text.secondary,
    maxWidth: 900,
  },
  triviaContainer: {
    backgroundColor: colors.bg.secondary,
    borderRadius: 16,
    padding: tvSpacing.xl,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: tvSpacing.md,
  },
  questionCategory: {
    color: colors.primary[500],
    fontSize: tvTypography.fontSize.lg,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  questionCounter: {
    color: colors.text.secondary,
    fontSize: tvTypography.fontSize.base,
    fontWeight: '600',
  },
  questionText: {
    color: colors.text.primary,
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 38,
    marginBottom: tvSpacing.xl,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tvSpacing.md,
    marginBottom: tvSpacing.lg,
  },
  optionCard: {
    width: '48%',
    backgroundColor: colors.bg.tertiary,
    borderRadius: 12,
    padding: tvSpacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: tvSpacing.md,
  },
  optionCardSelected: {
    borderColor: '#10B981',
    borderWidth: 2,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  optionIndex: {
    color: colors.primary[500],
    fontSize: 22,
    fontWeight: '800',
  },
  optionLabel: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  nextContainer: {
    marginTop: tvSpacing.md,
    alignItems: 'flex-start',
  },
});
