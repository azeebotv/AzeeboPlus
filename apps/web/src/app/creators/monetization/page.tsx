'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';

/**
 * Creator Monetization Settings (TAA §68)
 * Manage tipping, subscriptions, and monetization preferences.
 */

interface MonetizationSettings {
  tipsEnabled: boolean;
  minimumTipAmount: number;
  customTipAmounts: number[];
  subscriptionsEnabled: boolean;
  subscriptionPrice: number;
  subscriptionBenefits: string[];
  adRevenueShare: number;
  sponsorshipEnabled: boolean;
}

export default function CreatorMonetizationPage() {
  const [settings, setSettings] = useState<MonetizationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiFetch<MonetizationSettings>(
        '/api/v1/creator/monetization/settings'
      );
      if (response.success && response.data) {
        setSettings(response.data);
      }
    } catch {
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    setSuccess(false);
    try {
      await apiFetch('/api/v1/creator/monetization/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-2xl mx-auto text-center py-12 text-muted-foreground">
          Loading settings...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Monetization Settings</h1>
          <p className="text-muted-foreground mt-2">Configure how you earn from your content</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {settings && (
          <div className="space-y-6">
            {/* Tips */}
            <div className="bg-card rounded-xl border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-foreground">LightbulbTips</h2>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.tipsEnabled}
                    onChange={(e) =>
                      setSettings((prev) =>
                        prev ? { ...prev, tipsEnabled: e.target.checked } : prev
                      )
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {settings.tipsEnabled && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">
                      Minimum tip amount (NGN)
                    </label>
                    <input
                      type="number"
                      value={settings.minimumTipAmount}
                      onChange={(e) =>
                        setSettings((prev) =>
                          prev ? { ...prev, minimumTipAmount: Number(e.target.value) } : prev
                        )
                      }
                      className="w-full px-4 py-2 bg-background border rounded-lg text-foreground"
                      min={100}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Subscriptions */}
            <div className="bg-card rounded-xl border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-foreground">StarSubscriptions</h2>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.subscriptionsEnabled}
                    onChange={(e) =>
                      setSettings((prev) =>
                        prev ? { ...prev, subscriptionsEnabled: e.target.checked } : prev
                      )
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {settings.subscriptionsEnabled && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">
                      Monthly price (NGN)
                    </label>
                    <input
                      type="number"
                      value={settings.subscriptionPrice}
                      onChange={(e) =>
                        setSettings((prev) =>
                          prev ? { ...prev, subscriptionPrice: Number(e.target.value) } : prev
                        )
                      }
                      className="w-full px-4 py-2 bg-background border rounded-lg text-foreground"
                      min={500}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">
                      Benefits (one per line)
                    </label>
                    <textarea
                      value={settings.subscriptionBenefits.join('\n')}
                      onChange={(e) =>
                        setSettings((prev) =>
                          prev
                            ? {
                                ...prev,
                                subscriptionBenefits: e.target.value.split('\n').filter(Boolean),
                              }
                            : prev
                        )
                      }
                      className="w-full px-4 py-2 bg-background border rounded-lg text-foreground h-24 resize-none"
                      placeholder="Early access&#10;Exclusive content&#10;Behind the scenes"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Sponsorship */}
            <div className="bg-card rounded-xl border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-foreground">HandshakeSponsorships</h2>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.sponsorshipEnabled}
                    onChange={(e) =>
                      setSettings((prev) =>
                        prev ? { ...prev, sponsorshipEnabled: e.target.checked } : prev
                      )
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {settings.sponsorshipEnabled && (
                <p className="text-sm text-muted-foreground">
                  Sponsorship requests will be reviewed by our team. You&apos;ll be notified when
                  brands want to work with you.
                </p>
              )}
            </div>

            {/* Save button */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-muted text-white py-3 px-6 rounded-xl font-medium transition-colors"
            >
              {saving ? 'Saving...' : success ? 'Check Saved!' : 'Save Settings'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
