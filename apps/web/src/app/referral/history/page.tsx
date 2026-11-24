'use client';
import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';
import PageShell from '@/components/layout/PageShell';
import PageHero from '@/components/layout/PageHero';
import { Spinner, ErrorState } from '@azeebo/ui/web';
import { EmptyState } from '@/components/ui/EmptyState';
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
    <PageShell maxWidth="md">
      <Link
        href="/referral"
        className="az-body mb-6 inline-block text-az-ink-muted no-underline transition-colors hover:text-az-ink"
      >
        &larr; Back to Referral
      </Link>

      <PageHero
        eyebrow="Refer & Earn"
        title="Referral History"
        subtitle="Track your referrals and earnings"
      />

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" color="#EC691F" />
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
          <div className="mb-6 grid grid-cols-3 gap-4">
            {[
              { label: 'Total Referrals', value: String(totalReferrals), tint: 'text-az-flame' },
              {
                label: 'Total Earned',
                value: `₦${totalEarned.toLocaleString()}`,
                tint: 'text-az-success-400',
              },
              {
                label: 'Pending',
                value: String(statsData.pendingReferrals ?? statsData.pending ?? 0),
                tint: 'text-az-warning-400',
              },
            ].map((stat, i) => (
              <div key={i} className="az-glass px-5 py-5 text-center">
                <p className="az-caption text-az-ink-muted mb-2">{stat.label}</p>
                <p className={`az-subtitle font-bold ${stat.tint}`}>{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Share code */}
          <div className="az-glass mb-6 px-6 py-6 text-center">
            <p className="az-body text-az-ink-muted mb-4">Share your referral code</p>
            <div className="flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={copyToClipboard}
                className="az-btn-social w-auto cursor-pointer"
              >
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (navigator.share)
                    navigator.share({ title: 'Join Azeebo+', url: referralLink });
                }}
                className="az-btn-social w-auto cursor-pointer"
              >
                Share
              </button>
            </div>
          </div>

          {/* Referral list */}
          <div className="az-glass p-6">
            <h2 className="az-subtitle text-az-ink mb-4">All Referrals</h2>
            {referrals.length === 0 ? (
              <EmptyState
                icon="users"
                title="No referrals yet"
                description="Share your code to start earning"
                dark
              />
            ) : (
              <div className="flex flex-col gap-2">
                {referrals.map((ref: ReferralEntry, i: number) => {
                  const isPaid = ref.status === 'completed' || ref.status === 'rewarded';
                  return (
                    <div
                      key={ref.id || i}
                      className="flex items-center justify-between border-b border-az-glass-border py-3 last:border-b-0"
                    >
                      <div>
                        <p className="az-body-strong text-az-ink">
                          {ref.displayName || ref.username || ref.email}
                        </p>
                        <p className="az-caption text-az-ink-muted">
                          Joined{' '}
                          {new Date(ref.joinedAt || ref.createdAt || '').toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <span
                          className={`rounded-az-pill px-2.5 py-1 az-micro-label ${
                            isPaid
                              ? 'bg-az-success-400/15 text-az-success-400'
                              : ref.status === 'active'
                                ? 'bg-az-scarlet/15 text-az-flame'
                                : 'bg-az-warning-400/15 text-az-warning-400'
                          }`}
                        >
                          {ref.status}
                        </span>
                        {(ref.earningsGenerated ?? ref.reward ?? 0) > 0 && (
                          <p className="az-caption mt-1 font-semibold text-az-success-400">
                            +₦{(ref.earningsGenerated ?? ref.reward ?? 0).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </PageShell>
  );
}
