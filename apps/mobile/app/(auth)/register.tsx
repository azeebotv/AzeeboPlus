import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Linking,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useAuth } from '@azeebo/react-data/contexts/AuthContext';
import { authApi } from '@azeebo/react-data';
import { logger } from '@azeebo/react-data/utils/logger';
import { colors, typography, spacing, radius } from '../../src/theme';
import { GlassCard, BrandButton, BrandInput } from '../../src/components/ui';
import { PageTransition, ScrollReveal, AmbientGlow } from '../../src/components/motion';

export default function RegisterScreen() {
  const router = useRouter();
  const { register, socialLogin, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegister = async () => {
    if (!formData.name || !formData.email || !formData.password) {
      setError('Please fill in all required fields');
      return;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    const hasUpperCase = /[A-Z]/.test(formData.password);
    const hasLowerCase = /[a-z]/.test(formData.password);
    const hasNumber = /[0-9]/.test(formData.password);
    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
      setError('Password must include uppercase, lowercase, and numbers');
      return;
    }
    if (!agreed) {
      setError('You must agree to the Terms of Service and Privacy Policy');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await register(formData.email, formData.password, formData.name);
      router.push('/(auth)/otp-verification');
    } catch {
      setError('Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSocialSignup = useCallback(
    async (provider: 'google' | 'apple') => {
      setIsSubmitting(true);
      setError(null);

      try {
        // 1. Get the OAuth authorize URL and state from the backend
        const redirectUri = 'azeebo://oauth-callback';
        const authorizeResponse =
          provider === 'google'
            ? await authApi.getGoogleAuthorizeUrl(redirectUri)
            : await authApi.getAppleAuthorizeUrl(redirectUri);

        if (!authorizeResponse.success || !authorizeResponse.data) {
          setError(`${provider} sign-up is temporarily unavailable. Please try again.`);
          setIsSubmitting(false);
          return;
        }

        const { state, authorizeUrl } = authorizeResponse.data;

        // 2. Open the OAuth consent screen in-app browser
        const result = await WebBrowser.openAuthSessionAsync(authorizeUrl, redirectUri);

        if (result.type !== 'success') {
          // User cancelled or error
          if (result.type === 'cancel') {
            setIsSubmitting(false);
            return;
          }
          setError(`${provider} sign-up was cancelled or failed. Please try again.`);
          setIsSubmitting(false);
          return;
        }

        // 3. Parse the redirect URL to extract code and state
        const url = new URL(result.url);
        const code = url.searchParams.get('code');
        const returnedState = url.searchParams.get('state');
        const oauthError = url.searchParams.get('error');

        if (oauthError) {
          setError(`${provider} sign-up failed: ${oauthError}`);
          setIsSubmitting(false);
          return;
        }

        if (!code || !returnedState) {
          setError('Invalid OAuth response. Please try again.');
          setIsSubmitting(false);
          return;
        }

        // 4. Validate state matches (CSRF protection)
        if (returnedState !== state) {
          setError('Security validation failed. Please try again.');
          setIsSubmitting(false);
          return;
        }

        // 5. Exchange the code for auth tokens via the backend
        const socialResult = await socialLogin({
          code,
          state: returnedState,
          displayName: formData.name || undefined,
        });

        if (socialResult.success) {
          router.replace('/(tabs)');
        } else {
          setError(
            socialResult.message ||
              `${provider} sign-up failed. Please try again or use email sign-up.`
          );
        }
      } catch (error: unknown) {
        logger.error(`${provider} OAuth error`, error);
        const message =
          error instanceof Error ? error.message : `${provider} sign-up failed. Please try again.`;
        setError(message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData.name, router]
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <AmbientGlow color={colors.primary[500]} />

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
              <Text style={styles.tagline}>Empowering Nigeria{'\u2019'}s Creative Renaissance</Text>
              <Text style={styles.stepIndicator}>Step 1: Your Details</Text>
              <Text style={styles.subtitle}>Create Your Azeebo+ Account</Text>
            </View>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={100}>
            <GlassCard style={styles.card}>
              <BrandInput
                label="Name"
                value={formData.name}
                onChangeText={(v) => setFormData((p) => ({ ...p, name: v }))}
                placeholder="Your full name"
              />

              <BrandInput
                label="Email"
                value={formData.email}
                onChangeText={(v) => setFormData((p) => ({ ...p, email: v }))}
                placeholder="your@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <BrandInput
                label="Password"
                value={formData.password}
                onChangeText={(v) => setFormData((p) => ({ ...p, password: v }))}
                placeholder="At least 8 characters"
                secureTextEntry
              />

              {error && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.termsRow}
                onPress={() => setAgreed(!agreed)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
                  {agreed && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.termsText}>
                  I agree to the{' '}
                  <Text
                    style={styles.termsLink}
                    onPress={() => Linking.openURL('https://azeebo.plus/terms')}
                  >
                    Terms of Service
                  </Text>{' '}
                  and{' '}
                  <Text
                    style={styles.termsLink}
                    onPress={() => Linking.openURL('https://azeebo.plus/privacy')}
                  >
                    Privacy Policy
                  </Text>
                </Text>
              </TouchableOpacity>

              <BrandButton
                title="Create Account"
                onPress={handleRegister}
                loading={isLoading || isSubmitting}
                disabled={isSubmitting}
                variant="primary"
              />

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR SIGN UP WITH</Text>
                <View style={styles.dividerLine} />
              </View>

              <View style={styles.socialButtons}>
                <BrandButton
                  title="Google"
                  onPress={() => handleSocialSignup('google')}
                  variant="social"
                />
                <BrandButton
                  title="Apple"
                  onPress={() => handleSocialSignup('apple')}
                  variant="social"
                />
              </View>
            </GlassCard>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={200}>
            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <BrandButton
                title="Sign In"
                onPress={() => router.replace('/(auth)/login')}
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
    paddingVertical: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
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
  tagline: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  stepIndicator: {
    fontSize: typography.fontSize.xs,
    color: colors.primary[500],
    marginTop: spacing.md,
    fontWeight: typography.fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 1,
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
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: spacing.lg,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: colors.primaryColor,
    borderColor: colors.primaryColor,
  },
  checkmark: {
    color: colors.text.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  termsText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  termsLink: {
    color: colors.primaryColor,
    textDecorationLine: 'underline',
  },
});
