import React from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';

export default function MaintenanceScreen() {
  const colorScheme = useColorScheme();

  return (
    <View style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#000000' : '#ffffff' }]}>
      <View style={styles.content}>
        <Text style={styles.icon}>🛠️</Text>
        <Text style={[styles.title, { color: colorScheme === 'dark' ? '#ffffff' : '#000000' }]}>
          Down for Maintenance
        </Text>
        <Text style={styles.description}>
          We're currently making improvements to Azeebo+. We'll be back soon!
        </Text>
        <View style={styles.info}>
          <Text style={styles.infoText}>Estimated return: 15 minutes</Text>
          <Text style={styles.infoText}>Follow us on Twitter @azeeboplus for updates</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  content: {
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
    marginBottom: 24,
  },
  info: {
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});
