import { useEffect } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { AccessibilityInfo, type StyleProp, type ViewStyle } from 'react-native';
import { animation } from '../../theme';

interface ScrollRevealProps {
  children: React.ReactNode;
  direction?: 'up' | 'down' | 'left' | 'right';
  delay?: number;
  duration?: number;
  distance?: number;
  style?: StyleProp<ViewStyle>;
}

export function ScrollReveal({
  children,
  direction = 'up',
  delay = 0,
  duration = animation.normal,
  distance = 20,
  style,
}: ScrollRevealProps) {
  const opacity = useSharedValue(0);
  const translate = useSharedValue(distance);

  useEffect(() => {
    let cancelled = false;

    AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      if (cancelled) return;
      if (reduceMotion) {
        opacity.value = 1;
        translate.value = 0;
        return;
      }

      const translateAnim = withDelay(
        delay,
        withTiming(0, { duration }, () => {})
      );
      const opacityAnim = withDelay(delay, withTiming(1, { duration }));

      translate.value = translateAnim;
      opacity.value = opacityAnim;
    });

    return () => {
      cancelled = true;
    };
  }, [delay, duration, opacity, translate]);

  const getTranslate = (): { x: number; y: number } => {
    'worklet';
    if (direction === 'up') return { x: 0, y: translate.value };
    if (direction === 'down') return { x: 0, y: -translate.value };
    if (direction === 'left') return { x: translate.value, y: 0 };
    return { x: -translate.value, y: 0 };
  };

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(opacity.value, [0, 1], [0, 1], Extrapolation.CLAMP),
    transform: [{ translateX: getTranslate().x }, { translateY: getTranslate().y }],
  }));

  return (
    <Animated.View style={[style, animatedStyle]} accessible>
      {children}
    </Animated.View>
  );
}
