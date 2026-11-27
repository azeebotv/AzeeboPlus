import type { Dispatch, SetStateAction } from 'react';
import type { SubscriptionPlan } from '@/lib/admin-types';

interface PlanFormState {
  name: string;
  description: string;
  price: string;
  currency: string;
  durationDays: string;
  tier: SubscriptionPlan['tier'];
  status: SubscriptionPlan['status'];
  features: string;
  maxContentAccess: string;
  maxUsers: string;
}

interface PlanModalProps {
  form: PlanFormState;
  setForm: Dispatch<SetStateAction<PlanFormState>>;
  formError: string | null;
  editingPlan: SubscriptionPlan | null;
  onClose: () => void;
  onSubmit: () => void;
  saving: boolean;
  tiers: string[];
  statuses: string[];
}

export function PlanModal({
  form,
  setForm,
  formError,
  editingPlan,
  onClose,
  onSubmit,
  saving,
  tiers,
  statuses,
}: PlanModalProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="plan-dialog-title"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100,
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'var(--admin-bg)',
          border: '1px solid var(--admin-surface)',
          borderRadius: 16,
          padding: 28,
          width: '100%',
          maxWidth: 520,
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="plan-dialog-title" style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>
          {editingPlan ? 'Edit Plan' : 'Create New Plan'}
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 12,
                color: 'var(--admin-text-muted)',
                marginBottom: 4,
              }}
            >
              Name *
            </label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Premium Monthly"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid var(--admin-surface)',
                backgroundColor: 'var(--admin-dark)',
                color: 'var(--admin-text)',
                fontSize: 13,
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: 12,
                color: 'var(--admin-text-muted)',
                marginBottom: 4,
              }}
            >
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Brief description of this plan"
              rows={2}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid var(--admin-surface)',
                backgroundColor: 'var(--admin-dark)',
                color: 'var(--admin-text)',
                fontSize: 13,
                resize: 'vertical',
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 12,
                  color: 'var(--admin-text-muted)',
                  marginBottom: 4,
                }}
              >
                Price *
              </label>
              <input
                type="number"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="0.00"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--admin-surface)',
                  backgroundColor: 'var(--admin-dark)',
                  color: 'var(--admin-text)',
                  fontSize: 13,
                }}
              />
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 12,
                  color: 'var(--admin-text-muted)',
                  marginBottom: 4,
                }}
              >
                Currency
              </label>
              <select
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--admin-surface)',
                  backgroundColor: 'var(--admin-dark)',
                  color: 'var(--admin-text)',
                  fontSize: 13,
                }}
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="NGN">NGN</option>
                <option value="KES">KES</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 12,
                  color: 'var(--admin-text-muted)',
                  marginBottom: 4,
                }}
              >
                Duration (days) *
              </label>
              <input
                type="number"
                value={form.durationDays}
                onChange={(e) => setForm({ ...form, durationDays: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--admin-surface)',
                  backgroundColor: 'var(--admin-dark)',
                  color: 'var(--admin-text)',
                  fontSize: 13,
                }}
              />
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 12,
                  color: 'var(--admin-text-muted)',
                  marginBottom: 4,
                }}
              >
                Tier
              </label>
              <select
                value={form.tier}
                onChange={(e) =>
                  setForm({ ...form, tier: e.target.value as SubscriptionPlan['tier'] })
                }
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--admin-surface)',
                  backgroundColor: 'var(--admin-dark)',
                  color: 'var(--admin-text)',
                  fontSize: 13,
                }}
              >
                {tiers.map((t) => (
                  <option key={t} value={t}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: 12,
                color: 'var(--admin-text-muted)',
                marginBottom: 4,
              }}
            >
              Features (comma-separated)
            </label>
            <input
              value={form.features}
              onChange={(e) => setForm({ ...form, features: e.target.value })}
              placeholder="e.g. HD Streaming, No Ads, Exclusive Content"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid var(--admin-surface)',
                backgroundColor: 'var(--admin-dark)',
                color: 'var(--admin-text)',
                fontSize: 13,
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 12,
                  color: 'var(--admin-text-muted)',
                  marginBottom: 4,
                }}
              >
                Max Content Access
              </label>
              <input
                type="number"
                value={form.maxContentAccess}
                onChange={(e) => setForm({ ...form, maxContentAccess: e.target.value })}
                placeholder="Unlimited"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--admin-surface)',
                  backgroundColor: 'var(--admin-dark)',
                  color: 'var(--admin-text)',
                  fontSize: 13,
                }}
              />
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 12,
                  color: 'var(--admin-text-muted)',
                  marginBottom: 4,
                }}
              >
                Max Users
              </label>
              <input
                type="number"
                value={form.maxUsers}
                onChange={(e) => setForm({ ...form, maxUsers: e.target.value })}
                placeholder="Unlimited"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--admin-surface)',
                  backgroundColor: 'var(--admin-dark)',
                  color: 'var(--admin-text)',
                  fontSize: 13,
                }}
              />
            </div>
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: 12,
                color: 'var(--admin-text-muted)',
                marginBottom: 4,
              }}
            >
              Status
            </label>
            <select
              value={form.status}
              onChange={(e) =>
                setForm({ ...form, status: e.target.value as SubscriptionPlan['status'] })
              }
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid var(--admin-surface)',
                backgroundColor: 'var(--admin-dark)',
                color: 'var(--admin-text)',
                fontSize: 13,
              }}
            >
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {formError && (
          <p role="alert" style={{ color: 'var(--admin-red)', fontSize: 13, marginTop: 16 }}>
            {formError}
          </p>
        )}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 24 }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              border: '1px solid var(--admin-surface)',
              background: 'transparent',
              color: 'var(--admin-text-muted)',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={saving}
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              border: 'none',
              background: 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)',
              color: 'white',
              fontWeight: 600,
              fontSize: 13,
              cursor:
                saving
                  ? 'not-allowed'
                  : 'pointer',
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving
              ? 'Saving...'
              : editingPlan
                ? 'Update Plan'
                : 'Create Plan'}
          </button>
        </div>
      </div>
    </div>
  );
}
