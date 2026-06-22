import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';

export default function OfflineScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colorScheme === 'dark' ? '#000000' : '#ffffff' },
      ]}
    >
      <View style={styles.content}>
        <Text style={styles.icon}>📡</Text>
        <Text style={[styles.title, { color: colorScheme === 'dark' ? '#ffffff' : '#000000' }]}>
          No Internet Connection
        </Text>
        <Text style={styles.description}>Please check your network settings and try again.</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          onPress={() => router.replace('/(tabs)/home')}
          style={styles.primaryButton}
        >
          <Text style={styles.primaryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 80,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    lineHeight: 1.6,
  },
  actions: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#8B5CF6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
