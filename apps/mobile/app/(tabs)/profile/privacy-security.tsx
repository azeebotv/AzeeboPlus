import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Switch, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiClient } from '../../../src/api/client';
import { logger } from '../../../src/utils/logger';

interface SecurityOption {
  id: string;
  title: string;
  description: string;
  icon: string;
}

const SECURITY_OPTIONS: SecurityOption[] = [
  {
    id: 'two-factor',
    title: 'Two-Factor Authentication',
    description: 'Add an extra layer of security to your account',
    icon: '🔐',
  },
  {
    id: 'change-password',
    title: 'Change Password',
    description: 'Update your account password',
    icon: '🔑',
  },
  {
    id: 'active-sessions',
    title: 'Active Sessions',
    description: 'Manage your active login sessions',
    icon: '📱',
  },
  {
    id: 'login-alerts',
    title: 'Login Alerts',
    description: 'Get notified of suspicious login attempts',
    icon: '🔔',
  },
];

const PRIVACY_OPTIONS = [
  {
    id: 'profile-visibility',
    title: 'Profile Visibility',
    description: 'Control who can see your profile',
    icon: '👁️',
  },
  {
    id: 'activity-status',
    title: 'Activity Status',
    description: "Show when you're active",
    icon: '🟢',
  },
  {
    id: 'data-sharing',
    title: 'Data Sharing',
    description: 'Control how your data is used',
    icon: '📊',
  },
  {
    id: 'blocked-users',
    title: 'Blocked Users',
    description: 'Manage blocked accounts',
    icon: '🚫',
  },
];

