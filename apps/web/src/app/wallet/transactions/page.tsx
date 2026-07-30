'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, Transaction } from '@/lib/api';
import { webLogger } from '@/lib/logger';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';

interface TransactionFilters {
  type: 'all' | 'credit' | 'debit';
  status: 'all' | 'completed' | 'pending' | 'failed';
  dateRange: 'all' | '7d' | '30d' | '90d';
}

export const metadata = {
  title: 'Transaction History | Azeebo',
  description: 'View all your deposits, withdrawals, and payment transactions.',
  openGraph: {
    title: 'Transaction History | Azeebo',
    description: 'View all your deposits, withdrawals, and payment transactions.',
  },
};

export default function TransactionsPage(): React.JSX.Element {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filters, setFilters] = useState<TransactionFilters>({
    type: 'all',
    status: 'all',
    dateRange: 'all',
  });

  const loadTransactions = useCallback(async (): Promise<void> => {
    try {
      const params = new URLSearchParams();
      if (filters.type !== 'all') params.append('type', filters.type);
      if (filters.status !== 'all') params.append('status', filters.status);
      if (filters.dateRange !== 'all') params.append('dateRange', filters.dateRange);
      const result = await apiFetch<Transaction[] | { items: Transaction[] }>(
        `/v1/wallet/transactions?${params.toString()}`
      );
      if (result.success && result.data) {
        const txList = Array.isArray(result.data) ? result.data : result.data?.items || [];
        setTransactions(txList);
      }
    } catch (error) {
      webLogger.error('Failed to load transactions', error);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const formatDate = (dateString: string): string =>
    new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  const getStatusStyle = (status: string): { backgroundColor: string; color: string } => {
    switch (status) {
      case 'completed':
        return { backgroundColor: 'rgba(34,197,94,0.2)', color: '#22C55E' };
      case 'pending':
        return { backgroundColor: 'rgba(234,179,8,0.2)', color: '#EAB308' };
      case 'failed':
        return { backgroundColor: 'rgba(239,68,68,0.2)', color: '#EF4444' };
      default:
        return { backgroundColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' };
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#1A0A0A' }}>
        <AppHeader />
        <div
          className="flex items-center justify-center"
          style={{ minHeight: 'calc(100vh - 200px)' }}
        >
          <div className="text-center">
            <div
              className="animate-spin rounded-full h-12 w-12 mx-auto"
              style={{ border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#E8420A' }}
            />
            <p className="mt-4 text-white/60">Loading transactions...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#1A0A0A' }}>
      <AppHeader />
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-white/50 hover:text-white mb-2 flex items-center gap-2 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>{' '}
            Back
          </button>
          <h1 className="text-3xl font-bold text-white">Transaction History</h1>
        </div>

        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex gap-2" role="listbox" aria-label="Transaction type">
            {(['all', 'credit', 'debit'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilters((prev) => ({ ...prev, type: t }))}
                role="option"
                aria-selected={filters.type === t}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${filters.type === t ? 'az-btn-primary' : ''}`}
                style={
                  filters.type !== t
                    ? {
                        border: '1px solid rgba(255,255,255,0.2)',
                        backgroundColor: 'rgba(255,255,255,0.08)',
                        color: '#fff',
                      }
                    : undefined
                }
              >
                {t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
          <div className="flex gap-2" role="listbox" aria-label="Transaction status">
            {(['all', 'completed', 'pending', 'failed'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilters((prev) => ({ ...prev, status: s }))}
                role="option"
                aria-selected={filters.status === s}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${filters.status === s ? 'az-btn-primary' : ''}`}
                style={
                  filters.status !== s
                    ? {
                        border: '1px solid rgba(255,255,255,0.2)',
                        backgroundColor: 'rgba(255,255,255,0.08)',
                        color: '#fff',
                      }
                    : undefined
                }
              >
                {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {transactions.map((tx) => (
            <div key={tx.id} className="az-glass p-4 flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor:
                    tx.type === 'credit' ? 'rgba(34,197,94,0.2)' : 'rgba(232,66,10,0.2)',
                }}
              >
                <span className="text-xl">{tx.type === 'credit' ? '⬆️' : '⬇️'}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white truncate">{tx.description || 'Transaction'}</p>
                <p className="text-sm text-white/50">{formatDate(tx.createdAt)}</p>
              </div>
              <div className="text-right">
                <p
                  className="font-bold text-lg"
                  style={{ color: tx.type === 'credit' ? '#22C55E' : '#fff' }}
                >
                  {tx.type === 'credit' ? '+' : '-'}₦{(tx.amount ?? 0).toLocaleString()}
                </p>
                <span
                  className="inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize"
                  style={getStatusStyle(tx.status)}
                >
                  {tx.status}
                </span>
              </div>
            </div>
          ))}
          {transactions.length === 0 && (
            <div className="az-glass p-8 text-center">
              <p className="text-white/50 text-lg">No transactions found</p>
              <button
                onClick={() => router.push('/wallet/add-funds')}
                className="mt-4 az-btn-primary"
                style={{ width: 'auto', paddingInline: '1.5rem' }}
              >
                Add Funds
              </button>
            </div>
          )}
        </div>
      </div>
      <AppFooter />
    </div>
  );
}
