'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';

interface Device {
  id: string;
  name: string;
  type: string;
  lastActive: string;
  isCurrent: boolean;
  location?: string;
}

interface DeviceListResponse {
  devices?: Device[];
}

interface RemoveDeviceResult {
  removed: boolean;
}

export default function DevicesPage(): React.JSX.Element {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    destructive?: boolean;
    onConfirm: () => void;
  }>({ open: false, title: '', message: '', onConfirm: () => {} });

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !user) {
      router.push('/auth/login');
      return;
    }
    loadDevices();
  }, [authLoading, isAuthenticated, user, router]);

  const loadDevices = async () => {
    try {
      const response = await apiFetch<DeviceListResponse | Device[]>('/auth/devices');
      if (response.success && response.data) {
        const data = response.data;
        setDevices(Array.isArray(data) ? data : (data as DeviceListResponse).devices || []);
      }
    } catch {
      /* ignore */
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = (deviceId: string) => {
    setConfirmDialog({
      open: true,
      title: 'Remove Device',
      message: 'Are you sure you want to remove this device?',
      destructive: true,
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, open: false }));
        try {
          await apiFetch<RemoveDeviceResult>(`/auth/devices/${deviceId}`, { method: 'DELETE' });
          setDevices(devices.filter((d) => d.id !== deviceId));
        } catch {
          /* ignore */
        }
      },
    });
  };

  if (authLoading) return <></>;
  if (!isAuthenticated || !user) return <></>;

  const getDeviceIcon = (type: string) => {
    const cls = 'w-6 h-6 text-white/70';
    switch (type?.toLowerCase()) {
      case 'mobile':
      case 'tablet':
        return (
          <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
          </svg>
        );
      case 'tv':
        return (
          <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 20.25h12m-7.5-3v3m3-3v3m-10.125-3h17.25c.621 0 1.125-.504 1.125-1.125V4.875c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125z" />
          </svg>
        );
      default:
        return (
          <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0H3" />
          </svg>
        );
    }
  };

  return (
    <div
      style={{
        backgroundColor: 'var(--brand-near-black)',
        minHeight: '100vh',
        color: 'var(--text-primary)',
      }}
    >
      <AppHeader />
      <main
        style={{
          paddingTop: 100,
          paddingBottom: 60,
          maxWidth: 700,
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
          <h1 style={{ fontSize: 28, fontWeight: 700 }}>Manage Devices</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
            View and manage devices connected to your account
          </p>
        </div>

        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <div
              style={{
                width: 40,
                height: 40,
                border: '3px solid #18151e',
                borderTopColor: 'var(--brand-orange)',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }}
            />
          </div>
        ) : devices.length === 0 ? (
          <EmptyState
            icon="Smartphone"
            title="No devices found"
            description="No devices are linked to your account"
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {devices.map((device) => (
              <div
                key={device.id}
                className="az-glass"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: 16,
                  borderRadius: 16,
                  border: device.isCurrent ? '1px solid rgba(232, 66, 10, 0.4)' : undefined,
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    backgroundColor: 'var(--bg-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {getDeviceIcon(device.type)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <p style={{ fontWeight: 600, fontSize: 15 }}>{device.name}</p>
                    {device.isCurrent && (
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: 999,
                          fontSize: 11,
                          fontWeight: 600,
                          backgroundColor: 'rgba(232,66,10,0.15)',
                          color: 'var(--brand-orange)',
                          border: '1px solid rgba(232,66,10,0.3)',
                        }}
                      >
                        Current
                      </span>
                    )}
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                    {device.location ? `${device.location} · ` : ''}Last active{' '}
                    {new Date(device.lastActive).toLocaleDateString()}
                  </p>
                </div>
                {!device.isCurrent && (
                  <button
                    onClick={() => handleRemove(device.id)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 999,
                      border: '1px solid var(--brand-red)',
                      background: 'transparent',
                      color: 'var(--brand-red)',
                      fontWeight: 500,
                      fontSize: 13,
                      cursor: 'pointer',
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
      <AppFooter />
      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        destructive={confirmDialog.destructive}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}
      />
    </div>
  );
}
