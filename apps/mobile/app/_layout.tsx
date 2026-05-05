import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { AuthProvider } from '../src/contexts/AuthContext';
import { WalletProvider } from '../src/contexts/WalletContext';
import { ContentProvider } from '../src/contexts/ContentContext';
import { NotificationProvider } from '../src/contexts/NotificationContext';
import { SettingsProvider } from '../src/contexts/SettingsContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const queryClient = new QueryClient();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <WalletProvider>
            <ContentProvider>
              <NotificationProvider>
                <SettingsProvider>
                  <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
                  <Stack
                    screenOptions={{
                      headerShown: false,
                      animation: 'slide_from_right',
                    }}
                  >
                    <Stack.Screen name="index" options={{ headerShown: false }} />
                    <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                    <Stack.Screen name="watch/[contentId]" options={{ headerShown: false }} />
                  </Stack>
                </SettingsProvider>
              </NotificationProvider>
            </ContentProvider>
          </WalletProvider>
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}