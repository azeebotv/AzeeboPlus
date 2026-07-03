'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import AdminLayout from '@/components/layout/AdminLayout';

export default function AdminSettingsPage(): React.JSX.Element {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const [settings, setSettings] = useState({
    platformName: 'Azeebo+',
    maintenanceMode: false,
    registrationEnabled: true,
    maxUploadSize: 500,
    subscriptionEnabled: true,
    superVoteEnabled: true,
    referralEnabled: true,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !user || user.role !== 'admin') return;
    loadSettings();
  }, [authLoading, isAuthenticated, user]);

  const loadSettings = async () => {
    try {
      const response = await api.admin.getAllSettings();
      if (response.success && response.data) {
        const arr = response.data as any[];
        const map: Record<string, any> = {};
        if (Array.isArray(arr))
          arr.forEach((s: any) => {
            map[s.key] = s.value;
          });
        setSettings({ ...settings, ...map });
      }
    } catch {
      /* ignore */
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = Object.entries(settings).map(([key, value]) => ({ key, value }));
      await api.admin.bulkUpdateSettings(payload);
      setSaved(true);
      setSaveError(null);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save settings');
    }
    setIsSaving(false);
  };

  const toggleItems = [
    {
      key: 'maintenanceMode',
      label: 'Maintenance Mode',
      desc: 'Put the platform in maintenance mode',
    },
    { key: 'registrationEnabled', label: 'Registration', desc: 'Allow new user registrations' },
    { key: 'subscriptionEnabled', label: 'Subscriptions', desc: 'Enable subscription purchases' },
    { key: 'superVoteEnabled', label: 'Super Votes', desc: 'Enable super vote feature' },
    { key: 'referralEnabled', label: 'Referrals', desc: 'Enable referral program' },
  ];

  return (
    <AdminLayout>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Platform Settings</h1>
      <p style={{ color: '#9A8A7A', marginBottom: 32 }}>Configure platform-wide settings</p>

      <div className="az-glass" style={{ padding: 24, borderRadius: 20, marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>General</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 6,
                color: '#9A8A7A',
              }}
            >
              Platform Name
            </label>
            <input
              value={settings.platformName}
              onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 12,
                border: '1px solid #2A1A1A',
                backgroundColor: '#0D0505',
                color: '#F5F0EB',
                fontSize: 15,
              }}
            />
          </div>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 6,
                color: '#9A8A7A',
              }}
            >
              Max Upload Size (MB)
            </label>
            <input
              type="number"
              value={settings.maxUploadSize}
              onChange={(e) => setSettings({ ...settings, maxUploadSize: Number(e.target.value) })}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 12,
                border: '1px solid #2A1A1A',
                backgroundColor: '#0D0505',
                color: '#F5F0EB',
                fontSize: 15,
              }}
            />
          </div>
        </div>
      </div>

      <div className="az-glass" style={{ padding: 24, borderRadius: 20, marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Feature Toggles</h2>
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
        {saveError && (
          <p style={{ color: '#E8420A', fontSize: 14, marginTop: 12, textAlign: 'center' }}>
            {saveError}
          </p>
        )}
      </div>

      <button
        onClick={handleSave}
        disabled={isSaving}
        className="az-btn-primary"
        style={{
          width: '100%',
          maxWidth: 400,
          padding: '14px 0',
          borderRadius: 999,
          border: 'none',
          background: 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)',
          color: '#fff',
          fontWeight: 700,
          fontSize: 16,
          cursor: 'pointer',
          opacity: isSaving ? 0.6 : 1,
        }}
      >
        {saved ? '✓ Saved!' : isSaving ? 'Saving...' : 'Save Settings'}
      </button>
    </AdminLayout>
  );
}
