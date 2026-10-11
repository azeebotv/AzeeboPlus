'use client';

import { useState, useEffect, useCallback } from 'react';
import { Handshake, Lightbulb, Star } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { Alert } from '@/components/auth/FormBits';
import { PageHero } from '@/components/layout/PageHero';
import { PageShell } from '@/components/layout/PageShell';

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
        method: 'PATCH',
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
      <PageShell maxWidth="sm">
        <div className="az-body py-12 text-center text-az-ink-muted">Loading settings...</div>
      </PageShell>
    );
  }

  const toggleTrack =
    'h-6 w-11 rounded-full bg-az-ink/20 peer peer-checked:bg-az-scarlet peer-focus:ring-2 peer-focus:ring-az-scarlet/30 peer-checked:after:translate-x-full after:content-[""] after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:bg-az-ink after:transition-all';

  return (
    <PageShell maxWidth="sm" className="pb-16">
      <PageHero
        title="Monetization Settings"
        eyebrow="Creators"
        description="Configure how you earn from your content"
      />

      {error && <Alert>{error}</Alert>}

      {settings && (
        <div className={`space-y-6 ${error ? 'mt-6' : ''}`}>
          {/* Tips */}
          <div className="az-glass p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="az-subtitle flex items-center gap-2 text-az-ink">
                <Lightbulb className="size-5 text-az-flame" aria-hidden="true" />
                Tips
              </h2>
              <label className="relative inline-flex cursor-pointer items-center">
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
                <div className={toggleTrack}></div>
              </label>
            </div>

            {settings.tipsEnabled && (
              <div className="space-y-4">
                <div>
                  <label className="az-caption mb-1 block text-az-ink-muted">
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
                    className="az-input"
                    min={100}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Subscriptions */}
          <div className="az-glass p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="az-subtitle flex items-center gap-2 text-az-ink">
                <Star className="size-5 text-az-flame" aria-hidden="true" />
                Subscriptions
              </h2>
              <label className="relative inline-flex cursor-pointer items-center">
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
                <div className={toggleTrack}></div>
              </label>
            </div>

            {settings.subscriptionsEnabled && (
              <div className="space-y-4">
                <div>
                  <label className="az-caption mb-1 block text-az-ink-muted">
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
                    className="az-input"
                    min={500}
                  />
                </div>
                <div>
                  <label className="az-caption mb-1 block text-az-ink-muted">
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
                    className="az-input h-24 resize-none"
                    placeholder="Early access&#10;Exclusive content&#10;Behind the scenes"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Sponsorship */}
          <div className="az-glass p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="az-subtitle flex items-center gap-2 text-az-ink">
                <Handshake className="size-5 text-az-flame" aria-hidden="true" />
                Sponsorships
              </h2>
              <label className="relative inline-flex cursor-pointer items-center">
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
                <div className={toggleTrack}></div>
              </label>
            </div>

            {settings.sponsorshipEnabled && (
              <p className="az-body text-az-ink-muted">
                Sponsorship requests will be reviewed by our team. You&apos;ll be notified when
                brands want to work with you.
              </p>
            )}
          </div>

          {/* Save button */}
          <button onClick={handleSave} disabled={saving} className="az-btn-primary">
            {saving ? 'Saving...' : success ? 'Check Saved!' : 'Save Settings'}
          </button>
        </div>
      )}
    </PageShell>
  );
}
