'use client';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { api, apiFetch } from '@/lib/api';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { Skeleton, ErrorState } from '@azeebo/ui/web';

interface MonetizationData {
  eligibility: { isEligible: boolean; requirements: string[] };
  earnings: { totalEarned: number; pendingPayout: number; paidOut: number };
  settings: { enableSuperTips: boolean; enableSponsoredContent: boolean; minPayoutAmount: number };
}

export default function MonetizationPage(): React.JSX.Element {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEnabled = !authLoading && !!isAuthenticated && !!user;

  const {
    data: monetization,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['creator', 'monetization'],
    queryFn: async () => {
      const response = await api.creator.getStats();
      if (response.success && response.data) {
        const d = response.data as {
          totalEarnings?: number;
          totalViews?: number;
          pendingEarnings?: number;
        };
        return {
          eligibility: {
            isEligible: (d.totalEarnings || 0) > 0,
            requirements: (d.totalViews || 0) < 1000 ? ['Reach 1,000 views'] : [],
          },
          earnings: {
            totalEarned: d.totalEarnings || 0,
            pendingPayout: d.pendingEarnings || 0,
            paidOut: 0,
          },
          settings: { enableSuperTips: true, enableSponsoredContent: false, minPayoutAmount: 5000 },
        } as MonetizationData;
      }
      return {
        eligibility: { isEligible: false, requirements: [] },
        earnings: { totalEarned: 0, pendingPayout: 0, paidOut: 0 },
        settings: { enableSuperTips: false, enableSponsoredContent: false, minPayoutAmount: 5000 },
      } as MonetizationData;
    },
    enabled: isEnabled,
  });

  const toggleSetting = useMutation({
    mutationFn: ({ key, value }: { key: string; value: boolean }) =>
      apiFetch('/v1/creators/monetization/settings', {
        method: 'PUT',
        body: JSON.stringify({ [key]: value }),
      }),
    onMutate: async ({ key, value }) => {
      await queryClient.cancelQueries({ queryKey: ['creator', 'monetization'] });
      const previous = queryClient.getQueryData<MonetizationData>(['creator', 'monetization']);
      if (previous) {
        queryClient.setQueryData<MonetizationData>(['creator', 'monetization'], {
          ...previous,
          settings: { ...previous.settings, [key]: value },
        });
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['creator', 'monetization'], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['creator', 'monetization'] });
    },
  });

  if (authLoading) return <></>;
  if (!isAuthenticated || !user) return <></>;

  if (isLoading) {
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
            maxWidth: 800,
            margin: '0 auto',
            padding: '100px 24px 60px',
          }}
        >
          <div style={{ marginBottom: 32 }}>
            <Skeleton width="120px" height="20px" className="mb-4" />
            <Skeleton width="200px" height="32px" />
          </div>
          <div className="az-glass" style={{ padding: 24, borderRadius: 20, marginBottom: 20 }}>
            <Skeleton width="180px" height="20px" className="mb-4" />
            <Skeleton width="100%" height="60px" borderRadius="12px" />
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 16,
              marginBottom: 20,
            }}
          >
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="az-glass" style={{ padding: 20, borderRadius: 16 }}>
                <Skeleton width="80px" height="14px" className="mb-2" />
                <Skeleton width="100px" height="24px" />
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (error || !monetization) {
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
            maxWidth: 800,
            margin: '0 auto',
            padding: '100px 24px 60px',
          }}
        >
          <ErrorState
            title="Failed to load monetization"
            description="Please try again later"
            onButtonPress={() => router.refresh()}
          />
        </main>
      </div>
    );
  }

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
          <h1 style={{ fontSize: 28, fontWeight: 700 }}>Monetization</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
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
              {monetization.eligibility.isEligible ? 'CheckCircle' : 'Hourglass'}
            </div>
            <div>
              <h3 style={{ fontWeight: 600 }}>
                {monetization.eligibility.isEligible
                  ? 'Eligible for Monetization'
                  : 'Not Yet Eligible'}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
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
                    color: 'var(--text-secondary)',
                  }}
                >
                  <span style={{ color: 'var(--brand-red)' }}>○</span> {req}
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
              color: 'var(--brand-orange)',
            },
            {
              label: 'Pending Payout',
              value: `₦${monetization.earnings.pendingPayout.toLocaleString()}`,
              color: 'var(--color-warning-500)',
            },
            {
              label: 'Paid Out',
              value: `₦${monetization.earnings.paidOut.toLocaleString()}`,
              color: 'var(--brand-forest)',
            },
          ].map((item, i) => (
            <div
              key={i}
              className="az-glass"
              style={{ padding: 20, borderRadius: 16, textAlign: 'center' }}
            >
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>
                {item.label}
              </p>
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
                  borderBottom: '1px solid #18151e',
                }}
              >
                <div>
                  <h4 style={{ fontWeight: 600, fontSize: 15 }}>{setting.label}</h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 2 }}>
                    {setting.desc}
                  </p>
                </div>
                <button
                  onClick={() => {
                    const newValue =
                      !monetization.settings[setting.key as keyof typeof monetization.settings];
                    toggleSetting.mutate({ key: setting.key, value: newValue });
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
                      ? 'var(--brand-orange)'
                      : 'var(--bg-secondary)',
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
                      backgroundColor: 'white',
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
