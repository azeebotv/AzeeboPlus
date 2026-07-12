import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { useBiometric } from '../../src/hooks/useBiometric';
import { colors, typography, spacing, radius } from '../../src/theme';
import { GlassCard, BrandButton, BrandInput } from '../../src/components/ui';
import { PageTransition, ScrollReveal, AmbientGlow } from '../../src/components/motion';

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading } = useAuth();
  const { isAvailable, isEnabled, authenticateWithStoredCredentials } = useBiometric();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showBiometricOption, setShowBiometricOption] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAvailable && isEnabled) {
      setShowBiometricOption(true);
    }
  }, [isAvailable, isEnabled]);

  const handleBiometricLogin = async () => {
    try {
      const result = await authenticateWithStoredCredentials();
      if (result.success) {
        router.replace('/(tabs)/home');
      } else {
        Alert.alert(
          'Authentication Failed',
          result.error || 'Biometric authentication failed. Please use your password.',
          [{ text: 'OK' }]
        );
      }
    } catch {
      Alert.alert('Error', 'Biometric authentication failed');
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    setError(null);
    try {
      const result = await login(email, password);
      if (result.success) {
        router.replace('/(tabs)/home');
      } else {
        setError(result.message || 'Invalid email or password');
      }
    } catch {
      setError('Invalid email or password');
    }
  };

  const handleSocialLogin = (provider: 'google' | 'apple') => {
    Alert.alert(
      'Coming Soon',
      `${provider.charAt(0).toUpperCase() + provider.slice(1)} login will be available soon`
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <AmbientGlow color={colors.red} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <PageTransition>
          <ScrollReveal direction="up" delay={0}>
            <View style={styles.header}>
              <Text style={styles.logo}>
                AZEEBO<Text style={styles.logoPlus}>+</Text>
              </Text>
              <Text style={styles.subtitle}>Welcome back</Text>
            </View>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={100}>
            <GlassCard style={styles.card}>
              <BrandInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <BrandInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                secureTextEntry
              />

              {error && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <TouchableOpacity
                onPress={() => router.push('/(auth)/forgot-password')}
                style={styles.forgotPasswordContainer}
              >
                <Text style={styles.forgotPasswordText}>Forgot your password?</Text>
              </TouchableOpacity>

              <BrandButton
                title="Sign In to Azeebo+"
                onPress={handleLogin}
                loading={isLoading}
                variant="primary"
              />

              {showBiometricOption && (
                <BrandButton
                  title="Use Biometric Login"
                  onPress={handleBiometricLogin}
                  variant="secondary"
                  style={styles.biometricButton}
                />
              )}

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
                <View style={styles.dividerLine} />
              </View>

              <View style={styles.socialButtons}>
                <BrandButton
                  title="Google"
                  onPress={() => handleSocialLogin('google')}
                  variant="social"
                />
                <BrandButton
                  title="Apple"
                  onPress={() => handleSocialLogin('apple')}
                  variant="social"
                />
              </View>
            </GlassCard>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={200}>
            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <BrandButton
                title="Sign Up"
                onPress={() => router.push('/(auth)/register')}
                variant="ghost"
              />
            </View>
          </ScrollReveal>
        </PageTransition>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.xxl,
    justifyContent: 'center',
    paddingVertical: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxxl,
  },
  logo: {
    fontSize: typography.fontSize.xxl,
    fontWeight: '800',
    color: colors.text.primary,
  },
  logoPlus: {
    color: colors.primary[500],
  },
  subtitle: {
    fontSize: typography.fontSize.lg,
    color: colors.text.secondary,
    marginTop: spacing.sm,
  },
  card: {
    marginBottom: spacing.xxl,
  },
  errorContainer: {
    backgroundColor: 'rgba(204,28,28,0.15)',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(204,28,28,0.3)',
  },
  errorText: {
    color: colors.error[500],
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
  },
  forgotPasswordContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  forgotPasswordText: {
    color: colors.text.tertiary,
    fontSize: typography.fontSize.xs,
  },
  biometricButton: {
    marginTop: spacing.md,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.xxl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border.default,
  },
  dividerText: {
    color: colors.text.tertiary,
    marginHorizontal: spacing.md,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    letterSpacing: 0.5,
  },
  socialButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.base,
  },
});
