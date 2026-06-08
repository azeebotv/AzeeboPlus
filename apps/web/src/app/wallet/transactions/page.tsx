'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { webLogger } from '@/lib/logger';

interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'payment' | 'refund' | 'reward' | 'tip';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  description: string;
  reference: string;
  createdAt: string;
  metadata?: {
    provider?: string;
    bankName?: string;
    accountNumber?: string;
    contentTitle?: string;
    creatorName?: string;
  };
}

type FilterType = 'all' | 'deposit' | 'withdrawal' | 'payment' | 'reward';

export default function TransactionsPage(): JSX.Element {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadTransactions();
  }, [filter]);

  const loadTransactions = async (pageNum = 1): Promise<void> => {
    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: '20',
        ...(filter !== 'all' && { type: filter }),
      });

      const result = await apiFetch<{ transactions: Transaction[]; hasMore: boolean }>(
        `/v1/wallet/transactions?${params}`
      );

      if (result.success && result.data) {
        if (pageNum === 1) {
          setTransactions(result.data.transactions);
        } else {
          setTransactions((prev) => [...prev, ...result.data!.transactions]);
        }
        setHasMore(result.data.hasMore);
      }
    } catch (error) {
      webLogger.error('Failed to load transactions', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMore = (): void => {
    if (hasMore && !isLoading) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadTransactions(nextPage);
    }
  };

  const getTypeIcon = (type: string): string => {
    switch (type) {
      case 'deposit': return '💰';
      case 'withdrawal': return '💸';
      case 'payment': return '🛒';
      case 'refund': return '↩️';
      case 'reward': return '🎁';
      case 'tip': return '💝';
      default: return '💳';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed': return 'text-green-500';
      case 'pending': return 'text-yellow-500';
      case 'failed': return 'text-red-500';
      case 'cancelled': return 'text-gray-500';
      default: return 'text-muted-foreground';
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatAmount = (amount: number, type: string): string => {
    const formatted = `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
    return type === 'deposit' || type === 'refund' || type === 'reward' || type === 'tip'
      ? `+${formatted}`
      : `-${formatted}`;
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading && transactions.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 print:mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2 print:text-2xl">Transaction History</h1>
              <p className="text-muted-foreground print:hidden">Your transaction history</p>
              <p className="text-sm text-muted-foreground print:block hidden">
                Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
              </p>
            </div>
            <button
              onClick={handlePrint}
              className="print:hidden px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              aria-label="Print transaction history"
            >
              <svg className="w-5 h-5 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print
            </button>
          </div>
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {(['all', 'deposit', 'withdrawal', 'payment', 'reward'] as FilterType[]).map((f) => (
            <button
              key={f}
              onClick={() => { setFilter(f); setPage(1); }}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                filter === f
                  ? 'bg-primary text-white'
                  : 'bg-card border border-border text-foreground hover:bg-accent'
              }`}
            >
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Type</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Description</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Date</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Status</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-foreground">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {transactions.map((tx) => (
                <tr
                  key={tx.id}
                  className="hover:bg-accent/50 cursor-pointer"
                  onClick={() => router.push(`/wallet/transactions/${tx.id}`)}
                >
                  <td className="px-6 py-4">
                    <span className="text-2xl">{getTypeIcon(tx.type)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-foreground">{tx.description}</p>
                    <p className="text-sm text-muted-foreground">Ref: {tx.reference}</p>
                  </td>
                  <td className="px-6 py-4 text-foreground">{formatDate(tx.createdAt)}</td>
                  <td className="px-6 py-4">
                    <span className={`text-sm font-medium ${getStatusColor(tx.status)}`}>
                      {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                    </span>
                  </td>
                  <td className={`px-6 py-4 text-right font-bold ${
                    tx.type === 'deposit' || tx.type === 'refund' || tx.type === 'reward' || tx.type === 'tip'
                      ? 'text-green-500'
                      : 'text-red-500'
                  }`}>
                    {formatAmount(tx.amount, tx.type)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {transactions.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">💳</div>
            <h2 className="text-2xl font-bold text-foreground mb-2">No transactions yet</h2>
            <p className="text-muted-foreground">Your transaction history will appear here</p>
          </div>
        )}

        {hasMore && transactions.length > 0 && (
          <div className="text-center mt-6">
            <button
              onClick={loadMore}
              className="px-6 py-3 bg-card border border-border text-foreground rounded-lg hover:bg-accent"
            >
              Load More
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
