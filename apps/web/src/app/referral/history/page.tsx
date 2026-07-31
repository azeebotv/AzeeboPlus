'use client';
import { useQuery } from '@tanstack/react-query';

export const metadata = {
  title: 'Referral History | Azeebo',
  description: 'Track your referrals, earnings, and referral history on Azeebo.',
  openGraph: {
    title: 'Referral History | Azeebo',
    description: 'Track your referrals, earnings, and referral history on Azeebo.',
  },
};
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { Spinner, ErrorState } from '@azeebo/ui/web';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';

interface ReferralEntry {
  id?: string;
  username?: string;
  email?: string;
  displayName?: string;
  joinedAt?: string;
  createdAt?: string;
  status: string;
  earningsGenerated?: number;
  reward?: number;
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
  totalEarnings?: number;
}

interface ReferralCode {
  code?: string;
  referralCode?: string;
  link?: string;
  referralLink?: string;
}

interface ReferralsList {
  referrals?: ReferralEntry[];
  total?: number;
}

export default function ReferralHistoryPage(): React.JSX.Element {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const [copied, setCopied] = useState(false);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    };
  }, []);

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

  const codeQuery = useQuery({
    queryKey: ['referral', 'code'],
    queryFn: async () => {
      const res = await apiFetch<ReferralCode>('/referrals/code');
      return res.data ?? {};
    },
    staleTime: 300000,
  });

  const statsData = statsQuery.data ?? {};
  const referrals = referralsQuery.data ?? [];
  const codeData = codeQuery.data ?? {};

  const totalReferrals = Number(
    statsData.totalReferrals ?? statsData.total ?? referrals.length ?? 0
  );
  const totalEarned = Number(
    statsData.totalEarned ?? statsData.earned ?? statsData.totalEarnings ?? 0
  );
  const referralLink = String(codeData.link ?? codeData.referralLink ?? '');

  const isLoading =
    authLoading || statsQuery.isLoading || referralsQuery.isLoading || codeQuery.isLoading;
  const error =
    statsQuery.error?.message || referralsQuery.error?.message || codeQuery.error?.message || null;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
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
          maxWidth: 700,
          margin: '0 auto',
          padding: '100px 24px 60px',
        }}
      >
        <div style={{ marginBottom: 24 }}>
          <Link
            href="/referral"
            style={{ color: 'var(--text-secondary)', fontSize: 14, textDecoration: 'none' }}
          >
            &larr; Back to Referral
          </Link>
        </div>

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700 }}>Referral History</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
            Track your referrals and earnings
          </p>
        </div>

        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <Spinner size="lg" color="#E8420A" />
          </div>
        ) : error ? (
          <ErrorState
            title="Failed to load referral history"
            description={error}
            buttonText="Retry"
            onButtonPress={() => {
              statsQuery.refetch();
              referralsQuery.refetch();
            }}
          />
        ) : (
          <>
            {/* Stats summary */}
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
                  value: String(totalReferrals),
                  color: 'var(--brand-orange)',
                },
                {
                  label: 'Total Earned',
                  value: `₦${totalEarned.toLocaleString()}`,
                  color: 'var(--color-success-500)',
                },
                {
                  label: 'Pending',
                  value: String(statsData.pendingReferrals ?? statsData.pending ?? 0),
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

            {/* Share code */}
            <div
              className="az-glass"
              style={{
                padding: 24,
                borderRadius: 20,
                textAlign: 'center',
                marginBottom: 24,
              }}
            >
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 8 }}>
                Share your referral code
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button
                  onClick={copyToClipboard}
                  style={{
                    padding: '10px 28px',
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
                  {copied ? '✓ Copied!' : 'Copy Link'}
                </button>
                <button
                  onClick={() => {
                    if (navigator.share)
                      navigator.share({ title: 'Join Azeebo+', url: referralLink });
                  }}
                  style={{
                    padding: '10px 28px',
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

            {/* Referral list */}
            <div className="az-glass" style={{ padding: 24, borderRadius: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>All Referrals</h2>
              {referrals.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40 }}>
                  <p style={{ fontSize: 32, marginBottom: 12 }}>👥</p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>No referrals yet</p>
                  <p style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>
                    Share your code to start earning
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {referrals.map((ref: ReferralEntry, i: number) => (
                    <div
                      key={ref.id || i}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px 0',
                        borderBottom: '1px solid #2A1A1A',
                      }}
                    >
                      <div>
                        <p style={{ fontWeight: 600, fontSize: 14 }}>
                          {ref.displayName || ref.username || ref.email}
                        </p>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                          Joined{' '}
                          {new Date(ref.joinedAt || ref.createdAt || '').toLocaleDateString()}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span
                          style={{
                            padding: '3px 10px',
                            borderRadius: 999,
                            fontSize: 11,
                            fontWeight: 600,
                            backgroundColor:
                              ref.status === 'completed' || ref.status === 'rewarded'
                                ? 'rgba(34,197,94,0.15)'
                                : ref.status === 'active'
                                  ? 'rgba(232,66,10,0.15)'
                                  : 'rgba(245,158,11,0.15)',
                            color:
                              ref.status === 'completed' || ref.status === 'rewarded'
                                ? 'var(--color-success-500)'
                                : ref.status === 'active'
                                  ? 'var(--brand-orange)'
                                  : 'var(--color-warning-500)',
                          }}
                        >
                          {ref.status}
                        </span>
                        {(ref.earningsGenerated ?? ref.reward ?? 0) > 0 && (
                          <p
                            style={{
                              color: 'var(--color-success-500)',
                              fontSize: 12,
                              marginTop: 4,
                              fontWeight: 600,
                            }}
                          >
                            +₦{(ref.earningsGenerated ?? ref.reward ?? 0).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
      <AppFooter />
    </div>
  );
}
