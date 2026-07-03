'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import AdminLayout from '@/components/layout/AdminLayout';

export default function AdminFinancialPage(): React.JSX.Element {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const [financial, setFinancial] = useState({
    totalRevenue: 0,
    monthlyRevenue: 0,
    pendingPayouts: 0,
    totalPayouts: 0,
    recentTransactions: [] as any[],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !user || user.role !== 'admin') return;
    loadFinancial();
  }, [authLoading, isAuthenticated, user]);

  const loadFinancial = async () => {
    try {
      const [dashRes, walletRes] = await Promise.all([
        api.admin.getDashboard(),
        api.admin.getWallets(1, 10),
      ]);
      if (dashRes.success && dashRes.data) {
        const d = dashRes.data as any;
        setFinancial((prev) => ({
          ...prev,
          totalRevenue: d.totalRevenue || 0,
          monthlyRevenue: d.totalRevenue || 0,
        }));
      }
      if (walletRes.success && walletRes.data) {
        const w = walletRes.data as any;
        const items = w.items || w || [];
        setFinancial((prev) => ({
          ...prev,
          recentTransactions: Array.isArray(items) ? items : [],
        }));
      }
    } catch {
      /* ignore */
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminLayout>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Financial Overview</h1>
      <p style={{ color: '#9A8A7A', marginBottom: 32 }}>Revenue, payouts, and financial metrics</p>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div
            style={{
              width: 40,
              height: 40,
              border: '3px solid #2A1A1A',
              borderTopColor: '#E8420A',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }}
          />
        </div>
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
              {
                label: 'Total Revenue',
                value: `₦${financial.totalRevenue.toLocaleString()}`,
                color: '#0D3B2E',
              },
              {
                label: 'Monthly Revenue',
                value: `₦${financial.monthlyRevenue.toLocaleString()}`,
                color: '#E8420A',
              },
              {
                label: 'Pending Payouts',
                value: `₦${financial.pendingPayouts.toLocaleString()}`,
                color: '#F59E0B',
              },
              {
                label: 'Total Paid Out',
                value: `₦${financial.totalPayouts.toLocaleString()}`,
                color: '#9A8A7A',
              },
            ].map((stat, i) => (
              <div key={i} className="az-glass" style={{ padding: 20, borderRadius: 16 }}>
                <p style={{ fontSize: 12, color: '#9A8A7A', marginBottom: 8 }}>{stat.label}</p>
                <p style={{ fontSize: 22, fontWeight: 700, color: stat.color }}>{stat.value}</p>
              </div>
            ))}
          </div>

          {financial.recentTransactions.length > 0 && (
            <div className="az-glass" style={{ padding: 24, borderRadius: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
                Recent Transactions
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {financial.recentTransactions.map((tx: any, i: number) => (
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
                      <p style={{ color: '#9A8A7A', fontSize: 12 }}>
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      style={{
                        fontWeight: 700,
                        color:
                          tx.type === 'deposit' || tx.type === 'subscription'
                            ? '#0D3B2E'
                            : '#CC1C1C',
                      }}
                    >
                      {tx.type === 'deposit' || tx.type === 'subscription' ? '+' : '-'}₦
                      {(tx.amount || 0).toLocaleString()}
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
