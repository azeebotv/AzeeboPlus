import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import { asRecord, asArray, str, num } from '@/lib/payload';
import { Icon } from '@/components/Icons';

/**
 * Detail page for a single subscription plan, backed by
 * GET /admin/subscriptions/:id (upstream-mapped via the subscription-admin
 * proxy). Renders the full pricing/limit/tier record plus the feature list
 * and subscriber count the list row hides.
 */

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: 'var(--admin-text-muted)',
  marginBottom: 4,
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p style={labelStyle}>{label}</p>
      <div style={{ color: 'var(--admin-text)', fontSize: 14 }}>{children}</div>
    </div>
  );
}

const actionBtn: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: 8,
  border: '1px solid var(--admin-surface)',
  background: 'var(--admin-surface)',
  color: 'var(--admin-text)',
  fontSize: 13,
  cursor: 'pointer',
};

const TIER_COLORS: Record<string, string> = {
  free: 'var(--admin-text-muted)',
  basic: 'var(--admin-blue, #3b82f6)',
  standard: 'var(--admin-amber)',
  premium: 'var(--admin-emerald)',
  enterprise: 'var(--admin-purple, #a78bfa)',
};

export default function PlanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);

  const q = useQuery({
    queryKey: ['subscription-plan', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const res = await adminApi.getSubscriptionPlanById(id as string);
      return asRecord(res);
    },
  });

  const plan = q.data ?? null;
  const features = asArray<string>(plan?.features).map((f) => str(f)).filter(Boolean);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['subscription-plan', id] });
    queryClient.invalidateQueries({ queryKey: ['admin', 'subscriptions'] });
    queryClient.invalidateQueries({ queryKey: ['admin', 'subscription-stats'] });
  };

  void invalidate;

  const status = str(plan?.status, 'unknown');

  return (
    <div>
      <button
        onClick={() => navigate('/subscriptions')}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          background: 'transparent',
          border: 'none',
          color: 'var(--admin-text-muted)',
          cursor: 'pointer',
          padding: 0,
          marginBottom: 16,
          fontSize: 13,
        }}
      >
        <Icon name="arrowLeft" size={16} />
        <span>Back to Subscriptions</span>
      </button>

      {q.isLoading ? (
        <p style={{ color: 'var(--admin-text-muted)' }}>Loading plan…</p>
      ) : q.isError ? (
        <p style={{ color: 'var(--admin-red)' }}>
          Failed to load plan: {(q.error as Error).message}
        </p>
      ) : !plan || !plan.id ? (
        <p style={{ color: 'var(--admin-text-muted)' }}>Plan not found.</p>
      ) : (
        <>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              marginBottom: 20,
              flexWrap: 'wrap',
            }}
          >
            <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--admin-text)', margin: 0 }}>
              {str(plan.name, 'Unnamed plan')}
            </h1>
            <span
              style={{
                padding: '3px 10px',
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 600,
                textTransform: 'uppercase',
                color: TIER_COLORS[str(plan.tier)] || 'var(--admin-text-muted)',
                backgroundColor: `${TIER_COLORS[str(plan.tier)] || 'var(--admin-text-muted)'}20`,
              }}
            >
              {str(plan.tier, 'standard')}
            </span>
            <span
              style={{
                padding: '3px 12px',
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 600,
                textTransform: 'capitalize',
                backgroundColor:
                  status === 'active' ? 'rgba(13,59,46,0.2)' : 'rgba(154,138,122,0.2)',
                color: status === 'active' ? 'var(--admin-green)' : 'var(--admin-text-muted)',
              }}
            >
              {status}
            </span>
          </div>

          {actionError && (
            <p style={{ color: 'var(--admin-red)', marginBottom: 12 }}>{actionError}</p>
          )}

          {str(plan.description) && (
            <p
              style={{
                color: 'var(--admin-text-muted)',
                fontSize: 14,
                marginBottom: 24,
                maxWidth: 640,
              }}
            >
              {str(plan.description)}
            </p>
          )}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: 16,
              marginBottom: 24,
            }}
          >
            <Field label="Price">
              {num(plan.price).toLocaleString(undefined, {
                style: 'currency',
                currency: str(plan.currency, 'NGN'),
              })}
            </Field>
            <Field label="Duration">{num(plan.durationDays)} days</Field>
            <Field label="Subscribers">{num(plan.subscriberCount).toLocaleString()}</Field>
            <Field label="Max content access">
              {plan.maxContentAccess === undefined || plan.maxContentAccess === null
                ? 'Unlimited'
                : num(plan.maxContentAccess).toLocaleString()}
            </Field>
            <Field label="Max users">
              {plan.maxUsers === undefined || plan.maxUsers === null
                ? 'Unlimited'
                : num(plan.maxUsers).toLocaleString()}
            </Field>
            <Field label="Currency">{str(plan.currency, 'NGN')}</Field>
          </div>

          {features.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <Field label="Features">
                <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {features.map((f, i) => (
                    <li key={`${i}-${f}`}>{f}</li>
                  ))}
                </ul>
              </Field>
            </div>
          )}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 16,
              color: 'var(--admin-text-muted)',
              fontSize: 12,
            }}
          >
            <Field label="Plan ID">
              <code style={{ fontSize: 12 }}>{plan.id}</code>
            </Field>
            <Field label="Created">
              {plan.createdAt ? new Date(str(plan.createdAt)).toLocaleString() : '-'}
            </Field>
            <Field label="Updated">
              {plan.updatedAt ? new Date(str(plan.updatedAt)).toLocaleString() : '-'}
            </Field>
          </div>
        </>
      )}
    </div>
  );
}
