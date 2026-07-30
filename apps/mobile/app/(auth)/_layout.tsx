import { Stack } from 'expo-router';
import { View } from 'react-native';
import LanguageSwitcher from '../../src/components/ui/LanguageSwitcher';
import { colors } from '../../src/theme';

export default function AuthLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg.primary, position: 'relative' }}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
        }}
      >
        <Stack.Screen name="login" options={{ title: 'Login' }} />
        <Stack.Screen name="register" options={{ title: 'Create Account' }} />
        <Stack.Screen name="forgot-password" options={{ title: 'Forgot Password' }} />
        <Stack.Screen name="otp-verification" options={{ title: 'Verify Phone' }} />
        <Stack.Screen name="reset-password" options={{ title: 'Reset Password' }} />
        <Stack.Screen name="onboarding-welcome" options={{ title: 'Welcome' }} />
        <Stack.Screen name="onboarding-interests" options={{ title: 'Select Interests' }} />
        <Stack.Screen name="profile-setup" options={{ title: 'Complete Profile' }} />
        <Stack.Screen name="role-selection" options={{ title: 'Select Role' }} />
        <Stack.Screen name="biometric" options={{ title: 'Biometric Auth' }} />
      </Stack>
      <LanguageSwitcher placement="header" />
    </View>
  );
}
