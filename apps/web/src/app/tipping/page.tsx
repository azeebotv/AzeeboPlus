'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { HandCoins, Lock, PartyPopper } from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { PageHero } from '@/components/layout/PageHero';
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

/* Tip tiers are reward ranks, not statuses, so they keep their metal hues from
   the categorical ramp. */
const TIER_COLORS: Record<string, { color: string; bg: string }> = {
  bronze: {
    color: 'var(--color-az-accent-bronze)',
    bg: 'color-mix(in srgb, var(--color-az-accent-bronze) 15%, transparent)',
  },
  silver: {
    color: 'var(--color-az-accent-silver)',
    bg: 'color-mix(in srgb, var(--color-az-accent-silver) 15%, transparent)',
  },
  gold: {
    color: 'var(--color-az-accent-gold)',
    bg: 'color-mix(in srgb, var(--color-az-accent-gold) 15%, transparent)',
  },
  platinum: {
    color: 'var(--color-az-accent-silver)',
    bg: 'color-mix(in srgb, var(--color-az-accent-silver) 18%, transparent)',
  },
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
      <PageShell maxWidth="lg">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <div
              className="mx-auto size-12 animate-spin rounded-full border-[3px] border-az-glass-border-hover border-t-az-flame"
              role="status"
              aria-label="Loading tips"
            />
            <p className="az-body mt-4 text-az-ink/60">Loading...</p>
          </div>
        </div>
      </PageShell>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <PageShell maxWidth="lg">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="az-glass mx-auto max-w-md px-8 py-12 text-center">
            <span className="mx-auto mb-4 flex size-16 items-center justify-center rounded-az-panel bg-az-flame/10 text-az-flame">
              <Lock size={28} />
            </span>
            <h1 className="az-title mb-3 text-az-ink">Sign in to view tips</h1>
            <p className="az-body mb-6 text-az-ink-muted">
              Sign in to view your tipping history and support creators.
            </p>
            <Link
              href="/auth/login?redirect=/tipping"
              className="az-btn-primary az-btn-primary--inline"
            >
              Sign In
            </Link>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell maxWidth="lg">
      <PageHero eyebrow="Tipping" title="My Tips" description="Support your favorite creators" />

      {/* Stats */}
      <div className="mb-8 grid grid-cols-3 gap-4">
        <div className="az-glass p-4 text-center">
          <p className="az-heading text-az-flame">{statsQuery.data?.totalTips ?? 0}</p>
          <p className="az-caption mt-1 text-az-ink-muted">Tips Sent</p>
        </div>
        <div className="az-glass p-4 text-center">
          <p className="az-heading text-az-flame">
            ₦{(statsQuery.data?.totalAmount ?? 0).toLocaleString()}
          </p>
          <p className="az-caption mt-1 text-az-ink-muted">Total Tipped</p>
        </div>
        <div className="az-glass p-4 text-center">
          <p className="az-heading text-az-flame">
            {statsQuery.data?.topTier
              ? statsQuery.data.topTier.charAt(0).toUpperCase() + statsQuery.data.topTier.slice(1)
              : '—'}
          </p>
          <p className="az-caption mt-1 text-az-ink-muted">Current Tier</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-2">
        {(['history', 'send'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            aria-pressed={activeTab === tab}
            className={`cursor-pointer rounded-az-pill border px-5 py-2.5 az-body-strong transition-colors ${
              activeTab === tab
                ? 'border-az-flame bg-az-flame text-az-ink'
                : 'border-az-glass-border-hover bg-az-glass-fill text-az-ink hover:bg-az-glass-fill-hover'
            }`}
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
                  <div className="flex items-center justify-between">
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
            <div className="az-glass px-6 py-12 text-center">
              <span className="mx-auto mb-4 flex size-16 items-center justify-center rounded-az-panel bg-az-flame/10 text-az-flame">
                <HandCoins size={28} />
              </span>
              <p className="az-subtitle mb-2 text-az-ink">No tips sent yet</p>
              <p className="az-body mb-6 text-az-ink-muted">
                Support your favorite creators to see them here.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('send')}
                className="az-btn-primary az-btn-primary--inline"
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
                      <div className="az-glass flex items-center gap-4 p-4">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-az-pill bg-gradient-to-br from-az-flame to-az-scarlet az-body-strong text-az-ink">
                          {tip.creatorName?.charAt(0) || 'C'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="az-body-strong truncate text-az-ink">{tip.creatorName}</p>
                          {tip.message && (
                            <p className="az-caption truncate text-az-ink/40">{tip.message}</p>
                          )}
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="az-body-strong text-az-flame">
                            ₦{tip.amount.toLocaleString()}
                          </p>
                          <div className="flex items-center justify-end gap-2">
                            {tier && (
                              <span
                                className="az-micro-label rounded-az-pill px-1.5 py-0.5"
                                style={{ backgroundColor: tier.bg, color: tier.color }}
                              >
                                {tip.tier!.charAt(0).toUpperCase() + tip.tier!.slice(1)}
                              </span>
                            )}
                            <span className="az-caption text-az-ink/30">
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
                <div className="mt-6 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="az-btn-social cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    ← Prev
                  </button>
                  <span className="az-body px-4 py-2 text-az-ink-muted">
                    Page {page} of {historyQuery.data?.totalPages ?? 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page >= (historyQuery.data?.totalPages ?? 1)}
                    className="az-btn-social cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
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
    </PageShell>
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

  const amountButtonClass = (selected: boolean): string =>
    `cursor-pointer rounded-az-control border px-4 py-2 az-body-strong transition-colors ${
      selected
        ? 'border-az-flame bg-az-scarlet/15 text-az-flame'
        : 'border-az-glass-border-hover text-az-ink hover:bg-az-glass-fill-hover'
    }`;

  return (
    <div className="az-glass p-6">
      <h3 className="az-subtitle mb-4 text-az-ink">Send a Tip</h3>

      <div className="space-y-4">
        <div>
          <label className="az-label" htmlFor="tip-creator">
            Creator ID
          </label>
          <input
            id="tip-creator"
            type="text"
            value={creatorId}
            onChange={(e) => setCreatorId(e.target.value)}
            placeholder="Enter creator ID or username"
            className="az-input"
          />
        </div>

        <div>
          <span className="az-label">Amount</span>
          <div className="flex flex-wrap gap-2">
            {PRESET_AMOUNTS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  setAmount(preset);
                  setUseCustom(false);
                }}
                aria-pressed={!useCustom && amount === preset}
                className={amountButtonClass(!useCustom && amount === preset)}
              >
                ₦{preset.toLocaleString()}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setUseCustom(true)}
              aria-pressed={useCustom}
              className={amountButtonClass(useCustom)}
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
              className="az-input mt-3"
            />
          )}
        </div>

        <div>
          <label className="az-label" htmlFor="tip-message">
            Message (optional)
          </label>
          <input
            id="tip-message"
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Add a message..."
            maxLength={500}
            className="az-input"
          />
        </div>

        {tipMutation.isError && (
          <p className="az-body text-az-error-400">
            {tipMutation.error instanceof Error ? tipMutation.error.message : 'Failed to send tip'}
          </p>
        )}

        <button
          type="button"
          onClick={() => tipMutation.mutate()}
          disabled={tipMutation.isPending || !creatorId || selectedAmount < 50}
          className="az-btn-primary"
        >
          {tipMutation.isPending
            ? 'Sending...'
            : tipMutation.isSuccess
              ? 'Check Tip Sent!'
              : `Send ₦${selectedAmount.toLocaleString()}`}
        </button>

        {tipMutation.isSuccess && (
          <p className="az-body flex items-center justify-center gap-2 text-az-success-400">
            <PartyPopper size={16} aria-hidden /> Tip sent successfully!
          </p>
        )}
      </div>
    </div>
  );
}
