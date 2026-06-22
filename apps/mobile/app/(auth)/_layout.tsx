import React from 'react';
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
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
      <Stack.Screen name="profile-setup" options={{ title: 'Complete Profile' }} />
      <Stack.Screen name="role-selection" options={{ title: 'Select Role' }} />
    </Stack>
  );
}
