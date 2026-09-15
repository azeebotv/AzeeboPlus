import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useAuth } from '@azeebo/react-data/contexts/AuthContext';
import { authApi } from '@azeebo/react-data';
import { useBiometric } from '../../src/hooks/useBiometric';
import { analytics } from '../../src/utils/analytics';
import { useFeatureFlags } from '@azeebo/react-data/hooks/useFeatureFlags';
import { authFlags } from '@azeebo/feature-flags/registries';
import { logger } from '@azeebo/react-data/utils/logger';
import { colors, typography, spacing, radius } from '../../src/theme';
import { GlassCard, BrandButton, BrandInput } from '../../src/components/ui';
import { PageTransition, ScrollReveal, AmbientGlow } from '../../src/components/motion';

export default function LoginScreen() {
  const router = useRouter();
  const { login, socialLogin, isLoading } = useAuth();
  const { isAvailable, isEnabled, authenticateWithStoredCredentials } = useBiometric();
  const { flags } = useFeatureFlags();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showBiometricOption, setShowBiometricOption] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Feature flags for social login
  const googleEnabled = flags[authFlags.socialGoogle]?.enabled === true;
  const appleEnabled = flags[authFlags.socialApple]?.enabled === true;
  const showSocialLogin = googleEnabled || appleEnabled;

  useEffect(() => {
    if (isAvailable && isEnabled) {
      setShowBiometricOption(true);
    }
  }, [isAvailable, isEnabled]);

  const handleBiometricLogin = async () => {
    // Track the in-flight state like the password path does, so the submit
    // button's loading indicator and double-tap guard cover biometrics too
    // (previously only the password/social paths set isSubmitting).
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await authenticateWithStoredCredentials();
      if (result.success) {
        analytics.userLoggedIn('biometric', 'mobile');
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
    } finally {
      setIsSubmitting(false);
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
    setIsSubmitting(true);
    try {
      const result = await login(email, password);
      if (result.success) {
        analytics.userLoggedIn('password', 'mobile');
        router.replace('/(tabs)/home');
      } else {
        setError(result.message || 'Invalid email or password');
      }
    } catch {
      setError('Invalid email or password');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSocialLogin = useCallback(
    async (provider: 'google' | 'apple') => {
      setIsSubmitting(true);
      setError(null);

      try {
        const redirectUri = 'azeebo://oauth-callback';
        const authorizeResponse =
          provider === 'google'
            ? await authApi.getGoogleAuthorizeUrl(redirectUri)
            : await authApi.getAppleAuthorizeUrl(redirectUri);

        if (!authorizeResponse.success || !authorizeResponse.data) {
          setError(`${provider} sign-in is temporarily unavailable. Please try again.`);
          setIsSubmitting(false);
          return;
        }

        const { state, authorizeUrl } = authorizeResponse.data;
        const result = await WebBrowser.openAuthSessionAsync(authorizeUrl, redirectUri);

        if (result.type !== 'success') {
          if (result.type === 'cancel') {
            setIsSubmitting(false);
            return;
          }
          setError(`${provider} sign-in was cancelled or failed. Please try again.`);
          setIsSubmitting(false);
          return;
        }

        const url = new URL(result.url);
        const code = url.searchParams.get('code');
        const returnedState = url.searchParams.get('state');
        const oauthError = url.searchParams.get('error');

        if (oauthError) {
          setError(`${provider} sign-in failed: ${oauthError}`);
          setIsSubmitting(false);
          return;
        }

        if (!code || !returnedState) {
          setError('Invalid OAuth response. Please try again.');
          setIsSubmitting(false);
          return;
        }

        if (returnedState !== state) {
          setError('Security validation failed. Please try again.');
          setIsSubmitting(false);
          return;
        }

        const socialResult = await socialLogin({ code, state: returnedState });

        if (socialResult.success) {
          analytics.userLoggedIn(provider, 'mobile');
          router.replace('/(tabs)/home');
        } else {
          setError(
            socialResult.message ||
              `${provider} sign-in failed. Please try again or use email sign-in.`
          );
        }
      } catch (error: unknown) {
        logger.error(`${provider} OAuth login error`, error);
        const message =
          error instanceof Error ? error.message : `${provider} sign-in failed. Please try again.`;
        setError(message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [socialLogin, router]
  );

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
              <Image
                source={require('../../assets/logo-white.png')}
                style={{ width: 140, height: 34, marginBottom: 8 }}
                resizeMode="contain"
                accessibilityLabel="Azeebo+ Logo"
              />
              <Text style={styles.subtitle}>Welcome back</Text>
            </View>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={100}>
            <GlassCard style={styles.card} testID="login-card">
              <BrandInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                testID="login-email-input"
              />

              <BrandInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                secureTextEntry
                testID="login-password-input"
              />

              {error && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <TouchableOpacity
                onPress={() => router.push('/(auth)/forgot-password')}
                style={styles.forgotPasswordContainer}
                testID="login-forgot-password"
              >
                <Text style={styles.forgotPasswordText}>Forgot your password?</Text>
              </TouchableOpacity>

              <BrandButton
                title="Sign In to Azeebo+"
                onPress={handleLogin}
                loading={isLoading || isSubmitting}
                disabled={isSubmitting}
                variant="primary"
                testID="login-submit-button"
              />

              {showBiometricOption && (
                <BrandButton
                  title="Use Biometric Login"
                  onPress={handleBiometricLogin}
                  variant="secondary"
                  style={styles.biometricButton}
                />
              )}

              {showSocialLogin && (
                <>
                  <View style={styles.divider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
                    <View style={styles.dividerLine} />
                  </View>

                  <View style={styles.socialButtons}>
                    {googleEnabled && (
                      <BrandButton
                        title="Google"
                        onPress={() => handleSocialLogin('google')}
                        variant="social"
                        testID="login-google-button"
                      />
                    )}
                    {appleEnabled && (
                      <BrandButton
                        title="Apple"
                        onPress={() => handleSocialLogin('apple')}
                        variant="social"
                        testID="login-apple-button"
                      />
                    )}
                  </View>
                </>
              )}
            </GlassCard>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={200}>
            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <BrandButton
                title="Sign Up"
                onPress={() => router.push('/(auth)/register')}
                variant="ghost"
                testID="login-signup-button"
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
