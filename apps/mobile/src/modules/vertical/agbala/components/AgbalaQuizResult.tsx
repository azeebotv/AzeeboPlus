import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, typography, spacing, radius } from '../../../../theme';

interface AgbalaQuizResultProps {
  orisaAlignment?: string;
  path?: string;
  title?: string;
  description: string;
  icon?: string;
  onContinue?: () => void;
  onRetakeQuiz?: () => void;
}

export const AgbalaQuizResult: React.FC<AgbalaQuizResultProps> = ({
  orisaAlignment,
  path,
  title,
  description,
  icon,
  onContinue,
  onRetakeQuiz,
}) => {
  const alignment = orisaAlignment || title || path || '';
  return (
    <View
      style={styles.container}
      accessibilityRole="summary"
      accessibilityLabel={`Quiz complete. Your Orisa alignment is ${alignment}. ${description}`}
      accessibilityLiveRegion="polite"
    >
      <View style={styles.header} accessibilityRole="header">
        {icon && (
          <Text
            style={styles.icon}
            accessibilityRole="image"
            accessibilityLabel={`Icon representing ${alignment}`}
          >
            {icon}
          </Text>
        )}
        <Text style={styles.title} accessibilityRole="header">
          Your Orisa Alignment
        </Text>
        <Text
          style={styles.alignment}
          accessibilityRole="header"
          accessibilityLabel={`You are aligned with ${alignment}`}
        >
          {alignment}
        </Text>
      </View>

      <View style={styles.descriptionContainer} accessibilityRole="text">
        <Text style={styles.description}>{description}</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={onContinue}
          accessibilityRole="button"
          accessibilityLabel="Continue to storyworld"
          accessibilityHint="Double tap to proceed to the Agbala storyworld"
          accessibilityState={{ disabled: false }}
          activeOpacity={0.7}
        >
          <Text style={styles.continueButtonText}>Enter the Storyworld</Text>
        </TouchableOpacity>

        {onRetakeQuiz && (
          <TouchableOpacity
            style={styles.retakeButton}
            onPress={onRetakeQuiz}
            accessibilityRole="button"
            accessibilityLabel="Retake quiz"
            accessibilityHint="Double tap to take the Orisa alignment quiz again"
            accessibilityState={{ disabled: false }}
            activeOpacity={0.7}
          >
            <Text style={styles.retakeButtonText}>Retake Quiz</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.xxl,
    backgroundColor: colors.bg.secondary,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxxl,
  },
  icon: {
    fontSize: 80,
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.fontSize.md,
    color: colors.text.tertiary,
    marginBottom: spacing.sm,
  },
  alignment: {
    fontSize: typography.fontSize.hero,
    fontWeight: typography.fontWeight.bold,
    color: colors.accent.gold,
    textAlign: 'center',
  },
  descriptionContainer: {
    backgroundColor: colors.bg.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginBottom: spacing.xxxl,
  },
  description: {
    fontSize: typography.fontSize.md,
    lineHeight: typography.fontSize.md * typography.lineHeight.normal,
    color: colors.text.secondary,
  },
  buttonContainer: {
    gap: spacing.md,
  },
  continueButton: {
    backgroundColor: colors.accent.gold,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xxxl,
    borderRadius: radius.md,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  continueButtonText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.inverse,
  },
  retakeButton: {
    backgroundColor: 'transparent',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xxxl,
    borderRadius: radius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.default,
    minHeight: 48,
    justifyContent: 'center',
  },
  retakeButtonText: {
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
  },
});

export default AgbalaQuizResult;
