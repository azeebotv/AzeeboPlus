import type { Dispatch, SetStateAction } from 'react';

interface PromoFormState {
  code: string;
  discountType: 'percent' | 'flat';
  discountValue: string;
  maxUses: string;
  expiresAt: string;
}

interface PromoModalProps {
  form: PromoFormState;
  setForm: Dispatch<SetStateAction<PromoFormState>>;
  error: string | null;
  onClose: () => void;
  onSubmit: () => void;
  creating: boolean;
}

export function PromoModal({ form, setForm, error, onClose, onSubmit, creating }: PromoModalProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="promo-dialog-title"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--admin-dark)',
          border: '1px solid var(--admin-card)',
          borderRadius: 16,
          padding: 24,
          width: '90%',
          maxWidth: 420,
        }}
      >
        <h3 id="promo-dialog-title" style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
          Create Promo Code
        </h3>

        <div style={{ marginBottom: 14 }}>
          <label
            style={{
              display: 'block',
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--admin-text-muted)',
              marginBottom: 6,
            }}
          >
            Promo Code
          </label>
          <input
            type="text"
            placeholder="e.g. SUMMER50"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid var(--admin-card)',
              backgroundColor: 'var(--admin-surface)',
              color: 'var(--admin-text)',
              fontFamily: 'monospace',
              fontWeight: 600,
              fontSize: 14,
            }}
          />
        </div>

        <div
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}
        >
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--admin-text-muted)',
                marginBottom: 6,
              }}
            >
              Discount Type
            </label>
            <select
              value={form.discountType}
              onChange={(e) =>
                setForm({
                  ...form,
                  discountType: e.target.value as 'percent' | 'flat',
                })
              }
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid var(--admin-card)',
                backgroundColor: 'var(--admin-surface)',
                color: 'var(--admin-text)',
                fontSize: 13,
              }}
            >
              <option value="percent">Percentage (%)</option>
              <option value="flat">Flat Amount ($)</option>
            </select>
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--admin-text-muted)',
                marginBottom: 6,
              }}
            >
              Discount Value
            </label>
            <input
              type="number"
              min="1"
              value={form.discountValue}
              onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid var(--admin-card)',
                backgroundColor: 'var(--admin-surface)',
                color: 'var(--admin-text)',
                fontSize: 13,
              }}
            />
          </div>
        </div>

        <div
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}
        >
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--admin-text-muted)',
                marginBottom: 6,
              }}
            >
              Max Redemptions
            </label>
            <input
              type="number"
              min="1"
              placeholder="Unlimited"
              value={form.maxUses}
              onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid var(--admin-card)',
                backgroundColor: 'var(--admin-surface)',
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
                fontWeight: 600,
                color: 'var(--admin-text-muted)',
                marginBottom: 6,
              }}
            >
              Expires At
            </label>
            <input
              type="date"
              value={form.expiresAt}
              onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid var(--admin-card)',
                backgroundColor: 'var(--admin-surface)',
                color: 'var(--admin-text)',
                fontSize: 13,
              }}
            />
          </div>
        </div>

        {error && (
          <p
            role="alert"
            style={{ color: 'var(--admin-red)', fontSize: 12, margin: '0 0 12px' }}
          >
            {error}
          </p>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button
            onClick={() => onClose()}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: '1px solid var(--admin-card)',
              backgroundColor: 'transparent',
              color: 'var(--admin-text-muted)',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={!form.code || creating}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              backgroundColor: 'var(--admin-orange)',
              color: 'white',
              fontWeight: 600,
              fontSize: 13,
              cursor: !form.code ? 'not-allowed' : 'pointer',
              opacity: !form.code ? 0.5 : 1,
            }}
          >
            {creating ? 'Creating...' : 'Create Code'}
          </button>
        </div>
      </div>
    </div>
  );
}
