'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';

interface CreatorEarningsTransaction {
  description?: string;
  date?: string;
  createdAt?: string;
  amount: number;
}

export default function DashboardEarningsPage(): React.JSX.Element {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [earnings, setEarnings] = useState({
    balance: 0,
    totalEarned: 0,
    pendingPayout: 0,
    paidOut: 0,
    recentTransactions: [] as CreatorEarningsTransaction[],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !user) {
      router.push('/auth/login');
      return;
    }
    loadEarnings();
  }, [authLoading, isAuthenticated, user, router]);

  const loadEarnings = async () => {
    try {
      const response = await api.creator.getStats();
      if (response.success && response.data) {
        setEarnings({
          balance: response.data.totalEarnings || 0,
          totalEarned: response.data.totalEarnings || 0,
          pendingPayout: response.data.pendingEarnings || 0,
          paidOut: 0,
          recentTransactions: [],
        });
      }
    } catch {
      /* ignore */
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || (!isAuthenticated && !user)) return <></>;

  if (!isAuthenticated || !user) return <></>;

  return (
    <div style={{ backgroundColor: '#1A0A0A', minHeight: '100vh', color: '#F5F0EB' }}>
      <AppHeader />
      <main
        style={{
          paddingTop: 100,
          paddingBottom: 60,
          maxWidth: 900,
          margin: '0 auto',
          padding: '100px 24px 60px',
        }}
      >
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700 }}>Earnings</h1>
          <p style={{ color: '#9A8A7A', marginTop: 4 }}>Track your revenue and payouts</p>
        </div>

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
            {/* Balance card */}
            <div
              className="az-glass"
              style={{
                padding: 32,
                borderRadius: 20,
                marginBottom: 24,
                background:
                  'linear-gradient(135deg, rgba(232,66,10,0.15) 0%, rgba(204,28,28,0.1) 100%)',
              }}
            >
              <p style={{ color: '#9A8A7A', fontSize: 14, marginBottom: 8 }}>Available Balance</p>
              <p style={{ fontSize: 36, fontWeight: 700, color: '#E8420A' }}>
                ₦{earnings.balance.toLocaleString()}
              </p>
              <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                <a
                  href="/wallet/withdraw"
                  style={{
                    padding: '10px 24px',
                    borderRadius: 999,
                    background: 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)',
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: 14,
                    textDecoration: 'none',
                  }}
                >
                  Withdraw
                </a>
                <a
                  href="/wallet"
                  style={{
                    padding: '10px 24px',
                    borderRadius: 999,
                    border: '1px solid #2A1A1A',
                    background: 'transparent',
                    color: '#9A8A7A',
                    fontWeight: 600,
                    fontSize: 14,
                    textDecoration: 'none',
                  }}
                >
                  View Wallet
                </a>
              </div>
            </div>

            {/* Stats */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 16,
                marginBottom: 24,
              }}
            >
              {[
                {
                  label: 'Total Earned',
                  value: `₦${earnings.totalEarned.toLocaleString()}`,
                  color: '#E8420A',
                },
                {
                  label: 'Pending',
                  value: `₦${earnings.pendingPayout.toLocaleString()}`,
                  color: '#F59E0B',
                },
                {
                  label: 'Paid Out',
                  value: `₦${earnings.paidOut.toLocaleString()}`,
                  color: '#0D3B2E',
                },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="az-glass"
                  style={{ padding: 20, borderRadius: 16, textAlign: 'center' }}
                >
                  <p style={{ fontSize: 13, color: '#9A8A7A', marginBottom: 8 }}>{stat.label}</p>
                  <p style={{ fontSize: 20, fontWeight: 700, color: stat.color }}>{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Recent transactions */}
            <div className="az-glass" style={{ padding: 24, borderRadius: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
                Recent Transactions
              </h2>
              {earnings.recentTransactions.length === 0 ? (
                <p style={{ color: '#9A8A7A', textAlign: 'center', padding: 20 }}>
                  No transactions yet
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {earnings.recentTransactions.map((tx, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px 0',
                        borderBottom:
                          i < earnings.recentTransactions.length - 1 ? '1px solid #2A1A1A' : 'none',
                      }}
                    >
                      <div>
                        <p style={{ fontWeight: 600, fontSize: 14 }}>
                          {tx.description || 'Earning'}
                        </p>
                        <p style={{ color: '#9A8A7A', fontSize: 12 }}>
                          {new Date(tx.date || tx.createdAt || '').toLocaleDateString()}
                        </p>
                      </div>
                      <span style={{ fontWeight: 700, color: '#0D3B2E' }}>
                        +₦{(tx.amount || 0).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
      <AppFooter />
    </div>
  );
}
