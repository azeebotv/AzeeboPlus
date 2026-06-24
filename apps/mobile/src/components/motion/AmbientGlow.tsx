import React, { useEffect } from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { colors } from '../../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface AmbientGlowProps {
  color?: string;
  size?: number;
  intensity?: number;
}

export function AmbientGlow({
  color = colors.red,
  size = 200,
  intensity = 0.06,
}: AmbientGlowProps) {
  const rotation = useSharedValue(0);
  const driftX = useSharedValue(0);
  const driftY = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 20000, easing: Easing.linear }),
      -1,
      false
    );
    driftX.value = withRepeat(
      withTiming(30, { duration: 8000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    driftY.value = withRepeat(
      withTiming(-20, { duration: 10000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [rotation, driftX, driftY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(driftX.value, [0, 30], [0, 30], Extrapolation.CLAMP) },
      { translateY: interpolate(driftY.value, [0, -20], [0, -20], Extrapolation.CLAMP) },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.glow,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          opacity: intensity,
          top: -size / 3,
          left: (SCREEN_WIDTH - size) / 2,
        },
        animatedStyle,
      ]}
      pointerEvents="none"
    />
  );
}

const styles = StyleSheet.create({
  glow: {
    position: 'absolute',
  },
});
