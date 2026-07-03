import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/contexts/AuthContext';
import { notificationApi, type NotificationPreferences } from '../../src/api';
import { logger } from '../../src/utils/logger';
import { useBiometric } from '../../src/hooks/useBiometric';
import Constants from 'expo-constants';

// Type declaration for expo-constants
const safeConstants = Constants as unknown as { expoConfig?: { version?: string; name?: string } };

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const {
    isAvailable,
    biometricType,
    isEnabled,
    isLoading: _isBiometricLoading,
    enableBiometrics,
    disableBiometrics,
  } = useBiometric();
  const [_isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isBiometricToggling, setIsBiometricToggling] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email: true,
    push: true,
    sms: true,
    types: {
      newContent: true,
      comments: true,
      likes: true,
      followers: true,
      system: true,
      payments: true,
    },
  });

  useEffect(() => {
    if (isAuthenticated) {
      fetchPreferences();
    }
  }, [isAuthenticated]);

  const fetchPreferences = async () => {
    setIsLoading(true);
    try {
      const response = await notificationApi.getPreferences();
      if (response.success && response.data) {
        setPreferences(response.data);
      }
    } catch (error) {
      logger.error('Failed to fetch preferences', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTogglePreference = async (key: keyof NotificationPreferences, value?: boolean) => {
    if (key === 'types') return;

    const newValue =
      value !== undefined ? value : !preferences[key as keyof NotificationPreferences];
    const updatedPreferences = {
      ...preferences,
      [key]: newValue,
    };
    setPreferences(updatedPreferences);

    await savePreferences(updatedPreferences);
  };

  const handleToggleTypePreference = async (typeKey: keyof NotificationPreferences['types']) => {
    const updatedTypes = {
      ...preferences.types,
      [typeKey]: !preferences.types[typeKey],
    };
    const updatedPreferences = {
      ...preferences,
      types: updatedTypes,
    };
    setPreferences(updatedPreferences);

    await savePreferences(updatedPreferences);
  };

  const savePreferences = async (prefs: NotificationPreferences) => {
    setIsSaving(true);
    try {
      const response = await notificationApi.updatePreferences(prefs);
      if (!response.success) {
        Alert.alert('Error', response.message || 'Failed to save preferences');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save preferences');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBiometricToggle = async (value: boolean) => {
    if (!isAvailable) {
      Alert.alert('Not Available', 'Biometric authentication is not available on this device');
      return;
    }

    setIsBiometricToggling(true);
    try {
      if (value) {
        if (!user) {
          Alert.alert('Error', 'You must be logged in to enable biometric authentication');
          return;
        }

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
            }`
          );
        } else {
          Alert.alert('Error', 'Failed to enable biometric authentication');
        }
      } else {
        await disableBiometrics();
        Alert.alert('Success', 'Biometric authentication has been disabled');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update biometric settings');
    } finally {
      setIsBiometricToggling(false);
    }
  };

  const getBiometricLabel = () => {
    switch (biometricType) {
      case 'face':
        return 'Face ID';
      case 'fingerprint':
        return 'Touch ID';
      case 'iris':
        return 'Iris';
      default:
        return 'Biometric';
    }
  };

  if (authLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#1A0A0A' : '#fff' }]}
        edges={['top']}
      >
        <View style={styles.unauthenticatedContainer}>
          <ActivityIndicator size="large" color="#E8420A" />
        </View>
      </SafeAreaView>
    );
  }

  if (!isAuthenticated) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#1A0A0A' : '#fff' }]}
        edges={['top']}
      >
        <View style={styles.unauthenticatedContainer}>
          <Text style={styles.lockIcon}>🔒</Text>
          <Text style={[styles.lockText, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>
            Please log in to access settings
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#1A0A0A' : '#fff' }]}
      edges={['top']}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>
            Settings
          </Text>
        </View>

        {isSaving && (
          <View style={styles.savingIndicator}>
            <ActivityIndicator size="small" color="#E8420A" />
            <Text style={styles.savingText}>Saving...</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colorScheme === 'dark' ? '#888' : '#666' }]}>
            Notification Channels
          </Text>

          <View
            style={[
              styles.settingItem,
              { backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#f5f5f5' },
            ]}
          >
            <View style={styles.settingInfo}>
              <Text style={styles.settingIcon}>🔔</Text>
              <View>
                <Text
                  style={[styles.settingLabel, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}
                >
                  Push Notifications
                </Text>
                <Text style={styles.settingDescription}>Receive alerts on your device</Text>
              </View>
            </View>
            <Switch
              value={preferences.push}
              onValueChange={(value) => handleTogglePreference('push', value)}
              trackColor={{ false: '#333', true: '#E8420A' }}
              thumbColor="#fff"
            />
          </View>

          <View
            style={[
              styles.settingItem,
              { backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#f5f5f5' },
            ]}
          >
            <View style={styles.settingInfo}>
              <Text style={styles.settingIcon}>📧</Text>
              <View>
                <Text
                  style={[styles.settingLabel, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}
                >
                  Email Notifications
                </Text>
                <Text style={styles.settingDescription}>Receive updates via email</Text>
              </View>
            </View>
            <Switch
              value={preferences.email}
              onValueChange={(value) => handleTogglePreference('email', value)}
              trackColor={{ false: '#333', true: '#E8420A' }}
              thumbColor="#fff"
            />
          </View>

          <View
            style={[
              styles.settingItem,
              { backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#f5f5f5' },
            ]}
          >
            <View style={styles.settingInfo}>
              <Text style={styles.settingIcon}>📱</Text>
              <View>
                <Text
                  style={[styles.settingLabel, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}
                >
                  SMS Notifications
                </Text>
                <Text style={styles.settingDescription}>Receive text messages</Text>
              </View>
            </View>
            <Switch
              value={preferences.sms}
              onValueChange={(value) => handleTogglePreference('sms', value)}
              trackColor={{ false: '#333', true: '#E8420A' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colorScheme === 'dark' ? '#888' : '#666' }]}>
            Security
          </Text>

          <View
            style={[
              styles.settingItem,
              { backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#f5f5f5' },
            ]}
          >
            <View style={styles.settingInfo}>
              <Text style={styles.settingIcon}>
                {biometricType === 'face' ? '👤' : biometricType === 'fingerprint' ? '👆' : '🔐'}
              </Text>
              <View>
                <Text
                  style={[styles.settingLabel, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}
                >
                  {getBiometricLabel()}
                </Text>
                <Text style={styles.settingDescription}>
                  {isAvailable
                    ? `Use ${getBiometricLabel().toLowerCase()} to sign in quickly`
                    : 'Not available on this device'}
                </Text>
              </View>
            </View>
            {isBiometricToggling ? (
              <ActivityIndicator size="small" color="#E8420A" />
            ) : (
              <Switch
                value={isEnabled}
                onValueChange={handleBiometricToggle}
                trackColor={{ false: '#333', true: '#E8420A' }}
                thumbColor="#fff"
                disabled={!isAvailable || isBiometricToggling}
              />
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colorScheme === 'dark' ? '#888' : '#666' }]}>
            Notification Types
          </Text>

          <View
            style={[
              styles.settingItem,
              { backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#f5f5f5' },
            ]}
          >
            <View style={styles.settingInfo}>
              <Text style={styles.settingIcon}>📺</Text>
              <Text
                style={[styles.settingLabel, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}
              >
                New Content
              </Text>
            </View>
            <Switch
              value={preferences.types.newContent}
              onValueChange={() => handleToggleTypePreference('newContent')}
              trackColor={{ false: '#333', true: '#E8420A' }}
              thumbColor="#fff"
            />
          </View>

          <View
            style={[
              styles.settingItem,
              { backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#f5f5f5' },
            ]}
          >
            <View style={styles.settingInfo}>
              <Text style={styles.settingIcon}>💬</Text>
              <Text
                style={[styles.settingLabel, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}
              >
                Comments
              </Text>
            </View>
            <Switch
              value={preferences.types.comments}
              onValueChange={() => handleToggleTypePreference('comments')}
              trackColor={{ false: '#333', true: '#E8420A' }}
              thumbColor="#fff"
            />
          </View>

          <View
            style={[
              styles.settingItem,
              { backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#f5f5f5' },
            ]}
          >
            <View style={styles.settingInfo}>
              <Text style={styles.settingIcon}>👍</Text>
              <Text
                style={[styles.settingLabel, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}
              >
                Likes
              </Text>
            </View>
            <Switch
              value={preferences.types.likes}
              onValueChange={() => handleToggleTypePreference('likes')}
              trackColor={{ false: '#333', true: '#E8420A' }}
              thumbColor="#fff"
            />
          </View>

          <View
            style={[
              styles.settingItem,
              { backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#f5f5f5' },
            ]}
          >
            <View style={styles.settingInfo}>
              <Text style={styles.settingIcon}>👥</Text>
              <Text
                style={[styles.settingLabel, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}
              >
                Followers
              </Text>
            </View>
            <Switch
              value={preferences.types.followers}
              onValueChange={() => handleToggleTypePreference('followers')}
              trackColor={{ false: '#333', true: '#E8420A' }}
              thumbColor="#fff"
            />
          </View>

          <View
            style={[
              styles.settingItem,
              { backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#f5f5f5' },
            ]}
          >
            <View style={styles.settingInfo}>
              <Text style={styles.settingIcon}>⚙️</Text>
              <Text
                style={[styles.settingLabel, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}
              >
                System Updates
              </Text>
            </View>
            <Switch
              value={preferences.types.system}
              onValueChange={() => handleToggleTypePreference('system')}
              trackColor={{ false: '#333', true: '#E8420A' }}
              thumbColor="#fff"
            />
          </View>

          <View
            style={[
              styles.settingItem,
              { backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#f5f5f5' },
            ]}
          >
            <View style={styles.settingInfo}>
              <Text style={styles.settingIcon}>💰</Text>
              <Text
                style={[styles.settingLabel, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}
              >
                Payments
              </Text>
            </View>
            <Switch
              value={preferences.types.payments}
              onValueChange={() => handleToggleTypePreference('payments')}
              trackColor={{ false: '#333', true: '#E8420A' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colorScheme === 'dark' ? '#888' : '#666' }]}>
            About
          </Text>

          <View
            style={[
              styles.settingItem,
              { backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#f5f5f5' },
            ]}
          >
            <Text
              style={[styles.settingLabel, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}
            >
              Version
            </Text>
            <Text style={styles.settingValue}>{safeConstants.expoConfig?.version ?? '1.0.0'}</Text>
          </View>

          <TouchableOpacity
            style={[
              styles.settingItem,
              { backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#f5f5f5' },
            ]}
          >
            <Text
              style={[styles.settingLabel, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}
            >
              Terms of Service
            </Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.settingItem,
              { backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#f5f5f5' },
            ]}
          >
            <Text
              style={[styles.settingLabel, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}
            >
              Privacy Policy
            </Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.settingItem,
              { backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#f5f5f5' },
            ]}
          >
            <Text
              style={[styles.settingLabel, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}
            >
              Licenses
            </Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  unauthenticatedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  lockIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  lockText: {
    fontSize: 16,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  savingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  savingText: {
    color: '#E8420A',
    fontSize: 14,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    paddingHorizontal: 16,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 1,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 16,
  },
  settingDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  settingValue: {
    fontSize: 16,
    color: '#666',
  },
  menuArrow: {
    color: '#666',
    fontSize: 24,
  },
  bottomPadding: {
    height: 24,
  },
});
