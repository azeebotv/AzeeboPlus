import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import type { NavigationProp } from '@react-navigation/native';
import { apiClient } from '@azeebo/react-data/api/client';
import { AgbalaQuizQuestion } from '../components/AgbalaQuizQuestion';
import { colors, typography, spacing } from '../../../../theme';
import type { AgbalaStackParamList } from '../types';

type QuizNavigationProp = NavigationProp<AgbalaStackParamList, 'AgbalaQuiz'>;

interface QuestionItem {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex?: number;
  explanation?: string;
}

export default function AgbalaQuizScreen({ navigation }: { navigation: QuizNavigationProp }) {
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);

  useEffect(() => {
    async function loadQuiz() {
      try {
        setLoading(true);
        const res = await apiClient.get<{ success: boolean; data: { questions: QuestionItem[] } }>(
          '/api/vertical/quiz'
        );
        if (res?.success && Array.isArray(res.data?.questions) && res.data.questions.length > 0) {
          setQuestions(res.data.questions);
        } else {
          const direct = await apiClient.get<{ questions: QuestionItem[] }>('/v1/vertical/quiz');
          if (Array.isArray(direct?.questions)) setQuestions(direct.questions);
        }
      } catch {
        // Handled
      } finally {
        setLoading(false);
      }
    }
    loadQuiz();
  }, []);

  const handleAnswer = (answerIndex: number) => {
    const newAnswers = [...answers, answerIndex];
    setAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      navigation.navigate('AgbalaQuizResult', { answers: newAnswers });
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
        <Text style={[styles.progressText, { marginTop: 12 }]}>Consulting the Oracle...</Text>
      </View>
    );
  }

  if (questions.length === 0) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
        <Text style={{ color: colors.text.primary, fontSize: 18, fontWeight: '700', marginBottom: 8 }}>
          No Active Trials
        </Text>
        <Text style={{ color: colors.text.secondary, textAlign: 'center' }}>
          Check back shortly for new storyworld quizzes.
        </Text>
      </View>
    );
  }

  const q = questions[currentQuestion];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.progress}>
        <Text style={styles.progressText}>
          Question {currentQuestion + 1} of {questions.length}
        </Text>
      </View>

      <AgbalaQuizQuestion
        question={q.question}
        questionNumber={currentQuestion + 1}
        totalQuestions={questions.length}
        options={q.options.map((text, index) => ({
          id: `opt-${currentQuestion}-${index}`,
          text,
        }))}
        onOptionSelect={(optionId) => {
          const index = parseInt(optionId.split('-').pop() || '0', 10);
          handleAnswer(index);
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  progress: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  progressText: {
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
  },
});
