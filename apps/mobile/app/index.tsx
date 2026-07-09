import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { AccessibilityInfo } from 'react-native';
import { colors, typography, spacing, shadows } from '../src/theme';
import { BrandButton } from '../src/components/ui';
import { AmbientGlow, FadeIn, ScrollReveal } from '../src/components/motion';
import { useAuth } from '../src/contexts/AuthContext';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function SplashScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [progress, setProgress] = useState(0);
  const [showContent, setShowContent] = useState(false);

  const logoScale = useSharedValue(0.6);
  const logoOpacity = useSharedValue(0);
  const ringRotation = useSharedValue(0);
  const featuresOpacity = useSharedValue(0);
  const featuresTranslate = useSharedValue(20);

  useEffect(() => {
    let cancelled = false;

    AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      if (cancelled) return;
      if (reduceMotion) {
        logoScale.value = 1;
        logoOpacity.value = 1;
        ringRotation.value = 0;
        featuresOpacity.value = 1;
        featuresTranslate.value = 0;
        setShowContent(true);
        return;
      }

      const timer = setTimeout(() => {
        logoScale.value = withSpring(1, { damping: 12, stiffness: 100 });
        logoOpacity.value = withTiming(1, { duration: 600 });
        ringRotation.value = withTiming(360, { duration: 1200 });
        featuresOpacity.value = withDelay(400, withTiming(1, { duration: 500 }));
        featuresTranslate.value = withDelay(400, withTiming(0, { duration: 500 }));
        setShowContent(true);
      }, 400);

      return () => clearTimeout(timer);
    });

    return () => {
      cancelled = true;
    };
  }, [featuresOpacity, featuresTranslate, logoOpacity, logoScale, ringRotation]);

  useEffect(() => {
    if (!showContent || isLoading) return;
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            // Route based on actual auth state instead of always going to login
            if (isAuthenticated) {
              router.replace('/(tabs)');
            } else {
              router.replace('/(auth)/login');
            }
          }, 400);
          return 100;
        }
        return prev + 2;
      });
    }, 30);

    return () => clearInterval(interval);
  }, [showContent, isLoading, isAuthenticated, router]);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(logoOpacity.value, [0, 1], [0, 1], Extrapolation.CLAMP),
    transform: [{ scale: logoScale.value }],
  }));

  const ringAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${ringRotation.value}deg` }],
  }));

  const featuresAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(featuresOpacity.value, [0, 1], [0, 1], Extrapolation.CLAMP),
    transform: [{ translateY: featuresTranslate.value }],
  }));

  const featureItems = [
    { icon: '🎬', label: 'Movies' },
    { icon: '🎵', label: 'Music' },
    { icon: '🎮', label: 'Games' },
    { icon: '⚽', label: 'Sports' },
  ];

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colorScheme === 'dark' ? colors.bg.primary : '#ffffff' },
      ]}
    >
      <AmbientGlow color={colors.primary[500]} size={250} intensity={0.08} />

      <Animated.View style={logoAnimatedStyle}>
        <View style={styles.logoContainer}>
          <Animated.View style={[styles.logoRing, ringAnimatedStyle]}>
            <Text style={styles.logoText}>A</Text>
            <Text style={styles.logoPlus}>+</Text>
          </Animated.View>
          <Text
            style={[
              styles.appName,
              { color: colorScheme === 'dark' ? colors.text.primary : '#1A0A0A' },
            ]}
          >
            Azeebo
            <Text style={styles.appNamePlus}>+</Text>
          </Text>
          <Text style={styles.appTagline}>Experience the Future of Entertainment</Text>
        </View>

        <Animated.View style={[styles.featureIcons, featuresAnimatedStyle]}>
          {featureItems.map((item, index) => {
            const itemDelay = index * 80;
            return (
              <ScrollReveal key={index} direction="up" delay={500 + itemDelay}>
                <AnimatedTouchable
                  style={styles.featureIcon}
                  onPress={() => {}}
                  accessibilityLabel={item.label}
                  accessibilityRole="button"
                >
                  <Text style={styles.featureIconText}>{item.icon}</Text>
                </AnimatedTouchable>
              </ScrollReveal>
            );
          })}
        </Animated.View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` as unknown as number }]} />
          </View>
        </View>

        <FadeIn delay={800}>
          <BrandButton
            title="Get Started"
            onPress={() => router.replace('/(auth)/login')}
            variant="primary"
          />

          <View style={styles.bottomLinks}>
            <BrandButton
              title="Sign In"
              onPress={() => router.replace('/(auth)/login')}
              variant="ghost"
            />
            <Text style={styles.divider}>|</Text>
            <BrandButton
              title="Sign Up"
              onPress={() => router.replace('/(auth)/register')}
              variant="ghost"
            />
          </View>
        </FadeIn>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxxl,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.red,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    ...shadows.red,
  },
  logoText: {
    fontSize: 44,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  logoPlus: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.primary[500],
    marginTop: -16,
  },
  appName: {
    fontSize: typography.fontSize.hero,
    fontWeight: '800',
    marginTop: 20,
    color: colors.text.primary,
  },
  appNamePlus: {
    color: colors.primary[500],
  },
  appTagline: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    marginTop: spacing.sm,
  },
  featureIcons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 48,
  },
  featureIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureIconText: {
    fontSize: 24,
  },
  progressContainer: {
    width: '100%',
    marginBottom: 32,
  },
  progressBar: {
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.bg.tertiary,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary[500],
    borderRadius: 2,
  },
  bottomLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  divider: {
    color: colors.text.tertiary,
    fontSize: typography.fontSize.base,
  },
});
