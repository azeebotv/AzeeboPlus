'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import AdminLayout from '@/components/layout/AdminLayout';
import { Skeleton, ErrorState } from '@azeebo/ui/web';

interface FinancialTransaction {
  description?: string;
  type?: string;
  amount?: number;
  createdAt?: string;
}

export default function AdminFinancialPage(): React.JSX.Element {
  const router = useRouter();
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const isEnabled = !authLoading && !!isAuthenticated && !!user && user.role === 'admin';

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'financial'],
    queryFn: async () => {
      const [dashRes, walletRes] = await Promise.all([
        api.admin.getDashboard(),
        api.admin.getWallets(1, 10),
      ]);
      const result = { totalRevenue: 0, monthlyRevenue: 0, pendingPayouts: 0, totalPayouts: 0, recentTransactions: [] as FinancialTransaction[] };
      if (dashRes.success && dashRes.data) {
        const d = dashRes.data as { totalRevenue?: number };
        result.totalRevenue = d.totalRevenue || 0;
        result.monthlyRevenue = d.totalRevenue || 0;
      }
      if (walletRes.success && walletRes.data) {
        const w = walletRes.data as FinancialTransaction[] | { items?: FinancialTransaction[] };
        result.recentTransactions = Array.isArray(w) ? w : (w.items || []);
      }
      return result;
    },
    enabled: isEnabled,
  });

  const fin = data || { totalRevenue: 0, monthlyRevenue: 0, pendingPayouts: 0, totalPayouts: 0, recentTransactions: [] as FinancialTransaction[] };

  return (
    <AdminLayout>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Financial Overview</h1>
      <p style={{ color: '#9A8A7A', marginBottom: 32 }}>Revenue, payouts, and financial metrics</p>

      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="az-glass" style={{ padding: 20, borderRadius: 16 }}>
              <Skeleton width="60%" height="12px" className="mb-2" />
              <Skeleton width="50%" height="22px" />
            </div>
          ))}
        </div>
      ) : error ? (
        <ErrorState title="Failed to load financial data" description="Please try again later" onButtonPress={() => router.refresh()} />
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
            {[
              { label: 'Total Revenue', value: `₦${fin.totalRevenue.toLocaleString()}`, color: '#0D3B2E' },
              { label: 'Monthly Revenue', value: `₦${fin.monthlyRevenue.toLocaleString()}`, color: '#E8420A' },
              { label: 'Pending Payouts', value: `₦${fin.pendingPayouts.toLocaleString()}`, color: '#F59E0B' },
              { label: 'Total Paid Out', value: `₦${fin.totalPayouts.toLocaleString()}`, color: '#9A8A7A' },
            ].map((stat, i) => (
              <div key={i} className="az-glass" style={{ padding: 20, borderRadius: 16 }}>
                <p style={{ fontSize: 12, color: '#9A8A7A', marginBottom: 8 }}>{stat.label}</p>
                <p style={{ fontSize: 22, fontWeight: 700, color: stat.color }}>{stat.value}</p>
              </div>
            ))}
          </div>

          {fin.recentTransactions.length > 0 && (
            <div className="az-glass" style={{ padding: 24, borderRadius: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Recent Transactions</h2>
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
                      <p style={{ fontWeight: 600, fontSize: 14 }}>{tx.description || tx.type}</p>
                      <p style={{ color: '#9A8A7A', fontSize: 12 }}>{new Date(tx.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span
                      style={{
                        fontWeight: 700,
                        color: tx.type === 'deposit' || tx.type === 'subscription' ? '#0D3B2E' : '#CC1C1C',
                      }}
                    >
                      {tx.type === 'deposit' || tx.type === 'subscription' ? '+' : '-'}₦{(tx.amount || 0).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </AdminLayout>
  );
}
