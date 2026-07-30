'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { Skeleton, ErrorState, Spinner } from '@azeebo/ui/web';

interface UserSettings {
  language: string;
  autoplay: boolean;
  notifications: boolean;
  darkMode: boolean;
  dataSaver: boolean;
  downloadQuality: string;
}

const DEFAULT_SETTINGS: UserSettings = {
  language: 'en',
  autoplay: true,
  notifications: true,
  darkMode: true,
  dataSaver: false,
  downloadQuality: 'hd',
};

export const metadata = {
  title: 'Settings | Azeebo',
  description: 'Manage your account preferences, download quality, and notification settings.',
  openGraph: {
    title: 'Settings | Azeebo',
    description: 'Manage your account preferences, download quality, and notification settings.',
  },
};

export default function SettingsPage(): React.JSX.Element {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const preferencesQuery = useQuery({
    queryKey: ['user', 'preferences'],
    queryFn: async () => {
      const result = await api.user.getPreferences();
      if (result.success && result.data) {
        const data = result.data as Partial<UserSettings>;
        return { ...DEFAULT_SETTINGS, ...data };
      }
      return DEFAULT_SETTINGS;
    },
    staleTime: 300000,
    enabled: isAuthenticated && !authLoading,
  });

  const [localSettings, setLocalSettings] = useState<UserSettings | null>(null);
  const settings = localSettings ?? preferencesQuery.data ?? DEFAULT_SETTINGS;

  const saveMutation = useMutation({
    mutationFn: async (newSettings: UserSettings) => {
      return api.user.updatePreferences(newSettings as unknown as Record<string, unknown>);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'preferences'] });
    },
  });

  if (authLoading) return <></>;
  if (!isAuthenticated || !user) {
    router.push('/auth/login');
    return <></>;
  }

  const toggleItems = [
    { key: 'autoplay', label: 'Autoplay', desc: 'Automatically play next video' },
    { key: 'notifications', label: 'Notifications', desc: 'Receive push notifications' },
    { key: 'darkMode', label: 'Dark Mode', desc: 'Use dark theme' },
    { key: 'dataSaver', label: 'Data Saver', desc: 'Reduce streaming quality on mobile' },
  ];

  return (
    <div style={{ backgroundColor: 'var(--bg-primary, #1A0A0A)', minHeight: '100vh', color: 'var(--text-primary, #F5F0EB)' }}>
      <AppHeader />
      <main
        style={{
          paddingTop: 100,
          paddingBottom: 60,
          maxWidth: 600,
          margin: '0 auto',
          padding: '100px 24px 60px',
        }}
      >
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 32 }}>Settings</h1>

        <div className="az-glass" style={{ padding: 24, borderRadius: 20, marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Preferences</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {preferencesQuery.isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center justify-between py-2">
                    <div className="space-y-1">
                      <Skeleton width="120px" height="16px" />
                      <Skeleton width="200px" height="12px" />
                    </div>
                    <Skeleton width="48px" height="28px" borderRadius="14px" />
                  </div>
                ))}
              </div>
            ) : preferencesQuery.error ? (
              <ErrorState
                title="Failed to load settings"
                description="Please try again later."
                buttonText="Retry"
                onButtonPress={() => preferencesQuery.refetch()}
              />
            ) : (
              toggleItems.map((item) => (
                <div
                  key={item.key}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 0',
                    borderBottom: '1px solid #2A1A1A',
                  }}
                >
                  <div>
                    <p style={{ fontWeight: 600, fontSize: 15 }}>{item.label}</p>
                    <p style={{ color: 'var(--text-muted, #9A8A7A)', fontSize: 13 }}>{item.desc}</p>
                  </div>
                  <button
                    role="switch"
                    aria-checked={!!settings[item.key as keyof typeof settings]}
                    aria-label={`${item.label}: ${settings[item.key as keyof typeof settings] ? 'On' : 'Off'}`}
                    onClick={() => {
                      const updated = {
                        ...settings,
                        [item.key]: !settings[item.key as keyof typeof settings],
                      };
                      setLocalSettings(updated);
                    }}
                    style={{
                      width: 48,
                      height: 28,
                      borderRadius: 14,
                      border: 'none',
                      cursor: 'pointer',
                      position: 'relative',
                      backgroundColor: settings[item.key as keyof typeof settings]
                        ? 'var(--brand-orange, #E8420A)'
                        : 'var(--bg-surface, #2A1A1A)',
                      transition: 'background-color 0.2s',
                    }}
                  >
                    <span
                      style={{
                        position: 'absolute',
                        top: 3,
                        left: settings[item.key as keyof typeof settings] ? 23 : 3,
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        backgroundColor: '#fff',
                        transition: 'left 0.2s',
                      }}
                    />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="az-glass" style={{ padding: 24, borderRadius: 20, marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Download Quality</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            {['sd', 'hd', 'fullhd'].map((q) => (
              <button
                key={q}
                aria-label={`Download quality: ${q === 'fullhd' ? 'Full HD' : q.toUpperCase()}`}
                onClick={() => setLocalSettings({ ...settings, downloadQuality: q })}
                style={{
                  flex: 1,
                  padding: '10px 0',
                  borderRadius: 12,
                  border: settings.downloadQuality === q ? 'none' : '1px solid #2A1A1A',
                  background:
                    settings.downloadQuality === q
                      ? 'linear-gradient(135deg, var(--brand-orange, #E8420A) 0%, var(--brand-red, #CC1C1C) 100%)'
                      : 'transparent',
                  color: settings.downloadQuality === q ? '#fff' : 'var(--text-muted, #9A8A7A)',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                }}
              >
                {q === 'fullhd' ? 'Full HD' : q.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="az-glass" style={{ padding: 24, borderRadius: 20, marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Account Links</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { href: '/profile/edit', label: 'Edit Profile' },
              { href: '/profile/privacy-security', label: 'Privacy & Security' },
              { href: '/settings/devices', label: 'Manage Devices' },
              { href: '/wallet/subscription-plans', label: 'Subscription Plans' },
            ].map((link) => (
              <a
                key={link.href}
                href={link.href}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 0',
                  borderBottom: '1px solid #2A1A1A',
                  textDecoration: 'none',
                  color: 'var(--text-primary, #F5F0EB)',
                }}
              >
                <span style={{ fontWeight: 500, fontSize: 15 }}>{link.label}</span>
                <span style={{ color: 'var(--text-muted, #9A8A7A)' }}>→</span>
              </a>
            ))}
          </div>
        </div>

        {saveMutation.isSuccess && (
          <div
            className="mb-4 px-4 py-3 rounded-xl text-center text-sm font-medium"
            style={{
              backgroundColor: 'rgba(34,197,94,0.15)',
              border: '1px solid rgba(34,197,94,0.3)',
              color: '#22C55E',
            }}
            role="status"
          >
            Settings saved successfully
          </div>
        )}
        {saveMutation.isError && (
          <div
            className="mb-4 px-4 py-3 rounded-xl text-center text-sm font-medium"
            style={{
              backgroundColor: 'rgba(239,68,68,0.15)',
              border: '1px solid rgba(239,68,68,0.3)',
              color: '#EF4444',
            }}
            role="alert"
          >
            Failed to save settings. Please try again.
          </div>
        )}
        <button
          onClick={() => saveMutation.mutate(settings)}
          disabled={saveMutation.isPending}
          className="az-btn-primary"
          style={{
            width: '100%',
            padding: '14px 0',
            borderRadius: 999,
            border: 'none',
            background: 'linear-gradient(135deg, var(--brand-orange, #E8420A) 0%, var(--brand-red, #CC1C1C) 100%)',
            color: 'var(--brand-white)',
            fontWeight: 700,
            fontSize: 16,
            cursor: saveMutation.isPending ? 'not-allowed' : 'pointer',
            opacity: saveMutation.isPending ? 0.7 : 1,
          }}
        >
          {saveMutation.isPending ? (
            <span className="flex items-center justify-center gap-2">
              <Spinner size="sm" color="#fff" /> Saving...
            </span>
          ) : (
            'Save Settings'
          )}
        </button>
      </main>
      <AppFooter />
    </div>
  );
}
