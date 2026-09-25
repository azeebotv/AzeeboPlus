'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';
import PageShell from '@/components/layout/PageShell';
import PageHero from '@/components/layout/PageHero';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { Smartphone, Tablet, Tv, Laptop, ArrowLeft, Trash2, ShieldCheck } from 'lucide-react';

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
      title: 'Remove Device Session',
      message: 'Are you sure you want to sign out and disconnect this device? It will require re-authentication to stream again.',
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
    switch (type?.toLowerCase()) {
      case 'mobile':
        return <Smartphone size={22} />;
      case 'tablet':
        return <Tablet size={22} />;
      case 'tv':
        return <Tv size={22} />;
      default:
        return <Laptop size={22} />;
    }
  };

  return (
    <PageShell activeNav="Profile">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-6">
        <Link
          href="/settings"
          className="inline-flex items-center gap-2 text-xs font-bold text-white/50 hover:text-white transition-colors mb-6 group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Settings</span>
        </Link>
      </div>

      <PageHero
        badge="Session Security"
        title="Registered Devices"
        subtitle="Manage authorized streaming devices and revoke active sessions on lost or shared hardware."
        accentColor="orange"
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-20">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold text-white/60 uppercase tracking-wider">
            Connected Screens ({devices.length})
          </span>
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
            <ShieldCheck size={14} />
            <span>End-to-End Encrypted Session Tokens</span>
          </div>
        </div>

        {isLoading ? (
          <div className="az-glass rounded-3xl p-12 text-center border border-white/10">
            <div className="w-10 h-10 rounded-full border-2 border-orange-500/20 border-t-orange-500 animate-spin mx-auto mb-3" />
            <p className="text-white/60 text-sm">Querying active sessions...</p>
          </div>
        ) : devices.length === 0 ? (
          <div className="az-glass rounded-3xl p-10 border border-white/10 text-center">
            <EmptyState
              icon="Smartphone"
              title="No devices found"
              description="No authorized devices are currently connected to your Azeebo account."
              dark
            />
          </div>
        ) : (
          <div className="space-y-3">
            {devices.map((device) => (
              <div
                key={device.id}
                className={`az-glass p-5 rounded-2xl flex items-center justify-between gap-4 transition-all border ${
                  device.isCurrent
                    ? 'border-orange-500/40 bg-orange-500/[0.04] shadow-lg shadow-orange-500/5'
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 border ${
                      device.isCurrent
                        ? 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                        : 'bg-white/5 text-white/60 border-white/10'
                    }`}
                  >
                    {getDeviceIcon(device.type)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-white text-sm truncate">{device.name}</p>
                      {device.isCurrent && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-orange-500/15 text-orange-400 border border-orange-500/30">
                          Current Device
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-white/40 mt-0.5 truncate">
                      {device.location ? `${device.location} • ` : ''}Last active{' '}
                      {new Date(device.lastActive).toLocaleDateString('en-NG', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>

                {!device.isCurrent && (
                  <button
                    type="button"
                    onClick={() => handleRemove(device.id)}
                    className="p-2.5 rounded-xl text-white/40 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all flex items-center gap-1.5 text-xs font-semibold"
                    title="Sign out device"
                  >
                    <Trash2 size={15} />
                    <span className="hidden sm:inline">Revoke</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        destructive={confirmDialog.destructive}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}
      />
    </PageShell>
  );
}

