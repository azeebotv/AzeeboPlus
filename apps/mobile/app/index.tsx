import React from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/contexts/AuthContext';
import { View, StyleSheet } from 'react-native';
import { Loading, Error, EmptyState } from '@azeebo/ui';

export default function Index() {
  const router = useRouter();
  const { isAuthenticated, isLoading, error } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Loading message="Checking authentication..." />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Error 
          title="Authentication Error" 
          message={error.message || 'Failed to check authentication'} 
          onRetry={() => router.replace('/(auth)/login')}
        />
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <EmptyState 
          title="Sign In Required" 
          message="Please sign in to continue"
          onAction={() => router.replace('/(auth)/login')}
          actionText="Sign In"
        />
      </View>
    );
  }

  React.useEffect(() => {
    router.replace('/(tabs)/home');
  }, []);

  return (
    <View style={styles.container}>
      <Loading message="Redirecting..." />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
});
