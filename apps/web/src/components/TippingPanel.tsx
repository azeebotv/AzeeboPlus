'use client';
import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

const TIER_CONFIG: Record<string, { label: string; color: string; bg: string; min: number }> = {
  bronze: { label: 'Bronze', color: 'var(--brand-copper)', bg: 'rgba(205,127,50,0.15)', min: 1000 },
  silver: {
    label: 'Silver',
    color: 'var(--brand-silver)',
    bg: 'rgba(192,192,192,0.15)',
    min: 10000,
  },
  gold: { label: 'Gold', color: 'var(--brand-gold)', bg: 'rgba(255,215,0,0.15)', min: 50000 },
  platinum: {
    label: 'Platinum',
    color: 'var(--brand-silver)',
    bg: 'rgba(229,228,226,0.15)',
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
      return res.success && res.data ? res.data : null;
    },
  });

  const leaderboardQuery = useQuery({
    queryKey: ['tip-leaderboard', creatorId],
    queryFn: async () => {
      const res = await api.creator.getTipLeaderboard(creatorId);
      return res.success && res.data ? res.data.entries : [];
    },
  });

  const tipMutation = useMutation({
    mutationFn: async () => {
      const finalAmount = useCustom ? Number(customAmount) : amount;
      return api.creator.sendTip(creatorId, finalAmount, message || undefined);
    },
  });

  const selectedAmount = useCustom ? Number(customAmount) : amount;

  const topTier = statsQuery.data?.topTier;
  const tierConfig = topTier ? TIER_CONFIG[topTier] : null;

  return (
    <div
      style={{
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 12,
        padding: 20,
        border: '1px solid var(--border-default)',
      }}
    >
      <h3 style={{ color: 'var(--brand-white)', fontSize: 18, fontWeight: 600, marginBottom: 4 }}>
        Support {creatorName}
      </h3>
      <p style={{ color: 'var(--text-muted, #9A8A7A)', fontSize: 13, marginBottom: 16 }}>
        Send a tip and earn tier badges
      </p>

      {tierConfig && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {Object.entries(TIER_CONFIG).map(([key, cfg]) => {
            const unlocked =
              topTier &&
              Object.keys(TIER_CONFIG).indexOf(key) <= Object.keys(TIER_CONFIG).indexOf(topTier);
            return (
              <div
                key={key}
                style={{
                  padding: '4px 10px',
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 600,
                  backgroundColor: unlocked ? cfg.bg : 'rgba(255,255,255,0.05)',
                  color: unlocked ? cfg.color : 'var(--brand-grey)',
                  opacity: unlocked ? 1 : 0.4,
                }}
              >
                {unlocked ? 'Check ' : ''}
                {cfg.label}
              </div>
            );
          })}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        {PRESET_AMOUNTS.map((preset) => (
          <button
            key={preset}
            type="button"
            aria-label={`Tip ${preset.toLocaleString()} naira`}
            onClick={() => {
              setAmount(preset);
              setUseCustom(false);
            }}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: '1px solid',
              borderColor:
                !useCustom && amount === preset
                  ? 'var(--brand-orange, #E8420A)'
                  : 'var(--bg-surface, #18151e)',
              backgroundColor:
                !useCustom && amount === preset ? 'rgba(232,66,10,0.15)' : 'transparent',
              color:
                !useCustom && amount === preset
                  ? 'var(--brand-orange, #E8420A)'
                  : 'var(--text-primary, #F5F0EB)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            ₦{preset.toLocaleString()}
          </button>
        ))}
        <button
          type="button"
          aria-label="Enter custom tip amount"
          onClick={() => setUseCustom(true)}
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            border: '1px solid',
            borderColor: useCustom ? 'var(--brand-orange, #E8420A)' : 'var(--bg-surface, #18151e)',
            backgroundColor: useCustom ? 'rgba(232,66,10,0.15)' : 'transparent',
            color: useCustom ? 'var(--brand-orange, #E8420A)' : 'var(--text-primary, #F5F0EB)',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
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
          style={{
            width: '100%',
            padding: '10px 14px',
            borderRadius: 8,
            border: '1px solid var(--border-default)',
            background: 'var(--bg-tertiary)',
            color: 'var(--text-primary, #F5F0EB)',
            fontSize: 14,
            marginBottom: 12,
          }}
        />
      )}

      <input
        type="text"
        aria-label="Tip message"
        placeholder="Add a message (optional)"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        maxLength={500}
        style={{
          width: '100%',
          padding: '10px 14px',
          borderRadius: 8,
          border: '1px solid var(--border-default)',
          background: 'var(--bg-tertiary)',
          color: 'var(--text-primary, #F5F0EB)',
          fontSize: 14,
          marginBottom: 16,
        }}
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
        style={{
          width: '100%',
          padding: '12px',
          borderRadius: 10,
          border: 'none',
          backgroundColor: tipMutation.isPending
            ? 'var(--brand-grey)'
            : 'var(--brand-orange, #E8420A)',
          color: 'var(--brand-white)',
          fontSize: 15,
          fontWeight: 600,
          cursor: 'pointer',
          opacity: selectedAmount < 50 ? 0.5 : 1,
          marginBottom: 16,
        }}
      >
        {tipMutation.isPending
          ? 'Sending...'
          : tipMutation.isSuccess
            ? 'Check Tip Sent!'
            : `Send ₦${selectedAmount.toLocaleString()}`}
      </button>

      {tipMutation.isError && (
        <p
          style={{
            color: 'var(--color-error-500)',
            fontSize: 13,
            textAlign: 'center',
            marginBottom: 12,
          }}
        >
          {tipMutation.error instanceof Error ? tipMutation.error.message : 'Failed to send tip'}
        </p>
      )}

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 16 }}>
        <p
          style={{
            color: 'var(--text-muted, #9A8A7A)',
            fontSize: 13,
            fontWeight: 600,
            marginBottom: 8,
          }}
        >
          Top Supporters
        </p>
        {leaderboardQuery.isLoading ? (
          <p style={{ color: 'var(--brand-grey)', fontSize: 12 }}>Loading...</p>
        ) : leaderboardQuery.data && leaderboardQuery.data.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {leaderboardQuery.data.slice(0, 5).map((entry, i) => {
              const tier = TIER_CONFIG[entry.tier as string];
              return (
                <div
                  key={entry.userId}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: 'var(--brand-grey)', fontSize: 12, width: 16 }}>
                      #{i + 1}
                    </span>
                    {tier && (
                      <span
                        style={{
                          padding: '2px 6px',
                          borderRadius: 10,
                          fontSize: 10,
                          fontWeight: 600,
                          backgroundColor: tier.bg,
                          color: tier.color,
                        }}
                      >
                        {tier.label}
                      </span>
                    )}
                  </div>
                  <span
                    style={{ color: 'var(--text-primary, #F5F0EB)', fontSize: 12, fontWeight: 600 }}
                  >
                    ₦{Number(entry.totalAmount).toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p style={{ color: 'var(--brand-grey)', fontSize: 12 }}>Be the first to tip!</p>
        )}
      </div>
    </div>
  );
}
