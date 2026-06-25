import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import GuestHomepage from '@/components/homepage/GuestHomepage';
import AuthenticatedHomepage from '@/components/homepage/AuthenticatedHomepage';

/**
 * Root home tab — serves distinct experiences based on authentication status.
 *
 * While the auth session is loading (`isLoading === true`), we render a minimal
 * loading indicator to avoid layout shift. Once resolved, we render the
 * appropriate homepage variant. When the user logs in or out, the AuthContext
 * state changes and this component re-renders with the new variant — no full
 * reload needed.
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
