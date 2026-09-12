'use client';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import Link from 'next/link';
import { api, Transaction } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';

export default function WalletPage(): React.JSX.Element {
  const { isAuthenticated, isLoading: authIsLoading } = useAuth();

  const balanceQuery = useQuery({
    queryKey: ['wallet', 'balance:number'],
    queryFn: async () => {
      const res = await api.wallet.getBalance();
      if (res.success && res.data) return res.data.balance ?? 0;
      throw new Error(res.message || 'Failed to load wallet balance');
    },
    enabled: !authIsLoading && isAuthenticated,
    staleTime: 30000,
  });

  const transactionsQuery = useQuery({
    queryKey: ['wallet-transactions'],
    queryFn: async () => {
      const res = await api.wallet.getTransactions();
      if (res.success && res.data) {
        const txData = res.data;
        return Array.isArray(txData) ? txData : txData.items || [];
      }
      throw new Error(res.message || 'Failed to load transactions');
    },
    enabled: !authIsLoading && isAuthenticated,
    staleTime: 30000,
  });

  const balance = balanceQuery.data ?? 0;
  const transactions: Transaction[] = transactionsQuery.data ?? [];
  const isLoading = authIsLoading || balanceQuery.isLoading || transactionsQuery.isLoading;
  const error = balanceQuery.error?.message || transactionsQuery.error?.message || null;

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <AppHeader active="Wallet" />

      {/* Balance Section */}
      <section
        className="py-14 relative overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, #18151e 0%, #0b090e 100%)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(circle at 50% 20%, rgba(232, 66, 10, 0.18), transparent 70%)',
          }}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {isLoading ? (
            <Skeleton height="200px" borderRadius="1rem" className="bg-white/10" />
          ) : error ? (
            <ErrorState
              title="Failed to load wallet"
              description={error}
              buttonText="Retry"
              onButtonPress={() => {
                balanceQuery.refetch();
                transactionsQuery.refetch();
              }}
            />
          ) : (
            <div className="text-center">
              <span
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase mb-3"
                style={{
                  backgroundColor: 'rgba(232, 66, 10, 0.15)',
                  color: 'var(--brand-orange)',
                  border: '1px solid rgba(232, 66, 10, 0.3)',
                }}
              >
                Azeebo Pay
              </span>
              <p className="text-white/60 text-sm mb-2">Available Balance</p>
              <h2 className="text-5xl sm:text-6xl font-extrabold text-white tracking-tight mb-6">
                ₦{(balance ?? 0).toLocaleString()}
              </h2>
              <div className="flex items-center justify-center gap-4">
                <Link href="/wallet/add-funds">
                  <button
                    type="button"
                    className="px-8 py-3 rounded-full text-sm font-semibold transition-all shadow-lg hover:scale-105 active:scale-95"
                    style={{
                      background: 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)',
                      color: '#ffffff',
                    }}
                  >
                    Deposit
                  </button>
                </Link>
                <Link href="/wallet/withdraw">
                  <button
                    type="button"
                    className="px-8 py-3 rounded-full text-sm font-semibold text-white transition-all hover:bg-white/10 active:scale-95"
                    style={{
                      border: '1px solid rgba(255,255,255,0.15)',
                      backgroundColor: 'rgba(255,255,255,0.05)',
                    }}
                  >
                    Withdraw
                  </button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Transaction History */}
      <section className="py-12" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white">Transaction History</h2>
              <p className="text-base mt-1 text-white/50">View all your transactions</p>
            </div>
            <Link
              href="/wallet/transactions"
              className="text-sm font-medium text-[var(--brand-orange)] hover:text-[var(--brand-red)] transition-colors"
            >
              View All
            </Link>
          </div>

          <div className="az-glass p-6">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} height="64px" borderRadius="0.5rem" />
                ))}
              </div>
            ) : transactions.length > 0 ? (
              <div className="space-y-4">
                {transactions.slice(0, 5).map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between py-4"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center"
                        style={{
                          backgroundColor:
                            transaction.type === 'credit'
                              ? 'rgba(34,197,94,0.15)'
                              : 'rgba(232,66,10,0.15)',
                          color:
                            transaction.type === 'credit'
                              ? 'var(--color-success-500, #22c55e)'
                              : 'var(--brand-orange)',
                        }}
                      >
                        {transaction.type === 'credit' ? (
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2.2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M19.5 4.5l-15 15m0 0h11.25m-11.25 0V8.25"
                            />
                          </svg>
                        ) : (
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2.2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25"
                            />
                          </svg>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-white">
                          {transaction.description || 'Transaction'}
                        </p>
                        <p className="text-sm text-white/50">
                          {new Date(transaction.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className="font-bold text-lg"
                        style={{
                          color:
                            transaction.type === 'credit' ? 'var(--color-success-500)' : 'white',
                        }}
                      >
                        {transaction.type === 'credit' ? '+' : '-'} ₦
                        {(transaction.amount ?? 0).toLocaleString()}
                      </p>
                      <span
                        className="text-xs font-medium capitalize"
                        style={{
                          color:
                            transaction.status === 'completed'
                              ? 'var(--color-success-500)'
                              : transaction.status === 'pending'
                                ? 'var(--color-warning-400)'
                                : 'var(--color-error-500)',
                        }}
                      >
                        {transaction.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-white/50">No transactions yet</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <AppFooter />
    </div>
  );
}
