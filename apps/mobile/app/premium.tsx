import { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

export default function PremiumAccessScreen() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/subscription/plans');
  }, [router]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#E8400A" />
        <Text style={styles.text}>Redirecting to subscription plans...</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A0A0A',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  text: {
    color: '#9CA3AF',
    fontSize: 14,
  },
});
