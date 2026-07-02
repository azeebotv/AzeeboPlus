'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';

export default function ReferralPage(): React.JSX.Element {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const [referralData, setReferralData] = useState({
    code: '',
    link: '',
    totalReferrals: 0,
    successfulReferrals: 0,
    pendingReferrals: 0,
    totalEarned: 0,
    referrals: [] as any[],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push('/auth/login');
      return;
    }
    loadReferralData();
  }, [isAuthenticated, user, router]);

  const loadReferralData = async () => {
    try {
      const [codeRes, statsRes, referralsRes] = await Promise.allSettled([
        apiFetch<any>('/referrals/code'),
        apiFetch<any>('/referrals/stats'),
        apiFetch<any>('/referrals'),
      ]);

      const code = codeRes.status === 'fulfilled' ? codeRes.value : null;
      const stats = statsRes.status === 'fulfilled' ? statsRes.value : null;
      const referrals = referralsRes.status === 'fulfilled' ? referralsRes.value : null;

      const codeData = code?.data ?? {};
      const statsData = stats?.data ?? {};
      const referralsData = referrals?.data ?? {};

      setReferralData({
        code: String(codeData.code ?? codeData.referralCode ?? ''),
        link: String(codeData.link ?? codeData.referralLink ?? ''),
        totalReferrals: Number(
          statsData.totalReferrals ?? statsData.total ?? referralsData.total ?? 0
        ),
        successfulReferrals: Number(statsData.successfulReferrals ?? statsData.successful ?? 0),
        pendingReferrals: Number(statsData.pendingReferrals ?? statsData.pending ?? 0),
        totalEarned: Number(statsData.totalEarned ?? statsData.earned ?? 0),
        referrals: Array.isArray(referralsData.referrals)
          ? referralsData.referrals
          : Array.isArray(referralsData)
            ? referralsData
            : [],
      });
    } catch {
      /* ignore */
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(referralData.link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
          maxWidth: 700,
          margin: '0 auto',
          padding: '100px 24px 60px',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700 }}>Refer & Earn</h1>
          <p style={{ color: '#9A8A7A', marginTop: 4 }}>Invite friends and earn rewards</p>
        </div>

        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <div
              style={{
                width: 40,
                height: 40,
                border: '3px solid #2A1A1A',
                borderTopColor: '#E8420A',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }}
            />
          </div>
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
              <p style={{ color: '#9A8A7A', fontSize: 14, marginBottom: 8 }}>Your Referral Code</p>
              <p
                style={{
                  fontSize: 32,
                  fontWeight: 700,
                  color: '#E8420A',
                  letterSpacing: 4,
                  marginBottom: 16,
                }}
              >
                {referralData.code}
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button
                  onClick={copyToClipboard}
                  className="az-btn-primary"
                  style={{
                    padding: '12px 32px',
                    borderRadius: 999,
                    border: 'none',
                    background: 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)',
                    color: '#fff',
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
                      navigator.share({ title: 'Join Azeebo+', url: referralData.link });
                  }}
                  style={{
                    padding: '12px 32px',
                    borderRadius: 999,
                    border: '1px solid #2A1A1A',
                    background: 'transparent',
                    color: '#9A8A7A',
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
                  color: '#E8420A',
                },
                {
                  label: 'Successful',
                  value: String(referralData.successfulReferrals ?? 0),
                  color: '#0D3B2E',
                },
                {
                  label: 'Earned',
                  value: `₦${(referralData.totalEarned ?? 0).toLocaleString()}`,
                  color: '#F59E0B',
                },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="az-glass"
                  style={{ padding: 20, borderRadius: 16, textAlign: 'center' }}
                >
                  <p style={{ fontSize: 13, color: '#9A8A7A', marginBottom: 8 }}>{stat.label}</p>
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
                        background: 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)',
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
                    <p style={{ fontSize: 14, color: '#D4C8B8' }}>{item.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Referral list */}
            {referralData.referrals.length > 0 && (
              <div className="az-glass" style={{ padding: 24, borderRadius: 20 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Your Referrals</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {referralData.referrals.map((ref: any, i: number) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 0',
                        borderBottom: '1px solid #2A1A1A',
                      }}
                    >
                      <div>
                        <p style={{ fontWeight: 600, fontSize: 14 }}>{ref.username || ref.email}</p>
                        <p style={{ color: '#9A8A7A', fontSize: 12 }}>
                          {new Date(ref.joinedAt || ref.createdAt).toLocaleDateString()}
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
                          color: ref.status === 'completed' ? '#0D3B2E' : '#F59E0B',
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
