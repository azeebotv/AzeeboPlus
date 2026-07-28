import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import type { PaymentGateway } from '@/lib/admin-types';

export default function PaymentGatewaysPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<PaymentGateway | null>(null);
  const [form, setForm] = useState({ provider: '', name: '', mode: 'test' as 'live' | 'test' });

  const { data: gateways = [], isLoading } = useQuery({
    queryKey: ['admin', 'payment-gateways'],
    queryFn: async () => {
      const res = await adminApi.getPaymentGateways();
      return res.success ? (res.data as PaymentGateway[]) : [];
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isEnabled }: { id: string; isEnabled: boolean }) =>
      adminApi.togglePaymentGateway(id, isEnabled),
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
    const payload = { ...form, config: { ...(editing.config || {}) } };
    adminApi.updateNotificationTemplate(editing.id, payload).then(() => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'payment-gateways'] });
      closeModal();
    });
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
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Payment Gateways</h1>
          <p style={{ color: '#9A8A7A' }}>{gateways.length} gateways configured</p>
        </div>
      </div>

      {isLoading ? (
        <p style={{ color: '#9A8A7A', textAlign: 'center', padding: 40 }}>Loading...</p>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 16,
          }}
        >
          {gateways.map((g) => (
            <div
              key={g.id}
              style={{
                padding: 20,
                borderRadius: 16,
                border: '1px solid #2A1A1A',
                backgroundColor: 'rgba(26,10,10,0.5)',
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
                  <p style={{ color: '#9A8A7A', fontSize: 13 }}>{g.provider}</p>
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
                      backgroundColor: g.isEnabled ? '#0D3B2E' : '#2A1A1A',
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
                        backgroundColor: '#fff',
                        left: g.isEnabled ? 20 : 2,
                      }}
                    />
                  </span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <span
                  style={{
                    padding: '3px 10px',
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 600,
                    backgroundColor:
                      g.mode === 'live' ? 'rgba(13,59,46,0.2)' : 'rgba(245,158,11,0.2)',
                    color: g.mode === 'live' ? '#0D3B2E' : '#F59E0B',
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
                    backgroundColor: g.isEnabled ? 'rgba(13,59,46,0.2)' : 'rgba(204,28,28,0.2)',
                    color: g.isEnabled ? '#0D3B2E' : '#CC1C1C',
                  }}
                >
                  {g.isEnabled ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={() => {
                    setEditing(g);
                    setForm({ provider: g.provider, name: g.name, mode: g.mode });
                    setShowModal(true);
                  }}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 8,
                    border: '1px solid #2A1A1A',
                    background: 'transparent',
                    color: '#9A8A7A',
                    fontSize: 12,
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
                    border: '1px solid rgba(13,59,46,0.3)',
                    background: 'transparent',
                    color: '#0D3B2E',
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  {g.isEnabled ? 'Disable' : 'Enable'}
                </button>
              </div>
            </div>
          ))}
          {gateways.length === 0 && (
            <p style={{ textAlign: 'center', padding: 40, color: '#9A8A7A', gridColumn: '1/-1' }}>
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
            backgroundColor: 'rgba(0,0,0,0.7)',
            padding: 16,
          }}
          onClick={closeModal}
        >
          <div
            style={{
              backgroundColor: '#1A0A0A',
              borderRadius: 16,
              border: '1px solid #2A1A1A',
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
              <label style={{ display: 'block', fontSize: 13, color: '#9A8A7A', marginBottom: 6 }}>
                Display Name
              </label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid #2A1A1A',
                  backgroundColor: '#0D0505',
                  color: '#F5F0EB',
                  fontSize: 14,
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, color: '#9A8A7A', marginBottom: 6 }}>
                Provider
              </label>
              <input
                value={form.provider}
                onChange={(e) => setForm({ ...form, provider: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid #2A1A1A',
                  backgroundColor: '#0D0505',
                  color: '#F5F0EB',
                  fontSize: 14,
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, color: '#9A8A7A', marginBottom: 6 }}>
                Mode
              </label>
              <select
                value={form.mode}
                onChange={(e) => setForm({ ...form, mode: e.target.value as 'live' | 'test' })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid #2A1A1A',
                  backgroundColor: '#0D0505',
                  color: '#F5F0EB',
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
                  color: '#fff',
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
                  border: '1px solid #2A1A1A',
                  background: 'transparent',
                  color: '#9A8A7A',
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
