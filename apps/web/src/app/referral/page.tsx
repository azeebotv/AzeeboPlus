'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';
import PageShell from '@/components/layout/PageShell';
import PageHero from '@/components/layout/PageHero';
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
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    };
  }, []);

  // Logged-out visitors get sent to login instead of a blank page.
  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/auth/login?next=/referral');
  }, [authLoading, isAuthenticated, router]);

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
  if (!isAuthenticated || !user) return <></>; // redirect fires via effect

  return (
    <PageShell maxWidth="md">
      <PageHero
        eyebrow="Refer & Earn"
        title="Invite friends, earn rewards"
        subtitle="Both of you get credit when they subscribe"
      />

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" color="#EC691F" />
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
          <div className="az-glass az-glass--glow mb-6 px-6 py-8 text-center">
            <p className="az-body text-az-ink-muted mb-2">Your Referral Code</p>
            <p className="az-headline text-az-heading text-az-flame mb-4">{referralData.code}</p>
            <div className="flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={copyToClipboard}
                className="az-btn-social w-auto cursor-pointer"
              >
                {copied ? (
                  <>
                    <svg
                      className="size-4"
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
                type="button"
                onClick={() => {
                  if (navigator.share)
                    navigator.share({ title: 'Join Azeebo+', url: referralData.link });
                }}
                className="az-btn-social w-auto cursor-pointer"
              >
                Share
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="mb-6 grid grid-cols-3 gap-4">
            {[
              {
                label: 'Total Referrals',
                value: String(referralData.totalReferrals ?? 0),
                tint: 'text-az-flame',
              },
              {
                label: 'Successful',
                value: String(referralData.successfulReferrals ?? 0),
                tint: 'text-az-success-400',
              },
              {
                label: 'Earned',
                value: `₦${(referralData.totalEarned ?? 0).toLocaleString()}`,
                tint: 'text-az-warning-400',
              },
            ].map((stat, i) => (
              <div key={i} className="az-glass px-5 py-5 text-center">
                <p className="az-caption text-az-ink-muted mb-2">{stat.label}</p>
                <p className={`az-subtitle font-bold ${stat.tint}`}>{stat.value}</p>
              </div>
            ))}
          </div>

          {/* How it works */}
          <div className="az-glass mb-6 p-6">
            <h2 className="az-subtitle text-az-ink mb-4">How It Works</h2>
            <div className="flex flex-col gap-4">
              {[
                { step: '1', text: 'Share your referral link with friends' },
                { step: '2', text: 'They sign up using your link' },
                { step: '3', text: 'Both of you earn rewards when they subscribe' },
              ].map((item) => (
                <div key={item.step} className="flex items-center gap-3">
                  <span
                    className="flex size-8 shrink-0 items-center justify-center rounded-az-pill az-caption font-bold text-az-ink"
                    style={{ background: 'var(--gradient-az-cta)' }}
                  >
                    {item.step}
                  </span>
                  <p className="az-body text-az-ink-muted">{item.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Referral list */}
          {referralData.referrals.length > 0 && (
            <div className="az-glass p-6">
              <h2 className="az-subtitle text-az-ink mb-4">Your Referrals</h2>
              <div className="flex flex-col gap-2">
                {referralData.referrals.map((ref: ReferralEntry, i: number) => (
                  <div
                    key={i}
                    className="flex items-center justify-between border-b border-az-glass-border py-2.5 last:border-b-0"
                  >
                    <div>
                      <p className="az-body-strong text-az-ink">{ref.username || ref.email}</p>
                      <p className="az-caption text-az-ink-muted">
                        {new Date(ref.joinedAt || ref.createdAt || '').toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`rounded-az-pill px-2.5 py-1 az-micro-label ${
                        ref.status === 'completed'
                          ? 'bg-az-success-400/15 text-az-success-400'
                          : 'bg-az-warning-400/15 text-az-warning-400'
                      }`}
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
    </PageShell>
  );
}
