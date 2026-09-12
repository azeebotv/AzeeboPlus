'use client';
import { useState, useEffect, useRef } from 'react';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { Spinner, ErrorState } from '@azeebo/ui/web';

interface ReferralCode {
  code?: string;
  referralCode?: string;
  link?: string;
  referralLink?: string;
}

interface ReferralStats {
  totalReferrals?: number;
  total?: number;
  successfulReferrals?: number;
  successful?: number;
  pendingReferrals?: number;
  pending?: number;
  totalEarned?: number;
  earned?: number;
}

interface ReferralEntry {
  username?: string;
  email?: string;
  joinedAt?: string;
  createdAt?: string;
  status: string;
}

interface ReferralsList {
  referrals?: ReferralEntry[];
  total?: number;
}

export default function ReferralPage(): React.JSX.Element {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const [copied, setCopied] = useState(false);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    };
  }, []);

  const codeQuery = useQuery({
    queryKey: ['referral', 'code'],
    queryFn: async () => {
      const res = await apiFetch<ReferralCode>('/referrals/code');
      return res.data ?? {};
    },
    staleTime: 300000,
  });

  const statsQuery = useQuery({
    queryKey: ['referral', 'stats'],
    queryFn: async () => {
      const res = await apiFetch<ReferralStats>('/referrals/stats');
      return res.data ?? {};
    },
    staleTime: 60000,
  });

  const referralsQuery = useQuery({
    queryKey: ['referral', 'list'],
    queryFn: async () => {
      const res = await apiFetch<ReferralsList>('/referrals');
      const data = res.data ?? {};
      return Array.isArray(data.referrals)
        ? data.referrals
        : Array.isArray(data as unknown as ReferralEntry[])
          ? (data as unknown as ReferralEntry[])
          : [];
    },
    staleTime: 60000,
  });

  const codeData = codeQuery.data ?? {};
  const statsData = statsQuery.data ?? {};
  const referrals = referralsQuery.data ?? [];

  const referralData = {
    code: String(codeData.code ?? codeData.referralCode ?? ''),
    link: String(codeData.link ?? codeData.referralLink ?? ''),
    totalReferrals: Number(statsData.totalReferrals ?? statsData.total ?? referrals.length ?? 0),
    successfulReferrals: Number(statsData.successfulReferrals ?? statsData.successful ?? 0),
    pendingReferrals: Number(statsData.pendingReferrals ?? statsData.pending ?? 0),
    totalEarned: Number(statsData.totalEarned ?? statsData.earned ?? 0),
    referrals,
  };

  const isLoading =
    authLoading || codeQuery.isLoading || statsQuery.isLoading || referralsQuery.isLoading;
  const error =
    codeQuery.error?.message || statsQuery.error?.message || referralsQuery.error?.message || null;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(referralData.link);
      setCopied(true);
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
      copiedTimerRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  if (authLoading) return <></>;
  if (!isAuthenticated || !user) return <></>;

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
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700 }}>Refer & Earn</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
            Invite friends and earn rewards
          </p>
        </div>

        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <Spinner size="lg" color="#E8420A" />
          </div>
        ) : error ? (
          <ErrorState
            title="Failed to load referral data"
            description={error}
            buttonText="Retry"
            onButtonPress={() => {
              codeQuery.refetch();
              statsQuery.refetch();
              referralsQuery.refetch();
            }}
          />
        ) : (
          <>
            {/* Referral code card */}
            <div
              className="az-glass"
              style={{
                padding: 32,
                borderRadius: 20,
                textAlign: 'center',
                marginBottom: 24,
                background:
                  'linear-gradient(135deg, rgba(232,66,10,0.15) 0%, rgba(204,28,28,0.1) 100%)',
              }}
            >
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 8 }}>
                Your Referral Code
              </p>
              <p
                style={{
                  fontSize: 32,
                  fontWeight: 700,
                  color: 'var(--brand-orange)',
                  letterSpacing: 4,
                  marginBottom: 16,
                }}
              >
                {referralData.code}
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button
                  onClick={copyToClipboard}
                  className="az-btn-primary flex items-center justify-center gap-2"
                  style={{
                    padding: '12px 32px',
                    borderRadius: 999,
                    border: 'none',
                    background:
                      'linear-gradient(135deg, var(--brand-orange) 0%, var(--brand-red) 100%)',
                    color: 'var(--brand-white)',
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: 'pointer',
                  }}
                >
                  {copied ? (
                    <>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4.5 12.75l6 6 9-13.5"
                        />
                      </svg>
                      Copied!
                    </>
                  ) : (
                    'Copy Link'
                  )}
                </button>
                <button
                  onClick={() => {
                    if (navigator.share)
                      navigator.share({ title: 'Join Azeebo+', url: referralData.link });
                  }}
                  style={{
                    padding: '12px 32px',
                    borderRadius: 999,
                    border: '1px solid var(--border-default)',
                    background: 'transparent',
                    color: 'var(--text-secondary)',
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: 'pointer',
                  }}
                >
                  Share
                </button>
              </div>
            </div>

            {/* Stats */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 16,
                marginBottom: 24,
              }}
            >
              {[
                {
                  label: 'Total Referrals',
                  value: String(referralData.totalReferrals ?? 0),
                  color: 'var(--brand-orange)',
                },
                {
                  label: 'Successful',
                  value: String(referralData.successfulReferrals ?? 0),
                  color: 'var(--brand-forest)',
                },
                {
                  label: 'Earned',
                  value: `₦${(referralData.totalEarned ?? 0).toLocaleString()}`,
                  color: 'var(--color-warning-500)',
                },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="az-glass"
                  style={{ padding: 20, borderRadius: 16, textAlign: 'center' }}
                >
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>
                    {stat.label}
                  </p>
                  <p style={{ fontSize: 22, fontWeight: 700, color: stat.color }}>{stat.value}</p>
                </div>
              ))}
            </div>

            {/* How it works */}
            <div className="az-glass" style={{ padding: 24, borderRadius: 20, marginBottom: 24 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>How It Works</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[
                  { step: '1', text: 'Share your referral link with friends' },
                  { step: '2', text: 'They sign up using your link' },
                  { step: '3', text: 'Both of you earn rewards when they subscribe' },
                ].map((item) => (
                  <div key={item.step} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background:
                          'linear-gradient(135deg, var(--brand-orange) 0%, var(--brand-red) 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: 14,
                        flexShrink: 0,
                      }}
                    >
                      {item.step}
                    </div>
                    <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{item.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Referral list */}
            {referralData.referrals.length > 0 && (
              <div className="az-glass" style={{ padding: 24, borderRadius: 20 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Your Referrals</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {referralData.referrals.map((ref: ReferralEntry, i: number) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 0',
                        borderBottom: '1px solid #18151e',
                      }}
                    >
                      <div>
                        <p style={{ fontWeight: 600, fontSize: 14 }}>{ref.username || ref.email}</p>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                          {new Date(ref.joinedAt || ref.createdAt || '').toLocaleDateString()}
                        </p>
                      </div>
                      <span
                        style={{
                          padding: '3px 10px',
                          borderRadius: 999,
                          fontSize: 11,
                          fontWeight: 600,
                          backgroundColor:
                            ref.status === 'completed'
                              ? 'rgba(13,59,46,0.2)'
                              : 'rgba(245,158,11,0.2)',
                          color:
                            ref.status === 'completed'
                              ? 'var(--brand-forest)'
                              : 'var(--color-warning-500)',
                        }}
                      >
                        {ref.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
      <AppFooter />
    </div>
  );
}
