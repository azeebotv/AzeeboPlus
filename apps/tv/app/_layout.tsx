import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
// i18n side-effect import: registers + initializes i18next (async, non-blocking)
// BEFORE any screen renders, so useTranslation() finds the instance on the very
// first frame. Without it, every t() call on the home screen returns raw keys.
import '../src/i18n';
import { AuthProvider } from '@azeebo/react-data/contexts/AuthContext';
import { FlagsProvider } from '@azeebo/react-data/contexts/FlagsContext';
import { WalletProvider } from '@azeebo/react-data/contexts/WalletContext';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import { initializeCertificatePinning } from '@azeebo/react-data/utils/certificatePinning';
import { colors } from '../src/theme';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

// Certificate pinning behaves identically to mobile: enabled only when the
// native pinning library is present (see utils/certificatePinning).
initializeCertificatePinning();

function RootNavigator() {
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <FlagsProvider>
              <WalletProvider>
                <StatusBar style="light" />
                <Stack
                  screenOptions={{
                    headerShown: false,
                    // No slide animation — TV screens switch instantly, and
                    // the default animation pulls focus away from content.
                    animation: 'none',
                    contentStyle: { backgroundColor: colors.bg.primary },
                  }}
                >
                  <Stack.Screen name="index" options={{ headerShown: false }} />
                  <Stack.Screen name="browse" options={{ headerShown: false }} />
                  <Stack.Screen name="search" options={{ headerShown: false }} />
                  <Stack.Screen name="library" options={{ headerShown: false }} />
                  <Stack.Screen name="signin" options={{ headerShown: false }} />
                  <Stack.Screen name="settings" options={{ headerShown: false }} />
                  <Stack.Screen name="auth/device-link" options={{ headerShown: false }} />
                  <Stack.Screen name="profile/account" options={{ headerShown: false }} />
                  <Stack.Screen name="detail/[id]" options={{ headerShown: false }} />
                  <Stack.Screen name="live/[id]" options={{ headerShown: false }} />
                  <Stack.Screen name="wallet/fund" options={{ headerShown: false }} />
                  <Stack.Screen name="watch/[contentId]" options={{ headerShown: false }} />
                  <Stack.Screen name="reality" options={{ headerShown: false }} />
                  <Stack.Screen name="movies" options={{ headerShown: false }} />
                  <Stack.Screen name="comedy" options={{ headerShown: false }} />
                  <Stack.Screen name="sports" options={{ headerShown: false }} />
                  <Stack.Screen name="lifestyle" options={{ headerShown: false }} />
                  <Stack.Screen name="music" options={{ headerShown: false }} />
                  <Stack.Screen name="vertical" options={{ headerShown: false }} />
                  <Stack.Screen name="games" options={{ headerShown: false }} />
                  <Stack.Screen name="watch-party" options={{ headerShown: false }} />
                  <Stack.Screen name="bundles" options={{ headerShown: false }} />
                </Stack>
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
