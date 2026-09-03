'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';

interface TipEntry {
  id: string;
  creatorId: string;
  creatorName: string;
  amount: number;
  tier?: string;
  message?: string;
  createdAt: string;
}

interface TipStats {
  totalTips: number;
  totalAmount: number;
  topTier: string | null;
}

const TIER_COLORS: Record<string, { color: string; bg: string }> = {
  bronze: { color: 'var(--brand-copper)', bg: 'rgba(205,127,50,0.15)' },
  silver: { color: 'var(--brand-silver)', bg: 'rgba(192,192,192,0.15)' },
  gold: { color: 'var(--brand-gold)', bg: 'rgba(255,215,0,0.15)' },
  platinum: { color: 'var(--brand-silver)', bg: 'rgba(229,228,226,0.15)' },
};

const PRESET_AMOUNTS = [100, 500, 1000, 5000, 10000];

export default function TippingPage(): React.JSX.Element {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'history' | 'send'>('history');
  const [page, setPage] = useState(1);

  const statsQuery = useQuery({
    queryKey: ['tipping', 'stats'],
    queryFn: async () => {
      const res = await apiFetch<TipStats>('/v1/tipping/stats');
      return res.data ?? { totalTips: 0, totalAmount: 0, topTier: null };
    },
    staleTime: 60000,
    enabled: isAuthenticated,
  });

  const historyQuery = useQuery({
    queryKey: ['tipping', 'history', page],
    queryFn: async () => {
      const res = await apiFetch<{ items: TipEntry[]; total: number; totalPages: number }>(
        `/v1/tipping/history?page=${page}&limit=10`
      );
      return res.data ?? { items: [], total: 0, totalPages: 1 };
    },
    staleTime: 30000,
    enabled: isAuthenticated,
  });

  if (authLoading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--brand-near-black)' }}>
        <AppHeader />
        <div
          className="flex items-center justify-center"
          style={{ minHeight: 'calc(100vh - 200px)' }}
        >
          <div className="text-center">
            <div
              className="animate-spin rounded-full h-12 w-12 mx-auto"
              style={{
                border: '3px solid rgba(255,255,255,0.1)',
                borderTopColor: 'var(--brand-orange)',
              }}
            />
            <p className="mt-4 text-white/60">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--brand-near-black)' }}>
        <AppHeader />
        <div
          className="flex items-center justify-center"
          style={{ minHeight: 'calc(100vh - 200px)' }}
        >
          <div className="text-center max-w-md mx-auto px-4">
            <p className="text-4xl mb-4"></p>
            <h1 className="text-2xl font-bold text-white mb-4">Sign in to View Tips</h1>
            <p className="text-white/50 mb-6">
              Sign in to view your tipping history and support creators.
            </p>
            <Link
              href="/auth/login?redirect=/tipping"
              className="az-btn-primary inline-block"
              style={{ paddingInline: '2rem' }}
            >
              Sign In
            </Link>
          </div>
        </div>
        <AppFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--brand-near-black)' }}>
      <AppHeader />
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">My Tips</h1>
          <p className="text-white/50">Support your favorite creators</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="az-glass p-4 text-center">
            <p className="text-2xl font-bold" style={{ color: 'var(--brand-orange)' }}>
              {statsQuery.data?.totalTips ?? 0}
            </p>
            <p className="text-xs text-white/50 mt-1">Tips Sent</p>
          </div>
          <div className="az-glass p-4 text-center">
            <p className="text-2xl font-bold" style={{ color: 'var(--brand-orange)' }}>
              ₦{(statsQuery.data?.totalAmount ?? 0).toLocaleString()}
            </p>
            <p className="text-xs text-white/50 mt-1">Total Tipped</p>
          </div>
          <div className="az-glass p-4 text-center">
            <p className="text-2xl font-bold" style={{ color: 'var(--brand-orange)' }}>
              {statsQuery.data?.topTier
                ? statsQuery.data.topTier.charAt(0).toUpperCase() + statsQuery.data.topTier.slice(1)
                : '—'}
            </p>
            <p className="text-xs text-white/50 mt-1">Current Tier</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(['history', 'send'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-5 py-2.5 rounded-full text-sm font-medium transition-all"
              style={
                activeTab === tab
                  ? { background: 'var(--brand-orange)', color: 'var(--brand-white)' }
                  : {
                      border: '1px solid rgba(255,255,255,0.2)',
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      color: 'var(--brand-white)',
                    }
              }
            >
              {tab === 'history' ? 'History' : 'Send Tip'}
            </button>
          ))}
        </div>

        {activeTab === 'history' && (
          <div>
            {historyQuery.isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="az-glass p-4">
                    <div className="flex justify-between items-center">
                      <Skeleton height="20px" width="40%" />
                      <Skeleton height="20px" width="20%" />
                    </div>
                    <Skeleton height="14px" width="30%" className="mt-2" />
                  </div>
                ))}
              </div>
            ) : historyQuery.error ? (
              <ErrorState
                title="Failed to load tipping history"
                description={historyQuery.error.message}
                onButtonPress={() => historyQuery.refetch()}
              />
            ) : (historyQuery.data?.items ?? []).length === 0 ? (
              <div className="az-glass p-12 text-center">
                <p className="text-4xl mb-4"></p>
                <p className="text-lg font-semibold text-white mb-2">No tips sent yet</p>
                <p className="text-sm text-white/50 mb-6">
                  Support your favorite creators to see them here.
                </p>
                <button
                  onClick={() => setActiveTab('send')}
                  className="az-btn-primary"
                  style={{ paddingInline: '1.5rem' }}
                >
                  Send Your First Tip
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {(historyQuery.data?.items ?? []).map((tip) => {
                    const tier = tip.tier ? TIER_COLORS[tip.tier.toLowerCase()] : null;
                    return (
                      <Link key={tip.id} href={`/creators/${tip.creatorId}`}>
                        <div className="az-glass p-4 flex items-center gap-4 hover:scale-[1.01] transition-transform cursor-pointer">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
                            style={{ background: 'linear-gradient(135deg, #E8420A, #CC1C1C)' }}
                          >
                            {tip.creatorName?.charAt(0) || 'C'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-white truncate">{tip.creatorName}</p>
                            {tip.message && (
                              <p className="text-xs text-white/40 truncate">{tip.message}</p>
                            )}
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="font-bold" style={{ color: 'var(--brand-orange)' }}>
                              ₦{tip.amount.toLocaleString()}
                            </p>
                            <div className="flex items-center gap-2 justify-end">
                              {tier && (
                                <span
                                  className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                                  style={{ backgroundColor: tier.bg, color: tier.color }}
                                >
                                  {tip.tier!.charAt(0).toUpperCase() + tip.tier!.slice(1)}
                                </span>
                              )}
                              <span className="text-xs text-white/30">
                                {new Date(tip.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
                {/* Pagination */}
                {(historyQuery.data?.totalPages ?? 1) > 1 && (
                  <div className="flex justify-center gap-2 mt-6">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                      className="px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-40"
                      style={{
                        border: '1px solid rgba(255,255,255,0.2)',
                        color: 'var(--brand-white)',
                      }}
                    >
                      ← Prev
                    </button>
                    <span className="px-4 py-2 text-sm text-white/50">
                      Page {page} of {historyQuery.data?.totalPages ?? 1}
                    </span>
                    <button
                      onClick={() => setPage((p) => p + 1)}
                      disabled={page >= (historyQuery.data?.totalPages ?? 1)}
                      className="px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-40"
                      style={{
                        border: '1px solid rgba(255,255,255,0.2)',
                        color: 'var(--brand-white)',
                      }}
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'send' && (
          <SendTipForm
            onComplete={() => {
              setActiveTab('history');
              queryClient.invalidateQueries({ queryKey: ['tipping'] });
            }}
          />
        )}
      </div>
      <AppFooter />
    </div>
  );
}

function SendTipForm({ onComplete }: { onComplete: () => void }): React.JSX.Element {
  const [creatorId, setCreatorId] = useState('');
  const [amount, setAmount] = useState(500);
  const [customAmount, setCustomAmount] = useState('');
  const [message, setMessage] = useState('');
  const [useCustom, setUseCustom] = useState(false);

  const tipMutation = useMutation({
    mutationFn: async () => {
      const finalAmount = useCustom ? Number(customAmount) : amount;
      const res = await apiFetch('/v1/tipping/send', {
        method: 'POST',
        body: JSON.stringify({ creatorId, amount: finalAmount, message: message || undefined }),
      });
      if (!res.success) throw new Error(res.message || 'Failed to send tip');
      return res.data;
    },
    onSuccess: () => onComplete(),
  });

  const selectedAmount = useCustom ? Number(customAmount) : amount;

  return (
    <div className="az-glass p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Send a Tip</h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm text-white/50 mb-2">Creator ID</label>
          <input
            type="text"
            value={creatorId}
            onChange={(e) => setCreatorId(e.target.value)}
            placeholder="Enter creator ID or username"
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-[var(--brand-orange)] transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm text-white/50 mb-2">Amount</label>
          <div className="flex gap-2 flex-wrap">
            {PRESET_AMOUNTS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  setAmount(preset);
                  setUseCustom(false);
                }}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                style={
                  !useCustom && amount === preset
                    ? {
                        backgroundColor: 'rgba(232,66,10,0.15)',
                        border: '1px solid var(--brand-orange)',
                        color: 'var(--brand-orange)',
                      }
                    : { border: '1px solid rgba(255,255,255,0.15)', color: 'var(--brand-white)' }
                }
              >
                ₦{preset.toLocaleString()}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setUseCustom(true)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={
                useCustom
                  ? {
                      backgroundColor: 'rgba(232,66,10,0.15)',
                      border: '1px solid var(--brand-orange)',
                      color: 'var(--brand-orange)',
                    }
                  : { border: '1px solid rgba(255,255,255,0.15)', color: 'var(--brand-white)' }
              }
            >
              Custom
            </button>
          </div>
          {useCustom && (
            <input
              type="number"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              placeholder="Enter amount (min ₦50)"
              min={50}
              max={100000}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-[var(--brand-orange)] transition-colors mt-3"
            />
          )}
        </div>

        <div>
          <label className="block text-sm text-white/50 mb-2">Message (optional)</label>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Add a message..."
            maxLength={500}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-[var(--brand-orange)] transition-colors"
          />
        </div>

        {tipMutation.isError && (
          <p className="text-sm text-red-400">
            {tipMutation.error instanceof Error ? tipMutation.error.message : 'Failed to send tip'}
          </p>
        )}

        <button
          type="button"
          onClick={() => tipMutation.mutate()}
          disabled={tipMutation.isPending || !creatorId || selectedAmount < 50}
          className="w-full py-4 rounded-full font-semibold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: 'linear-gradient(135deg, var(--brand-orange), var(--brand-red))',
            color: 'var(--brand-white)',
          }}
        >
          {tipMutation.isPending
            ? 'Sending...'
            : tipMutation.isSuccess
              ? 'Check Tip Sent!'
              : `Send ₦${selectedAmount.toLocaleString()}`}
        </button>

        {tipMutation.isSuccess && (
          <p className="text-center text-sm text-green-400">Tip sent successfully! PartyPopper</p>
        )}
      </div>
    </div>
  );
}
