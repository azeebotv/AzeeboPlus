'use client';
import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { webLogger } from '@/lib/logger';
import { Button, Card, Skeleton, Badge, Chip, Input, Select, Switch, RadioGroup, Radio } from '@azeebo/ui';
import { colors } from '@azeebo/design-tokens';
import Link from 'next/link';

export default function SettingsPage(): JSX.Element {
  const [settings, setSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
    marketing: false,
  });
  const [privacy, setPrivacy] = useState({
    profileVisibility: 'public',
    showEarnings: false,
    allowMessages: true,
  });

  useEffect(() => {
    let cancelled = false;

    async function fetchSettings() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await api.creator.getSettings();

        if (cancelled) return;

        if (response.success) {
          setSettings(response.data);
          // Update local state with fetched settings
          setNotifications({
            email: response.data.emailNotifications ?? true,
            push: response.data.pushNotifications ?? true,
            sms: response.data.smsNotifications ?? false,
            marketing: response.data.marketingNotifications ?? false,
          });
          setPrivacy({
            profileVisibility: response.data.profileVisibility ?? 'public',
            showEarnings: response.data.showEarnings ?? false,
            allowMessages: response.data.allowMessages ?? true,
          });
        } else {
          setError(response.message || 'Failed to load settings');
          webLogger.error('Failed to load creator settings', { error: response.message });
        }
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : 'An unexpected error occurred';
        setError(message);
        webLogger.error('Failed to load creator settings', { error: message });
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchSettings();
    return () => { cancelled = true; };
  }, []);

  const handleSaveSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await api.creator.updateSettings({
        notifications: {
          email: notifications.email,
          push: notifications.push,
          sms: notifications.sms,
          marketing: notifications.marketing,
        },
        privacy: {
          profileVisibility: privacy.profileVisibility,
          showEarnings: privacy.showEarnings,
          allowMessages: privacy.allowMessages,
        },
      });

      if (response.success) {
        webLogger.info('Creator settings updated successfully');
        // Optionally show a success toast or message
      } else {
        setError(response.message || 'Failed to update settings');
        webLogger.error('Failed to update creator settings', { error: response.message });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(message);
      webLogger.error('Failed to update creator settings', { error: message });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold" style={{ color: colors.text.primary }}>
            Settings
          </h2>
        </div>

        <div className="grid gap-6">
          <div className="w-full">
            <Card padding="none">
              <Skeleton height="80px" />
              <Skeleton width="60%" height="20px" className="mt-4" />
            </Card>
          </div>

          <div className="w-full">
            <Card padding="none">
              <Skeleton height="80px" />
              <Skeleton width="60%" height="20px" className="mt-4" />
            </Card>
          </div>

          <div className="w-full">
            <Card padding="none">
              <Skeleton height="200px" />
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold" style={{ color: colors.text.primary }}>
            Settings
          </h2>
        </div>

        <div className="text-center py-8">
          <p className="text-lg" style={{ color: colors.text.secondary }}>
            {error}
          </p>
          <Button variant="primary" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold" style={{ color: colors.text.primary }}>
          Settings
        </h2>
      </div>

      {/* Notification Settings */}
      <Card padding="none">
        <div className="p-6">
          <h3 className="text-lg font-bold mb-4" style={{ color: colors.text.primary }}>
            Notifications
          </h3>
          <div className="space-y-4">
            <div className="flex items-center">
              <Switch
                checked={notifications.email}
                onChange={checked => setNotifications(prev => ({ ...prev, email: checked }))}
                checkedIcon={<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>}
                uncheckedIcon={<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>}
              />
              <span className="ml-3 text-sm" style={{ color: colors.text.primary }}>Email notifications</span>
            </div>

            <div className="flex items-center">
              <Switch
                checked={notifications.push}
                onChange={checked => setNotifications(prev => ({ ...prev, push: checked }))}
                checkedIcon={<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>}
                uncheckedIcon={<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>}
              />
              <span className="ml-3 text-sm" style={{ color: colors.text.primary }}>Push notifications</span>
            </div>

            <div className="flex items-center">
              <Switch
                checked={notifications.sms}
                onChange={checked => setNotifications(prev => ({ ...prev, sms: checked }))}
                checkedIcon={<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>}
                uncheckedIcon={<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>}
              />
              <span className="ml-3 text-sm" style={{ color: colors.text.primary }}>SMS notifications</span>
            </div>

            <div className="flex items-center">
              <Switch
                checked={notifications.marketing}
                onChange={checked => setNotifications(prev => ({ ...prev, marketing: checked }))}
                checkedIcon={<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>}
                uncheckedIcon={<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>}
              />
              <span className="ml-3 text-sm" style={{ color: colors.text.primary }}>Marketing and promotions</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Privacy Settings */}
      <Card padding="none">
        <div className="p-6">
          <h3 className="text-lg font-bold mb-4" style={{ color: colors.text.primary }}>
            Privacy
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: colors.text.primary }}>
                Profile Visibility
              </label>
              <RadioGroup
                value={privacy.profileVisibility}
                onValueChange={value => setPrivacy(prev => ({ ...prev, profileVisibility: value }))}
                className="flex space-x-4"
              >
                <Radio value="public">
                  Public (visible to everyone)
                </Radio>
                <Radio value="followers">
                  Followers only
                </Radio>
                <Radio value="private">
                  Private (only you)
                </Radio>
              </RadioGroup>
            </div>

            <div className="flex items-center">
              <Switch
                checked={privacy.showEarnings}
                onChange={checked => setPrivacy(prev => ({ ...prev, showEarnings: checked }))}
                checkedIcon={<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>}
                uncheckedIcon={<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>}
              />
              <span className="ml-3 text-sm" style={{ color: colors.text.primary }}>
                Show earnings on profile
              </span>
            </div>

            <div className="flex items-center">
              <Switch
                checked={privacy.allowMessages}
                onChange={checked => setPrivacy(prev => ({ ...prev, allowMessages: checked }))}
                checkedIcon={<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>}
                uncheckedIcon={<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>}
              />
              <span className="ml-3 text-sm" style={{ color: colors.text.primary }}>
                Allow messages from fans
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button variant="primary" onClick={handleSaveSettings} isLoading={isLoading}>
          Save Settings
        </Button>
      </div>
    </div>
  );
}