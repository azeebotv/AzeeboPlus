'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';

interface TransactionDetail {
  id: string;
  type: string;
  amount: number;
  status: string;
  createdAt: string;
  description?: string;
  paymentMethod?: string;
  fee?: number;
}

export default function TransactionDetailPage(): React.JSX.Element {
  const { transactionId } = useParams();
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [transaction, setTransaction] = useState<TransactionDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !user) {
      router.push('/auth/login');
      return;
    }
    loadTransaction();
  }, [authLoading, isAuthenticated, user, router, transactionId]);

  const loadTransaction = async () => {
    try {
      const response = await api.wallet.getTransaction(transactionId as string);
      if (response.success && response.data) setTransaction(response.data);
    } catch {
      /* ignore */
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || (!isAuthenticated && !user)) return <></>;

  if (!isAuthenticated || !user) return <></>;

  return (
    <div
      style={{
        backgroundColor: 'var(--brand-near-black)',
        minHeight: '100vh',
        color: 'var(--text-primary)',
      }}
    >
      <AppHeader />
      <main
        style={{
          paddingTop: 100,
          paddingBottom: 60,
          maxWidth: 600,
          margin: '0 auto',
          padding: '100px 24px 60px',
        }}
      >
        <div style={{ marginBottom: 32 }}>
          <button
            onClick={() => router.back()}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: 14,
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span>←</span> Back to Transactions
          </button>
          <h1 style={{ fontSize: 28, fontWeight: 700 }}>Transaction Details</h1>
        </div>

        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <div
              style={{
                width: 40,
                height: 40,
                border: '3px solid #18151e',
                borderTopColor: 'var(--brand-orange)',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }}
            />
          </div>
        ) : !transaction ? (
          <div className="az-glass" style={{ padding: 40, borderRadius: 20, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}></div>
            <h3 style={{ fontSize: 18, marginBottom: 8 }}>Transaction not found</h3>
            <a
              href="/wallet/transactions"
              style={{ color: 'var(--brand-orange)', textDecoration: 'none', fontWeight: 600 }}
            >
              View all transactions
            </a>
          </div>
        ) : (
          <div className="az-glass" style={{ padding: 28, borderRadius: 20 }}>
            {/* Amount */}
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <p
                style={{
                  fontSize: 36,
                  fontWeight: 700,
                  color:
                    transaction.type === 'deposit' || transaction.type === 'earning'
                      ? 'var(--brand-forest)'
                      : 'var(--brand-red)',
                }}
              >
                {transaction.type === 'deposit' || transaction.type === 'earning' ? '+' : '-'}₦
                {(transaction.amount || 0).toLocaleString()}
              </p>
              <span
                style={{
                  display: 'inline-block',
                  marginTop: 8,
                  padding: '4px 14px',
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 600,
                  backgroundColor:
                    transaction.status === 'completed'
                      ? 'rgba(13,59,46,0.2)'
                      : transaction.status === 'pending'
                        ? 'rgba(245,158,11,0.2)'
                        : 'rgba(204,28,28,0.2)',
                  color:
                    transaction.status === 'completed'
                      ? 'var(--brand-forest)'
                      : transaction.status === 'pending'
                        ? 'var(--color-warning-500)'
                        : 'var(--brand-red)',
                }}
              >
                {transaction.status}
              </span>
            </div>

            {/* Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { label: 'Transaction ID', value: transaction.id },
                { label: 'Type', value: transaction.type },
                { label: 'Date', value: new Date(transaction.createdAt).toLocaleString() },
                { label: 'Description', value: transaction.description || 'N/A' },
                { label: 'Payment Method', value: transaction.paymentMethod || 'N/A' },
                transaction.fee
                  ? { label: 'Fee', value: `₦${transaction.fee.toLocaleString()}` }
                  : null,
              ]
                .filter(Boolean)
                .map((item, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '10px 0',
                      borderBottom: '1px solid #18151e',
                    }}
                  >
                    <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                      {item!.label}
                    </span>
                    <span style={{ fontWeight: 600, fontSize: 14, textTransform: 'capitalize' }}>
                      {item!.value}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </main>
      <AppFooter />
    </div>
  );
}
