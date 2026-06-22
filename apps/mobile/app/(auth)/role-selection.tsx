import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
// import { authApi } from '@/src/api/auth';

export default function RoleSelectionScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleRoleSelection = async (role: 'user' | 'creator' | 'both') => {
    setIsLoading(true);
    setError(null);
    try {
      // In a real app, you would send this to your backend to set the user's role
      // For now, we'll just store it locally and navigate to profile setup
      // await api.auth.setRole({ role });
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Navigate to profile setup
      router.replace('/(auth)/profile-setup' as never);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to select role');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Select Your Role</Text>
        <Text style={styles.subtitle}>
          Are you here to watch content, create content, or both?
        </Text>
      </View>

      <View style={styles.options}>
        <Pressable
          style={[styles.optionButton, styles.userButton]}
          onPress={() => handleRoleSelection('user')}
          disabled={isLoading}
        >
          <View style={styles.optionIcon}>
            <Text style={styles.iconText}>👀</Text>
          </View>
          <View style={styles.optionText}>
            <Text style={styles.optionTitle}>Viewer</Text>
            <Text style={styles.optionDescription}>Watch shows, vote, and enjoy content</Text>
          </View>
        </Pressable>

        <Pressable
          style={[styles.optionButton, styles.creatorButton]}
          onPress={() => handleRoleSelection('creator')}
          disabled={isLoading}
        >
          <View style={styles.optionIcon}>
            <Text style={styles.iconText}>🎥</Text>
          </View>
          <View style={styles.optionText}>
            <Text style={styles.optionTitle}>Creator</Text>
            <Text style={styles.optionDescription}>Upload content, engage with fans, and earn</Text>
          </View>
        </Pressable>

        <Pressable
          style={[styles.optionButton, styles.bothButton]}
          onPress={() => handleRoleSelection('both')}
          disabled={isLoading}
        >
          <View style={styles.optionIcon}>
            <Text style={styles.iconText}>👀🎥</Text>
          </View>
          <View style={styles.optionText}>
            <Text style={styles.optionTitle}>Both</Text>
            <Text style={styles.optionDescription}>Watch and create content</Text>
          </View>
        </Pressable>
      </View>

      {error && (
        <View style={styles.error}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#6b7280',
    textAlign: 'center',
  },
  options: {
    gap: 16,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  optionButtonDisabled: {
    opacity: 0.6,
  },
  userButton: {
    borderColor: '#3b82f6',
  },
  creatorButton: {
    borderColor: '#10b981',
  },
  bothButton: {
    borderColor: '#8b5cf6',
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    backgroundColor: '#fff',
  },
  iconText: {
    fontSize: 20,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  error: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorText: {
    color: '#dc2626',
    textAlign: 'center',
  },
});
