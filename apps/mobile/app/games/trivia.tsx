import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle, TextStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { apiClient } from '../../src/api';
import { LoadingState, EmptyState, ErrorState } from '../../src/components/StateContainers';

interface TriviaQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  category: string;
  difficulty: string;
}

export default function TriviaScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const isDark = colorScheme === 'dark';
  const [questions, setQuestions] = useState<TriviaQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const fetchQuestions = async () => {
      setIsLoading(true);
      try {
        const res = await apiClient.get<TriviaQuestion[]>('/games/trivia');
        setQuestions(Array.isArray(res) ? res : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load trivia');
      } finally {
        setIsLoading(false);
      }
    };
    fetchQuestions();
  }, []);

  useEffect(() => {
    if (isLoading || isGameOver || !questions.length) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, isLoading, isGameOver, questions.length]);

  const handleTimeout = () => {
    setShowResult(true);
    setStreak(0);
    setTimeout(() => nextQuestion(), 2000);
  };

  const handleAnswer = (index: number) => {
    if (selectedAnswer !== null || showResult) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setSelectedAnswer(index);
    setShowResult(true);
    const correct = questions[currentIndex].correctAnswer === index;
    if (correct) {
      setScore((prev) => prev + 100 + streak * 10);
      setStreak((prev) => prev + 1);
    } else {
      setStreak(0);
    }
    setTimeout(() => nextQuestion(), 2000);
  };

  const nextQuestion = () => {
    if (currentIndex + 1 >= questions.length) {
      setIsGameOver(true);
    } else {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setTimeLeft(30);
    }
  };

  const restart = () => {
    setCurrentIndex(0);
    setScore(0);
    setStreak(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setTimeLeft(30);
    setIsGameOver(false);
  };

  if (isLoading)
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#1A0A0A' : '#ffffff' }]}>
        <LoadingState text="Loading trivia..." />
      </SafeAreaView>
    );
  if (error)
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#1A0A0A' : '#ffffff' }]}>
        <ErrorState description={error} onRetry={() => {}} />
      </SafeAreaView>
    );
  if (!questions.length)
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#1A0A0A' : '#ffffff' }]}>
        <EmptyState icon="🧠" title="No trivia" description="Trivia will be available soon" />
      </SafeAreaView>
    );

  if (isGameOver) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#1A0A0A' : '#ffffff' }]}>
        <View style={styles.gameOverContainer}>
          <Text style={styles.gameOverEmoji}>🏆</Text>
          <Text style={[styles.gameOverTitle, { color: isDark ? '#fff' : '#000' }]}>
            Game Over!
          </Text>
          <Text style={styles.gameOverScore}>Score: {score}</Text>
          <Text style={styles.gameOverQuestions}>Questions: {questions.length}</Text>
          <View style={styles.gameOverButtons}>
            <TouchableOpacity style={styles.playAgainButton} onPress={restart}>
              <Text style={styles.playAgainText}>Play Again</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.exitButton} onPress={() => router.back()}>
              <Text style={styles.exitText}>Exit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const question = questions[currentIndex];
  const timerColor = timeLeft > 10 ? '#22C55E' : timeLeft > 5 ? '#F59E0B' : '#EF4444';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#1A0A0A' : '#ffffff' }]}>
      <View style={styles.gameHeader}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.exitIcon}>✕</Text>
        </TouchableOpacity>
        <View style={styles.gameStats}>
          <Text style={styles.scoreText}>Score: {score}</Text>
          <Text style={styles.streakText}>🔥 {streak}</Text>
        </View>
        <View style={[styles.timerCircle, { borderColor: timerColor }]}>
          <Text style={[styles.timerText, { color: timerColor }]}>{timeLeft}</Text>
        </View>
      </View>

      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            { width: `${((currentIndex + 1) / questions.length) * 100}%` },
          ]}
        />
      </View>
      <Text style={styles.questionCount}>
        {currentIndex + 1} / {questions.length}
      </Text>

      <View style={styles.questionContainer}>
        <Text style={[styles.questionText, { color: isDark ? '#fff' : '#000' }]}>
          {question.question}
        </Text>
      </View>

      <View style={styles.optionsContainer}>
        {question.options.map((option, index) => {
          let optionStyle: ViewStyle = styles.option;
          let textStyle: TextStyle = styles.optionText;
          if (showResult) {
            if (index === question.correctAnswer) {
              optionStyle = { ...styles.option, ...styles.optionCorrect };
              textStyle = { ...styles.optionText, ...styles.optionTextCorrect };
            } else if (index === selectedAnswer) {
              optionStyle = { ...styles.option, ...styles.optionIncorrect };
              textStyle = { ...styles.optionText, ...styles.optionTextIncorrect };
            }
          }
          return (
            <TouchableOpacity
              key={index}
              style={optionStyle}
              onPress={() => handleAnswer(index)}
              disabled={showResult}
            >
              <Text style={textStyle}>{option}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {showResult && (
        <View style={styles.resultBanner}>
          <Text style={styles.resultText}>
            {selectedAnswer === question.correctAnswer ? '🎉 Correct!' : '❌ Wrong!'}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gameHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 50,
  },
  exitIcon: { color: '#888', fontSize: 24 },
  gameStats: { flexDirection: 'row', gap: 16 },
  scoreText: { color: '#DDA0DD', fontSize: 16, fontWeight: '700' },
  streakText: { color: '#F59E0B', fontSize: 16, fontWeight: '700' },
  timerCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerText: { fontSize: 20, fontWeight: '700' },
  progressBar: { height: 4, backgroundColor: '#2a2a2a', marginHorizontal: 16, borderRadius: 2 },
  progressFill: { height: 4, backgroundColor: '#DDA0DD', borderRadius: 2 },
  questionCount: {
    color: '#888',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  questionContainer: { paddingHorizontal: 24, marginBottom: 32 },
  questionText: { fontSize: 20, fontWeight: '700', textAlign: 'center', lineHeight: 28 },
  optionsContainer: { paddingHorizontal: 16, gap: 12 },
  option: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#1a1a1a',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionCorrect: { borderColor: '#22C55E', backgroundColor: 'rgba(34, 197, 94, 0.1)' },
  optionIncorrect: { borderColor: '#EF4444', backgroundColor: 'rgba(239, 68, 68, 0.1)' },
  optionText: { color: '#fff', fontSize: 16, fontWeight: '600', textAlign: 'center' },
  optionTextCorrect: { color: '#22C55E' },
  optionTextIncorrect: { color: '#EF4444' },
  resultBanner: { padding: 16, alignItems: 'center' },
  resultText: { fontSize: 18, fontWeight: '700' },
  gameOverContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  gameOverEmoji: { fontSize: 80, marginBottom: 20 },
  gameOverTitle: { fontSize: 28, fontWeight: '700', marginBottom: 12 },
  gameOverScore: { color: '#DDA0DD', fontSize: 24, fontWeight: '700', marginBottom: 8 },
  gameOverQuestions: { color: '#888', fontSize: 16, marginBottom: 32 },
  gameOverButtons: { flexDirection: 'row', gap: 16 },
  playAgainButton: {
    backgroundColor: '#DDA0DD',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 10,
  },
  playAgainText: { color: '#000', fontSize: 16, fontWeight: '700' },
  exitButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#888',
  },
  exitText: { color: '#888', fontSize: 16, fontWeight: '600' },
});
