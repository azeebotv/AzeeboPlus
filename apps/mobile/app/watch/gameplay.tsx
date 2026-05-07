import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useColorScheme } from 'react-native';

export default function GameplayScreen() {
  const colorScheme = useColorScheme();
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const questions = [
    {
      id: 1,
      question: 'What is the capital of Nigeria?',
      options: ['Abuja', 'Lagos', 'Kano', 'Port Harcourt'],
      correct: 'Abuja',
    },
    {
      id: 2,
      question: 'Who won the 2022 World Cup?',
      options: ['Brazil', 'Argentina', 'France', 'Germany'],
      correct: 'Argentina',
    },
    {
      id: 3,
      question: 'What is the largest ocean?',
      options: ['Atlantic', 'Indian', 'Pacific', 'Arctic'],
      correct: 'Pacific',
    },
  ];

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
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

  return (
    <ScrollView style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#0a0a0a' : '#ffffff' }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerStats}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Score</Text>
            <Text style={styles.statValue}>{score}</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Time</Text>
            <Text style={[styles.statValue, timeLeft <= 10 && { color: '#EF4444' }]}>{timeLeft}s</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Round</Text>
            <Text style={styles.statValue}>{currentQuestion + 1}/{questions.length}</Text>
          </View>
        </View>
      </View>

      {!isGameOver ? (
        <>
          <View style={styles.questionSection}>
            <Text style={[styles.question, { color: colorScheme === 'dark' ? '#ffffff' : '#000000' }]}>
              {questions[currentQuestion].question}
            </Text>
          </View>

          <View style={styles.optionsSection}>
            {questions[currentQuestion].options.map((option) => (
              <TouchableOpacity
                key={option}
                onPress={() => handleAnswer(option)}
                disabled={selectedAnswer !== null}
                style={[
                  styles.optionButton,
                  selectedAnswer === option && isCorrect && { backgroundColor: '#22C55E' },
                  selectedAnswer === option && !isCorrect && { backgroundColor: '#EF4444' },
                  selectedAnswer !== option && isCorrect && option === questions[currentQuestion].correct && { backgroundColor: '#22C55E' },
                  selectedAnswer !== null && selectedAnswer !== option && option !== questions[currentQuestion].correct && { opacity: 0.5 },
                ]}
              >
                <Text style={[styles.optionText, selectedAnswer === option && { color: '#fff' }]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {selectedAnswer && (
            <TouchableOpacity onPress={handleNext} style={styles.nextButton}>
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
              <Text style={styles.resultStatValue}>{Math.round((score / (questions.length * 100)) * 100)}%</Text>
              <Text style={styles.resultStatLabel}>Accuracy</Text>
            </View>
            <View style={styles.resultStat}>
              <Text style={styles.resultStatValue}>{questions.length}</Text>
              <Text style={styles.resultStatLabel}>Questions</Text>
            </View>
          </View>
          <TouchableOpacity onPress={handlePlayAgain} style={styles.playAgainButton}>
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
    backgroundColor: '#8B5CF6',
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
    color: '#8B5CF6',
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
    color: '#8B5CF6',
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
    color: '#8B5CF6',
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
    backgroundColor: '#8B5CF6',
  },
  playAgainText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
