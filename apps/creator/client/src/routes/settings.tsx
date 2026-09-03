import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { creatorApi } from '@/lib/api/creator';

type NotificationPrefs = {
  email: boolean;
  push: boolean;
  sms: boolean;
  marketing: boolean;
};

type PrivacySettings = {
  profileVisibility: 'public' | 'private' | 'subscribers';
  showEarnings: boolean;
  allowMessages: boolean;
};

export default function SettingsPage() {
  const [payoutMethod, setPayoutMethod] = useState('bank_transfer');
  const [minimumPayout, setMinimumPayout] = useState('50');

  const [notifications, setNotifications] = useState<NotificationPrefs>({
    email: true,
    push: true,
    sms: false,
    marketing: false,
  });

  const [privacy, setPrivacy] = useState<PrivacySettings>({
    profileVisibility: 'public',
    showEarnings: false,
    allowMessages: true,
  });

  const settingsMutation = useMutation({
    mutationFn: () =>
      creatorApi.updateSettings({
        payoutMethod,
        minimumPayout: Number(minimumPayout),
        notifications,
        privacy,
      }),
  });

  const toggleNotification = (key: keyof NotificationPrefs) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const togglePrivacy = (key: keyof PrivacySettings, value?: boolean) => {
    setPrivacy((prev) => ({ ...prev, [key]: value ?? (!prev[key] as never) }));
  };

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Settings</h1>
      <p style={{ color: 'var(--creator-text-muted)', marginBottom: 24 }}>Manage your creator settings</p>

      <div style={{ maxWidth: 600 }}>
        {/* Payout Settings */}
        <div
          style={{
            padding: 20,
            borderRadius: 12,
            border: '1px solid var(--creator-border)',
            backgroundColor: 'rgba(26,10,10,0.5)',
            marginBottom: 16,
          }}
        >
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Payout Settings</h3>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--creator-text-muted)', marginBottom: 6 }}>
              Payout Method
            </label>
            <select
              value={payoutMethod}
              onChange={(e) => setPayoutMethod(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 8,
                border: '1px solid var(--creator-border)',
                backgroundColor: 'var(--creator-dark)',
                color: 'var(--creator-text)',
                fontSize: 14,
              }}
            >
              <option value="bank_transfer">Bank Transfer</option>
              <option value="paypal">PayPal</option>
              <option value="crypto">Crypto</option>
            </select>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--creator-text-muted)', marginBottom: 6 }}>
              Minimum Payout ($)
            </label>
            <input
              type="number"
              value={minimumPayout}
              onChange={(e) => setMinimumPayout(e.target.value)}
              min="10"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 8,
                border: '1px solid var(--creator-border)',
                backgroundColor: 'var(--creator-dark)',
                color: 'var(--creator-text)',
                fontSize: 14,
              }}
            />
          </div>
        </div>

        {/* Notification Settings */}
        <div
          style={{
            padding: 20,
            borderRadius: 12,
            border: '1px solid var(--creator-border)',
            backgroundColor: 'rgba(26,10,10,0.5)',
            marginBottom: 16,
          }}
        >
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Notifications</h3>

          {[
            {
              key: 'email' as const,
              label: 'Email Notifications',
              desc: 'Receive updates via email',
            },
            {
              key: 'push' as const,
              label: 'Push Notifications',
              desc: 'Receive push notifications on your devices',
            },
            {
              key: 'sms' as const,
              label: 'SMS Notifications',
              desc: 'Receive text message alerts',
            },
            {
              key: 'marketing' as const,
              label: 'Marketing Emails',
              desc: 'Receive promotional content and tips',
            },
          ].map((item) => (
            <div
              key={item.key}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 0',
                borderBottom: '1px solid var(--creator-border)',
              }}
            >
              <div>
                <div style={{ fontSize: 14, color: 'var(--creator-text)' }}>{item.label}</div>
                <div style={{ fontSize: 12, color: 'var(--creator-text-muted)' }}>{item.desc}</div>
              </div>
              <button
                onClick={() => toggleNotification(item.key)}
                style={{
                  width: 44,
                  height: 24,
                  borderRadius: 12,
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: notifications[item.key] ? 'var(--creator-orange)' : 'var(--creator-surface)',
                  position: 'relative',
                  transition: 'background-color 0.2s',
                }}
              >
                <div
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    backgroundColor: 'var(--creator-surface-light)',
                    position: 'absolute',
                    top: 3,
                    left: notifications[item.key] ? 23 : 3,
                    transition: 'left 0.2s',
                  }}
                />
              </button>
            </div>
          ))}
        </div>

        {/* Privacy Settings */}
        <div
          style={{
            padding: 20,
            borderRadius: 12,
            border: '1px solid var(--creator-border)',
            backgroundColor: 'rgba(26,10,10,0.5)',
            marginBottom: 16,
          }}
        >
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Privacy</h3>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--creator-text-muted)', marginBottom: 6 }}>
              Profile Visibility
            </label>
            <select
              value={privacy.profileVisibility}
              onChange={(e) =>
                setPrivacy((prev) => ({
                  ...prev,
                  profileVisibility: e.target.value as PrivacySettings['profileVisibility'],
                }))
              }
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 8,
                border: '1px solid var(--creator-border)',
                backgroundColor: 'var(--creator-dark)',
                color: 'var(--creator-text)',
                fontSize: 14,
              }}
            >
              <option value="public">Public</option>
              <option value="subscribers">Subscribers Only</option>
              <option value="private">Private</option>
            </select>
          </div>

          {[
            {
              key: 'showEarnings' as const,
              label: 'Show Earnings',
              desc: 'Display your earnings on your public profile',
            },
            {
              key: 'allowMessages' as const,
              label: 'Allow Messages',
              desc: 'Let subscribers send you direct messages',
            },
          ].map((item) => (
            <div
              key={item.key}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 0',
                borderBottom: '1px solid var(--creator-border)',
              }}
            >
              <div>
                <div style={{ fontSize: 14, color: 'var(--creator-text)' }}>{item.label}</div>
                <div style={{ fontSize: 12, color: 'var(--creator-text-muted)' }}>{item.desc}</div>
              </div>
              <button
                onClick={() => togglePrivacy(item.key)}
                style={{
                  width: 44,
                  height: 24,
                  borderRadius: 12,
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: privacy[item.key] ? 'var(--creator-orange)' : 'var(--creator-surface)',
                  position: 'relative',
                  transition: 'background-color 0.2s',
                }}
              >
                <div
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    backgroundColor: 'var(--creator-surface-light)',
                    position: 'absolute',
                    top: 3,
                    left: privacy[item.key] ? 23 : 3,
                    transition: 'left 0.2s',
                  }}
                />
              </button>
            </div>
          ))}
        </div>

        {/* Save Button */}
        <button
          onClick={() => settingsMutation.mutate()}
          disabled={settingsMutation.isPending}
          style={{
            padding: '10px 20px',
            borderRadius: 8,
            border: 'none',
            background: 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)',
            color: 'white',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {settingsMutation.isPending ? 'Saving...' : 'Save All Settings'}
        </button>

        {settingsMutation.isSuccess && (
          <p style={{ color: 'var(--creator-green)', fontSize: 13, marginTop: 8 }}>
            Settings saved successfully
          </p>
        )}
        {settingsMutation.isError && (
          <p style={{ color: 'var(--creator-red)', fontSize: 13, marginTop: 8 }}>Failed to save settings</p>
        )}
      </div>
    </div>
  );
}
