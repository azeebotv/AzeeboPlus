import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, typography, spacing, radius } from '../../../../theme';

interface AgbalaUnlockCardProps {
  title: string;
  description: string;
  isLocked: boolean;
  requiredPlan?: string;
  onUnlock?: () => void;
  previewContent?: React.ReactNode;
}

export const AgbalaUnlockCard: React.FC<AgbalaUnlockCardProps> = ({
  title,
  description,
  isLocked,
  requiredPlan = 'Premium',
  onUnlock,
  previewContent,
}) => {
  return (
    <View
      style={[styles.container, isLocked && styles.lockedContainer]}
      accessibilityRole="none"
      accessibilityLabel={`${title}. ${description}. ${
        isLocked ? `Locked. Requires ${requiredPlan} plan to unlock.` : 'Unlocked'
      }`}
      accessibilityState={{ disabled: isLocked }}
    >
      {previewContent && (
        <View style={styles.previewContainer} accessibilityRole="none">
          {previewContent}
        </View>
      )}

      <View style={styles.contentContainer} accessibilityRole="none">
        <View style={styles.header}>
          <Text style={styles.title} accessibilityRole="header">
            {title}
          </Text>
          {isLocked && (
            <View
              style={styles.lockBadge}
              accessibilityRole="text"
              accessibilityLabel="Locked content"
            >
              <Text style={styles.lockIcon}>🔒</Text>
              <Text style={styles.lockText}>LOCKED</Text>
            </View>
          )}
        </View>

        <Text style={styles.description} accessibilityRole="text">
          {description}
        </Text>

        {isLocked && (
          <View
            style={styles.unlockSection}
            accessibilityRole="none"
            accessibilityLabel={`Requires ${requiredPlan} plan to unlock`}
          >
            <Text style={styles.requiredPlan}>Requires {requiredPlan} plan</Text>

            {onUnlock && (
              <TouchableOpacity
                style={styles.unlockButton}
                onPress={onUnlock}
                accessibilityRole="button"
                accessibilityLabel={`Unlock ${title} with ${requiredPlan} plan`}
                accessibilityHint="Double tap to view subscription options"
                accessibilityState={{ disabled: false }}
                activeOpacity={0.7}
              >
                <Text style={styles.unlockButtonText}>Unlock Now</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {isLocked && (
        <View style={styles.overlay} accessibilityRole="none" accessibilityLabel="Content locked" />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bg.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  lockedContainer: {
    opacity: 0.8,
  },
  previewContainer: {
    height: 200,
    backgroundColor: colors.bg.secondary,
  },
  contentContainer: {
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    flex: 1,
  },
  lockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.accent.gold}33`,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    marginLeft: spacing.md,
  },
  lockIcon: {
    fontSize: typography.fontSize.xs,
    marginRight: spacing.xs,
  },
  lockText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    color: colors.accent.gold,
    letterSpacing: 1,
  },
  description: {
    fontSize: typography.fontSize.sm,
    lineHeight: typography.fontSize.sm * typography.lineHeight.normal,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
  },
  unlockSection: {
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    paddingTop: spacing.lg,
  },
  requiredPlan: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  unlockButton: {
    backgroundColor: colors.accent.gold,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    borderRadius: radius.md,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  unlockButtonText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.inverse,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: `${colors.bg.secondary}4D`,
    pointerEvents: 'none',
  },
});

export default AgbalaUnlockCard;
