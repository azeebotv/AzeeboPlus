import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';

export default function OnboardingWelcomeScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: colorScheme === 'dark' ? '#000000' : '#ffffff', opacity: fadeAnim },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.animationContainer}>
          <View style={styles.ring1} />
          <View style={styles.ring2} />
          <View style={styles.ring3} />
          <Text style={styles.animationIcon}>🎬</Text>
        </View>

        <Text style={[styles.title, { color: colorScheme === 'dark' ? '#ffffff' : '#000000' }]}>
          Welcome to Azeebo+
        </Text>

        <Text style={styles.description}>
          Discover endless entertainment across 8 amazing universes. Reality shows, creators,
          movies, games, and more!
        </Text>

        <View style={styles.features}>
          {[
            { icon: '🎭', label: 'Reality' },
            { icon: '🎤', label: 'Creators' },
            { icon: '✨', label: 'Lifestyle' },
            { icon: '🏰', label: 'Vertical' },
          ].map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <Text style={styles.featureIcon}>{feature.icon}</Text>
              <Text
                style={[
                  styles.featureLabel,
                  { color: colorScheme === 'dark' ? '#ffffff' : '#000000' },
                ]}
              >
                {feature.label}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.bottomActions}>
        <TouchableOpacity
          onPress={() => router.push('/(auth)/onboarding-interests')}
          style={styles.primaryButton}
        >
          <Text style={styles.primaryButtonText}>Get Started</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
          <Text style={styles.secondaryButtonText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  content: {
    alignItems: 'center',
  },
  animationContainer: {
    position: 'relative',
    width: 200,
    height: 200,
    marginBottom: 32,
  },
  ring1: {
    position: 'absolute',
    top: '20%',
    left: '20%',
    right: '20%',
    bottom: '20%',
    borderRadius: 100,
    borderWidth: 2,
    borderColor: '#8B5CF6',
    opacity: 0.3,
  },
  ring2: {
    position: 'absolute',
    top: '10%',
    left: '10%',
    right: '10%',
    bottom: '10%',
    borderRadius: 100,
    borderWidth: 2,
    borderColor: '#6366F1',
    opacity: 0.2,
  },
  ring3: {
    position: 'absolute',
    top: '5%',
    left: '5%',
    right: '5%',
    bottom: '5%',
    borderRadius: 100,
    borderWidth: 2,
    borderColor: '#EC4899',
    opacity: 0.1,
  },
  animationIcon: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -24 }, { translateY: -24 }],
    fontSize: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    lineHeight: 1.6,
    marginBottom: 32,
  },
  features: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'center',
  },
  featureItem: {
    alignItems: 'center',
    width: '40%',
  },
  featureIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  featureLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  bottomActions: {
    gap: 16,
  },
  primaryButton: {
    backgroundColor: '#8B5CF6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#8B5CF6',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
});
