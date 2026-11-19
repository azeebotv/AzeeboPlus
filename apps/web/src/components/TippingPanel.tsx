'use client';
import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

/* Tip tiers are reward ranks, not statuses, so they keep the categorical
   metallic ramp (see `src/app/rankings`) instead of the semantic colour set.
   A tone is a pair of token CLASSES — the tint is `bg-az-accent-gold/15`,
   Tailwind emits the color-mix for us. */
const TIER_CONFIG: Record<string, { label: string; color: string; bg: string; min: number }> = {
  bronze: {
    label: 'Bronze',
    color: 'text-[var(--color-az-accent-bronze)]',
    bg: 'bg-[var(--color-az-accent-bronze)]/15',
    min: 1000,
  },
  silver: {
    label: 'Silver',
    color: 'text-[var(--color-az-accent-silver)]',
    bg: 'bg-[var(--color-az-accent-silver)]/15',
    min: 10000,
  },
  gold: {
    label: 'Gold',
    color: 'text-az-accent-gold',
    bg: 'bg-az-accent-gold/15',
    min: 50000,
  },
  platinum: {
    label: 'Platinum',
    color: 'text-[var(--color-az-accent-silver)]',
    bg: 'bg-az-ink/15',
    min: 100000,
  },
};

const PRESET_AMOUNTS = [100, 500, 1000, 5000, 10000];

export default function TippingPanel({
  creatorId,
  creatorName,
}: {
  creatorId: string;
  creatorName: string;
}) {
  const [amount, setAmount] = useState(500);
  const [customAmount, setCustomAmount] = useState('');
  const [message, setMessage] = useState('');
  const [useCustom, setUseCustom] = useState(false);

  const statsQuery = useQuery({
    queryKey: ['tip-stats', creatorId],
    queryFn: async () => {
      const res = await api.creator.getTipStats(creatorId);
      if (!res.success || !res.data) {
        throw new Error(res.message || 'Failed to load tip stats');
      }
      return res.data;
    },
  });

  const leaderboardQuery = useQuery({
    queryKey: ['tip-leaderboard', creatorId],
    queryFn: async () => {
      const res = await api.creator.getTipLeaderboard(creatorId);
      if (!res.success || !res.data) {
        throw new Error(res.message || 'Failed to load tip leaderboard');
      }
      return res.data.entries || [];
    },
  });

  const tipMutation = useMutation({
    mutationFn: async () => {
      const finalAmount = useCustom ? Number(customAmount) : amount;
      const res = await api.creator.sendTip(creatorId, finalAmount, message || undefined);
      if (!res.success) {
        throw new Error(res.message || 'Failed to send tip');
      }
      return res;
    },
  });

  const selectedAmount = useCustom ? Number(customAmount) : amount;

  const topTier = statsQuery.data?.topTier;
  const tierConfig = topTier ? TIER_CONFIG[topTier] : null;

  return (
    <div className="az-glass p-5">
      <h3 className="az-subtitle mb-1 text-az-ink">Support {creatorName}</h3>
      <p className="az-caption mb-4 text-az-ink-muted">Send a tip and earn tier badges</p>

      {tierConfig && (
        <div className="mb-4 flex flex-wrap gap-2">
          {Object.entries(TIER_CONFIG).map(([key, cfg]) => {
            const unlocked =
              topTier &&
              Object.keys(TIER_CONFIG).indexOf(key) <= Object.keys(TIER_CONFIG).indexOf(topTier);
            return (
              <div
                key={key}
                className={`rounded-az-pill px-2.5 py-1 text-[11px] font-semibold ${
                  unlocked ? `${cfg.bg} ${cfg.color}` : 'bg-az-ink/5 text-az-ink-muted opacity-40'
                }`}
              >
                {unlocked ? 'Check ' : ''}
                {cfg.label}
              </div>
            );
          })}
        </div>
      )}

      <div className="mb-3 flex flex-wrap gap-2">
        {PRESET_AMOUNTS.map((preset) => (
          <button
            key={preset}
            type="button"
            aria-label={`Tip ${preset.toLocaleString()} naira`}
            onClick={() => {
              setAmount(preset);
              setUseCustom(false);
            }}
            className={`cursor-pointer rounded-az-control border px-4 py-2 az-body-strong transition-colors ${
              !useCustom && amount === preset
                ? 'border-az-flame bg-az-scarlet/15 text-az-flame'
                : 'border-az-glass-border-hover text-az-ink hover:bg-az-glass-fill-hover'
            }`}
          >
            ₦{preset.toLocaleString()}
          </button>
        ))}
        <button
          type="button"
          aria-label="Enter custom tip amount"
          onClick={() => setUseCustom(true)}
          className={`cursor-pointer rounded-az-control border px-4 py-2 az-body-strong transition-colors ${
            useCustom
              ? 'border-az-flame bg-az-scarlet/15 text-az-flame'
              : 'border-az-glass-border-hover text-az-ink hover:bg-az-glass-fill-hover'
          }`}
        >
          Custom
        </button>
      </div>

      {useCustom && (
        <input
          type="number"
          aria-label="Custom tip amount in naira"
          placeholder="Enter amount (min ₦50)"
          value={customAmount}
          onChange={(e) => setCustomAmount(e.target.value)}
          min={50}
          max={100000}
          className="mb-3 az-input"
        />
      )}

      <input
        type="text"
        aria-label="Tip message"
        placeholder="Add a message (optional)"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        maxLength={500}
        className="mb-4 az-input"
      />

      <button
        type="button"
        aria-label={
          tipMutation.isPending
            ? 'Sending tip...'
            : tipMutation.isSuccess
              ? 'Tip sent'
              : `Send tip of ${selectedAmount.toLocaleString()} naira`
        }
        onClick={() => tipMutation.mutate()}
        disabled={tipMutation.isPending || selectedAmount < 50}
        className="mb-4 az-btn-primary"
      >
        {tipMutation.isPending
          ? 'Sending...'
          : tipMutation.isSuccess
            ? 'Check Tip Sent!'
            : `Send ₦${selectedAmount.toLocaleString()}`}
      </button>

      {tipMutation.isError && (
        <p className="az-caption mb-3 text-center text-az-error-500">
          {tipMutation.error instanceof Error ? tipMutation.error.message : 'Failed to send tip'}
        </p>
      )}

      <div className="border-t border-az-ink/8 pt-4">
        <p className="az-label">Top Supporters</p>
        {leaderboardQuery.isLoading ? (
          <p className="az-caption text-az-ink-muted">Loading...</p>
        ) : leaderboardQuery.isError ? (
          <p className="az-caption text-az-error-500">Failed to load leaderboard</p>
        ) : leaderboardQuery.data && leaderboardQuery.data.length > 0 ? (
          <div className="flex flex-col gap-1.5">
            {leaderboardQuery.data.slice(0, 5).map((entry, i) => {
              const tier = TIER_CONFIG[entry.tier as string];
              return (
                <div key={entry.userId} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="az-caption w-4 text-az-ink-muted">#{i + 1}</span>
                    {tier && (
                      <span
                        className={`az-micro-label rounded-az-pill px-1.5 py-0.5 ${tier.bg} ${tier.color}`}
                      >
                        {tier.label}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-semibold text-az-ink">
                    ₦{Number(entry.totalAmount).toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="az-caption text-az-ink-muted">Be the first to tip!</p>
        )}
      </div>
    </div>
  );
}
