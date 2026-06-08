'use client';
import React, { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { webLogger } from '@/lib/logger';

interface Device {
  id: string;
  name: string;
  type: string;
  os: string;
  browser: string;
  lastActive: string;
  location: string;
  isCurrent: boolean;
  ip: string;
}

export default function DeviceManagementPage(): JSX.Element {
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async (): Promise<void> => {
    try {
      const result = await apiFetch<Device[]>('/v1/auth/devices');

      if (result.success && result.data) {
        setDevices(result.data);
      }
    } catch (error) {
      webLogger.error('Failed to load devices', error);
    } finally {
      setIsLoading(false);
    }
  };

  const revokeDevice = async (deviceId: string): Promise<void> => {
    try {
      const result = await apiFetch<unknown>(`/v1/auth/devices/${deviceId}`, {
        method: 'DELETE',
      });

      if (result.success) {
        setDevices(devices.filter((d) => d.id !== deviceId));
      }
    } catch (error) {
      webLogger.error('Failed to revoke device', error);
    }
  };

  const getDeviceIcon = (type: string): string => {
    switch (type) {
      case 'mobile': return '📱';
      case 'desktop': return '💻';
      case 'tablet': return '📟';
      default: return '🖥️';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading devices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Device Management</h1>
          <p className="text-muted-foreground">Manage your active sessions and devices</p>
        </div>

        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-6">
          <p className="text-yellow-500 text-sm">
            🔒 For your security, review all active devices regularly. Revoke access for any device you don't recognize.
          </p>
        </div>

        <div className="space-y-4">
          {devices.map((device) => (
            <div
              key={device.id}
              className={`bg-card rounded-lg border p-6 ${
                device.isCurrent ? 'border-primary' : 'border-border'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <span className="text-4xl">{getDeviceIcon(device.type)}</span>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-bold text-foreground">{device.name}</h3>
                      {device.isCurrent && (
                        <span className="bg-primary/20 text-primary text-xs font-semibold px-2 py-1 rounded-full">
                          Current Device
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">
                      {device.os} • {device.browser}
                    </p>
                    <p className="text-sm text-muted-foreground mb-1">
                      Last active: {new Date(device.lastActive).toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Location: {device.location} • IP: {device.ip}
                    </p>
                  </div>
                </div>
                {!device.isCurrent && (
                  <button
                    onClick={() => revokeDevice(device.id)}
                    className="px-4 py-2 bg-red-500/20 text-red-500 rounded-lg font-semibold hover:bg-red-500/30"
                  >
                    Revoke Access
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {devices.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🖥️</div>
            <h2 className="text-xl font-bold text-foreground mb-2">No devices found</h2>
            <p className="text-muted-foreground">Your active sessions will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
}
