import { useState, useEffect, useCallback } from 'react';
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
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@azeebo/react-data/contexts/AuthContext';
import { useFlags } from '@azeebo/react-data/contexts/FlagsContext';
import { notificationApi, type NotificationPreferences } from '@azeebo/react-data';
import { useBiometric } from '../../src/hooks/useBiometric';
import Constants from 'expo-constants';
import { colors } from '../../src/theme';
import * as Linking from 'expo-linking';
import { changeLanguage, LANGUAGES, type SupportedLanguage } from '../../src/i18n';

// Type declaration for expo-constants
const safeConstants = Constants as unknown as { expoConfig?: { version?: string; name?: string } };

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { isEnabled: isFlagEnabled } = useFlags();
  // mobile_biometric_auth (off by default): the security section (biometric
  // sign-in) is hidden until ops enables the flag.
  const biometricAuthEnabled = isFlagEnabled('mobile_biometric_auth');
  const { t, i18n } = useTranslation();
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>(
    (i18n.language as SupportedLanguage) || 'en'
  );
  const queryClient = useQueryClient();

  useEffect(() => {
    setCurrentLanguage((i18n.language as SupportedLanguage) || 'en');
  }, [i18n.language]);

  const handleLanguageChange = useCallback(async (lang: SupportedLanguage) => {
    await changeLanguage(lang);
    setCurrentLanguage(lang);
    setLanguageModalVisible(false);
  }, []);
  const {
    isAvailable,
    biometricType,
    isEnabled,
    isLoading: _isBiometricLoading,
    enableBiometrics,
    disableBiometrics,
  } = useBiometric();
  const [isBiometricToggling, setIsBiometricToggling] = useState(false);

  const { data: preferences, isLoading: _isPreferencesLoading } = useQuery({
    queryKey: ['notification', 'preferences'],
    queryFn: async () => {
      const response = await notificationApi.getPreferences();
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch preferences');
      }
      return response.data as NotificationPreferences;
    },
    enabled: isAuthenticated,
    staleTime: 60_000,
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: async (prefs: NotificationPreferences) => {
      const response = await notificationApi.updatePreferences(prefs);
      if (!response.success) {
        throw new Error(response.message || 'Failed to save preferences');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification', 'preferences'] });
    },
  });

  const currentPreferences = preferences ?? {
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
  };

  const handleTogglePreference = async (key: keyof NotificationPreferences, value?: boolean) => {
    if (key === 'types') return;

    const newValue =
      value !== undefined ? value : !currentPreferences[key as keyof NotificationPreferences];
    const updatedPreferences = {
      ...currentPreferences,
      [key]: newValue,
    };

    updatePreferencesMutation.mutate(updatedPreferences, {
      onError: (error: Error) => {
        Alert.alert('Error', error.message || 'Failed to save preferences');
      },
    });
  };

  const handleToggleTypePreference = async (typeKey: keyof NotificationPreferences['types']) => {
    const updatedTypes = {
      ...currentPreferences.types,
      [typeKey]: !currentPreferences.types[typeKey],
    };
    const updatedPreferences = {
      ...currentPreferences,
      types: updatedTypes,
    };

    updatePreferencesMutation.mutate(updatedPreferences, {
      onError: (error: Error) => {
        Alert.alert('Error', error.message || 'Failed to save preferences');
      },
    });
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
        style={[
          styles.container,
          { backgroundColor: colorScheme === 'dark' ? colors.bg.primary : '#fff' },
        ]}
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
        style={[
          styles.container,
          { backgroundColor: colorScheme === 'dark' ? colors.bg.primary : '#fff' },
        ]}
        edges={['top']}
      >
        <View style={styles.unauthenticatedContainer}>
          <Text style={styles.lockIcon}>🔒</Text>
          <Text
            style={[
              styles.lockText,
              { color: colorScheme === 'dark' ? colors.text.primary : '#000' },
            ]}
          >
            Please log in to access settings
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: colorScheme === 'dark' ? colors.bg.primary : '#fff' },
      ]}
      edges={['top']}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text
            style={[styles.title, { color: colorScheme === 'dark' ? colors.text.primary : '#000' }]}
          >
            Settings
          </Text>
        </View>

        {updatePreferencesMutation.isPending && (
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
              { backgroundColor: colorScheme === 'dark' ? colors.bg.tertiary : '#f5f5f5' },
            ]}
          >
            <View style={styles.settingInfo}>
              <Text style={styles.settingIcon}>🔔</Text>
              <View>
                <Text
                  style={[
                    styles.settingLabel,
                    { color: colorScheme === 'dark' ? colors.text.primary : '#000' },
                  ]}
                >
                  Push Notifications
                </Text>
                <Text style={styles.settingDescription}>Receive alerts on your device</Text>
              </View>
            </View>
            <Switch
              value={currentPreferences.push}
              onValueChange={(value) => handleTogglePreference('push', value)}
              trackColor={{ false: '#333', true: '#E8420A' }}
              thumbColor="#fff"
            />
          </View>

          <View
            style={[
              styles.settingItem,
              { backgroundColor: colorScheme === 'dark' ? colors.bg.tertiary : '#f5f5f5' },
            ]}
          >
            <View style={styles.settingInfo}>
              <Text style={styles.settingIcon}>📧</Text>
              <View>
                <Text
                  style={[
                    styles.settingLabel,
                    { color: colorScheme === 'dark' ? colors.text.primary : '#000' },
                  ]}
                >
                  Email Notifications
                </Text>
                <Text style={styles.settingDescription}>Receive updates via email</Text>
              </View>
            </View>
            <Switch
              value={currentPreferences.email}
              onValueChange={(value) => handleTogglePreference('email', value)}
              trackColor={{ false: '#333', true: '#E8420A' }}
              thumbColor="#fff"
            />
          </View>

          <View
            style={[
              styles.settingItem,
              { backgroundColor: colorScheme === 'dark' ? colors.bg.tertiary : '#f5f5f5' },
            ]}
          >
            <View style={styles.settingInfo}>
              <Text style={styles.settingIcon}>📱</Text>
              <View>
                <Text
                  style={[
                    styles.settingLabel,
                    { color: colorScheme === 'dark' ? colors.text.primary : '#000' },
                  ]}
                >
                  SMS Notifications
                </Text>
                <Text style={styles.settingDescription}>Receive text messages</Text>
              </View>
            </View>
            <Switch
              value={currentPreferences.sms}
              onValueChange={(value) => handleTogglePreference('sms', value)}
              trackColor={{ false: '#333', true: '#E8420A' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Language Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colorScheme === 'dark' ? '#888' : '#666' }]}>
            {t('settings.language')}
          </Text>

          <TouchableOpacity
            style={[
              styles.settingItem,
              { backgroundColor: colorScheme === 'dark' ? colors.bg.tertiary : '#f5f5f5' },
            ]}
            onPress={() => setLanguageModalVisible(true)}
            accessibilityLabel={t('settings.selectLanguage')}
          >
            <View style={styles.settingInfo}>
              <Text style={styles.settingIcon}>🌐</Text>
              <View>
                <Text
                  style={[
                    styles.settingLabel,
                    { color: colorScheme === 'dark' ? colors.text.primary : '#000' },
                  ]}
                >
                  {t('settings.language')}
                </Text>
                <Text style={styles.settingDescription}>
                  {LANGUAGES.find((l) => l.code === currentLanguage)?.nativeName || 'English'}
                </Text>
              </View>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Language Selection Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={languageModalVisible}
          onRequestClose={() => setLanguageModalVisible(false)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setLanguageModalVisible(false)}>
            <Pressable
              style={[
                styles.modalContent,
                { backgroundColor: colorScheme === 'dark' ? colors.bg.tertiary : '#fff' },
              ]}
              onPress={(e) => e.stopPropagation()}
            >
              <Text
                style={[
                  styles.modalTitle,
                  { color: colorScheme === 'dark' ? colors.text.primary : '#000' },
                ]}
              >
                {t('settings.selectLanguage')}
              </Text>

              {LANGUAGES.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.languageOption,
                    currentLanguage === lang.code && {
                      backgroundColor:
                        colorScheme === 'dark' ? 'rgba(232,66,10,0.15)' : 'rgba(232,66,10,0.08)',
                    },
                  ]}
                  onPress={() => handleLanguageChange(lang.code)}
                  accessibilityLabel={`${t('settings.selectLanguage')}: ${lang.name}`}
                  accessibilityRole="button"
                >
                  <Text style={styles.languageEmoji}>
                    {lang.code === 'en'
                      ? '🇬🇧'
                      : lang.code === 'fr'
                        ? '🇫🇷'
                        : lang.code === 'pt'
                          ? '🇵🇹'
                          : lang.code === 'ha'
                            ? '🇳🇬'
                            : lang.code === 'yo'
                              ? '🇳🇬'
                              : '🇳🇬'}
                  </Text>
                  <View style={styles.languageInfo}>
                    <Text
                      style={[
                        styles.languageName,
                        { color: colorScheme === 'dark' ? colors.text.primary : '#000' },
                      ]}
                    >
                      {lang.name}
                    </Text>
                    <Text style={styles.languageNative}>{lang.nativeName}</Text>
                  </View>
                  {currentLanguage === lang.code && <Text style={styles.languageCheck}>✓</Text>}
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setLanguageModalVisible(false)}
              >
                <Text style={styles.modalCloseText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>

        {biometricAuthEnabled ? (
          <View style={styles.section}>
            <Text
              style={[styles.sectionTitle, { color: colorScheme === 'dark' ? '#888' : '#666' }]}
            >
              Security
            </Text>

            <View
              style={[
                styles.settingItem,
                { backgroundColor: colorScheme === 'dark' ? colors.bg.tertiary : '#f5f5f5' },
              ]}
            >
              <View style={styles.settingInfo}>
                <Text style={styles.settingIcon}>
                  {biometricType === 'face' ? '👤' : biometricType === 'fingerprint' ? '👆' : '🔐'}
                </Text>
                <View>
                  <Text
                    style={[
                      styles.settingLabel,
                      { color: colorScheme === 'dark' ? colors.text.primary : '#000' },
                    ]}
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
        ) : null}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colorScheme === 'dark' ? '#888' : '#666' }]}>
            Notification Types
          </Text>

          <View
            style={[
              styles.settingItem,
              { backgroundColor: colorScheme === 'dark' ? colors.bg.tertiary : '#f5f5f5' },
            ]}
          >
            <View style={styles.settingInfo}>
              <Text style={styles.settingIcon}>📺</Text>
              <Text
                style={[
                  styles.settingLabel,
                  { color: colorScheme === 'dark' ? colors.text.primary : '#000' },
                ]}
              >
                New Content
              </Text>
            </View>
            <Switch
              value={currentPreferences.types.newContent}
              onValueChange={() => handleToggleTypePreference('newContent')}
              trackColor={{ false: '#333', true: '#E8420A' }}
              thumbColor="#fff"
            />
          </View>

          <View
            style={[
              styles.settingItem,
              { backgroundColor: colorScheme === 'dark' ? colors.bg.tertiary : '#f5f5f5' },
            ]}
          >
            <View style={styles.settingInfo}>
              <Text style={styles.settingIcon}>💬</Text>
              <Text
                style={[
                  styles.settingLabel,
                  { color: colorScheme === 'dark' ? colors.text.primary : '#000' },
                ]}
              >
                Comments
              </Text>
            </View>
            <Switch
              value={currentPreferences.types.comments}
              onValueChange={() => handleToggleTypePreference('comments')}
              trackColor={{ false: '#333', true: '#E8420A' }}
              thumbColor="#fff"
            />
          </View>

          <View
            style={[
              styles.settingItem,
              { backgroundColor: colorScheme === 'dark' ? colors.bg.tertiary : '#f5f5f5' },
            ]}
          >
            <View style={styles.settingInfo}>
              <Text style={styles.settingIcon}>👍</Text>
              <Text
                style={[
                  styles.settingLabel,
                  { color: colorScheme === 'dark' ? colors.text.primary : '#000' },
                ]}
              >
                Likes
              </Text>
            </View>
            <Switch
              value={currentPreferences.types.likes}
              onValueChange={() => handleToggleTypePreference('likes')}
              trackColor={{ false: '#333', true: '#E8420A' }}
              thumbColor="#fff"
            />
          </View>

          <View
            style={[
              styles.settingItem,
              { backgroundColor: colorScheme === 'dark' ? colors.bg.tertiary : '#f5f5f5' },
            ]}
          >
            <View style={styles.settingInfo}>
              <Text style={styles.settingIcon}>👥</Text>
              <Text
                style={[
                  styles.settingLabel,
                  { color: colorScheme === 'dark' ? colors.text.primary : '#000' },
                ]}
              >
                Followers
              </Text>
            </View>
            <Switch
              value={currentPreferences.types.followers}
              onValueChange={() => handleToggleTypePreference('followers')}
              trackColor={{ false: '#333', true: '#E8420A' }}
              thumbColor="#fff"
            />
          </View>

          <View
            style={[
              styles.settingItem,
              { backgroundColor: colorScheme === 'dark' ? colors.bg.tertiary : '#f5f5f5' },
            ]}
          >
            <View style={styles.settingInfo}>
              <Text style={styles.settingIcon}>⚙️</Text>
              <Text
                style={[
                  styles.settingLabel,
                  { color: colorScheme === 'dark' ? colors.text.primary : '#000' },
                ]}
              >
                System Updates
              </Text>
            </View>
            <Switch
              value={currentPreferences.types.system}
              onValueChange={() => handleToggleTypePreference('system')}
              trackColor={{ false: '#333', true: '#E8420A' }}
              thumbColor="#fff"
            />
          </View>

          <View
            style={[
              styles.settingItem,
              { backgroundColor: colorScheme === 'dark' ? colors.bg.tertiary : '#f5f5f5' },
            ]}
          >
            <View style={styles.settingInfo}>
              <Text style={styles.settingIcon}>💰</Text>
              <Text
                style={[
                  styles.settingLabel,
                  { color: colorScheme === 'dark' ? colors.text.primary : '#000' },
                ]}
              >
                Payments
              </Text>
            </View>
            <Switch
              value={currentPreferences.types.payments}
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
              { backgroundColor: colorScheme === 'dark' ? colors.bg.tertiary : '#f5f5f5' },
            ]}
          >
            <Text
              style={[
                styles.settingLabel,
                { color: colorScheme === 'dark' ? colors.text.primary : '#000' },
              ]}
            >
              Version
            </Text>
            <Text style={styles.settingValue}>{safeConstants.expoConfig?.version ?? '1.0.0'}</Text>
          </View>

          <TouchableOpacity
            style={[
              styles.settingItem,
              { backgroundColor: colorScheme === 'dark' ? colors.bg.tertiary : '#f5f5f5' },
            ]}
            onPress={() => Linking.openURL('https://azeebo.plus/terms')}
          >
            <Text
              style={[
                styles.settingLabel,
                { color: colorScheme === 'dark' ? colors.text.primary : '#000' },
              ]}
            >
              Terms of Service
            </Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.settingItem,
              { backgroundColor: colorScheme === 'dark' ? colors.bg.tertiary : '#f5f5f5' },
            ]}
            onPress={() => Linking.openURL('https://azeebo.plus/privacy')}
          >
            <Text
              style={[
                styles.settingLabel,
                { color: colorScheme === 'dark' ? colors.text.primary : '#000' },
              ]}
            >
              Privacy Policy
            </Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.settingItem,
              { backgroundColor: colorScheme === 'dark' ? colors.bg.tertiary : '#f5f5f5' },
            ]}
          >
            <Text
              style={[
                styles.settingLabel,
                { color: colorScheme === 'dark' ? colors.text.primary : '#000' },
              ]}
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
    color: colors.text.tertiary,
    marginTop: 2,
  },
  settingValue: {
    fontSize: 16,
    color: colors.text.tertiary,
  },
  menuArrow: {
    color: colors.text.tertiary,
    fontSize: 24,
  },
  bottomPadding: {
    height: 24,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 16,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 4,
  },
  languageEmoji: {
    fontSize: 28,
    marginRight: 14,
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '600',
  },
  languageNative: {
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: 2,
  },
  languageCheck: {
    fontSize: 20,
    color: '#E8420A',
    fontWeight: '700',
  },
  modalCloseButton: {
    marginTop: 12,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: 'rgba(232,66,10,0.1)',
    borderRadius: 12,
  },
  modalCloseText: {
    color: '#E8420A',
    fontSize: 16,
    fontWeight: '600',
  },
});
