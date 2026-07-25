import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import type { PaymentGateway } from '@/lib/admin-types';

export default function PaymentGatewaysPage() {
  const { data: gateways = [], isLoading } = useQuery({
    queryKey: ['admin', 'payment-gateways'],
    queryFn: async () => {
      const res = await adminApi.getPaymentGateways();
      return res.success ? (res.data as PaymentGateway[]) : [];
    },
  });

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Payment Gateways</h1>
      <p style={{ color: '#9A8A7A', marginBottom: 24 }}>{gateways.length} gateways configured</p>

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
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    backgroundColor: g.isEnabled ? '#0D3B2E' : '#CC1C1C',
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
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
            </div>
          ))}
          {gateways.length === 0 && (
            <p style={{ textAlign: 'center', padding: 40, color: '#9A8A7A', gridColumn: '1/-1' }}>
              No payment gateways configured
            </p>
          )}
        </div>
      )}
    </div>
  );
}
