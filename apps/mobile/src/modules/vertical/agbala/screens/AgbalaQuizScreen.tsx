import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import type { NavigationProp } from '@react-navigation/native';
import { AgbalaQuizQuestion } from '../components/AgbalaQuizQuestion';
import { colors, typography, spacing } from '../../../../theme';
import type { AgbalaStackParamList } from '../types';

type QuizNavigationProp = NavigationProp<AgbalaStackParamList, 'AgbalaQuiz'>;

const SAMPLE_QUESTIONS = [
  {
    id: 'q1',
    question: 'When faced with a moral dilemma, what is your first instinct?',
    options: [
      'Stand firm in your principles',
      'Seek counsel from wise advisors',
      'Find a creative solution others miss',
      'Protect those who cannot protect themselves',
    ],
    correctAnswerIndex: 0,
    explanation: '',
  },
  {
    id: 'q2',
    question: 'Which element resonates with your spirit?',
    options: [
      'Fire - passion and transformation',
      'Water - adaptability and depth',
      'Air - freedom and intellect',
      'Earth - stability and growth',
    ],
    correctAnswerIndex: 0,
    explanation: '',
  },
];

export default function AgbalaQuizScreen({ navigation }: { navigation: QuizNavigationProp }) {
  const [currentQuestion, setCurrentQuestion] = React.useState(0);
  const [answers, setAnswers] = React.useState<number[]>([]);

  const handleAnswer = (answerIndex: number) => {
    const newAnswers = [...answers, answerIndex];
    setAnswers(newAnswers);

    if (currentQuestion < SAMPLE_QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      navigation.navigate('AgbalaQuizResult', { answers: newAnswers });
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.progress}>
        <Text style={styles.progressText}>
          Question {currentQuestion + 1} of {SAMPLE_QUESTIONS.length}
        </Text>
      </View>

      <AgbalaQuizQuestion
        question={SAMPLE_QUESTIONS[currentQuestion].question}
        questionNumber={currentQuestion + 1}
        totalQuestions={SAMPLE_QUESTIONS.length}
        options={SAMPLE_QUESTIONS[currentQuestion].options.map((text, index) => ({
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
