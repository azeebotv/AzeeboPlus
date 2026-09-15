import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams, Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authApi } from '@azeebo/react-data';
import { PasswordInput } from '../../src/components/PasswordInput';
import { PasswordStrengthMeter } from '../../src/components/PasswordStrengthMeter';
import { colors } from '../../src/theme';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const token = params.token as string;

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [errors, setErrors] = useState<{
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!newPassword) {
      newErrors.newPassword = 'Password is required';
    } else if (passwordStrength < 3) {
      newErrors.newPassword = 'Password is too weak';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleReset = async () => {
    if (!validateForm()) {
      return;
    }

    if (!token) {
      Alert.alert('Error', 'Invalid reset link. Please request a new password reset link.');
      return;
    }

    setIsLoading(true);
    try {
      await authApi.resetPassword(token, newPassword);
      Alert.alert('Success', 'Your password has been reset successfully', [
        {
          text: 'OK',
          onPress: () => router.replace('/(auth)/login'),
        },
      ]);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Failed to reset password. Please try again.';
      Alert.alert('Error', message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Image
              source={require('../../assets/logo-white.png')}
              style={{ width: 140, height: 34, marginBottom: 12 }}
              resizeMode="contain"
              accessibilityLabel="Azeebo+ Logo"
            />
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>Create a new strong password for your account</Text>
          </View>

          <View style={styles.form}>
            <PasswordInput
              value={newPassword}
              onChangeText={(text) => {
                setNewPassword(text);
                if (errors.newPassword) {
                  setErrors((prev) => ({ ...prev, newPassword: undefined }));
                }
              }}
              label="New Password"
              placeholder="Enter new password"
              error={errors.newPassword}
              testID="new-password"
            />

            <PasswordStrengthMeter password={newPassword} onStrengthChange={setPasswordStrength} />

            <PasswordInput
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                if (errors.confirmPassword) {
                  setErrors((prev) => ({
                    ...prev,
                    confirmPassword: undefined,
                  }));
                }
              }}
              label="Confirm Password"
              placeholder="Confirm new password"
              error={errors.confirmPassword}
              testID="confirm-password"
            />

            <TouchableOpacity
              style={[styles.resetButton, isLoading && styles.resetButtonDisabled]}
              onPress={handleReset}
              disabled={isLoading}
              testID="reset-button"
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.resetButtonText}>Reset Password</Text>
              )}
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Remember your password?</Text>
              <Link href="/(auth)/login" asChild>
                <TouchableOpacity>
                  <Text style={styles.loginLink}> Sign In</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A0A0A',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#E8420A',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.light[100],
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.light[400],
    textAlign: 'center',
  },
  form: {
    flex: 1,
  },
  resetButton: {
    backgroundColor: '#E8420A',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 24,
  },
  resetButtonDisabled: {
    opacity: 0.7,
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  footerText: {
    color: colors.light[400],
    fontSize: 14,
  },
  loginLink: {
    color: '#E8420A',
    fontSize: 14,
    fontWeight: '600',
  },
});
