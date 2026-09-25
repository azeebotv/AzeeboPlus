import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { creatorApi } from '@/lib/api/creator';
import type { MonetizationData, MonetizationTier } from '@/lib/creator-types';
import { formatNgn, errorTextStyle } from '@/lib/ui';

const EMPTY_TIER_FORM = { name: '', price: '', perks: '', isActive: true };

/** Split a comma/newline separated perk list into clean entries. */
function parsePerks(raw: string): string[] {
  return raw
    .split(/[,,\n]/)
    .map((p) => p.trim())
    .filter(Boolean);
}

const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: 8,
  border: '1px solid var(--creator-border)',
  backgroundColor: 'var(--creator-dark)',
  color: 'var(--creator-text)',
  fontSize: 14,
};

export default function MonetizationPage() {
  const queryClient = useQueryClient();
  const [tipEnabled, setTipEnabled] = useState(false);
  const [tipMin, setTipMin] = useState('1');
  const [tipMax, setTipMax] = useState('100');
  const [payoutMethod, setPayoutMethod] = useState('bank_transfer');
  const [tipValidationError, setTipValidationError] = useState<string | null>(null);
  const [tierForm, setTierForm] = useState(EMPTY_TIER_FORM);
  const [tierFormError, setTierFormError] = useState<string | null>(null);
  const [editingTierId, setEditingTierId] = useState<string | null>(null);
  const [showTierForm, setShowTierForm] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['creator', 'monetization'],
    queryFn: async () => {
      const res = await creatorApi.getMonetization();
      if (res.success && res.data) {
        const d = res.data as MonetizationData;
        setTipEnabled(d.tipEnabled);
        setTipMin(String(d.tipMin));
        setTipMax(String(d.tipMax));
        setPayoutMethod(d.payoutMethod);
        return d;
      }
      return null;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await creatorApi.updateMonetization({
        tipEnabled,
        tipMin: Number(tipMin),
        tipMax: Number(tipMax),
        payoutMethod,
      });
      return creatorApi.assertSuccess<MonetizationData>(res);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['creator', 'monetization'] }),
  });

  const tiersQuery = useQuery({
    queryKey: ['creator', 'monetization', 'tiers'],
    queryFn: async () => {
      const res = await creatorApi.listTiers();
      return res.success && res.data ? (res.data as MonetizationTier[]) : [];
    },
  });
  const tiers = tiersQuery.data ?? [];

  const resetTierForm = () => {
    setTierForm(EMPTY_TIER_FORM);
    setEditingTierId(null);
    setTierFormError(null);
    setShowTierForm(false);
  };

  const startEditTier = (tier: MonetizationTier) => {
    setEditingTierId(tier.id);
    setTierForm({
      name: tier.name,
      price: String(tier.price),
      perks: tier.perks.join(', '),
      isActive: tier.isActive ?? true,
    });
    setTierFormError(null);
    setShowTierForm(true);
  };

  const submitTier = useMutation({
    mutationFn: async () => {
      const payload = {
        name: tierForm.name.trim(),
        price: Number(tierForm.price),
        perks: parsePerks(tierForm.perks),
        isActive: tierForm.isActive,
      };
      if (editingTierId) {
        const res = await creatorApi.updateTier(editingTierId, payload);
        return creatorApi.assertSuccess<MonetizationTier>(res);
      }
      const res = await creatorApi.createTier(payload);
      return creatorApi.assertSuccess<MonetizationTier>(res);
    },
    onSuccess: () => {
      resetTierForm();
      queryClient.invalidateQueries({ queryKey: ['creator', 'monetization'] });
    },
  });

  const deleteTier = useMutation({
    mutationFn: async (id: string) => {
      const res = await creatorApi.deleteTier(id);
      return creatorApi.assertSuccess<{ success: boolean }>(res);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['creator', 'monetization'] }),
  });

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Monetization</h1>
      <p style={{ color: 'var(--creator-text-muted)', marginBottom: 24 }}>
        Configure subscriptions, tips, and payout settings
      </p>

      {isLoading ? (
        <p style={{ color: 'var(--creator-text-muted)', textAlign: 'center', padding: 40 }}>
          Loading...
        </p>
      ) : (
        <div style={{ maxWidth: 700 }}>
          {/* Subscription Tiers */}
          <div
            style={{
              padding: 20,
              borderRadius: 12,
              border: '1px solid var(--creator-border)',
              backgroundColor: 'rgba(26,10,10,0.5)',
              marginBottom: 16,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
              }}
            >
              <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Subscription Tiers</h3>
              {!showTierForm && (
                <button
                  onClick={() => {
                    setEditingTierId(null);
                    setTierForm({ name: '', price: '', perks: '', isActive: true });
                    setShowTierForm(true);
                  }}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--creator-border)',
                    background: 'transparent',
                    color: 'var(--creator-text)',
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  + New Tier
                </button>
              )}
            </div>

            {/* Create / edit form */}
            {showTierForm && (
              <div
                style={{
                  padding: 14,
                  borderRadius: 10,
                  border: '1px solid var(--creator-border)',
                  backgroundColor: 'var(--creator-dark)',
                  marginBottom: 16,
                }}
              >
                <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                  <div style={{ flex: 2 }}>
                    <label
                      style={{
                        display: 'block',
                        fontSize: 12,
                        color: 'var(--creator-text-muted)',
                        marginBottom: 4,
                      }}
                    >
                      Tier Name
                    </label>
                    <input
                      value={tierForm.name}
                      onChange={(e) => setTierForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="e.g. Supporter"
                      maxLength={50}
                      style={inputStyle}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label
                      style={{
                        display: 'block',
                        fontSize: 12,
                        color: 'var(--creator-text-muted)',
                        marginBottom: 4,
                      }}
                    >
                      Price (₦/mo)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={tierForm.price}
                      onChange={(e) => setTierForm((f) => ({ ...f, price: e.target.value }))}
                      placeholder="500"
                      style={inputStyle}
                    />
                  </div>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 12,
                      color: 'var(--creator-text-muted)',
                      marginBottom: 4,
                    }}
                  >
                    Perks (comma separated, up to 10)
                  </label>
                  <input
                    value={tierForm.perks}
                    onChange={(e) => setTierForm((f) => ({ ...f, perks: e.target.value }))}
                    placeholder="Early access, Behind the scenes, Discord role"
                    style={inputStyle}
                  />
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      fontSize: 13,
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={tierForm.isActive}
                      onChange={(e) => setTierForm((f) => ({ ...f, isActive: e.target.checked }))}
                    />
                    Active (visible to fans)
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={resetTierForm}
                      style={{
                        padding: '6px 14px',
                        borderRadius: 8,
                        border: '1px solid var(--creator-border)',
                        background: 'transparent',
                        color: 'var(--creator-text)',
                        fontSize: 13,
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        const price = Number(tierForm.price);
                        if (!tierForm.name.trim()) {
                          setTierFormError('Tier name is required.');
                          return;
                        }
                        if (!Number.isFinite(price) || price < 0) {
                          setTierFormError('Price must be a non-negative number.');
                          return;
                        }
                        setTierFormError(null);
                        submitTier.mutate();
                      }}
                      disabled={submitTier.isPending}
                      style={{
                        padding: '6px 14px',
                        borderRadius: 8,
                        border: 'none',
                        background: 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)',
                        color: 'white',
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {submitTier.isPending
                        ? 'Saving...'
                        : editingTierId
                          ? 'Save Changes'
                          : 'Create Tier'}
                    </button>
                  </div>
                </div>
                {tierFormError && (
                  <p style={{ ...errorTextStyle(), marginTop: 8 }} role="alert">
                    {tierFormError}
                  </p>
                )}
                {submitTier.isError && (
                  <p style={errorTextStyle()} role="alert">
                    {creatorApi.errorMessage(submitTier.error)}
                  </p>
                )}
              </div>
            )}

            {tiersQuery.isLoading ? (
              <p style={{ color: 'var(--creator-text-muted)', fontSize: 13 }}>Loading tiers...</p>
            ) : tiers.length > 0 ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: 12,
                }}
              >
                {tiers.map((tier: MonetizationTier) => (
                  <div
                    key={tier.id}
                    style={{
                      padding: 16,
                      borderRadius: 10,
                      border: '1px solid var(--creator-border)',
                      backgroundColor: 'var(--creator-dark)',
                      opacity: tier.isActive ? 1 : 0.55,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 4,
                      }}
                    >
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{tier.name}</div>
                      {!tier.isActive && (
                        <span
                          style={{
                            fontSize: 10,
                            padding: '2px 6px',
                            borderRadius: 6,
                            backgroundColor: 'rgba(245,158,11,0.2)',
                            color: 'var(--creator-amber, #f59e0b)',
                          }}
                        >
                          Inactive
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
                      {formatNgn(tier.price)}
                      <span
                        style={{
                          fontSize: 13,
                          color: 'var(--creator-text-muted)',
                          fontWeight: 400,
                        }}
                      >
                        /mo
                      </span>
                    </div>
                    <div
                      style={{ fontSize: 12, color: 'var(--creator-text-muted)', marginBottom: 8 }}
                    >
                      {tier.subscriberCount} subscriber{tier.subscriberCount === 1 ? '' : 's'}
                    </div>
                    {tier.perks.length > 0 && (
                      <ul style={{ margin: 0, padding: 0, listStyle: 'none', marginBottom: 8 }}>
                        {tier.perks.map((perk, i) => (
                          <li
                            key={i}
                            style={{
                              fontSize: 12,
                              color: 'var(--creator-text-muted)',
                              padding: '2px 0',
                            }}
                          >
                            + {perk}
                          </li>
                        ))}
                      </ul>
                    )}
                    <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                      <button
                        onClick={() => startEditTier(tier)}
                        style={{
                          flex: 1,
                          padding: '5px 0',
                          borderRadius: 7,
                          border: '1px solid var(--creator-border)',
                          background: 'transparent',
                          color: 'var(--creator-text)',
                          fontSize: 12,
                          cursor: 'pointer',
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          if (
                            window.confirm(`Delete tier "${tier.name}"? This cannot be undone.`)
                          ) {
                            deleteTier.mutate(tier.id);
                          }
                        }}
                        disabled={deleteTier.isPending}
                        title={
                          tier.subscriberCount > 0
                            ? 'Tier has active subscribers — deactivate instead'
                            : 'Delete tier'
                        }
                        style={{
                          flex: 1,
                          padding: '5px 0',
                          borderRadius: 7,
                          border: '1px solid var(--creator-border)',
                          background: 'transparent',
                          color: 'var(--creator-red)',
                          fontSize: 12,
                          cursor: 'pointer',
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--creator-text-muted)', fontSize: 13 }}>
                No subscription tiers yet. Click “+ New Tier” to create your first one.
              </p>
            )}
            {deleteTier.isError && (
              <p style={{ ...errorTextStyle(), marginTop: 8 }} role="alert">
                {creatorApi.errorMessage(deleteTier.error)}
              </p>
            )}
          </div>

          {/* Tip Settings */}
          <div
            style={{
              padding: 20,
              borderRadius: 12,
              border: '1px solid var(--creator-border)',
              backgroundColor: 'rgba(26,10,10,0.5)',
              marginBottom: 16,
            }}
          >
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Tip Settings</h3>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
              }}
            >
              <div>
                <div style={{ fontSize: 14 }}>Enable Tips</div>
                <div style={{ fontSize: 12, color: 'var(--creator-text-muted)' }}>
                  Allow fans to send one-time tips
                </div>
              </div>
              <button
                onClick={() => setTipEnabled(!tipEnabled)}
                style={{
                  width: 44,
                  height: 24,
                  borderRadius: 12,
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: tipEnabled ? 'var(--creator-orange)' : 'var(--creator-surface)',
                  position: 'relative',
                  transition: 'background-color 0.2s',
                }}
              >
                <div
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    backgroundColor: 'var(--creator-surface-light)',
                    position: 'absolute',
                    top: 3,
                    left: tipEnabled ? 23 : 3,
                    transition: 'left 0.2s',
                  }}
                />
              </button>
            </div>
            {tipEnabled && (
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 13,
                      color: 'var(--creator-text-muted)',
                      marginBottom: 6,
                    }}
                  >
                    Min Tip (₦)
                  </label>
                  <input
                    type="number"
                    value={tipMin}
                    onChange={(e) => setTipMin(e.target.value)}
                    min="1"
                    style={inputStyle}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 13,
                      color: 'var(--creator-text-muted)',
                      marginBottom: 6,
                    }}
                  >
                    Max Tip (₦)
                  </label>
                  <input
                    type="number"
                    value={tipMax}
                    onChange={(e) => setTipMax(e.target.value)}
                    min="1"
                    style={inputStyle}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Payout Method */}
          <div
            style={{
              padding: 20,
              borderRadius: 12,
              border: '1px solid var(--creator-border)',
              backgroundColor: 'rgba(26,10,10,0.5)',
              marginBottom: 16,
            }}
          >
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Payout Method</h3>
            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 13,
                  color: 'var(--creator-text-muted)',
                  marginBottom: 6,
                }}
              >
                Method
              </label>
              <select
                value={payoutMethod}
                onChange={(e) => setPayoutMethod(e.target.value)}
                style={inputStyle}
              >
                <option value="bank_transfer">Bank Transfer</option>
                <option value="paypal">PayPal</option>
                <option value="crypto">Crypto</option>
              </select>
            </div>
            {data?.payoutDetails && Object.keys(data.payoutDetails).length > 0 && (
              <div
                style={{
                  padding: 12,
                  borderRadius: 8,
                  backgroundColor: 'var(--creator-dark)',
                  border: '1px solid var(--creator-border)',
                }}
              >
                <p style={{ fontSize: 12, color: 'var(--creator-text-muted)', marginBottom: 8 }}>
                  Current Details
                </p>
                {Object.entries(data.payoutDetails).map(([key, val]) => (
                  <div
                    key={key}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: 13,
                      padding: '3px 0',
                    }}
                  >
                    <span
                      style={{ color: 'var(--creator-text-muted)', textTransform: 'capitalize' }}
                    >
                      {key.replace(/_/g, ' ')}
                    </span>
                    <span>{val}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pricing Summary */}
          <div
            style={{
              padding: 20,
              borderRadius: 12,
              border: '1px solid var(--creator-border)',
              backgroundColor: 'rgba(26,10,10,0.5)',
              marginBottom: 24,
            }}
          >
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Pricing Summary</h3>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '6px 0',
                borderBottom: '1px solid var(--creator-border-light)',
              }}
            >
              <span style={{ fontSize: 14, color: 'var(--creator-text-muted)' }}>
                Subscription Tiers
              </span>
              <span style={{ fontSize: 14 }}>{data?.tiers?.length || 0} active</span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '6px 0',
                borderBottom: '1px solid var(--creator-border-light)',
              }}
            >
              <span style={{ fontSize: 14, color: 'var(--creator-text-muted)' }}>Tips</span>
              <span
                style={{
                  fontSize: 14,
                  color: tipEnabled ? 'var(--creator-green)' : 'var(--creator-text-muted)',
                }}
              >
                {tipEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              if (tipEnabled) {
                const minNum = Number(tipMin);
                const maxNum = Number(tipMax);
                if (!Number.isFinite(minNum) || minNum < 0) {
                  setTipValidationError('Minimum tip must be a non-negative number.');
                  return;
                }
                if (!Number.isFinite(maxNum) || maxNum < minNum) {
                  setTipValidationError('Maximum tip cannot be less than the minimum tip.');
                } else {
                  setTipValidationError(null);
                  saveMutation.mutate();
                }
              } else {
                setTipValidationError(null);
                saveMutation.mutate();
              }
            }}
            disabled={saveMutation.isPending}
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              border: 'none',
              background: 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)',
              color: 'white',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {saveMutation.isPending ? 'Saving...' : 'Save Monetization Settings'}
          </button>
          {tipValidationError && (
            <p style={{ ...errorTextStyle(), marginTop: 8 }} role="alert">
              {tipValidationError}
            </p>
          )}
          {saveMutation.isSuccess && (
            <p style={{ color: 'var(--creator-green)', fontSize: 13, marginTop: 8 }}>
              Settings saved successfully
            </p>
          )}
          {saveMutation.isError && (
            <p style={errorTextStyle()}>{creatorApi.errorMessage(saveMutation.error)}</p>
          )}
        </div>
      )}
    </div>
  );
}
