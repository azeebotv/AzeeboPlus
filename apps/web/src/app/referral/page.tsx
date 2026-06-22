'use client';
import React, { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { webLogger } from '@/lib/logger';

interface ReferralStats {
  referralCode: string;
  totalReferrals: number;
  successfulReferrals: number;
  pendingReferrals: number;
  totalEarnings: number;
  commissionRate: number;
  referralLink: string;
}

interface Referral {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  avatar: string;
  joinedAt: string;
  status: 'pending' | 'active' | 'rewarded';
  earningsGenerated: number;
}

export default function ReferralPage(): JSX.Element {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadReferralData();
  }, []);

  const loadReferralData = async (): Promise<void> => {
    try {
      const [statsResult, referralsResult] = await Promise.all([
        apiFetch<ReferralStats>('/v1/referral/stats'),
        apiFetch<Referral[]>('/v1/referral/referrals'),
      ]);

      if (statsResult.success && statsResult.data) {
        setStats(statsResult.data);
      }

      if (referralsResult.success && referralsResult.data) {
        setReferrals(referralsResult.data);
      }
    } catch (error) {
      webLogger.error('Failed to load referral data', error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyReferralLink = async (): Promise<void> => {
    if (!stats) return;

    try {
      await navigator.clipboard.writeText(stats.referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      webLogger.error('Failed to copy', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading referral data...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-foreground mb-4">Failed to load referral data</p>
          <button
            onClick={loadReferralData}
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
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Referral Program</h1>
          <p className="text-muted-foreground">Invite friends and earn rewards</p>
        </div>

        <div className="bg-card rounded-lg border border-border p-8 mb-8 text-center">
          <h2 className="text-xl font-bold text-foreground mb-4">Your Referral Code</h2>
          <div className="flex items-center justify-center gap-4 mb-6">
            <span className="text-4xl font-bold text-primary tracking-widest">
              {stats.referralCode}
            </span>
            <button
              onClick={copyReferralLink}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                copied ? 'bg-green-500 text-white' : 'bg-primary text-white hover:bg-primary/90'
              }`}
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <div className="bg-muted rounded-lg p-4 mb-4">
            <p className="text-sm text-muted-foreground mb-2">Your referral link</p>
            <p className="text-foreground font-mono text-sm break-all">{stats.referralLink}</p>
          </div>
          <button
            onClick={copyReferralLink}
            className="px-8 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90"
          >
            Share Referral Link
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-card rounded-lg border border-border p-6 text-center">
            <p className="text-3xl font-bold text-primary">{stats.totalReferrals}</p>
            <p className="text-sm text-muted-foreground mt-1">Total Referrals</p>
          </div>
          <div className="bg-card rounded-lg border border-border p-6 text-center">
            <p className="text-3xl font-bold text-primary">{stats.successfulReferrals}</p>
            <p className="text-sm text-muted-foreground mt-1">Successful</p>
          </div>
          <div className="bg-card rounded-lg border border-border p-6 text-center">
            <p className="text-3xl font-bold text-primary">{stats.commissionRate}%</p>
            <p className="text-sm text-muted-foreground mt-1">Commission</p>
          </div>
          <div className="bg-card rounded-lg border border-border p-6 text-center">
            <p className="text-3xl font-bold text-green-500">
              ₦{stats.totalEarnings.toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground mt-1">Total Earnings</p>
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-6">
          <h2 className="text-xl font-bold text-foreground mb-6">Your Referrals</h2>
          {referrals.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">👥</div>
              <h3 className="text-xl font-bold text-foreground mb-2">No referrals yet</h3>
              <p className="text-muted-foreground">Share your code to start earning</p>
            </div>
          ) : (
            <div className="space-y-4">
              {referrals.map((referral) => (
                <div
                  key={referral.id}
                  className="flex items-center justify-between p-4 bg-muted rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={referral.avatar}
                      alt={referral.displayName}
                      className="w-12 h-12 rounded-full"
                    />
                    <div>
                      <p className="font-semibold text-foreground">{referral.displayName}</p>
                      <p className="text-sm text-muted-foreground">
                        Joined {new Date(referral.joinedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        referral.status === 'rewarded'
                          ? 'bg-green-500/20 text-green-500'
                          : referral.status === 'active'
                            ? 'bg-primary/20 text-primary'
                            : 'bg-yellow-500/20 text-yellow-500'
                      }`}
                    >
                      {referral.status.charAt(0).toUpperCase() + referral.status.slice(1)}
                    </span>
                    {referral.earningsGenerated > 0 && (
                      <span className="text-green-500 font-semibold">
                        ₦{referral.earningsGenerated.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
