'use client';

import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@azeebo/react-data/api/client';
import { colors } from '../../src/theme';
import { LoadingState, EmptyState } from '../../src/components/StateContainers';

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer?: number;
  correctAnswerIndex?: number;
  explanation?: string;
}

interface QuizData {
  id: string;
  title: string;
  description?: string;
  questions: QuizQuestion[];
}

const PATHS = [
  {
    id: 'warrior',
    name: 'Warrior',
    description: 'Strength, honor, and combat mastery',
    emoji: '⚔️',
    color: '#EF4444',
  },
  {
    id: 'sage',
    name: 'Sage',
    description: 'Wisdom, knowledge, and ancient truths',
    emoji: '📜',
    color: '#8B5CF6',
  },
  {
    id: 'trickster',
    name: 'Trickster',
    description: 'Cunning, deception, and stealth survival',
    emoji: '🎭',
    color: '#F59E0B',
  },
  {
    id: 'healer',
    name: 'Healer',
    description: 'Compassion, spiritual restoration, and harmony',
    emoji: '🌿',
    color: '#10B981',
  },
];

export default function AgbalaQuizScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [completed, setCompleted] = useState(false);

  const quizQuery = useQuery({
    queryKey: ['vertical', 'quiz'],
    queryFn: async () => {
      try {
        const res = await apiClient.get<{ success: boolean; data: QuizData }>('/api/vertical/quiz');
        if (res?.success && res.data?.questions?.length > 0) return res.data;
      } catch {
        // Fallback route
      }
      try {
        const direct = await apiClient.get<QuizData>('/v1/vertical/quiz');
        if (direct?.questions?.length > 0) return direct;
      } catch {
        // Handled
      }
      return null;
    },
    staleTime: 60_000,
  });

  const quiz = quizQuery.data;
  const questions = quiz?.questions ?? [];

  const handleSelectOption = (optIndex: number) => {
    const updated = [...selectedAnswers, optIndex];
    setSelectedAnswers(updated);

    if (currentIdx < questions.length - 1) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      setCompleted(true);
    }
  };

  const resetQuiz = () => {
    setCurrentIdx(0);
    setSelectedAnswers([]);
    setCompleted(false);
  };

  const assignedPath = PATHS[selectedAnswers.length > 0 ? selectedAnswers[selectedAnswers.length - 1] % PATHS.length : 0];

  const themeStyles = createStyles(isDark);

  if (quizQuery.isLoading) {
    return <LoadingState text="Summoning the Oracle of Agbala..." />;
  }

  if (!quiz || questions.length === 0) {
    return (
      <SafeAreaView style={themeStyles.container} edges={['top']}>
        <View style={themeStyles.header}>
          <TouchableOpacity onPress={() => router.back()} style={themeStyles.backButton}>
            <Text style={themeStyles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={themeStyles.headerTitle}>Agbala Storyworld Quiz</Text>
        </View>
        <EmptyState
          icon="🔮"
          title="Oracle is Resting"
          description="The Agbala spiritual trials are currently compiling. Please check back soon!"
        />
      </SafeAreaView>
    );
  }

  if (completed) {
    return (
      <SafeAreaView style={themeStyles.container} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={themeStyles.resultContainer}>
          <Text style={themeStyles.resultEmoji}>{assignedPath.emoji}</Text>
          <Text style={themeStyles.resultSubtitle}>THE ORACLE HAS SPOKEN</Text>
          <Text style={[themeStyles.resultTitle, { color: assignedPath.color }]}>
            {assignedPath.name}
          </Text>
          <Text style={themeStyles.resultDesc}>{assignedPath.description}</Text>

          <View style={themeStyles.statsBox}>
            <Text style={themeStyles.statsLabel}>Trial Questions Answered</Text>
            <Text style={themeStyles.statsValue}>{questions.length} / {questions.length}</Text>
          </View>

          <TouchableOpacity
            style={[themeStyles.primaryButton, { backgroundColor: assignedPath.color }]}
            onPress={() => {
              Alert.alert('Oath Bound', 'Your destiny is recorded in the Agbala canon archives.');
              router.push('/vertical');
            }}
          >
            <Text style={themeStyles.primaryButtonText}>Enter Storyworld</Text>
          </TouchableOpacity>

          <TouchableOpacity style={themeStyles.secondaryButton} onPress={resetQuiz}>
            <Text style={themeStyles.secondaryButtonText}>Retake Trial</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const q = questions[currentIdx];

  return (
    <SafeAreaView style={themeStyles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={themeStyles.header}>
        <TouchableOpacity onPress={() => router.back()} style={themeStyles.backButton}>
          <Text style={themeStyles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={themeStyles.headerTitle}>{quiz.title || 'Agbala Trial'}</Text>
        <Text style={themeStyles.progressCounter}>
          {currentIdx + 1} / {questions.length}
        </Text>
      </View>

      {/* Progress Bar */}
      <View style={themeStyles.progressTrack}>
        <View
          style={[
            themeStyles.progressBar,
            { width: `${((currentIdx + 1) / questions.length) * 100}%` },
          ]}
        />
      </View>

      <ScrollView contentContainerStyle={themeStyles.questionContainer}>
        <Text style={themeStyles.questionNumber}>TRIAL {currentIdx + 1}</Text>
        <Text style={themeStyles.questionText}>{q.question}</Text>

        <View style={themeStyles.optionsList}>
          {q.options.map((option, idx) => (
            <TouchableOpacity
              key={`${q.id}-opt-${idx}`}
              style={themeStyles.optionCard}
              onPress={() => handleSelectOption(idx)}
              activeOpacity={0.7}
            >
              <View style={themeStyles.optionIndexBadge}>
                <Text style={themeStyles.optionIndexText}>
                  {String.fromCharCode(65 + idx)}
                </Text>
              </View>
              <Text style={themeStyles.optionText}>{option}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(isDark: boolean) {
  const bg = isDark ? '#030712' : '#F9FAFB';
  const cardBg = isDark ? '#111827' : '#FFFFFF';
  const border = isDark ? '#1F2937' : '#E5E7EB';
  const textPrimary = isDark ? '#F9FAFB' : '#111827';
  const textSecondary = isDark ? '#9CA3AF' : '#6B7280';

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: bg,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: border,
    },
    backButton: {
      padding: 8,
      marginRight: 8,
    },
    backButtonText: {
      fontSize: 22,
      color: textPrimary,
    },
    headerTitle: {
      fontSize: 17,
      fontWeight: '700',
      color: textPrimary,
      flex: 1,
    },
    progressCounter: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.primary[500],
    },
    progressTrack: {
      height: 4,
      backgroundColor: isDark ? '#1F2937' : '#E5E7EB',
      width: '100%',
    },
    progressBar: {
      height: 4,
      backgroundColor: colors.primary[500],
    },
    questionContainer: {
      padding: 20,
      paddingBottom: 40,
    },
    questionNumber: {
      fontSize: 12,
      fontWeight: '800',
      color: colors.primary[500],
      letterSpacing: 1.5,
      marginBottom: 8,
    },
    questionText: {
      fontSize: 20,
      fontWeight: '800',
      color: textPrimary,
      lineHeight: 28,
      marginBottom: 24,
    },
    optionsList: {
      gap: 12,
    },
    optionCard: {
      backgroundColor: cardBg,
      borderRadius: 14,
      padding: 16,
      borderWidth: 1,
      borderColor: border,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
    },
    optionIndexBadge: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: isDark ? '#1F2937' : '#F3F4F6',
      alignItems: 'center',
      justifyContent: 'center',
    },
    optionIndexText: {
      fontSize: 14,
      fontWeight: '700',
      color: textPrimary,
    },
    optionText: {
      fontSize: 15,
      color: textPrimary,
      fontWeight: '600',
      flex: 1,
      lineHeight: 22,
    },
    resultContainer: {
      flexGrow: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    },
    resultEmoji: {
      fontSize: 64,
      marginBottom: 16,
    },
    resultSubtitle: {
      fontSize: 12,
      fontWeight: '800',
      letterSpacing: 1.5,
      color: textSecondary,
      marginBottom: 6,
    },
    resultTitle: {
      fontSize: 32,
      fontWeight: '900',
      marginBottom: 12,
    },
    resultDesc: {
      fontSize: 15,
      color: textSecondary,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: 24,
      maxWidth: 320,
    },
    statsBox: {
      backgroundColor: cardBg,
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: border,
      width: '100%',
      alignItems: 'center',
      marginBottom: 24,
    },
    statsLabel: {
      fontSize: 12,
      color: textSecondary,
      marginBottom: 4,
    },
    statsValue: {
      fontSize: 18,
      fontWeight: '800',
      color: textPrimary,
    },
    primaryButton: {
      width: '100%',
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
      marginBottom: 12,
    },
    primaryButtonText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '700',
    },
    secondaryButton: {
      paddingVertical: 12,
    },
    secondaryButtonText: {
      color: textSecondary,
      fontSize: 14,
      fontWeight: '600',
    },
  });
}
