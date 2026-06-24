import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { colors, typography, spacing, radius } from '../../src/theme';
import { GlassCard, BrandButton, BrandInput } from '../../src/components/ui';
import {
  PageTransition,
  ScrollReveal,
  AmbientGlow,
} from '../../src/components/motion';

export default function RegisterScreen() {
  const router = useRouter();
  const { register, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    displayName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async () => {
    if (!formData.username || !formData.email || !formData.password) {
      setError('Please fill in all required fields');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setError(null);
    try {
      await register(
        formData.email,
        formData.password,
        formData.displayName || formData.username,
        formData.phone || ''
      );
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
      <AmbientGlow color={colors.primary} />

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
              <Text style={styles.subtitle}>Create your account</Text>
            </View>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={100}>
            <GlassCard style={styles.card}>
              <BrandInput
                label="Username"
                value={formData.username}
                onChangeText={(v) => setFormData((p) => ({ ...p, username: v }))}
                placeholder="Choose a username"
                autoCapitalize="none"
              />

              <BrandInput
                label="Display Name"
                value={formData.displayName}
                onChangeText={(v) => setFormData((p) => ({ ...p, displayName: v }))}
                placeholder="How should we call you?"
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
                label="Phone (Optional)"
                value={formData.phone}
                onChangeText={(v) => setFormData((p) => ({ ...p, phone: v }))}
                placeholder="+234 XXX XXX XXXX"
                keyboardType="phone-pad"
              />

              <BrandInput
                label="Password"
                value={formData.password}
                onChangeText={(v) => setFormData((p) => ({ ...p, password: v }))}
                placeholder="At least 8 characters"
                secureTextEntry
              />

              <BrandInput
                label="Confirm Password"
                value={formData.confirmPassword}
                onChangeText={(v) => setFormData((p) => ({ ...p, confirmPassword: v }))}
                placeholder="Confirm your password"
                secureTextEntry
              />

              {error && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

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
    color: colors.primary,
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
    color: colors.error,
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
});
