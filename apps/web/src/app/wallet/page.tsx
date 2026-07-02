'use client';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Link from 'next/link';
import { api, Transaction } from '@/lib/api';
import { webLogger } from '@/lib/logger';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';

export default function WalletPage(): React.JSX.Element {
  const { user: _user, isAuthenticated, isLoading: authIsLoading } = useAuth();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authIsLoading) return;
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    const fetchWallet = async () => {
      try {
        setIsLoading(true);
        const [balanceRes, transactionsRes] = await Promise.all([
          api.wallet.getBalance(),
          api.wallet.getTransactions(),
        ]);
        if (balanceRes.success && balanceRes.data) setBalance(balanceRes.data.balance);
        if (transactionsRes.success && transactionsRes.data) {
          const txData = transactionsRes.data;
          setTransactions(Array.isArray(txData) ? txData : txData.items || []);
        }
      } catch (err) {
        webLogger.error('Failed to fetch wallet data', err);
        setError('Failed to load wallet data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchWallet();
  }, [authIsLoading, isAuthenticated]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#1A0A0A' }}>
      <AppHeader active="Wallet" />

      {/* Balance Section */}
      <section
        className="py-12"
        style={{ background: 'linear-gradient(135deg, #E8420A, #CC1C1C)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div
              className="h-[200px] animate-pulse"
              style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '1rem' }}
            />
          ) : error ? (
            <div className="text-center">
              <p className="text-white/80 mb-4">{error}</p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-6 py-3 rounded-full text-sm font-semibold transition-colors"
                style={{ backgroundColor: 'white', color: '#CC1C1C' }}
              >
                Retry
              </button>
            </div>
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
                    style={{ backgroundColor: 'white', color: '#CC1C1C' }}
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
                  <div
                    key={i}
                    className="h-16 animate-pulse rounded-lg"
                    style={{ backgroundColor: '#2A2A2A' }}
                  />
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
                        style={{ color: transaction.type === 'credit' ? '#22C55E' : '#fff' }}
                      >
                        {transaction.type === 'credit' ? '+' : '-'} ₦
                        {(transaction.amount ?? 0).toLocaleString()}
                      </p>
                      <span
                        className="text-xs font-medium capitalize"
                        style={{
                          color:
                            transaction.status === 'completed'
                              ? '#22C55E'
                              : transaction.status === 'pending'
                                ? '#EAB308'
                                : '#EF4444',
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
