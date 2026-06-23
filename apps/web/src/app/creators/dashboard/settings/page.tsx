'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';

export default function DashboardSettingsPage(): React.JSX.Element {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const [settings, setSettings] = useState({ notifications: { email: true, push: true, sms: false }, privacy: { showEarnings: false, allowMessages: true }, payoutSchedule: 'monthly' });
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user) { router.push('/auth/login'); return; }
  }, [isAuthenticated, user, router]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.creator.updateSettings(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch { /* ignore */ }
    setIsSaving(false);
  };

  if (!isAuthenticated || !user) return <></>;

  return (
    <div style={{ backgroundColor: '#1A0A0A', minHeight: '100vh', color: '#F5F0EB' }}>
      <AppHeader />
      <main style={{ paddingTop: 100, paddingBottom: 60, maxWidth: 700, margin: '0 auto', padding: '100px 24px 60px' }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700 }}>Creator Settings</h1>
          <p style={{ color: '#9A8A7A', marginTop: 4 }}>Configure your creator preferences</p>
        </div>

        <div className="az-glass" style={{ padding: 24, borderRadius: 20, marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Notifications</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { key: 'email', label: 'Email Notifications', desc: 'Receive updates via email' },
              { key: 'push', label: 'Push Notifications', desc: 'Receive browser push notifications' },
              { key: 'sms', label: 'SMS Notifications', desc: 'Receive text message alerts' },
            ].map(item => (
              <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
                <div>
                  <p style={{ fontWeight: 600, fontSize: 15 }}>{item.label}</p>
                  <p style={{ color: '#9A8A7A', fontSize: 13 }}>{item.desc}</p>
                </div>
                <button onClick={() => setSettings({ ...settings, notifications: { ...settings.notifications, [item.key]: !settings.notifications[item.key as keyof typeof settings.notifications] } })} style={{ width: 48, height: 28, borderRadius: 14, border: 'none', cursor: 'pointer', position: 'relative', backgroundColor: settings.notifications[item.key as keyof typeof settings.notifications] ? '#E8420A' : '#2A1A1A', transition: 'background-color 0.2s' }}>
                  <span style={{ position: 'absolute', top: 3, left: settings.notifications[item.key as keyof typeof settings.notifications] ? 23 : 3, width: 22, height: 22, borderRadius: '50%', backgroundColor: '#fff', transition: 'left 0.2s' }} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="az-glass" style={{ padding: 24, borderRadius: 20, marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Privacy</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { key: 'showEarnings', label: 'Show Earnings Publicly', desc: 'Display your earnings on your profile' },
              { key: 'allowMessages', label: 'Allow Messages', desc: 'Let viewers send you direct messages' },
            ].map(item => (
              <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
                <div>
                  <p style={{ fontWeight: 600, fontSize: 15 }}>{item.label}</p>
                  <p style={{ color: '#9A8A7A', fontSize: 13 }}>{item.desc}</p>
                </div>
                <button onClick={() => setSettings({ ...settings, privacy: { ...settings.privacy, [item.key]: !settings.privacy[item.key as keyof typeof settings.privacy] } })} style={{ width: 48, height: 28, borderRadius: 14, border: 'none', cursor: 'pointer', position: 'relative', backgroundColor: settings.privacy[item.key as keyof typeof settings.privacy] ? '#E8420A' : '#2A1A1A', transition: 'background-color 0.2s' }}>
                  <span style={{ position: 'absolute', top: 3, left: settings.privacy[item.key as keyof typeof settings.privacy] ? 23 : 3, width: 22, height: 22, borderRadius: '50%', backgroundColor: '#fff', transition: 'left 0.2s' }} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <button onClick={handleSave} disabled={isSaving} className="az-btn-primary" style={{ width: '100%', padding: '14px 0', borderRadius: 999, border: 'none', background: 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)', color: '#fff', fontWeight: 700, fontSize: 16, cursor: 'pointer', opacity: isSaving ? 0.6 : 1 }}>
          {saved ? '✓ Saved!' : isSaving ? 'Saving...' : 'Save Settings'}
        </button>
      </main>
      <AppFooter />
    </div>
  );
}
