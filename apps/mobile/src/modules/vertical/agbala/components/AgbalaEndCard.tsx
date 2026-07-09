import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, typography, spacing, radius } from '../../../../theme';

interface AgbalaEndCardProps {
  title: string;
  message: string;
  isCliffhanger?: boolean;
  onContinue?: () => void;
  onShare?: () => void;
  nextEpisodeTitle?: string;
}

export const AgbalaEndCard: React.FC<AgbalaEndCardProps> = ({
  title,
  message,
  isCliffhanger = false,
  onContinue,
  onShare,
  nextEpisodeTitle,
}) => {
  return (
    <View
      style={styles.container}
      accessibilityRole="summary"
      accessibilityLabel={`${title}. ${message}. ${isCliffhanger ? 'This is a cliffhanger episode.' : ''}`}
      accessibilityLiveRegion="polite"
    >
      <View style={styles.header} accessibilityRole="header">
        <Text style={styles.title} accessibilityRole="header">
          {title}
        </Text>
        {isCliffhanger && (
          <View
            style={styles.cliffhangerBadge}
            accessibilityRole="text"
            accessibilityLabel="Cliffhanger episode"
          >
            <Text style={styles.cliffhangerText}>CLIFFHANGER</Text>
          </View>
        )}
      </View>

      <Text style={styles.message} accessibilityRole="text">
        {message}
      </Text>

      {nextEpisodeTitle && (
        <View
          style={styles.nextEpisode}
          accessibilityRole="none"
          accessibilityLabel={`Next episode: ${nextEpisodeTitle}`}
        >
          <Text style={styles.nextEpisodeLabel}>Up Next</Text>
          <Text style={styles.nextEpisodeTitle}>{nextEpisodeTitle}</Text>
        </View>
      )}

      <View style={styles.buttonContainer}>
        {onContinue && (
          <TouchableOpacity
            style={styles.continueButton}
            onPress={onContinue}
            accessibilityRole="button"
            accessibilityLabel={nextEpisodeTitle ? `Continue to ${nextEpisodeTitle}` : 'Continue'}
            accessibilityHint="Double tap to proceed to the next episode"
            accessibilityState={{ disabled: false }}
            activeOpacity={0.7}
          >
            <Text style={styles.continueButtonText}>
              {nextEpisodeTitle ? 'Continue Watching' : 'Continue'}
            </Text>
          </TouchableOpacity>
        )}

        {onShare && (
          <TouchableOpacity
            style={styles.shareButton}
            onPress={onShare}
            accessibilityRole="button"
            accessibilityLabel="Share this episode"
            accessibilityHint="Double tap to share this episode with friends"
            accessibilityState={{ disabled: false }}
            activeOpacity={0.7}
          >
            <Text style={styles.shareButtonText}>Share</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bg.surface,
    borderRadius: radius.xl,
    padding: spacing.xxl,
    margin: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    flex: 1,
  },
  cliffhangerBadge: {
    backgroundColor: colors.accent.gold,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    marginLeft: spacing.md,
  },
  cliffhangerText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.inverse,
    letterSpacing: 1,
  },
  message: {
    fontSize: typography.fontSize.md,
    lineHeight: typography.fontSize.md * typography.lineHeight.normal,
    color: colors.text.secondary,
    marginBottom: spacing.xxl,
  },
  nextEpisode: {
    backgroundColor: `${colors.accent.gold}1A`,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.xxl,
    borderWidth: 1,
    borderColor: `${colors.accent.gold}4D`,
  },
  nextEpisodeLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  nextEpisodeTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.accent.gold,
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
  shareButton: {
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
  shareButtonText: {
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
  },
});

export default AgbalaEndCard;
