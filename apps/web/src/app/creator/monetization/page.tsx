'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { webLogger } from '@/lib/logger';

interface MonetizationSettings {
  isMonetizationEnabled: boolean;
  isSubscriptionEnabled: boolean;
  subscriptionPrice: number;
  isTipEnabled: boolean;
  minimumTip: number;
  isAdEnabled: boolean;
  adRevenueShare: number;
  payoutMethod: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
}

export default function MonetizationSettingsPage(): JSX.Element {
  const router = useRouter();
  const [settings, setSettings] = useState<MonetizationSettings | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async (): Promise<void> => {
    try {
      const result = await apiFetch<MonetizationSettings>('/v1/creator/monetization');

      if (result.success && result.data) {
        setSettings(result.data);
      }
    } catch (error) {
      webLogger.error('Failed to load monetization settings', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (): Promise<void> => {
    if (!settings) return;

    setIsSaving(true);
    try {
      const result = await apiFetch('/v1/creator/monetization', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });

      if (!result.success) {
        throw new Error(result.message || 'Failed to update settings');
      }

      alert('Monetization settings updated successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update settings';
      alert(message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-foreground mb-4">Failed to load settings</p>
          <button
            onClick={loadSettings}
            className="px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <button
              onClick={() => router.back()}
              className="text-muted-foreground hover:text-foreground mb-2 flex items-center gap-2"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <h1 className="text-3xl font-bold text-foreground">Monetization Settings</h1>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-card rounded-lg border border-border p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">General</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Enable Monetization</p>
                <p className="text-sm text-muted-foreground">Turn on monetization for your content</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.isMonetizationEnabled}
                  onChange={(e) => setSettings({ ...settings, isMonetizationEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">Subscriptions</h2>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-medium text-foreground">Enable Subscriptions</p>
                <p className="text-sm text-muted-foreground">Allow users to subscribe to your content</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.isSubscriptionEnabled}
                  onChange={(e) => setSettings({ ...settings, isSubscriptionEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
            {settings.isSubscriptionEnabled && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Subscription Price (₦)
                </label>
                <input
                  type="number"
                  value={settings.subscriptionPrice}
                  onChange={(e) => setSettings({ ...settings, subscriptionPrice: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-foreground"
                  placeholder="Enter price"
                />
              </div>
            )}
          </div>

          <div className="bg-card rounded-lg border border-border p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">Tips</h2>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-medium text-foreground">Enable Tips</p>
                <p className="text-sm text-muted-foreground">Allow users to tip your content</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.isTipEnabled}
                  onChange={(e) => setSettings({ ...settings, isTipEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
            {settings.isTipEnabled && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Minimum Tip (₦)
                </label>
                <input
                  type="number"
                  value={settings.minimumTip}
                  onChange={(e) => setSettings({ ...settings, minimumTip: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-foreground"
                  placeholder="Enter minimum tip"
                />
              </div>
            )}
          </div>

          <div className="bg-card rounded-lg border border-border p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">Ads</h2>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-medium text-foreground">Enable Ads</p>
                <p className="text-sm text-muted-foreground">Show ads on your content</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.isAdEnabled}
                  onChange={(e) => setSettings({ ...settings, isAdEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
            {settings.isAdEnabled && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Revenue Share (%)
                </label>
                <input
                  type="number"
                  value={settings.adRevenueShare}
                  onChange={(e) => setSettings({ ...settings, adRevenueShare: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-foreground"
                  placeholder="Enter revenue share"
                />
              </div>
            )}
          </div>

          <div className="bg-card rounded-lg border border-border p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">Payout Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Bank Name
                </label>
                <input
                  type="text"
                  value={settings.bankName}
                  onChange={(e) => setSettings({ ...settings, bankName: e.target.value })}
                  className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-foreground"
                  placeholder="Enter bank name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Account Number
                </label>
                <input
                  type="text"
                  value={settings.accountNumber}
                  onChange={(e) => setSettings({ ...settings, accountNumber: e.target.value })}
                  className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-foreground"
                  placeholder="Enter account number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Account Name
                </label>
                <input
                  type="text"
                  value={settings.accountName}
                  onChange={(e) => setSettings({ ...settings, accountName: e.target.value })}
                  className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-foreground"
                  placeholder="Enter account name"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