export default function PrivacySecurityScreen() {
  const router = useRouter();

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [loginAlertsEnabled, setLoginAlertsEnabled] = useState(true);
  const [profileVisibility, setProfileVisibility] = useState<'public' | 'private'>('public');
  const [activityStatusEnabled, setActivityStatusEnabled] = useState(true);
  const [dataSharingEnabled, setDataSharingEnabled] = useState(false);

  const savePrivacySettings = async (settings: Record<string, unknown>) => {
    try {
      await apiClient.put('/v1/users/me/privacy-settings', settings);
    } catch (error) {
      logger.error('Failed to save privacy settings:', error);
    }
  };

  const handleSecurityOption = (option: SecurityOption) => {
    switch (option.id) {
      case 'two-factor':
        setTwoFactorEnabled(!twoFactorEnabled);
        Alert.alert(
          twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA',
          twoFactorEnabled
            ? 'Are you sure you want to disable two-factor authentication?'
            : 'Two-factor authentication will be enabled.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: twoFactorEnabled ? 'Disable' : 'Enable',
              onPress: async () => {
                try {
                  await apiClient.put('/v1/users/me/privacy-settings', {
                    twoFactorEnabled: !twoFactorEnabled,
                  });
                } catch (error) {
                  logger.error('Failed to save 2FA setting:', error);
                }
              },
            },
          ]
        );
        break;
      case 'change-password':
        router.push('/(auth)/reset-password');
        break;
      case 'active-sessions':
        Alert.alert('Active Sessions', 'You have 2 active sessions');
        break;
      case 'login-alerts':
        setLoginAlertsEnabled(!loginAlertsEnabled);
        savePrivacySettings({ loginAlertsEnabled: !loginAlertsEnabled });
        break;
      default:
        break;
    }
  };

  const handlePrivacyOption = (option: (typeof PRIVACY_OPTIONS)[0]) => {
    switch (option.id) {
      case 'profile-visibility':
        setProfileVisibility(profileVisibility === 'public' ? 'private' : 'public');
        savePrivacySettings({
          profileVisibility: profileVisibility === 'public' ? 'private' : 'public',
        });
        break;
      case 'activity-status':
        setActivityStatusEnabled(!activityStatusEnabled);
        savePrivacySettings({ activityStatusEnabled: !activityStatusEnabled });
        break;
      case 'data-sharing':
        setDataSharingEnabled(!dataSharingEnabled);
        savePrivacySettings({ dataSharingEnabled: !dataSharingEnabled });
        break;
      case 'blocked-users':
        Alert.alert('Blocked Users', 'No blocked users');
        break;
      default:
        break;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Privacy & Security</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>

          {SECURITY_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={styles.optionCard}
              onPress={() => handleSecurityOption(option)}
            >
              <View style={styles.optionIcon}>
                <Text style={styles.optionIconText}>{option.icon}</Text>
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>{option.title}</Text>
                <Text style={styles.optionDescription}>{option.description}</Text>
              </View>
              <View style={styles.optionAction}>
                {option.id === 'two-factor' && (
                  <Switch
                    value={twoFactorEnabled}
                    onValueChange={() => handleSecurityOption(option)}
                    trackColor={{ false: '#333', true: '#E8420A' }}
                    thumbColor={twoFactorEnabled ? '#fff' : '#666'}
                  />
                )}
                {option.id === 'login-alerts' && (
                  <Switch
                    value={loginAlertsEnabled}
                    onValueChange={() => handleSecurityOption(option)}
                    trackColor={{ false: '#333', true: '#E8420A' }}
                    thumbColor={loginAlertsEnabled ? '#fff' : '#666'}
                  />
                )}
                {(option.id === 'change-password' || option.id === 'active-sessions') && (
                  <Text style={styles.arrowText}>›</Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy</Text>

          {PRIVACY_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={styles.optionCard}
              onPress={() => handlePrivacyOption(option)}
            >
              <View style={styles.optionIcon}>
                <Text style={styles.optionIconText}>{option.icon}</Text>
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>{option.title}</Text>
                <Text style={styles.optionDescription}>{option.description}</Text>
              </View>
              <View style={styles.optionAction}>
                {option.id === 'profile-visibility' && (
                  <Text style={styles.valueText}>
                    {profileVisibility === 'public' ? 'Public' : 'Private'}
                  </Text>
                )}
                {option.id === 'activity-status' && (
                  <Switch
                    value={activityStatusEnabled}
                    onValueChange={() => handlePrivacyOption(option)}
                    trackColor={{ false: '#333', true: '#E8420A' }}
                    thumbColor={activityStatusEnabled ? '#fff' : '#666'}
                  />
                )}
                {option.id === 'data-sharing' && (
                  <Switch
                    value={dataSharingEnabled}
                    onValueChange={() => handlePrivacyOption(option)}
                    trackColor={{ false: '#333', true: '#E8420A' }}
                    thumbColor={dataSharingEnabled ? '#fff' : '#666'}
                  />
                )}
                {option.id === 'blocked-users' && <Text style={styles.arrowText}>›</Text>}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data & Privacy</Text>

          <TouchableOpacity
            style={styles.optionCard}
            onPress={() => Alert.alert('Download Data', 'Your data will be prepared for download')}
          >
            <View style={styles.optionIcon}>
              <Text style={styles.optionIconText}>📥</Text>
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Download My Data</Text>
              <Text style={styles.optionDescription}>Export all your data</Text>
            </View>
            <Text style={styles.arrowText}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.optionCard, styles.dangerCard]}
            onPress={() =>
              Alert.alert('Delete Account', 'This action cannot be undone. Are you sure?', [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: () => {},
                },
              ])
            }
          >
            <View style={styles.optionIcon}>
              <Text style={styles.optionIconText}>🗑️</Text>
            </View>
            <View style={styles.optionContent}>
              <Text style={[styles.optionTitle, styles.dangerText]}>Delete Account</Text>
              <Text style={styles.optionDescription}>Permanently delete your account</Text>
            </View>
            <Text style={[styles.arrowText, styles.dangerText]}>›</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A0A0A',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  backButton: {
    marginRight: 16,
  },
  backButtonText: {
    fontSize: 24,
    color: '#F3F4F6',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#F3F4F6',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F3F4F6',
    marginBottom: 16,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  dangerCard: {
    borderColor: '#EF4444',
    borderWidth: 1,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionIconText: {
    fontSize: 20,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#F3F4F6',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 12,
    color: '#666',
  },
  optionAction: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: {
    fontSize: 24,
    color: '#666',
  },
  valueText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  dangerText: {
    color: '#EF4444',
  },
});
