'use client';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import Link from 'next/link';
import { api, Transaction } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';

export const metadata = {
  title: 'Wallet | Azeebo',
  description: 'View your wallet balance, make deposits, and manage transactions.',
  openGraph: {
    title: 'Wallet | Azeebo',
    description: 'View your wallet balance, make deposits, and manage transactions.',
  },
};

export default function WalletPage(): React.JSX.Element {
  const { isAuthenticated, isLoading: authIsLoading } = useAuth();

  const balanceQuery = useQuery({
    queryKey: ['wallet-balance'],
    queryFn: async () => {
      const res = await api.wallet.getBalance();
      if (res.success && res.data) return res.data.balance;
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
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary, #1A0A0A)' }}>
      <AppHeader active="Wallet" />

      {/* Balance Section */}
      <section
        className="py-12"
        style={{ background: 'linear-gradient(135deg, #E8420A, #CC1C1C)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
              <p className="text-white/80 mb-2">Your Wallet Balance</p>
              <h2 className="text-5xl sm:text-6xl font-bold text-white mb-6">
                ₦{(balance ?? 0).toLocaleString()}
              </h2>
              <div className="flex items-center justify-center gap-4">
                <Link href="/wallet/add-funds">
                  <button
                    type="button"
                    className="px-6 py-3 rounded-full text-sm font-semibold transition-colors"
                    style={{ backgroundColor: 'white', color: 'var(--brand-red, #CC1C1C)' }}
                  >
                    Deposit
                  </button>
                </Link>
                <Link href="/wallet/withdraw">
                  <button
                    type="button"
                    className="px-6 py-3 rounded-full text-sm font-semibold text-white transition-colors"
                    style={{ border: '1px solid rgba(255,255,255,0.3)' }}
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
      <section className="py-12" style={{ backgroundColor: '#0d0505' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white">Transaction History</h2>
              <p className="text-base mt-1 text-white/50">View all your transactions</p>
            </div>
            <Link
              href="/wallet/transactions"
              className="text-sm font-medium text-[#E8420A] hover:text-[#CC1C1C] transition-colors"
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
                              ? 'rgba(34,197,94,0.2)'
                              : 'rgba(232,66,10,0.2)',
                        }}
                      >
                        <span className="text-2xl">
                          {transaction.type === 'credit' ? '⬆️' : '⬇️'}
                        </span>
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
                        style={{ color: transaction.type === 'credit' ? 'var(--color-success-500)' : '#fff' }}
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
