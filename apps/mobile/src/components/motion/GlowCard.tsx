import { StyleSheet, TouchableOpacity, type ViewStyle, type StyleProp } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { colors, radius, shadows, universeColors } from '../../theme';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface GlowCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  universe?: string;
  padding?: number;
  variant?: 'default' | 'strong' | 'subtle';
  onPress?: () => void;
}

export function GlowCard({
  children,
  style,
  universe,
  padding = 16,
  variant = 'default',
  onPress,
}: GlowCardProps) {
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);

  const glowColor = universe ? universeColors[universe] || colors.red : colors.red;

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
    glowOpacity.value = withTiming(0.15, { duration: 200 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    glowOpacity.value = withTiming(0, { duration: 300 });
  };

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const Wrapper = onPress ? AnimatedTouchable : Animated.View;
  const wrapperProps = onPress
    ? {
        onPress,
        onPressIn: handlePressIn,
        onPressOut: handlePressOut,
        activeOpacity: 1,
        accessibilityRole: 'button' as const,
      }
    : {};

  return (
    <Wrapper style={[cardStyle, style]} {...wrapperProps}>
      <Animated.View
        style={[styles.glow, { backgroundColor: glowColor }, glowStyle]}
        pointerEvents="none"
      />
      <Animated.View
        style={[
          styles.card,
          variant === 'strong' && styles.cardStrong,
          variant === 'subtle' && styles.cardSubtle,
          { padding },
        ]}
      >
        {children}
      </Animated.View>
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  glow: {
    ...StyleSheet.absoluteFill,
    borderRadius: radius.xl,
    opacity: 0,
  },
  card: {
    backgroundColor: colors.bg.glass,
    borderWidth: 1,
    borderColor: colors.bg.glassBorder,
    borderRadius: radius.xl,
    ...shadows.glass,
    overflow: 'hidden',
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
