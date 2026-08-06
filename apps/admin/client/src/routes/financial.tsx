import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';

export default function FinancialPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'financial'],
    queryFn: async () => {
      const [dashRes, walletRes] = await Promise.all([
        adminApi.getDashboard(),
        adminApi.getWallets(1, 10),
      ]);
      return {
        totalRevenue: dashRes.success
          ? (dashRes.data as { totalRevenue?: number })?.totalRevenue || 0
          : 0,
        recentTransactions: walletRes.success
          ? (
              walletRes.data as {
                items?: Array<{ description?: string; amount?: number; createdAt?: string }>;
              }
            )?.items || []
          : [],
      };
    },
  });

  const fin = data || { totalRevenue: 0, recentTransactions: [] };

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Financial Overview</h1>
      <p style={{ color: '#9A8A7A', marginBottom: 32 }}>Revenue, payouts, and financial metrics</p>

      {isLoading ? (
        <p style={{ color: '#9A8A7A', textAlign: 'center', padding: 40 }}>Loading...</p>
      ) : (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 16,
              marginBottom: 32,
            }}
          >
            <div
              style={{
                padding: 20,
                borderRadius: 16,
                border: '1px solid #2A1A1A',
                backgroundColor: 'rgba(26,10,10,0.5)',
              }}
            >
              <p style={{ fontSize: 12, color: '#9A8A7A', marginBottom: 8 }}>Total Revenue</p>
              <p style={{ fontSize: 22, fontWeight: 700, color: '#0D3B2E' }}>
                ₦{fin.totalRevenue.toLocaleString()}
              </p>
            </div>
          </div>

          {fin.recentTransactions.length > 0 && (
            <div
              style={{
                padding: 24,
                borderRadius: 20,
                border: '1px solid #2A1A1A',
                backgroundColor: 'rgba(26,10,10,0.5)',
              }}
            >
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
                Recent Transactions
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {fin.recentTransactions.map((tx, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 0',
                      borderBottom: '1px solid #2A1A1A',
                    }}
                  >
                    <div>
                      <p style={{ fontWeight: 600, fontSize: 14 }}>
                        {tx.description || 'Transaction'}
                      </p>
                      <p style={{ color: '#9A8A7A', fontSize: 12 }}>
                        {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : ''}
                      </p>
                    </div>
                    <span style={{ fontWeight: 700, color: '#0D3B2E' }}>
                      ₦{(tx.amount || 0).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
