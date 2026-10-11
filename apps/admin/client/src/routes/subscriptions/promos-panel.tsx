import type { PromoCode } from '@/lib/admin-types';

interface PromosPanelProps {
  promoData: PromoCode[] | undefined;
  loadingPromos: boolean;
  promoError: boolean;
  refetchPromos: () => Promise<unknown>;
  onNewPromo: () => void;
  expirePromoMutation: { mutate: (id: string) => void; isPending: boolean };
  deletePromoMutation: { mutate: (id: string) => void; isPending: boolean };
}

export function PromosPanel({
  promoData,
  loadingPromos,
  promoError,
  refetchPromos,
  onNewPromo,
  expirePromoMutation,
  deletePromoMutation,
}: PromosPanelProps) {
  return (
    <div id="promo-codes-panel" role="tabpanel" aria-label="Promo codes">
      {loadingPromos ? (
        <p style={{ color: 'var(--admin-text-muted)', textAlign: 'center', padding: 40 }}>
          Loading promo codes...
        </p>
      ) : promoError ? (
        <div
          role="alert"
          style={{
            textAlign: 'center',
            padding: 48,
            border: '1px solid rgba(204,28,28,0.35)',
            borderRadius: 16,
            background: 'rgba(204,28,28,0.06)',
          }}
        >
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>Promo codes could not be loaded</h2>
          <p style={{ color: 'var(--admin-text-muted)', marginBottom: 16 }}>
            Try again or contact the subscription service owner.
          </p>
          <button
            type="button"
            onClick={() => void refetchPromos()}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: '1px solid var(--admin-orange)',
              background: 'transparent',
              color: 'var(--admin-orange)',
              cursor: 'pointer',
            }}
          >
            Retry
          </button>
        </div>
      ) : (promoData?.length ?? 0) === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: 60,
            border: '1px dashed var(--admin-card)',
            borderRadius: 16,
          }}
        >
          <p style={{ color: 'var(--admin-text-muted)', fontSize: 14, marginBottom: 12 }}>
            No promo codes created yet
          </p>
          <button
            onClick={() => onNewPromo()}
            style={{
              padding: '8px 18px',
              borderRadius: 8,
              border: 'none',
              background: 'var(--admin-orange)',
              color: 'white',
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Create Promo Code
          </button>
        </div>
      ) : (
        <div
          style={{
            borderRadius: 16,
            border: '1px solid var(--admin-card)',
            backgroundColor: 'var(--admin-surface)',
            overflow: 'hidden',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--admin-card)', textAlign: 'left' }}>
                  <th style={{ padding: '12px 16px', color: 'var(--admin-text-muted)' }}>
                    Code
                  </th>
                  <th style={{ padding: '12px 16px', color: 'var(--admin-text-muted)' }}>
                    Discount
                  </th>
                  <th style={{ padding: '12px 16px', color: 'var(--admin-text-muted)' }}>
                    Redemptions
                  </th>
                  <th style={{ padding: '12px 16px', color: 'var(--admin-text-muted)' }}>
                    Status
                  </th>
                  <th style={{ padding: '12px 16px', color: 'var(--admin-text-muted)' }}>
                    Expires
                  </th>
                  <th
                    style={{
                      padding: '12px 16px',
                      color: 'var(--admin-text-muted)',
                      textAlign: 'right',
                    }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {promoData?.map((p) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          fontFamily: 'monospace',
                          fontWeight: 700,
                          fontSize: 14,
                          color: 'var(--admin-orange)',
                          letterSpacing: 1,
                        }}
                      >
                        {p.code}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: '12px 16px',
                        fontWeight: 600,
                        color: 'var(--admin-emerald)',
                      }}
                    >
                      {p.discountType === 'percent'
                        ? `${p.discountValue}% OFF`
                        : `$${p.discountValue} OFF`}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--admin-text)' }}>
                      {p.usedCount} / {p.maxUses ? p.maxUses : '∞'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          backgroundColor:
                            p.status === 'active'
                              ? 'rgba(13,59,46,0.3)'
                              : 'rgba(204,28,28,0.2)',
                          color:
                            p.status === 'active' ? 'var(--admin-emerald)' : 'var(--admin-red)',
                        }}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--admin-text-muted)' }}>
                      {p.expiresAt ? new Date(p.expiresAt).toLocaleDateString() : 'Never'}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        {p.status === 'active' && (
                          <button
                            onClick={() => expirePromoMutation.mutate(p.id)}
                            disabled={expirePromoMutation.isPending}
                            style={{
                              padding: '4px 8px',
                              borderRadius: 6,
                              border: '1px solid var(--admin-card)',
                              backgroundColor: 'transparent',
                              color: 'var(--admin-amber)',
                              fontSize: 11,
                              cursor: 'pointer',
                            }}
                          >
                            Expire
                          </button>
                        )}
                        <button
                          onClick={() => deletePromoMutation.mutate(p.id)}
                          disabled={deletePromoMutation.isPending}
                          style={{
                            padding: '4px 8px',
                            borderRadius: 6,
                            border: '1px solid var(--admin-red)',
                            backgroundColor: 'transparent',
                            color: 'var(--admin-red)',
                            fontSize: 11,
                            cursor: 'pointer',
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
