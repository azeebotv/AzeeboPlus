import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import type { PaymentGateway, WebhookEvent } from '@/lib/admin-types';
import { Icon } from '@/components/Icons';

export default function PaymentGatewaysPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<PaymentGateway | null>(null);
  const [expandedGatewayId, setExpandedGatewayId] = useState<string | null>(null);
  const [webhooksMap, setWebhooksMap] = useState<Record<string, WebhookEvent[]>>({});
  const [loadingWebhooks, setLoadingWebhooks] = useState<string | null>(null);

  const fetchWebhooks = async (id: string) => {
    if (expandedGatewayId === id) {
      setExpandedGatewayId(null);
      return;
    }
    setExpandedGatewayId(id);
    if (!webhooksMap[id]) {
      setLoadingWebhooks(id);
      try {
        const res = await adminApi.getGatewayWebhooks(id, 20);
        if (res.success && res.data) {
          setWebhooksMap((prev) => ({
            ...prev,
            [id]: (res.data as { items: WebhookEvent[] }).items || [],
          }));
        }
      } catch (err) {
        setWebhooksMap((prev) => ({ ...prev, [id]: [] }));
      } finally {
        setLoadingWebhooks(null);
      }
    }
  };
  const [form, setForm] = useState({ provider: '', name: '', mode: 'test' as 'live' | 'test' });

  const {
    data: gateways = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['admin', 'payment-gateways'],
    queryFn: async () => {
      const res = await adminApi.getPaymentGateways();
      // The endpoint returns a dashboard envelope {items, recentIntents,
      // total} — cast the items array out (an unguarded cast of res.data
      // crashed this page: `gateways.map is not a function`).
      if (!res.success) return [];
      const d = res.data as unknown;
      const list: unknown[] = Array.isArray(d)
        ? d
        : Array.isArray((d as { items?: unknown[] }).items)
          ? (d as { items: unknown[] }).items
          : [];
      return list.map((g) => {
        const rec = g as Record<string, unknown>;
        return {
          id: String(rec.id),
          // Backend sends provider (== id) and enabled; the page/type
          // contract uses isEnabled (type maps to the provider kind).
          provider: (rec.provider as string) ?? (rec.type as string) ?? String(rec.id),
          name: (rec.name as string) ?? String(rec.id),
          mode: ((rec.mode as string) === 'live' ? 'live' : 'test') as 'live' | 'test',
          isEnabled: (rec.isEnabled as boolean | undefined) ?? rec.enabled === true,
          config: (rec.config as Record<string, unknown>) ?? {},
          stats: rec.stats,
          createdAt: (rec.createdAt as string) ?? '',
          updatedAt: (rec.updatedAt as string) ?? '',
        } satisfies PaymentGateway & { stats?: unknown };
      });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isEnabled }: { id: string; isEnabled: boolean }) =>
      adminApi.togglePaymentGateway(id, isEnabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'payment-gateways'] });
    },
    onError: () => {
      window.alert('Failed to update gateway. Please try again.');
    },
  });

  const updateModeMutation = useMutation({
    mutationFn: ({ id, mode }: { id: string; mode: 'live' | 'test' }) =>
      adminApi.updateGatewayMode(id, mode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'payment-gateways'] });
    },
  });

  function closeModal() {
    setShowModal(false);
    setEditing(null);
    setForm({ provider: '', name: '', mode: 'test' });
  }

  function handleSave() {
    if (!editing) return;
    updateModeMutation.mutate(
      { id: editing.id, mode: form.mode },
      {
        onSuccess: () => {
          closeModal();
        },
      }
    );
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 24,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 700,
              marginBottom: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <Icon name="creditCard" size={28} color="var(--admin-orange)" />
            <span>Payment Gateways</span>
          </h1>
          <p style={{ color: 'var(--admin-text-muted)' }}>{gateways.length} gateways configured</p>
        </div>
      </div>

      {isError ? (
        <p style={{ color: 'var(--admin-red)', textAlign: 'center', padding: 40 }}>
          Failed to load payment gateways. Check that the admin backend is running.
        </p>
      ) : isLoading ? (
        <p style={{ color: 'var(--admin-text-muted)', textAlign: 'center', padding: 40 }}>
          Loading...
        </p>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 16,
          }}
        >
          {gateways.map((g) => (
            <div
              key={g.id}
              style={{
                padding: 20,
                borderRadius: 16,
                border: '1px solid var(--admin-card)',
                backgroundColor: 'var(--admin-surface)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: 12,
                }}
              >
                <div>
                  <h3 style={{ fontWeight: 600, fontSize: 16 }}>{g.name}</h3>
                  <p style={{ color: 'var(--admin-text-muted)', fontSize: 13 }}>{g.provider}</p>
                </div>
                <label
                  style={{
                    position: 'relative',
                    display: 'inline-block',
                    width: 40,
                    height: 22,
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={g.isEnabled}
                    onChange={() => toggleMutation.mutate({ id: g.id, isEnabled: !g.isEnabled })}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span
                    style={{
                      position: 'absolute',
                      inset: 0,
                      borderRadius: 22,
                      transition: '0.3s',
                      backgroundColor: g.isEnabled ? 'var(--admin-emerald)' : 'var(--admin-card)',
                    }}
                  >
                    <span
                      style={{
                        position: 'absolute',
                        height: 18,
                        width: 18,
                        borderRadius: '50%',
                        top: 2,
                        transition: '0.3s',
                        backgroundColor: 'white',
                        left: g.isEnabled ? 20 : 2,
                      }}
                    />
                  </span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <span
                  style={{
                    padding: '3px 10px',
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 600,
                    backgroundColor:
                      g.mode === 'live' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                    color: g.mode === 'live' ? 'var(--admin-emerald)' : 'var(--admin-amber)',
                    textTransform: 'capitalize',
                  }}
                >
                  {g.mode}
                </span>
                <span
                  style={{
                    padding: '3px 10px',
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 600,
                    backgroundColor: g.isEnabled ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                    color: g.isEnabled ? 'var(--admin-emerald)' : 'var(--admin-red)',
                  }}
                >
                  {g.isEnabled ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => {
                    setEditing(g);
                    setForm({ provider: g.provider, name: g.name, mode: g.mode });
                    setShowModal(true);
                  }}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 8,
                    border: '1px solid var(--admin-border)',
                    background: 'transparent',
                    color: 'var(--admin-text)',
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  Configure
                </button>
                <button
                  onClick={() => toggleMutation.mutate({ id: g.id, isEnabled: !g.isEnabled })}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 8,
                    border: `1px solid ${g.isEnabled ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`,
                    background: 'transparent',
                    color: g.isEnabled ? 'var(--admin-red)' : 'var(--admin-emerald)',
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  {g.isEnabled ? 'Disable' : 'Enable'}
                </button>
                <button
                  onClick={() => fetchWebhooks(g.id)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 8,
                    border: '1px solid var(--admin-border)',
                    background: expandedGatewayId === g.id ? 'var(--admin-surface)' : 'transparent',
                    color: expandedGatewayId === g.id ? 'var(--admin-orange)' : 'var(--admin-text-muted)',
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  {expandedGatewayId === g.id ? 'Hide Logs' : 'Webhooks'}
                </button>
              </div>

              {/* Webhook Events Log Panel */}
              {expandedGatewayId === g.id && (
                <div
                  style={{
                    marginTop: 16,
                    paddingTop: 16,
                    borderTop: '1px solid var(--admin-card)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--admin-text)' }}>
                      Recent Webhook Events
                    </p>
                    <span style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>
                      {webhooksMap[g.id]?.length ?? 0} events
                    </span>
                  </div>

                  {loadingWebhooks === g.id ? (
                    <p style={{ fontSize: 12, color: 'var(--admin-text-muted)', textAlign: 'center', padding: 12 }}>
                      Loading events...
                    </p>
                  ) : (webhooksMap[g.id]?.length ?? 0) === 0 ? (
                    <p style={{ fontSize: 12, color: 'var(--admin-text-muted)', textAlign: 'center', padding: 12 }}>
                      No recent webhook events for this gateway.
                    </p>
                  ) : (
                    <div style={{ maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {webhooksMap[g.id]?.map((evt) => (
                        <div
                          key={evt.id}
                          style={{
                            padding: '8px 10px',
                            borderRadius: 8,
                            backgroundColor: 'var(--admin-dark)',
                            border: '1px solid rgba(255,255,255,0.05)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: 12,
                          }}
                        >
                          <div>
                            <span style={{ fontWeight: 600, color: 'var(--admin-text)' }}>
                              {evt.eventType}
                            </span>
                            <span style={{ color: 'var(--admin-text-muted)', marginLeft: 8 }}>
                              {evt.reference.slice(0, 14)}...
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontWeight: 600, color: 'var(--admin-emerald)' }}>
                              {evt.currency} {evt.amount.toLocaleString()}
                            </span>
                            <span
                              style={{
                                padding: '2px 6px',
                                borderRadius: 4,
                                fontSize: 10,
                                fontWeight: 600,
                                textTransform: 'uppercase',
                                backgroundColor:
                                  evt.status === 'success'
                                    ? 'rgba(16,185,129,0.2)'
                                    : evt.status === 'failed'
                                      ? 'rgba(239,68,68,0.2)'
                                      : 'rgba(245,158,11,0.2)',
                                color:
                                  evt.status === 'success'
                                    ? 'var(--admin-emerald)'
                                    : evt.status === 'failed'
                                      ? 'var(--admin-red)'
                                      : 'var(--admin-amber)',
                              }}
                            >
                              {evt.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          {gateways.length === 0 && (
            <p
              style={{
                textAlign: 'center',
                padding: 40,
                color: 'var(--admin-text-muted)',
                gridColumn: '1/-1',
              }}
            >
              No payment gateways configured
            </p>
          )}
        </div>
      )}

      {showModal && editing && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(4px)',
            padding: 16,
          }}
          onClick={closeModal}
        >
          <div
            style={{
              backgroundColor: 'var(--admin-surface)',
              borderRadius: 16,
              border: '1px solid var(--admin-card)',
              padding: 24,
              maxWidth: 480,
              width: '100%',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>
              Configure {editing.name}
            </h2>

            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 13,
                  color: 'var(--admin-text-muted)',
                  marginBottom: 6,
                }}
              >
                Display Name
              </label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--admin-border)',
                  backgroundColor: 'var(--admin-card)',
                  color: 'var(--admin-text)',
                  fontSize: 14,
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 13,
                  color: 'var(--admin-text-muted)',
                  marginBottom: 6,
                }}
              >
                Provider
              </label>
              <input
                value={form.provider}
                onChange={(e) => setForm({ ...form, provider: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--admin-border)',
                  backgroundColor: 'var(--admin-card)',
                  color: 'var(--admin-text)',
                  fontSize: 14,
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 13,
                  color: 'var(--admin-text-muted)',
                  marginBottom: 6,
                }}
              >
                Mode
              </label>
              <select
                value={form.mode}
                onChange={(e) => setForm({ ...form, mode: e.target.value as 'live' | 'test' })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--admin-border)',
                  backgroundColor: 'var(--admin-card)',
                  color: 'var(--admin-text)',
                  fontSize: 14,
                  outline: 'none',
                }}
              >
                <option value="test">Test</option>
                <option value="live">Live</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={handleSave}
                style={{
                  flex: 1,
                  padding: '12px 20px',
                  borderRadius: 10,
                  border: 'none',
                  background: 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                Save Configuration
              </button>
              <button
                onClick={closeModal}
                style={{
                  padding: '12px 20px',
                  borderRadius: 10,
                  border: '1px solid var(--admin-border)',
                  background: 'transparent',
                  color: 'var(--admin-text-muted)',
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
