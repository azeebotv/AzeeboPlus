import { useEffect } from 'react';
import { AccessibilityInfo, type ViewStyle, type StyleProp } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { animation } from '../../theme';

interface PageTransitionProps {
  children: React.ReactNode;
  duration?: number;
  style?: StyleProp<ViewStyle>;
}

export function PageTransition({
  children,
  duration = animation.slow,
  style,
}: PageTransitionProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(12);

  useEffect(() => {
    let cancelled = false;

    AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      if (cancelled) return;
      if (reduceMotion) {
        opacity.value = 1;
        translateY.value = 0;
        return;
      }

      opacity.value = withTiming(1, { duration });
      translateY.value = withTiming(0, { duration });
    });

    return () => {
      cancelled = true;
    };
  }, [duration, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(opacity.value, [0, 1], [0, 1], Extrapolation.CLAMP),
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}
