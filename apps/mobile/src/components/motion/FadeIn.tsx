import React, { useEffect } from 'react';
import { AccessibilityInfo, type ViewStyle, type StyleProp } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { animation } from '../../theme';

interface FadeInProps {
  children: React.ReactNode;
  duration?: number;
  delay?: number;
  style?: StyleProp<ViewStyle>;
}

export function FadeIn({ children, duration = animation.normal, delay = 0, style }: FadeInProps) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    let cancelled = false;

    AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      if (cancelled) return;
      if (reduceMotion) {
        opacity.value = 1;
        return;
      }

      opacity.value = withTiming(1, { duration });
    });

    return () => {
      cancelled = true;
    };
  }, [delay, duration, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(opacity.value, [0, 1], [0, 1], Extrapolation.CLAMP),
  }));

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}
