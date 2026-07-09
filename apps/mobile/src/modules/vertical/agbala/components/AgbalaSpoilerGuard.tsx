import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, typography, spacing, radius } from '../../../../theme';

interface AgbalaSpoilerGuardProps {
  children: React.ReactNode;
  spoilerLevel: 'mild' | 'moderate' | 'major';
  warningText?: string;
  defaultRevealed?: boolean;
}

export const AgbalaSpoilerGuard: React.FC<AgbalaSpoilerGuardProps> = ({
  children,
  spoilerLevel,
  warningText,
  defaultRevealed = false,
}) => {
  const [isRevealed, setIsRevealed] = useState(defaultRevealed);

  const getDefaultWarningText = () => {
    switch (spoilerLevel) {
      case 'mild':
        return 'This content contains mild spoilers';
      case 'moderate':
        return 'This content contains spoilers for the story';
      case 'major':
        return 'Major spoilers ahead! This reveals key plot points';
      default:
        return 'This content may contain spoilers';
    }
  };

  const getSpoilLevelColor = () => {
    switch (spoilerLevel) {
      case 'mild':
        return colors.warning;
      case 'moderate':
        return colors.error;
      case 'major':
        return colors.error[500];
      default:
        return colors.warning;
    }
  };

  if (isRevealed) {
    return (
      <View
        style={styles.revealedContainer}
        accessibilityRole="none"
        accessibilityLabel={`Spoiler content revealed. ${warningText || getDefaultWarningText()}`}
        accessibilityLiveRegion="polite"
      >
        {children}
        <TouchableOpacity
          style={styles.hideButton}
          onPress={() => setIsRevealed(false)}
          accessibilityRole="button"
          accessibilityLabel="Hide spoiler content"
          accessibilityHint="Double tap to hide this spoiler content again"
          accessibilityState={{ disabled: false }}
          activeOpacity={0.7}
        >
          <Text style={styles.hideButtonText}>Hide Spoiler</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View
      style={styles.container}
      accessibilityRole="summary"
      accessibilityLabel={`${warningText || getDefaultWarningText()}. Content is hidden.`}
      accessibilityLiveRegion="polite"
    >
      <View
        style={[styles.warningBanner, { backgroundColor: `${getSpoilLevelColor()}20` }]}
        accessibilityRole="text"
        accessibilityLabel={`Spoiler warning: ${spoilerLevel} level spoilers`}
      >
        <View style={styles.warningHeader}>
          <Text
            style={[styles.spoilerBadge, { backgroundColor: getSpoilLevelColor() }]}
            accessibilityRole="text"
          >
            SPOILER
          </Text>
          <Text
            style={[styles.spoilerLevelText, { color: getSpoilLevelColor() }]}
            accessibilityRole="text"
          >
            {spoilerLevel.toUpperCase()}
          </Text>
        </View>
        <Text style={styles.warningText} accessibilityRole="text">
          {warningText || getDefaultWarningText()}
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.revealButton, { borderColor: getSpoilLevelColor() }]}
        onPress={() => setIsRevealed(true)}
        accessibilityRole="button"
        accessibilityLabel={`Reveal ${spoilerLevel} spoiler content`}
        accessibilityHint="Double tap to reveal hidden spoiler content"
        accessibilityState={{ disabled: false }}
        activeOpacity={0.7}
      >
        <Text style={[styles.revealButtonText, { color: getSpoilLevelColor() }]}>
          Reveal Content
        </Text>
      </TouchableOpacity>

      <View
        style={styles.blurOverlay}
        accessibilityRole="none"
        accessibilityLabel="Content hidden due to spoiler"
      >
        <Text style={styles.blurText}>Content Hidden</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bg.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    position: 'relative',
    overflow: 'hidden',
  },
  revealedContainer: {
    backgroundColor: colors.bg.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  warningBanner: {
    padding: spacing.lg,
    borderRadius: radius.md,
    marginBottom: spacing.lg,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  spoilerBadge: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    marginRight: spacing.sm,
    letterSpacing: 1,
  },
  spoilerLevelText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    letterSpacing: 1,
  },
  warningText: {
    fontSize: typography.fontSize.sm,
    lineHeight: typography.fontSize.sm * typography.lineHeight.normal,
    color: colors.text.secondary,
  },
  revealButton: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  revealButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  hideButton: {
    backgroundColor: colors.border.subtle,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    alignItems: 'center',
    marginTop: spacing.lg,
    minHeight: 48,
    justifyContent: 'center',
  },
  hideButtonText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: `${colors.bg.secondary}E6`,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radius.lg,
  },
  blurText: {
    fontSize: typography.fontSize.md,
    color: colors.text.tertiary,
    fontWeight: typography.fontWeight.medium,
  },
});

export default AgbalaSpoilerGuard;
