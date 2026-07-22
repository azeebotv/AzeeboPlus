import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import type { AdminWallet } from '@/lib/admin-types';

export default function WalletsPage() {
  const { data: wallets = [], isLoading } = useQuery({
    queryKey: ['admin', 'wallets'],
    queryFn: async () => {
      const res = await adminApi.getWallets();
      if (res.success && res.data) {
        const d = res.data as AdminWallet[] | { items: AdminWallet[] };
        return Array.isArray(d) ? d : d.items || [];
      }
      return [];
    },
  });

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>User Wallets</h1>
      <p style={{ color: '#9A8A7A', marginBottom: 24 }}>{wallets.length} wallets</p>

      {isLoading ? (
        <p style={{ color: '#9A8A7A', textAlign: 'center', padding: 40 }}>Loading...</p>
      ) : (
        <div style={{ borderRadius: 16, border: '1px solid #2A1A1A', backgroundColor: 'rgba(26,10,10,0.5)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #2A1A1A' }}>
                  {['User', 'Balance', 'Currency', 'Status'].map((h) => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: '#9A8A7A', fontWeight: 600, fontSize: 12, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {wallets.map((w) => (
                  <tr key={w.id} style={{ borderBottom: '1px solid #1A0A0A' }}>
                    <td style={{ padding: '12px 16px' }}><p style={{ fontWeight: 600 }}>{w.userId}</p></td>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: '#E8420A' }}>₦{w.balance.toLocaleString()}</td>
                    <td style={{ padding: '12px 16px', color: '#9A8A7A' }}>{w.currency}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600, backgroundColor: w.status === 'active' ? 'rgba(13,59,46,0.2)' : 'rgba(204,28,28,0.2)', color: w.status === 'active' ? '#0D3B2E' : '#CC1C1C' }}>
                        {w.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {wallets.length === 0 && <p style={{ textAlign: 'center', padding: 40, color: '#9A8A7A' }}>No wallets found</p>}
        </div>
      )}
    </div>
  );
}
