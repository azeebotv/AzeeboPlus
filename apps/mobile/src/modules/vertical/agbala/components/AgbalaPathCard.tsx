import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, typography, spacing, radius } from '../../../../theme';

interface AgbalaPathCardProps {
  path: 'chronological' | 'thematic';
  title: string;
  description: string;
  icon?: string;
  isSelected?: boolean;
  onSelect: (path: 'chronological' | 'thematic') => void;
}

export const AgbalaPathCard: React.FC<AgbalaPathCardProps> = ({
  path,
  title,
  description,
  icon,
  isSelected = false,
  onSelect,
}) => {
  const handlePress = () => {
    onSelect(path);
  };

  return (
    <TouchableOpacity
      style={[styles.container, isSelected && styles.selectedContainer]}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`${title} path. ${description}`}
      accessibilityHint={isSelected ? 'Currently selected' : 'Double tap to select this path'}
      accessibilityState={{
        selected: isSelected,
        disabled: false,
      }}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        {icon && (
          <Text style={styles.icon} accessibilityRole="text">
            {icon}
          </Text>
        )}
        <View style={styles.textContainer}>
          <Text
            style={[styles.title, isSelected && styles.selectedTitle]}
            accessibilityRole="header"
          >
            {title}
          </Text>
          <Text
            style={[styles.description, isSelected && styles.selectedDescription]}
            accessibilityRole="text"
          >
            {description}
          </Text>
        </View>
      </View>
      {isSelected && (
        <View style={styles.checkmark} accessibilityRole="text" accessibilityLabel="Selected">
          <Text style={styles.checkmarkText}>✓</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bg.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
    minHeight: 48,
    justifyContent: 'center',
  },
  selectedContainer: {
    borderColor: colors.accent.gold,
    backgroundColor: colors.bg.tertiary,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: 32,
    marginRight: spacing.lg,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  selectedTitle: {
    color: colors.accent.gold,
  },
  description: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  selectedDescription: {
    color: colors.text.accent,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.accent.gold,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: colors.text.inverse,
    fontWeight: typography.fontWeight.bold,
    fontSize: typography.fontSize.xs,
  },
});

export default AgbalaPathCard;
