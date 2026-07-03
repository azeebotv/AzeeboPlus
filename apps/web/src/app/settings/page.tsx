'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';

export default function SettingsPage(): React.JSX.Element {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [settings, setSettings] = useState({
    language: 'en',
    autoplay: true,
    notifications: true,
    darkMode: true,
    dataSaver: false,
    downloadQuality: 'hd',
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !user) {
      router.push('/auth/login');
      return;
    }
  }, [authLoading, isAuthenticated, user, router]);

  const handleSave = async () => {
    try {
      const result = await api.user.updatePreferences(settings);
      if (result.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch {
      /* ignore */
    }
  };

  if (!isAuthenticated || !user) return <></>;

  const toggleItems = [
    { key: 'autoplay', label: 'Autoplay', desc: 'Automatically play next video' },
    { key: 'notifications', label: 'Notifications', desc: 'Receive push notifications' },
    { key: 'darkMode', label: 'Dark Mode', desc: 'Use dark theme' },
    { key: 'dataSaver', label: 'Data Saver', desc: 'Reduce streaming quality on mobile' },
  ];

  return (
    <div style={{ backgroundColor: '#1A0A0A', minHeight: '100vh', color: '#F5F0EB' }}>
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
            {toggleItems.map((item) => (
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
                  <p style={{ color: '#9A8A7A', fontSize: 13 }}>{item.desc}</p>
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

        <div className="az-glass" style={{ padding: 24, borderRadius: 20, marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Download Quality</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            {['sd', 'hd', 'fullhd'].map((q) => (
              <button
                key={q}
                onClick={() => setSettings({ ...settings, downloadQuality: q })}
                style={{
                  flex: 1,
                  padding: '10px 0',
                  borderRadius: 12,
                  border: settings.downloadQuality === q ? 'none' : '1px solid #2A1A1A',
                  background:
                    settings.downloadQuality === q
                      ? 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)'
                      : 'transparent',
                  color: settings.downloadQuality === q ? '#fff' : '#9A8A7A',
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
                  color: '#F5F0EB',
                }}
              >
                <span style={{ fontWeight: 500, fontSize: 15 }}>{link.label}</span>
                <span style={{ color: '#9A8A7A' }}>→</span>
              </a>
            ))}
          </div>
        </div>

        <button
          onClick={handleSave}
          className="az-btn-primary"
          style={{
            width: '100%',
            padding: '14px 0',
            borderRadius: 999,
            border: 'none',
            background: 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)',
            color: '#fff',
            fontWeight: 700,
            fontSize: 16,
            cursor: 'pointer',
          }}
        >
          {saved ? '✓ Saved!' : 'Save Settings'}
        </button>
      </main>
      <AppFooter />
    </div>
  );
}
