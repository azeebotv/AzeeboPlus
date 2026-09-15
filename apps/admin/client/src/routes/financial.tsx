import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import { Icon } from '@/components/Icons';

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
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Icon name="dollarSign" size={28} color="var(--admin-orange)" />
          <span>Financial Overview</span>
        </h1>
        <p style={{ color: 'var(--admin-text-muted)' }}>Revenue, payouts, and financial metrics</p>
      </div>

      {isLoading ? (
        <p style={{ color: 'var(--admin-text-muted)', textAlign: 'center', padding: 40 }}>Loading...</p>
      ) : (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: 16,
              marginBottom: 32,
            }}
          >
            <div
              style={{
                padding: 20,
                borderRadius: 16,
                border: '1px solid var(--admin-card)',
                backgroundColor: 'var(--admin-surface)',
              }}
            >
              <p style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginBottom: 8 }}>Total Revenue</p>
              <p style={{ fontSize: 24, fontWeight: 700, color: 'var(--admin-emerald)' }}>
                ₦{fin.totalRevenue.toLocaleString()}
              </p>
            </div>
          </div>

          {fin.recentTransactions.length > 0 && (
            <div
              style={{
                padding: 24,
                borderRadius: 20,
                border: '1px solid var(--admin-card)',
                backgroundColor: 'var(--admin-surface)',
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
                      borderBottom: '1px solid var(--admin-surface)',
                    }}
                  >
                    <div>
                      <p style={{ fontWeight: 600, fontSize: 14 }}>
                        {tx.description || 'Transaction'}
                      </p>
                      <p style={{ color: 'var(--admin-text-muted)', fontSize: 12 }}>
                        {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : ''}
                      </p>
                    </div>
                    <span style={{ fontWeight: 700, color: 'var(--admin-green)' }}>
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
