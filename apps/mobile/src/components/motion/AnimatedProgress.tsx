import React, { useEffect } from 'react';
import { StyleSheet, View, type ViewStyle, type StyleProp } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { colors } from '../../theme';

interface AnimatedProgressProps {
  progress: number;
  color?: string;
  height?: number;
  style?: StyleProp<ViewStyle>;
}

export function AnimatedProgress({
  progress,
  color = colors.primary,
  height = 6,
  style,
}: AnimatedProgressProps) {
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withTiming(Math.min(Math.max(progress, 0), 100), {
      duration: 800,
    });
  }, [progress, width]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${interpolate(width.value, [0, 100], [0, 100], Extrapolation.CLAMP)}%`,
  }));

  return (
    <View style={[styles.track, { height, borderRadius: height / 2 }, style]}>
      <Animated.View
        style={[styles.fill, { backgroundColor: color, borderRadius: height / 2 }, fillStyle]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
});
