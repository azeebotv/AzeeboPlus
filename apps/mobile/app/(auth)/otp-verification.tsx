import { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@azeebo/react-data/contexts/AuthContext';
import { colors } from '../../src/theme';

export default function OTPVerificationScreen() {
  const router = useRouter();
  const { verifyOTP, resendOTP, isLoading } = useAuth();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(60);
  const [error, setError] = useState<string | null>(null);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleOTPChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (index === 5 && value) {
      const fullOTP = newOtp.join('');
      if (fullOTP.length === 6) {
        handleVerify(fullOTP);
      }
    }
  };

  const handleKeyPress = (e: { nativeEvent: { key: string } }, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (otpCode?: string) => {
    const code = otpCode || otp.join('');
    setError(null);

    if (code.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    try {
      const result = await verifyOTP(code);
      if (result.success) {
        // After OTP verification, check if user needs to select a role
        const verifiedUser = result.user;
        if (!verifiedUser?.role) {
          router.replace('/(auth)/role-selection');
        } else {
          router.replace('/(tabs)/home');
        }
      } else {
        setError(result.message || 'Invalid or expired code');
      }
    } catch (error) {
      setError('Invalid or expired code');
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;

    try {
      await resendOTP();
      setTimer(60);
      Alert.alert('Code Sent', 'A new verification code has been sent');
    } catch (error) {
      setError('Unable to resend code');
    }
  };

  const setInputRef = useCallback((index: number) => {
    return (ref: TextInput | null) => {
      inputRefs.current[index] = ref;
    };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Verify Your Phone</Text>
            <Text style={styles.subtitle}>Enter the 6-digit code sent to your phone number</Text>
          </View>

          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={setInputRef(index)}
                style={[styles.otpInput, digit && styles.otpInputFilled]}
                value={digit}
                onChangeText={(value) => handleOTPChange(value, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
              />
            ))}
          </View>

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.verifyButton, isLoading && styles.verifyButtonDisabled]}
            onPress={() => handleVerify()}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.text.primary} />
            ) : (
              <Text style={styles.verifyButtonText}>Verify</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.resendButton, timer > 0 && styles.resendButtonDisabled]}
            onPress={handleResend}
            disabled={timer > 0}
          >
            <Text style={styles.resendButtonText}>
              {timer > 0 ? `Resend code in ${timer}s` : 'Resend code'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.text.primary,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.dark[700],
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 40,
  },
  otpInput: {
    width: 48,
    height: 56,
    borderWidth: 2,
    borderColor: colors.light[300],
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '600',
    marginHorizontal: 4,
    backgroundColor: colors.light[50],
  },
  otpInputFilled: {
    borderColor: colors.primary[500],
    backgroundColor: colors.text.primary,
  },
  verifyButton: {
    backgroundColor: colors.primary[500],
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  verifyButtonDisabled: {
    backgroundColor: colors.light[300],
  },
  verifyButtonText: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: '600',
  },
  resendButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  resendButtonDisabled: {
    opacity: 0.5,
  },
  resendButtonText: {
    color: colors.primary[500],
    fontSize: 16,
  },
  errorContainer: {
    backgroundColor: colors.error[100],
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: colors.error[500],
    fontSize: 14,
    textAlign: 'center',
  },
});
