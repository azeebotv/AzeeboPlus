import { StyleSheet, type ViewStyle, type StyleProp } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { colors, radius, shadows, spring } from '../../theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'strong' | 'subtle';
  padding?: number;
  animated?: boolean;
}

const AnimatedView = Animated.createAnimatedComponent(Animated.View);

export function GlassCard({
  children,
  style,
  variant = 'default',
  padding = 16,
  animated = false,
}: GlassCardProps) {
  const scale = useSharedValue(1);

  const _handlePressIn = () => {
    if (!animated) return;
    scale.value = withSpring(0.98, spring.snappy);
  };

  const _handlePressOut = () => {
    if (!animated) return;
    scale.value = withSpring(1, spring.gentle);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedView
      style={[
        styles.card,
        variant === 'strong' && styles.cardStrong,
        variant === 'subtle' && styles.cardSubtle,
        { padding },
        animated && animatedStyle,
        style,
      ]}
      accessibilityRole="none"
    >
      {children}
    </AnimatedView>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg.glass,
    borderWidth: 1,
    borderColor: colors.bg.glassBorder,
    borderRadius: radius.xl,
    ...shadows.glass,
  },
  cardStrong: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderColor: 'rgba(255,255,255,0.2)',
    ...shadows.glassStrong,
  },
  cardSubtle: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.06)',
    shadowOpacity: 0,
    elevation: 0,
  },
});
