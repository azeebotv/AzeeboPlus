import React, { useEffect } from 'react';
import { AccessibilityInfo, type ViewStyle, type StyleProp } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { animation } from '../../theme';

interface StaggerGridProps {
  children: React.ReactNode[];
  staggerDelay?: number;
  duration?: number;
  style?: StyleProp<ViewStyle>;
}

export function StaggerGrid({
  children,
  staggerDelay = 60,
  duration = animation.normal,
  style,
}: StaggerGridProps) {
  return (
    <Animated.View style={style}>
      {React.Children.map(children, (child, index) => (
        <StaggerItem
          key={index}
          index={index}
          delay={staggerDelay}
          duration={duration}
        >
          {child}
        </StaggerItem>
      ))}
    </Animated.View>
  );
}

function StaggerItem({
  children,
  index,
  delay,
  duration,
}: {
  children: React.ReactNode;
  index: number;
  delay: number;
  duration: number;
}) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(16);

  useEffect(() => {
    let cancelled = false;
    const totalDelay = index * delay;

    AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      if (cancelled) return;
      if (reduceMotion) {
        opacity.value = 1;
        translateY.value = 0;
        return;
      }

      opacity.value = withDelay(totalDelay, withTiming(1, { duration }));
      translateY.value = withDelay(totalDelay, withTiming(0, { duration }));
    });

    return () => {
      cancelled = true;
    };
  }, [index, delay, duration, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(opacity.value, [0, 1], [0, 1], Extrapolation.CLAMP),
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      {children}
    </Animated.View>
  );
}
