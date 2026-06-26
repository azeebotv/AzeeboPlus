import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import GuestHomepage from '@/components/homepage/GuestHomepage';
import AuthenticatedHomepage from '@/components/homepage/AuthenticatedHomepage';

/**
 * Root home tab — serves distinct experiences based on authentication status.
 *
 * Mobile routing is tab-based (not URL-based), so the auth guard is inherent:
 * - Unauthenticated users see GuestHomepage (legacy experience)
 * - Authenticated users see AuthenticatedHomepage (redesigned experience)
 * - Transitions happen in-place when auth state changes (login/logout)
 *
 * Analytics are tracked via each homepage component's own useEffect hooks.
 */
export default function HomeTab() {
  const { isAuthenticated, isLoading } = useAuth();

  // Loading state: minimal skeleton to avoid layout shift
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E8420A" />
      </View>
    );
  }

  if (isAuthenticated) {
    return <AuthenticatedHomepage />;
  }

  return <GuestHomepage />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
});
