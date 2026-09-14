import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Switch,
  Alert,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { contentApi } from '../../src/api';
import { logger } from '../../src/utils/logger';
import { LoadingState, ErrorState } from '../../src/components/StateContainers';
import { colors } from '../../src/theme';

interface MonetizationSettings {
  isMonetizationEnabled: boolean;
  isSubscriptionEnabled: boolean;
  subscriptionPrice: number;
  isTipEnabled: boolean;
  minimumTip: number;
  isAdEnabled: boolean;
  adRevenueShare: number;
  payoutMethod: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
}

export default function MonetizationSettingsScreen() {
  const router = useRouter();
  const [settings, setSettings] = useState<MonetizationSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await contentApi.getMonetizationSettings();
      if (response.success && response.data) {
        // Cast API response to UI interface
        setSettings({
          isMonetizationEnabled:
            response.data.isMonetizationEnabled ?? response.data.isMonetized ?? false,
          isSubscriptionEnabled: response.data.isSubscriptionEnabled ?? false,
          subscriptionPrice: 0,
          isTipEnabled: response.data.isTipEnabled ?? false,
          minimumTip: response.data.minimumTip ?? 0,
          isAdEnabled: response.data.isAdEnabled ?? false,
          adRevenueShare: response.data.adRevenueShare ?? response.data.adRevenueShare ?? 0,
          payoutMethod: response.data.payoutMethod ?? '',
          bankName: '',
          accountNumber: '',
          accountName: '',
        });
      }
    } catch (error) {
      logger.error('Failed to load monetization settings', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    setIsSaving(true);
    try {
      await contentApi.updateMonetizationSettings(settings);
      Alert.alert('Success', 'Monetization settings updated successfully');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update settings';
      Alert.alert('Error', message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <LoadingState text="Loading settings..." />
      </SafeAreaView>
    );
  }

  if (!settings) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ErrorState
          title="Failed to load"
          description="Could not load monetization settings"
          onRetry={loadSettings}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Monetization Settings</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>General</Text>
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Enable Monetization</Text>
                <Text style={styles.settingDescription}>Turn on monetization for your content</Text>
              </View>
              <Switch
                value={settings.isMonetizationEnabled}
                onValueChange={(value) =>
                  setSettings({ ...settings, isMonetizationEnabled: value })
                }
                trackColor={{ false: 'rgba(255,255,255,0.2)', true: '#E8420A' }}
                thumbColor="#fff"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subscriptions</Text>
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Enable Subscriptions</Text>
                <Text style={styles.settingDescription}>
                  Allow users to subscribe to your content
                </Text>
              </View>
              <Switch
                value={settings.isSubscriptionEnabled}
                onValueChange={(value) =>
                  setSettings({ ...settings, isSubscriptionEnabled: value })
                }
                trackColor={{ false: 'rgba(255,255,255,0.2)', true: '#E8420A' }}
                thumbColor="#fff"
              />
            </View>
            {settings.isSubscriptionEnabled && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Subscription Price (₦)</Text>
                <TextInput
                  style={styles.input}
                  value={String(settings.subscriptionPrice)}
                  onChangeText={(value) =>
                    setSettings({ ...settings, subscriptionPrice: parseFloat(value) || 0 })
                  }
                  keyboardType="numeric"
                  placeholder="Enter price"
                  placeholderTextColor="#6B7280"
                />
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tips</Text>
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Enable Tips</Text>
                <Text style={styles.settingDescription}>Allow users to tip your content</Text>
              </View>
              <Switch
                value={settings.isTipEnabled}
                onValueChange={(value) => setSettings({ ...settings, isTipEnabled: value })}
                trackColor={{ false: 'rgba(255,255,255,0.2)', true: '#E8420A' }}
                thumbColor="#fff"
              />
            </View>
            {settings.isTipEnabled && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Minimum Tip (₦)</Text>
                <TextInput
                  style={styles.input}
                  value={String(settings.minimumTip)}
                  onChangeText={(value) =>
                    setSettings({ ...settings, minimumTip: parseFloat(value) || 0 })
                  }
                  keyboardType="numeric"
                  placeholder="Enter minimum tip"
                  placeholderTextColor="#6B7280"
                />
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ads</Text>
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Enable Ads</Text>
                <Text style={styles.settingDescription}>Show ads on your content</Text>
              </View>
              <Switch
                value={settings.isAdEnabled}
                onValueChange={(value) => setSettings({ ...settings, isAdEnabled: value })}
                trackColor={{ false: 'rgba(255,255,255,0.2)', true: '#E8420A' }}
                thumbColor="#fff"
              />
            </View>
            {settings.isAdEnabled && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Revenue Share (%)</Text>
                <TextInput
                  style={styles.input}
                  value={String(settings.adRevenueShare)}
                  onChangeText={(value) =>
                    setSettings({ ...settings, adRevenueShare: parseFloat(value) || 0 })
                  }
                  keyboardType="numeric"
                  placeholder="Enter revenue share"
                  placeholderTextColor="#6B7280"
                />
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payout Information</Text>
          <View style={styles.card}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Bank Name</Text>
              <TextInput
                style={styles.input}
                value={settings.bankName}
                onChangeText={(value) => setSettings({ ...settings, bankName: value })}
                placeholder="Enter bank name"
                placeholderTextColor="#6B7280"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Account Number</Text>
              <TextInput
                style={styles.input}
                value={settings.accountNumber}
                onChangeText={(value) => setSettings({ ...settings, accountNumber: value })}
                keyboardType="numeric"
                placeholder="Enter account number"
                placeholderTextColor="#6B7280"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Account Name</Text>
              <TextInput
                style={styles.input}
                value={settings.accountName}
                onChangeText={(value) => setSettings({ ...settings, accountName: value })}
                placeholder="Enter account name"
                placeholderTextColor="#6B7280"
              />
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Save Settings</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A0A0A',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: colors.light[400],
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: colors.light[100],
    fontSize: 18,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#E8420A',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  backButton: {
    marginRight: 16,
  },
  backButtonText: {
    fontSize: 24,
    color: colors.light[100],
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.light[100],
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.light[100],
    marginBottom: 16,
  },
  card: {
    backgroundColor: colors.palette.charcoal,
    borderRadius: 12,
    padding: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.light[100],
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 12,
    color: colors.light[400],
  },
  inputGroup: {
    marginTop: 12,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.light[100],
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.light[100],
  },
  saveButton: {
    backgroundColor: '#E8420A',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
