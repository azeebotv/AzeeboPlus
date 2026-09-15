import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
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
import Feather from '@expo/vector-icons/Feather';
import { colors, typography, spacing, shadows } from '../src/theme';
import { BrandButton } from '../src/components/ui';
import { AmbientGlow, FadeIn, ScrollReveal } from '../src/components/motion';
import { useAuth } from '@azeebo/react-data/contexts/AuthContext';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function SplashScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [progress, setProgress] = useState(0);
  const [showContent, setShowContent] = useState(false);
  const routeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const logoScale = useSharedValue(0.6);
  const logoOpacity = useSharedValue(0);
  const featuresOpacity = useSharedValue(0);
  const featuresTranslate = useSharedValue(20);

  useEffect(() => {
    let cancelled = false;

    AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      if (cancelled) return;
      if (reduceMotion) {
        logoScale.value = 1;
        logoOpacity.value = 1;
        featuresOpacity.value = 1;
        featuresTranslate.value = 0;
        setShowContent(true);
        return;
      }

      const timer = setTimeout(() => {
        logoScale.value = withSpring(1, { damping: 12, stiffness: 100 });
        logoOpacity.value = withTiming(1, { duration: 600 });
        featuresOpacity.value = withDelay(400, withTiming(1, { duration: 500 }));
        featuresTranslate.value = withDelay(400, withTiming(0, { duration: 500 }));
        setShowContent(true);
      }, 400);

      return () => clearTimeout(timer);
    });

    return () => {
      cancelled = true;
    };
  }, [featuresOpacity, featuresTranslate, logoOpacity, logoScale]);

  useEffect(() => {
    if (!showContent) return;
    // M12: the bar is display-only, but it must not *claim* completion while
    // auth is still restoring — it holds at 90% until isLoading resolves,
    // then finishes and routes. Route scheduling lives in this effect so a
    // pending route is always cancelled if auth state changes underneath it
    // (the old version scheduled a fire-and-forget timeout that survived
    // effect re-runs and could route with stale auth state).
    const cap = isLoading ? 90 : 100;
    let scheduled = false;
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= cap) {
          if (!scheduled) {
            scheduled = true;
            clearInterval(interval);
            if (cap === 100) {
              routeTimerRef.current = setTimeout(() => {
                if (isAuthenticated) {
                  router.replace('/(tabs)');
                } else {
                  router.replace('/(auth)/login');
                }
              }, 400);
            }
          }
          return cap;
        }
        return prev + 2;
      });
    }, 30);

    return () => {
      clearInterval(interval);
      if (routeTimerRef.current) {
        clearTimeout(routeTimerRef.current);
        routeTimerRef.current = null;
      }
    };
  }, [showContent, isLoading, isAuthenticated, router]);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(logoOpacity.value, [0, 1], [0, 1], Extrapolation.CLAMP),
    transform: [{ scale: logoScale.value }],
  }));

  const featuresAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(featuresOpacity.value, [0, 1], [0, 1], Extrapolation.CLAMP),
    transform: [{ translateY: featuresTranslate.value }],
  }));

  const featureItems: Array<{ icon: keyof typeof Feather.glyphMap; label: string }> = [
    { icon: 'film', label: 'Movies' },
    { icon: 'music', label: 'Music' },
    { icon: 'play-circle', label: 'Games' },
    { icon: 'award', label: 'Sports' },
  ];

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colorScheme === 'dark' ? colors.bg.primary : colors.text.primary },
      ]}
    >
      <AmbientGlow color={colors.primary[500]} size={250} intensity={0.08} />

      <Animated.View style={logoAnimatedStyle}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/logo-white.png')}
            style={{ width: 180, height: 46, marginBottom: 16 }}
            resizeMode="contain"
          />
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
                  <Feather name={item.icon} size={22} color={colors.primary[500]} />
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
          {/* Auth-aware CTAs: a signed-in user landing here (deep link, stale
              route, back-swipe from tabs) goes home instead of losing their
              session context by being pushed into the auth stack. */}
          {isAuthenticated ? (
            <BrandButton
              title="Continue to Azeebo+"
              onPress={() => router.replace('/(tabs)')}
              variant="primary"
            />
          ) : (
            <BrandButton
              title="Get Started"
              onPress={() => router.replace('/(auth)/login')}
              variant="primary"
            />
          )}

          <View style={styles.bottomLinks}>
            {isAuthenticated ? (
              <BrandButton
                title="Go to Home"
                onPress={() => router.replace('/(tabs)')}
                variant="ghost"
              />
            ) : (
              <>
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
              </>
            )}
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
