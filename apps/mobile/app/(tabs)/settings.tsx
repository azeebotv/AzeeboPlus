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

export default function SettingsScreen(): JSX.Element {
  const colorScheme = useColorScheme();
  const { user, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
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
      console.error('Failed to fetch preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTogglePreference = async (
    key: keyof NotificationPreferences,
    value?: boolean
  ) => {
    if (key === 'types') return;

    const newValue = value !== undefined ? value : !preferences[key as keyof NotificationPreferences];
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

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#000' : '#fff' }]} edges={['top']}>
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
    <SafeAreaView style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#000' : '#fff' }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>Settings</Text>
        </View>

        {isSaving && (
          <View style={styles.savingIndicator}>
            <ActivityIndicator size="small" color="#8B5CF6" />
            <Text style={styles.savingText}>Saving...</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colorScheme === 'dark' ? '#888' : '#666' }]}>
            Notification Channels
          </Text>

          <View style={[styles.settingItem, { backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#f5f5f5' }]}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingIcon}>🔔</Text>
              <View>
                <Text style={[styles.settingLabel, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>
                  Push Notifications
                </Text>
                <Text style={styles.settingDescription}>Receive alerts on your device</Text>
              </View>
            </View>
            <Switch
              value={preferences.push}
              onValueChange={(value) => handleTogglePreference('push', value)}
              trackColor={{ false: '#333', true: '#8B5CF6' }}
              thumbColor="#fff"
            />
          </View>

          <View style={[styles.settingItem, { backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#f5f5f5' }]}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingIcon}>📧</Text>
              <View>
                <Text style={[styles.settingLabel, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>
                  Email Notifications
                </Text>
                <Text style={styles.settingDescription}>Receive updates via email</Text>
              </View>
            </View>
            <Switch
              value={preferences.email}
              onValueChange={(value) => handleTogglePreference('email', value)}
              trackColor={{ false: '#333', true: '#8B5CF6' }}
              thumbColor="#fff"
            />
          </View>

          <View style={[styles.settingItem, { backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#f5f5f5' }]}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingIcon}>📱</Text>
              <View>
                <Text style={[styles.settingLabel, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>
                  SMS Notifications
                </Text>
                <Text style={styles.settingDescription}>Receive text messages</Text>
              </View>
            </View>
            <Switch
              value={preferences.sms}
              onValueChange={(value) => handleTogglePreference('sms', value)}
              trackColor={{ false: '#333', true: '#8B5CF6' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colorScheme === 'dark' ? '#888' : '#666' }]}>
            Notification Types
          </Text>

          <View style={[styles.settingItem, { backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#f5f5f5' }]}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingIcon}>📺</Text>
              <Text style={[styles.settingLabel, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>
                New Content
              </Text>
            </View>
            <Switch
              value={preferences.types.newContent}
              onValueChange={() => handleToggleTypePreference('newContent')}
              trackColor={{ false: '#333', true: '#8B5CF6' }}
              thumbColor="#fff"
            />
          </View>

          <View style={[styles.settingItem, { backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#f5f5f5' }]}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingIcon}>💬</Text>
              <Text style={[styles.settingLabel, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>
                Comments
              </Text>
            </View>
            <Switch
              value={preferences.types.comments}
              onValueChange={() => handleToggleTypePreference('comments')}
              trackColor={{ false: '#333', true: '#8B5CF6' }}
              thumbColor="#fff"
            />
          </View>

          <View style={[styles.settingItem, { backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#f5f5f5' }]}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingIcon}>👍</Text>
              <Text style={[styles.settingLabel, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>
                Likes
              </Text>
            </View>
            <Switch
              value={preferences.types.likes}
              onValueChange={() => handleToggleTypePreference('likes')}
              trackColor={{ false: '#333', true: '#8B5CF6' }}
              thumbColor="#fff"
            />
          </View>

          <View style={[styles.settingItem, { backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#f5f5f5' }]}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingIcon}>👥</Text>
              <Text style={[styles.settingLabel, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>
                Followers
              </Text>
            </View>
            <Switch
              value={preferences.types.followers}
              onValueChange={() => handleToggleTypePreference('followers')}
              trackColor={{ false: '#333', true: '#8B5CF6' }}
              thumbColor="#fff"
            />
          </View>

          <View style={[styles.settingItem, { backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#f5f5f5' }]}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingIcon}>⚙️</Text>
              <Text style={[styles.settingLabel, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>
                System Updates
              </Text>
            </View>
            <Switch
              value={preferences.types.system}
              onValueChange={() => handleToggleTypePreference('system')}
              trackColor={{ false: '#333', true: '#8B5CF6' }}
              thumbColor="#fff"
            />
          </View>

          <View style={[styles.settingItem, { backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#f5f5f5' }]}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingIcon}>💰</Text>
              <Text style={[styles.settingLabel, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>
                Payments
              </Text>
            </View>
            <Switch
              value={preferences.types.payments}
              onValueChange={() => handleToggleTypePreference('payments')}
              trackColor={{ false: '#333', true: '#8B5CF6' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colorScheme === 'dark' ? '#888' : '#666' }]}>
            About
          </Text>

          <View style={[styles.settingItem, { backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#f5f5f5' }]}>
            <Text style={[styles.settingLabel, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>
              Version
            </Text>
            <Text style={styles.settingValue}>1.0.0</Text>
          </View>

          <TouchableOpacity
            style={[styles.settingItem, { backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#f5f5f5' }]}
          >
            <Text style={[styles.settingLabel, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>
              Terms of Service
            </Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingItem, { backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#f5f5f5' }]}
          >
            <Text style={[styles.settingLabel, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>
              Privacy Policy
            </Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingItem, { backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#f5f5f5' }]}
          >
            <Text style={[styles.settingLabel, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>
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
    color: '#8B5CF6',
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