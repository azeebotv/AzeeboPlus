'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api, apiFetch } from '@/lib/api';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';

export default function MonetizationPage(): React.JSX.Element {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const [monetization, setMonetization] = useState({
    eligibility: { isEligible: false, requirements: [] as string[] },
    earnings: { totalEarned: 0, pendingPayout: 0, paidOut: 0 },
    settings: { enableSuperTips: false, enableSponsoredContent: false, minPayoutAmount: 5000 },
  });

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push('/auth/login');
      return;
    }
    loadMonetization();
  }, [isAuthenticated, user, router]);

  const loadMonetization = async () => {
    try {
      const response = await api.creator.getStats();
      if (response.success && response.data) {
        const d = response.data as any;
        setMonetization({
          eligibility: {
            isEligible: d.totalEarnings > 0,
            requirements: d.totalViews < 1000 ? ['Reach 1,000 views'] : [],
          },
          earnings: {
            totalEarned: d.totalEarnings || 0,
            pendingPayout: d.pendingEarnings || 0,
            paidOut: 0,
          },
          settings: { enableSuperTips: true, enableSponsoredContent: false, minPayoutAmount: 5000 },
        });
      }
    } catch {
      /* ignore */
    }
  };

  if (!isAuthenticated || !user) return <></>;

  return (
    <div style={{ backgroundColor: '#1A0A0A', minHeight: '100vh', color: '#F5F0EB' }}>
      <AppHeader />
      <main
        style={{
          paddingTop: 100,
          paddingBottom: 60,
          maxWidth: 800,
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
              color: '#9A8A7A',
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
          <h1 style={{ fontSize: 28, fontWeight: 700 }}>Monetization</h1>
          <p style={{ color: '#9A8A7A', marginTop: 4 }}>
            Manage your earnings and monetization settings
          </p>
        </div>

        {/* Eligibility */}
        <div className="az-glass" style={{ padding: 24, borderRadius: 20, marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Eligibility Status</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: monetization.eligibility.isEligible
                  ? 'rgba(13,59,46,0.3)'
                  : 'rgba(204,28,28,0.2)',
              }}
            >
              {monetization.eligibility.isEligible ? '✅' : '⏳'}
            </div>
            <div>
              <h3 style={{ fontWeight: 600 }}>
                {monetization.eligibility.isEligible
                  ? 'Eligible for Monetization'
                  : 'Not Yet Eligible'}
              </h3>
              <p style={{ color: '#9A8A7A', fontSize: 13 }}>
                Meet all requirements to unlock earning features
              </p>
            </div>
          </div>
          {monetization.eligibility.requirements.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {monetization.eligibility.requirements.map((req, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 14,
                    color: '#9A8A7A',
                  }}
                >
                  <span style={{ color: '#CC1C1C' }}>○</span> {req}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Earnings Overview */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 16,
            marginBottom: 20,
          }}
        >
          {[
            {
              label: 'Total Earned',
              value: `₦${monetization.earnings.totalEarned.toLocaleString()}`,
              color: '#E8420A',
            },
            {
              label: 'Pending Payout',
              value: `₦${monetization.earnings.pendingPayout.toLocaleString()}`,
              color: '#F59E0B',
            },
            {
              label: 'Paid Out',
              value: `₦${monetization.earnings.paidOut.toLocaleString()}`,
              color: '#0D3B2E',
            },
          ].map((item, i) => (
            <div
              key={i}
              className="az-glass"
              style={{ padding: 20, borderRadius: 16, textAlign: 'center' }}
            >
              <p style={{ fontSize: 13, color: '#9A8A7A', marginBottom: 8 }}>{item.label}</p>
              <p style={{ fontSize: 22, fontWeight: 700, color: item.color }}>{item.value}</p>
            </div>
          ))}
        </div>

        {/* Settings */}
        <div className="az-glass" style={{ padding: 24, borderRadius: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Monetization Settings</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              {
                key: 'enableSuperTips',
                label: 'Super Tips',
                desc: 'Allow viewers to send paid tips on your content',
              },
              {
                key: 'enableSponsoredContent',
                label: 'Sponsored Content',
                desc: 'Allow brands to sponsor your content',
              },
            ].map((setting) => (
              <div
                key={setting.key}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 0',
                  borderBottom: '1px solid #2A1A1A',
                }}
              >
                <div>
                  <h4 style={{ fontWeight: 600, fontSize: 15 }}>{setting.label}</h4>
                  <p style={{ color: '#9A8A7A', fontSize: 13, marginTop: 2 }}>{setting.desc}</p>
                </div>
                <button
                  onClick={async () => {
                    const newValue =
                      !monetization.settings[setting.key as keyof typeof monetization.settings];
                    setMonetization({
                      ...monetization,
                      settings: {
                        ...monetization.settings,
                        [setting.key]: newValue,
                      },
                    });
                    try {
                      await apiFetch('/v1/creators/monetization/settings', {
                        method: 'PUT',
                        body: JSON.stringify({ [setting.key]: newValue }),
                      });
                    } catch {
                      // Revert on failure
                      setMonetization({
                        ...monetization,
                        settings: {
                          ...monetization.settings,
                          [setting.key]: !newValue,
                        },
                      });
                    }
                  }}
                  style={{
                    width: 48,
                    height: 28,
                    borderRadius: 14,
                    border: 'none',
                    cursor: 'pointer',
                    position: 'relative',
                    backgroundColor: monetization.settings[
                      setting.key as keyof typeof monetization.settings
                    ]
                      ? '#E8420A'
                      : '#2A1A1A',
                    transition: 'background-color 0.2s',
                  }}
                >
                  <span
                    style={{
                      position: 'absolute',
                      top: 3,
                      left: monetization.settings[setting.key as keyof typeof monetization.settings]
                        ? 23
                        : 3,
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
      </main>
      <AppFooter />
    </div>
  );
}
