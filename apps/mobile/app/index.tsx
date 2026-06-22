import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';

export default function SplashScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [progress, setProgress] = useState(0);
  const [showContent, setShowContent] = useState(false);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideUpAnim = React.useRef(new Animated.Value(100)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideUpAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start();
      setShowContent(true);
    }, 500);

    return () => clearTimeout(timer);
  }, [fadeAnim, slideUpAnim]);

  useEffect(() => {
    if (!showContent) return;
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            router.replace('/(auth)/login');
          }, 500);
          return 100;
        }
        return prev + 2;
      });
    }, 30);

    return () => clearInterval(interval);
  }, [showContent, router]);

  const handleGetStarted = () => {
    router.replace('/(auth)/login');
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colorScheme === 'dark' ? '#000000' : '#ffffff' },
      ]}
    >
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideUpAnim }] }}>
        <View style={styles.logoContainer}>
          <View style={styles.logoRing}>
            <Text style={styles.logoText}>A+</Text>
          </View>
          <Text style={[styles.appName, { color: colorScheme === 'dark' ? '#ffffff' : '#000000' }]}>
            Azeebo+
          </Text>
          <Text style={styles.appTagline}>Experience the Future of Entertainment</Text>
        </View>

        <View style={styles.featureIcons}>
          {['🎬', '🎮', '🎤', '⚽', '😂', '✨'].map((icon, index) => (
            <Animated.Text
              key={index}
              style={[
                styles.featureIcon,
                {
                  opacity: fadeAnim,
                  transform: [
                    {
                      translateY: slideUpAnim.interpolate({
                        inputRange: [0, 100],
                        outputRange: [0, 50 + index * 10],
                      }),
                    },
                  ],
                },
              ]}
            >
              {icon}
            </Animated.Text>
          ))}
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>{progress}%</Text>
        </View>

        <TouchableOpacity onPress={handleGetStarted} style={styles.getStartedButton}>
          <Text style={styles.getStartedText}>Get Started</Text>
        </TouchableOpacity>

        <View style={styles.bottomLinks}>
          <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
            <Text style={styles.linkText}>Sign In</Text>
          </TouchableOpacity>
          <Text style={styles.divider}>|</Text>
          <TouchableOpacity onPress={() => router.replace('/(auth)/register')}>
            <Text style={styles.linkText}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  logoText: {
    fontSize: 48,
    fontWeight: '700',
    color: '#ffffff',
  },
  appName: {
    fontSize: 32,
    fontWeight: '700',
    marginTop: 20,
  },
  appTagline: {
    fontSize: 14,
    color: '#888',
    marginTop: 8,
  },
  featureIcons: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 40,
  },
  featureIcon: {
    fontSize: 28,
    opacity: 0.8,
  },
  progressContainer: {
    width: '100%',
    marginBottom: 32,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#e0e0e0',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#8B5CF6',
    borderRadius: 2,
  },
  progressText: {
    textAlign: 'right',
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  getStartedButton: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    marginBottom: 24,
  },
  getStartedText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomLinks: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  linkText: {
    fontSize: 14,
    color: '#8B5CF6',
    fontWeight: '500',
  },
  divider: {
    color: '#ccc',
  },
});
