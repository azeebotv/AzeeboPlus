import { View, Text, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../../src/theme';
import { brand } from '@azeebo/design-tokens';

export default function ExpiredSessionScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();

  return (
    <View
      accessibilityLabel="Expired Session Screen"
      style={[
        styles.container,
        { backgroundColor: colorScheme === 'dark' ? '#1A0A0A' : '#ffffff' },
      ]}
    >
      <View style={styles.content}>
        <Text style={styles.icon}>⌛</Text>
        <Text style={[styles.title, { color: colorScheme === 'dark' ? '#ffffff' : '#1A0A0A' }]}>
          Session Expired
        </Text>
        <Text style={styles.description}>
          Your login session has expired. Please sign in again to continue enjoying Azeebo+.
        </Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          onPress={() => router.replace('/(auth)/login')}
          style={styles.primaryButton}
        >
          <Text style={styles.primaryButtonText}>Sign In Again</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.replace('/(tabs)/home')}
          style={styles.secondaryButton}
        >
          <Text style={styles.secondaryButtonText}>Browse as Guest</Text>
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
    lineHeight: 22,
  },
  actions: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: brand.flame,
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
    borderColor: brand.flame,
  },
  secondaryButtonText: {
    color: brand.flame,
    fontSize: 16,
    fontWeight: '600',
  },
});
