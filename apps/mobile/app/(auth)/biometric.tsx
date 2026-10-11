import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useBiometric } from '../../src/hooks/useBiometric';
import { useAuth } from '@azeebo/react-data/contexts/AuthContext';
import { colors } from '../../src/theme';
import { brand } from '@azeebo/design-tokens';

export default function BiometricAuthScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const { user } = useAuth();
  const {
    isAvailable,
    biometricType,
    isEnabled,
    isLoading,
    error,
    authenticateWithStoredCredentials,
    enableBiometrics,
  } = useBiometric();

  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isEnabling, setIsEnabling] = useState(false);

  useEffect(() => {
    if (!isAvailable && !isLoading) {
      Alert.alert(
        'Biometric Not Available',
        'Biometric authentication is not available on this device. Please use password login.',
        [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
      );
    }
  }, [isAvailable, isLoading]);

  const handleBiometricLogin = async () => {
    setIsAuthenticating(true);
    try {
      const result = await authenticateWithStoredCredentials();

      if (result.success) {
        router.replace('/(tabs)/home');
      } else {
        Alert.alert(
          'Authentication Failed',
          result.error || 'Biometric authentication failed. Please try again.',
          [
            { text: 'Retry', onPress: () => handleBiometricLogin() },
            { text: 'Use Password', onPress: () => router.replace('/(auth)/login') },
          ]
        );
      }
    } catch (err) {
      Alert.alert('Error', 'Authentication failed. Please try again.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleEnableBiometrics = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to enable biometric authentication');
      return;
    }

    setIsEnabling(true);
    try {
      const credentials = JSON.stringify({
        userId: user.id,
        email: user.email,
        timestamp: Date.now(),
      });

      const success = await enableBiometrics(JSON.parse(credentials));

      if (success) {
        Alert.alert(
          'Success',
          `Biometric authentication has been enabled${
            biometricType === 'face'
              ? ' (Face ID)'
              : biometricType === 'fingerprint'
                ? ' (Fingerprint)'
                : ''
          }`,
          [{ text: 'OK', onPress: () => router.replace('/(tabs)/home') }]
        );
      } else {
        Alert.alert('Error', 'Failed to enable biometric authentication');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to enable biometric authentication');
    } finally {
      setIsEnabling(false);
    }
  };

  const getBiometricIcon = () => {
    switch (biometricType) {
      case 'face':
        return '👤';
      case 'fingerprint':
        return '👆';
      case 'iris':
        return '👁️';
      default:
        return '🔐';
    }
  };

  const getBiometricLabel = () => {
    switch (biometricType) {
      case 'face':
        return 'Face ID';
      case 'fingerprint':
        return 'Fingerprint';
      case 'iris':
        return 'Iris';
      default:
        return 'Biometric';
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#1A0A0A' : '#fff' }]}
      >
        <ActivityIndicator size="large" color={brand.flame} />
        <Text style={[styles.loadingText, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>
          Initializing biometric authentication...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#1A0A0A' : '#fff' }]}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.biometricIcon}>{getBiometricIcon()}</Text>
        </View>

        <Text style={[styles.title, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>
          {isEnabled ? 'Biometric Login' : `Enable ${getBiometricLabel()}`}
        </Text>

        <Text style={[styles.subtitle, { color: colorScheme === 'dark' ? '#888' : '#666' }]}>
          {isEnabled
            ? `Use your ${getBiometricLabel().toLowerCase()} to sign in quickly and securely`
            : `Set up ${getBiometricLabel()} for fast and secure access to your account`}
        </Text>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.buttonContainer}>
          {isEnabled ? (
            <>
              <TouchableOpacity
                style={[styles.primaryButton, isAuthenticating && styles.buttonDisabled]}
                onPress={handleBiometricLogin}
                disabled={isAuthenticating}
              >
                {isAuthenticating ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.biometricIconSmall}>{getBiometricIcon()}</Text>
                    <Text style={styles.primaryButtonText}>Use {getBiometricLabel()}</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => router.replace('/(auth)/login')}
              >
                <Text style={styles.secondaryButtonText}>Use Password Instead</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={[styles.primaryButton, isEnabling && styles.buttonDisabled]}
                onPress={handleEnableBiometrics}
                disabled={isEnabling}
              >
                {isEnabling ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.biometricIconSmall}>{getBiometricIcon()}</Text>
                    <Text style={styles.primaryButtonText}>Enable {getBiometricLabel()}</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => router.replace('/(auth)/login')}
              >
                <Text style={styles.secondaryButtonText}>Skip for Now</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <View style={styles.securityInfo}>
          <Text style={styles.securityIcon}>🔒</Text>
          <Text style={[styles.securityText, { color: colorScheme === 'dark' ? '#888' : '#666' }]}>
            Your biometric data is stored securely on your device and is never shared with our
            servers
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.alpha.primary20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  biometricIcon: {
    fontSize: 64,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  errorContainer: {
    backgroundColor: colors.alpha.danger20,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    width: '100%',
  },
  errorText: {
    color: brand.scarlet,
    fontSize: 14,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    marginBottom: 32,
  },
  primaryButton: {
    backgroundColor: brand.flame,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  biometricIconSmall: {
    fontSize: 20,
    marginRight: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.neutral[700],
  },
  secondaryButtonText: {
    color: brand.flame,
    fontSize: 16,
    fontWeight: '600',
  },
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: 300,
  },
  securityIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  securityText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});
