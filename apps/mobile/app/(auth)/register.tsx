import { useState } from 'react';
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
import { colors, typography, spacing, radius } from '../../src/theme';
import { GlassCard, BrandButton, BrandInput } from '../../src/components/ui';
import { PageTransition, ScrollReveal, AmbientGlow } from '../../src/components/motion';

export default function RegisterScreen() {
  const router = useRouter();
  const { register, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    try {
      await register(formData.email, formData.password, formData.name);
      router.push('/(auth)/otp-verification');
    } catch {
      setError('Registration failed. Please try again.');
    }
  };

  const handleSocialSignup = (provider: 'google' | 'apple') => {
    Alert.alert(
      'Coming Soon',
      `${provider.charAt(0).toUpperCase() + provider.slice(1)} signup will be available soon`
    );
  };

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
              <Text style={styles.logo}>
                AZEEBO<Text style={styles.logoPlus}>+</Text>
              </Text>
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
                  I agree to the <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
                  <Text style={styles.termsLink}>Privacy Policy</Text>
                </Text>
              </TouchableOpacity>

              <BrandButton
                title="Create Account"
                onPress={handleRegister}
                loading={isLoading}
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
    backgroundColor: '#E8420A',
    borderColor: '#E8420A',
  },
  checkmark: {
    color: '#fff',
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
    color: '#E8420A',
    textDecorationLine: 'underline',
  },
});
