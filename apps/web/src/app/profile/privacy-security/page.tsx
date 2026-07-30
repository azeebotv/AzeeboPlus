'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';

export const metadata = {
  title: 'Privacy & Security | Azeebo',
  description: 'Manage your privacy settings, direct messages, and two-factor authentication.',
  openGraph: {
    title: 'Privacy & Security | Azeebo',
    description: 'Manage your privacy settings, direct messages, and two-factor authentication.',
  },
};

export default function PrivacySecurityPage(): React.JSX.Element {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [settings, setSettings] = useState({
    isPrivate: false,
    showActivity: true,
    allowMessages: true,
    twoFactorEnabled: false,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !user) {
      router.push('/auth/login');
      return;
    }
    loadSettings();
  }, [authLoading, isAuthenticated, user, router]);

  const loadSettings = async () => {
    try {
      const response = await api.user.getPrivacySettings();
      if (response.success && response.data) setSettings(response.data as typeof settings);
    } catch {
      /* ignore */
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.user.updatePrivacySettings(settings);
      setSaved(true);
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
      savedTimerRef.current = setTimeout(() => setSaved(false), 2000);
    } catch {
      /* ignore */
    }
    setIsSaving(false);
  };

  if (authLoading) return <></>;
  if (!isAuthenticated || !user) return <></>;

  const toggleItems = [
    {
      key: 'isPrivate',
      label: 'Private Account',
      desc: 'Only approved followers can see your content',
    },
    { key: 'showActivity', label: 'Show Activity', desc: 'Let others see your viewing activity' },
    { key: 'allowMessages', label: 'Direct Messages', desc: 'Allow anyone to send you messages' },
    {
      key: 'twoFactorEnabled',
      label: 'Two-Factor Authentication',
      desc: 'Add an extra layer of security',
    },
  ];

  return (
    <div style={{ backgroundColor: 'var(--brand-near-black)', minHeight: '100vh', color: 'var(--text-primary)' }}>
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
        <div style={{ marginBottom: 32 }}>
          <button
            onClick={() => router.back()}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: 14,
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span>←</span> Back
          </button>
          <h1 style={{ fontSize: 28, fontWeight: 700 }}>Privacy & Security</h1>
        </div>

        <div className="az-glass" style={{ padding: 24, borderRadius: 20, marginBottom: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {toggleItems.map((item) => (
              <div
                key={item.key}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 0',
                  borderBottom: '1px solid #2A1A1A',
                }}
              >
                <div>
                  <p style={{ fontWeight: 600, fontSize: 15 }}>{item.label}</p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 2 }}>{item.desc}</p>
                </div>
                <button
                  onClick={() =>
                    setSettings({
                      ...settings,
                      [item.key]: !settings[item.key as keyof typeof settings],
                    })
                  }
                  style={{
                    width: 48,
                    height: 28,
                    borderRadius: 14,
                    border: 'none',
                    cursor: 'pointer',
                    position: 'relative',
                    backgroundColor: settings[item.key as keyof typeof settings]
                      ? '#E8420A'
                      : '#2A1A1A',
                    transition: 'background-color 0.2s',
                    flexShrink: 0,
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
            ))}
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="az-btn-primary"
          style={{
            width: '100%',
            padding: '14px 0',
            borderRadius: 999,
            border: 'none',
            background: 'linear-gradient(135deg, var(--brand-orange) 0%, var(--brand-red) 100%)',
            color: 'var(--brand-white)',
            fontWeight: 700,
            fontSize: 16,
            cursor: 'pointer',
            opacity: isSaving ? 0.6 : 1,
          }}
        >
          {saved ? '✓ Saved!' : isSaving ? 'Saving...' : 'Save Settings'}
        </button>

        {/* Danger zone */}
        <div
          className="az-glass"
          style={{
            padding: 24,
            borderRadius: 20,
            marginTop: 24,
            border: '1px solid rgba(204,28,28,0.3)',
          }}
        >
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#CC1C1C', marginBottom: 12 }}>
            Danger Zone
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 16 }}>
            Once you delete your account, there is no going back.
          </p>
          <button
            style={{
              padding: '10px 24px',
              borderRadius: 999,
              border: '1px solid var(--brand-red)',
              background: 'transparent',
              color: '#CC1C1C',
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            Delete Account
          </button>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
