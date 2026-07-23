import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { apiClient } from '../../src/api';
import { logger } from '../../src/utils/logger';
import { LoadingState, ErrorState, EmptyState } from '../../src/components/StateContainers';
import { analytics } from '../../src/utils/analytics';

interface GameQuestion {
  id: number;
  question: string;
  options: string[];
  correct: string;
}

export default function GameplayScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [questions, setQuestions] = useState<GameQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQuestions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<{ questions: GameQuestion[] }>('/games/trivia');
      if (response?.questions?.length) {
        setQuestions(response.questions);
      } else {
        setError('No game questions available');
      }
    } catch (err: unknown) {
      logger.error('Failed to load game:', err);
      const message = err instanceof Error ? err.message : 'Failed to load game';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [timeLeft]);

  const handleAnswer = (answer: string) => {
    if (selectedAnswer) return;
    setSelectedAnswer(answer);
    const correct = answer === questions[currentQuestion].correct;
    setIsCorrect(correct);
    if (correct) setScore(score + 100);
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setIsCorrect(null);
    }
  };

  const handlePlayAgain = () => {
    setScore(0);
    setTimeLeft(60);
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setIsCorrect(null);
  };

  const isGameOver = timeLeft === 0 || (currentQuestion === questions.length - 1 && selectedAnswer);

  useEffect(() => {
    if (isGameOver) {
      try { analytics.gameCompleted('trivia', score, 60 - timeLeft); } catch {}
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGameOver]);

  if (isLoading) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: colorScheme === 'dark' ? '#1A0A0A' : '#ffffff' },
        ]}
      >
        <LoadingState text="Loading game..." />
      </View>
    );
  }

  if (error) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: colorScheme === 'dark' ? '#1A0A0A' : '#ffffff' },
        ]}
      >
        <ErrorState description={error} onRetry={fetchQuestions} />
      </View>
    );
  }

  if (questions.length === 0) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: colorScheme === 'dark' ? '#1A0A0A' : '#ffffff' },
        ]}
      >
        <EmptyState icon="🎮" title="No Games" description="No trivia games available right now." />
      </View>
    );
  }

  return (
    <ScrollView
      style={[
        styles.container,
        { backgroundColor: colorScheme === 'dark' ? '#1A0A0A' : '#ffffff' },
      ]}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} accessibilityLabel="Go back" accessibilityRole="button">
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerStats}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Score</Text>
            <Text style={styles.statValue}>{score}</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Time</Text>
            <Text style={[styles.statValue, timeLeft <= 10 && { color: '#EF4444' }]}>
              {timeLeft}s
            </Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Round</Text>
            <Text style={styles.statValue}>
              {currentQuestion + 1}/{questions.length}
            </Text>
          </View>
        </View>
      </View>

      {!isGameOver ? (
        <>
          <View style={styles.questionSection}>
            <Text
              style={[styles.question, { color: colorScheme === 'dark' ? '#ffffff' : '#1A0A0A' }]}
            >
              {questions[currentQuestion].question}
            </Text>
          </View>

          <View style={styles.optionsSection}>
            {questions[currentQuestion].options.map((option) => (
              <TouchableOpacity
                key={option}
                onPress={() => handleAnswer(option)}
                disabled={selectedAnswer !== null}
                accessibilityLabel={`Answer: ${option}`}
                accessibilityRole="button"
                accessibilityState={{ disabled: selectedAnswer !== null }}
                style={[
                  styles.optionButton,
                  selectedAnswer === option && isCorrect && { backgroundColor: '#22C55E' },
                  selectedAnswer === option && !isCorrect && { backgroundColor: '#EF4444' },
                  selectedAnswer !== option &&
                    isCorrect &&
                    option === questions[currentQuestion].correct && { backgroundColor: '#22C55E' },
                  selectedAnswer !== null &&
                    selectedAnswer !== option &&
                    option !== questions[currentQuestion].correct && { opacity: 0.5 },
                ]}
              >
                <Text style={[styles.optionText, selectedAnswer === option && { color: '#fff' }]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {selectedAnswer && (
            <TouchableOpacity onPress={handleNext} style={styles.nextButton} accessibilityLabel={currentQuestion < questions.length - 1 ? 'Next question' : 'See results'} accessibilityRole="button">
              <Text style={styles.nextText}>
                {currentQuestion < questions.length - 1 ? 'Next Question' : 'See Results'}
              </Text>
            </TouchableOpacity>
          )}
        </>
      ) : (
        <View style={styles.resultsSection}>
          <Text style={styles.resultsTitle}>🎉 Game Over!</Text>
          <View style={styles.resultsScore}>
            <Text style={styles.scoreLabel}>Final Score</Text>
            <Text style={styles.scoreValue}>{score}</Text>
          </View>
          <View style={styles.resultsStats}>
            <View style={styles.resultStat}>
              <Text style={styles.resultStatValue}>
                {Math.round((score / (questions.length * 100)) * 100)}%
              </Text>
              <Text style={styles.resultStatLabel}>Accuracy</Text>
            </View>
            <View style={styles.resultStat}>
              <Text style={styles.resultStatValue}>{questions.length}</Text>
              <Text style={styles.resultStatLabel}>Questions</Text>
            </View>
          </View>
          <TouchableOpacity onPress={handlePlayAgain} style={styles.playAgainButton} accessibilityLabel="Play again" accessibilityRole="button">
            <Text style={styles.playAgainText}>Play Again</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    backgroundColor: '#1a1a1a',
    padding: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  backIcon: {
    color: '#fff',
    fontSize: 20,
  },
  headerStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stat: {
    alignItems: 'center',
  },
  statLabel: {
    color: '#888',
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  questionSection: {
    padding: 20,
  },
  question: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 1.5,
  },
  optionsSection: {
    padding: 16,
    gap: 12,
  },
  optionButton: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  nextButton: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#E8420A',
    alignItems: 'center',
  },
  nextText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsSection: {
    padding: 32,
    alignItems: 'center',
  },
  resultsTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#E8420A',
    marginBottom: 24,
  },
  resultsScore: {
    alignItems: 'center',
    marginBottom: 24,
  },
  scoreLabel: {
    fontSize: 16,
    color: '#888',
    marginBottom: 8,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: '700',
    color: '#E8420A',
  },
  resultsStats: {
    flexDirection: 'row',
    gap: 48,
    marginBottom: 32,
  },
  resultStat: {
    alignItems: 'center',
  },
  resultStatValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#E8420A',
    marginBottom: 4,
  },
  resultStatLabel: {
    fontSize: 14,
    color: '#888',
  },
  playAgainButton: {
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 30,
    backgroundColor: '#E8420A',
  },
  playAgainText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
