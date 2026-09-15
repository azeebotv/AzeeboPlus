import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Linking from 'expo-linking';
import * as Notifications from 'expo-notifications';
import * as ScreenOrientation from 'expo-screen-orientation';
// i18n side-effect import: registers + initializes i18next (async, non-blocking)
// BEFORE any screen renders, so useTranslation() finds the instance on the very
// first frame. Without it, every t() call returns raw keys until Settings is
// first opened (the only place that previously imported src/i18n).
import '../src/i18n';
import { AuthProvider } from '@azeebo/react-data/contexts/AuthContext';
import { VideoPlayerProvider } from '../src/contexts/VideoPlayerContext';
import { MiniPlayerOverlay } from '../src/components/video/MiniPlayerOverlay';
import { FlagsProvider, useFlags } from '@azeebo/react-data/contexts/FlagsContext';
import { WalletProvider } from '@azeebo/react-data/contexts/WalletContext';
import { NotificationProvider } from '../src/contexts/NotificationContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import { initializeCertificatePinning } from '@azeebo/react-data/utils/certificatePinning';
import { DeepLinkService } from '@azeebo/react-data/utils/deepLinking';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

// Foreground notification presentation — without a handler, notifications
// arriving while the app is open are silently dropped on both platforms.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Initialize certificate pinning at app startup
initializeCertificatePinning();

// The manifest allows all orientations so fullscreen video can rotate (see
// useVideoPlayer). Lock the app back to portrait on every launch — non-video
// screens are designed portrait-only.
ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {
  // Best-effort: devices without an orientation lock (rare) just skip it.
});

/**
 * Subscribes to azeebo:// deep links and routes them. Without this the
 * manifest's intent filters opened the app but every shared link silently
 * landed on the splash screen. Runs inside the router so `useRouter` works.
 */
function DeepLinkHandler() {
  const router = useRouter();

  useEffect(() => {
    const subscription = Linking.addEventListener('url', ({ url }) => {
      DeepLinkService.handleDeepLink(url, router);
    });

    // Cold-start link (app opened from a closed state)
    Linking.getInitialURL().then((url) => {
      if (url) DeepLinkService.handleDeepLink(url, router);
    });

    return () => subscription.remove();
  }, [router]);

  return null;
}

function RootNavigator() {
  const colorScheme = useColorScheme();
  const { isEnabled, ready } = useFlags();
  // mobile_dark_mode (on by default): when disabled the app is forced to the
  // light system scheme regardless of device preference. Before the flag
  // bootstrap resolves, follow the system scheme — defaulting to "disabled"
  // caused a light flash on every cold start for dark-mode users.
  const darkModeEnabled = !ready || isEnabled('mobile_dark_mode');
  const resolvedDark = darkModeEnabled && colorScheme === 'dark';

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <FlagsProvider>
              <WalletProvider>
                {/* Shared video player + PiP overlay: above the navigator so
                    the mini card floats over every screen. */}
                <VideoPlayerProvider>
                  <NotificationProvider>
                    <StatusBar style={resolvedDark ? 'light' : 'dark'} />
                    <DeepLinkHandler />
                    <MiniPlayerOverlay />
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
                </VideoPlayerProvider>
              </WalletProvider>
            </FlagsProvider>
          </AuthProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

export default function RootLayout() {
  // Root view for react-native-gesture-handler (video player gestures run
  // through it; RNGH pan/tap recognizers no-op without an ancestor root).
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <RootNavigator />
    </GestureHandlerRootView>
  );
}
