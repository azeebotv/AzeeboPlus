import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, typography, spacing, radius } from '../../../../theme';

interface AgbalaQuizQuestionProps {
  question: string;
  questionNumber: number;
  totalQuestions: number;
  options: Array<{ id: string; text: string }>;
  selectedOptionId?: string;
  onOptionSelect: (optionId: string) => void;
}

export const AgbalaQuizQuestion: React.FC<AgbalaQuizQuestionProps> = ({
  question,
  questionNumber,
  totalQuestions,
  options,
  selectedOptionId,
  onOptionSelect,
}) => {
  return (
    <View
      style={styles.container}
      accessibilityRole="none"
      accessibilityLabel={`Question ${questionNumber} of ${totalQuestions}. ${question}`}
    >
      <View
        style={styles.progressBar}
        accessibilityRole="progressbar"
        accessibilityLabel={`Question ${questionNumber} of ${totalQuestions}`}
        accessibilityValue={{
          min: 1,
          max: totalQuestions,
          now: questionNumber,
        }}
      >
        <View
          style={[styles.progressFill, { width: `${(questionNumber / totalQuestions) * 100}%` }]}
        />
      </View>

      <Text style={styles.questionCounter} accessibilityRole="text">
        Question {questionNumber} of {totalQuestions}
      </Text>

      <Text style={styles.question} accessibilityRole="header" accessibilityLiveRegion="polite">
        {question}
      </Text>

      <View
        style={styles.optionsContainer}
        accessibilityRole="radiogroup"
        accessibilityLabel="Answer options"
      >
        {options.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[styles.optionButton, selectedOptionId === option.id && styles.selectedOption]}
            onPress={() => onOptionSelect(option.id)}
            accessibilityRole="radio"
            accessibilityLabel={option.text}
            accessibilityHint={
              selectedOptionId === option.id
                ? 'Currently selected'
                : 'Double tap to select this answer'
            }
            accessibilityState={{
              selected: selectedOptionId === option.id,
              disabled: false,
            }}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.radioButton,
                selectedOptionId === option.id && styles.selectedRadioButton,
              ]}
            >
              {selectedOptionId === option.id && <View style={styles.radioInner} />}
            </View>
            <Text
              style={[
                styles.optionText,
                selectedOptionId === option.id && styles.selectedOptionText,
              ]}
            >
              {option.text}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.border.default,
    borderRadius: radius.sm,
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.accent.gold,
    borderRadius: radius.sm,
  },
  questionCounter: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
    marginBottom: spacing.sm,
  },
  question: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xxl,
    lineHeight: typography.fontSize.xl * typography.lineHeight.normal,
  },
  optionsContainer: {
    gap: spacing.md,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: 'transparent',
    minHeight: 48,
    justifyContent: 'center',
  },
  selectedOption: {
    borderColor: colors.accent.gold,
    backgroundColor: colors.bg.tertiary,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border.default,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  selectedRadioButton: {
    borderColor: colors.accent.gold,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.accent.gold,
  },
  optionText: {
    flex: 1,
    fontSize: typography.fontSize.md,
    color: colors.text.primary,
  },
  selectedOptionText: {
    color: colors.accent.gold,
    fontWeight: typography.fontWeight.medium,
  },
});

export default AgbalaQuizQuestion;
