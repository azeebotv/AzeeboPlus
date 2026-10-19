import { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@azeebo/react-data/contexts/AuthContext';

export default function RoleSelectionScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { selectRole } = useAuth();

  // The same union as react-data's SelectableRole; kept as literals so this
  // screen needs no value import from the package barrel.
  const handleRoleSelection = async (role: 'user' | 'creator') => {
    setIsLoading(true);
    setError(null);
    try {
      // selectRole adopts the re-minted access token, so the new role is live on
      // the next request instead of after the old token expires.
      const result = await selectRole(role);
      if (!result.success) {
        setError(result.message || 'Failed to select role');
        return;
      }
      router.replace('/(auth)/profile-setup');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Select Your Azeebo+ Role</Text>
        <Text style={styles.subtitle}>
          Your curated home for Nigerian contents, community and creation.
        </Text>
      </View>

      <View style={styles.options}>
        <Pressable
          style={[styles.optionButton, styles.userButton]}
          onPress={() => handleRoleSelection('user')}
          disabled={isLoading}
        >
          <View style={styles.optionIcon}>
            <Text style={styles.iconText}>👨‍👩‍👧‍👦</Text>
          </View>
          <View style={styles.optionText}>
            <Text style={styles.optionTitle}>Regular User</Text>
            <Text style={styles.optionDescription}>Enjoy premium Nigerian contents</Text>
            <Text style={styles.optionSub}>Discover music, movie, creator and entertainment</Text>
          </View>
        </Pressable>

        <Pressable
          style={[styles.optionButton, styles.creatorButton]}
          onPress={() => handleRoleSelection('creator')}
          disabled={isLoading}
        >
          <View style={styles.optionIcon}>
            <Text style={styles.iconText}>🎬</Text>
          </View>
          <View style={styles.optionText}>
            <Text style={styles.optionTitle}>Creator</Text>
            <Text style={styles.optionDescription}>Build your audience and brand</Text>
            <Text style={styles.optionSub}>
              Publish and get paid — keeps full viewer access to everything a Regular User gets
            </Text>
          </View>
        </Pressable>
      </View>

      {error && (
        <View style={styles.error}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A0A0A',
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
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#9A8A7A',
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#9A8A7A',
    textAlign: 'center',
  },
  options: {
    gap: 16,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
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
    backgroundColor: 'rgba(255,255,255,0.08)',
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
    color: '#FFFFFF',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: '#F5F0EB',
  },
  optionSub: {
    fontSize: 12,
    color: '#9A8A7A',
    marginTop: 2,
  },
  error: {
    marginTop: 24,
    padding: 16,
    backgroundColor: 'rgba(220,38,38,0.15)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(220,38,38,0.3)',
  },
  errorText: {
    color: '#EF4444',
    textAlign: 'center',
  },
});
