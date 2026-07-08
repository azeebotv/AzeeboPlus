import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { useAgbalaAccessibility } from './AgbalaAccessibilityProvider';
import { colors, typography, spacing, radius } from '../../../../theme';

const { width } = Dimensions.get('window');

interface AgbalaHeroProps {
  title: string;
  subtitle?: string;
  imageUrl?: string;
  onCTAPress?: () => void;
  ctaLabel?: string;
}

export const AgbalaHero: React.FC<AgbalaHeroProps> = ({
  title,
  subtitle,
  imageUrl,
  onCTAPress,
  ctaLabel = 'Begin Journey',
}) => {
  const { isReducedMotionEnabled: _isReducedMotionEnabled } = useAgbalaAccessibility();

  return (
    <View
      style={styles.container}
      accessibilityRole="header"
      accessibilityLabel={`${title}. ${subtitle || ''}`}
    >
      {imageUrl && (
        <Image
          source={{ uri: imageUrl }}
          style={styles.image}
          accessibilityLabel={`Background image for ${title}`}
          accessibilityRole="image"
        />
      )}
      <View style={styles.overlay}>
        <Text style={styles.title} accessibilityRole="header">
          {title}
        </Text>
        {subtitle && (
          <Text style={styles.subtitle} accessibilityRole="text">
            {subtitle}
          </Text>
        )}
        {onCTAPress && (
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={onCTAPress}
            accessibilityRole="button"
            accessibilityLabel={ctaLabel}
            accessibilityHint="Double tap to start your Agbala journey"
            accessibilityState={{ disabled: false }}
            activeOpacity={0.7}
          >
            <Text style={styles.ctaText}>{ctaLabel}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width,
    height: 400,
    position: 'relative',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay.dark,
    justifyContent: 'flex-end',
    padding: spacing.xxl,
  },
  title: {
    fontSize: typography.fontSize.hero,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.fontSize.lg,
    color: colors.text.secondary,
    marginBottom: spacing.xxl,
  },
  ctaButton: {
    backgroundColor: colors.accent.gold,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xxxl,
    borderRadius: radius.md,
    alignSelf: 'flex-start',
    minHeight: 48,
    minWidth: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctaText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.inverse,
  },
});

export default AgbalaHero;
