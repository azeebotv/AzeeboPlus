'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';

interface Device { id: string; name: string; type: string; lastActive: string; isCurrent: boolean; location?: string; }

export default function DevicesPage(): React.JSX.Element {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !user) { router.push('/auth/login'); return; }
    loadDevices();
  }, [isAuthenticated, user, router]);

  const loadDevices = async () => {
    try {
      const response = await apiFetch<any>('/auth/devices');
      if (response.success && response.data) {
        const data = response.data as any;
        setDevices(Array.isArray(data) ? data : data.devices || []);
      }
    } catch { /* ignore */ } finally { setIsLoading(false); }
  };

  const handleRemove = async (deviceId: string) => {
    if (!confirm('Remove this device?')) return;
    try {
      await apiFetch<any>(`/auth/devices/${deviceId}`, { method: 'DELETE' });
      setDevices(devices.filter(d => d.id !== deviceId));
    } catch { /* ignore */ }
  };

  if (!isAuthenticated || !user) return <></>;

  const getDeviceIcon = (type: string) => {
    switch (type?.toLowerCase()) { case 'mobile': return '📱'; case 'tablet': return '📱'; case 'tv': return '📺'; default: return '💻'; }
  };

  return (
    <div style={{ backgroundColor: '#1A0A0A', minHeight: '100vh', color: '#F5F0EB' }}>
      <AppHeader />
      <main style={{ paddingTop: 100, paddingBottom: 60, maxWidth: 700, margin: '0 auto', padding: '100px 24px 60px' }}>
        <div style={{ marginBottom: 32 }}>
          <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: '#9A8A7A', cursor: 'pointer', fontSize: 14, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>←</span> Back
          </button>
          <h1 style={{ fontSize: 28, fontWeight: 700 }}>Manage Devices</h1>
          <p style={{ color: '#9A8A7A', marginTop: 4 }}>View and manage devices connected to your account</p>
        </div>

        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <div style={{ width: 40, height: 40, border: '3px solid #2A1A1A', borderTopColor: '#E8420A', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : devices.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📱</div>
            <h3 style={{ fontSize: 18 }}>No devices found</h3>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {devices.map(device => (
              <div key={device.id} className="az-glass" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 16, borderRadius: 16, border: device.isCurrent ? '1px solid #0D3B2E' : undefined }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: '#2A1A1A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
                  {getDeviceIcon(device.type)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <p style={{ fontWeight: 600, fontSize: 15 }}>{device.name}</p>
                    {device.isCurrent && <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600, backgroundColor: 'rgba(13,59,46,0.2)', color: '#0D3B2E' }}>Current</span>}
                  </div>
                  <p style={{ color: '#9A8A7A', fontSize: 13 }}>
                    {device.location ? `${device.location} · ` : ''}Last active {new Date(device.lastActive).toLocaleDateString()}
                  </p>
                </div>
                {!device.isCurrent && (
                  <button onClick={() => handleRemove(device.id)} style={{ padding: '8px 16px', borderRadius: 999, border: '1px solid #CC1C1C', background: 'transparent', color: '#CC1C1C', fontWeight: 500, fontSize: 13, cursor: 'pointer' }}>
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
      <AppFooter />
    </div>
  );
}
