import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { AuthProvider } from '../src/contexts/AuthContext';
import { FlagsProvider, useFlags } from '../src/contexts/FlagsContext';
import { WalletProvider } from '../src/contexts/WalletContext';
import { NotificationProvider } from '../src/contexts/NotificationContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import { initializeCertificatePinning } from '../src/utils/certificatePinning';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

// Initialize certificate pinning at app startup
initializeCertificatePinning();

function RootNavigator() {
  const colorScheme = useColorScheme();
  const { isEnabled } = useFlags();
  // mobile_dark_mode (on by default): when disabled the app is forced to the
  // light system scheme regardless of device preference.
  const darkModeEnabled = isEnabled('mobile_dark_mode');
  const resolvedDark = darkModeEnabled && colorScheme === 'dark';

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <FlagsProvider>
              <WalletProvider>
                <NotificationProvider>
                <StatusBar style={resolvedDark ? 'light' : 'dark'} />
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
                  <Stack.Screen name="subscription" options={{ headerShown: false }} />

                  {/* Reality */}
                  <Stack.Screen name="reality" options={{ headerShown: false }} />
                  <Stack.Screen name="reality/[showId]" options={{ headerShown: false }} />

                  {/* Lifestyle */}
                  <Stack.Screen name="lifestyle" options={{ headerShown: false }} />

                  {/* Vertical / Vertical Title */}
                  <Stack.Screen name="vertical" options={{ headerShown: false }} />
                  <Stack.Screen name="vertical-title" options={{ headerShown: false }} />

                  {/* Sports */}
                  <Stack.Screen name="sports" options={{ headerShown: false }} />

                  {/* Comedy */}
                  <Stack.Screen name="comedy" options={{ headerShown: false }} />

                  {/* Games */}
                  <Stack.Screen name="games" options={{ headerShown: false }} />

                  {/* Movies */}
                  <Stack.Screen name="movies" options={{ headerShown: false }} />

                  {/* Standalone screens */}
                  <Stack.Screen name="vote" options={{ headerShown: false }} />
                  <Stack.Screen name="leaderboard" options={{ headerShown: false }} />
                  <Stack.Screen name="prediction" options={{ headerShown: false }} />
                  <Stack.Screen name="messages" options={{ headerShown: false }} />
                  <Stack.Screen name="notifications" options={{ headerShown: false }} />
                  <Stack.Screen name="premium" options={{ headerShown: false }} />
                </Stack>
                </NotificationProvider>
              </WalletProvider>
            </FlagsProvider>
          </AuthProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

export default function RootLayout() {
  return <RootNavigator />;
}
