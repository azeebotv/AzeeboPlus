import { View, Text, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../../src/theme';

export default function NotFoundScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colorScheme === 'dark' ? '#1A0A0A' : '#ffffff' },
      ]}
    >
      <View style={styles.content}>
        <Text style={styles.icon}>🔍</Text>
        <Text style={[styles.title, { color: colorScheme === 'dark' ? '#ffffff' : '#1A0A0A' }]}>
          Page Not Found
        </Text>
        <Text style={styles.description}>
          The page you're looking for doesn't exist or has been moved.
        </Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity onPress={() => router.back()} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Go Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.replace('/(tabs)/home')}
          style={styles.secondaryButton}
        >
          <Text style={styles.secondaryButtonText}>Go Home</Text>
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
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 1.6,
  },
  actions: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#E8420A',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E8420A',
  },
  secondaryButtonText: {
    color: '#E8420A',
    fontSize: 16,
    fontWeight: '600',
  },
});
