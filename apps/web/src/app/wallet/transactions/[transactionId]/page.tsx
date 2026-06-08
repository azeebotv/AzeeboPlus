'use client';
import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { webLogger } from '@/lib/logger';

interface TransactionDetail {
  id: string;
  type: string;
  amount: number;
  currency: string;
  status: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  reference: string;
  metadata: {
    source?: string;
    method?: string;
    fee?: number;
    relatedTransactionId?: string;
  };
  balanceBefore: number;
  balanceAfter: number;
}

export default function TransactionDetailPage(): JSX.Element {
  const params = useParams();
  const transactionId = params.transactionId as string;
  const [transaction, setTransaction] = useState<TransactionDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (transactionId) {
      loadTransaction(transactionId);
    }
  }, [transactionId]);

  const loadTransaction = async (id: string): Promise<void> => {
    try {
      const result = await apiFetch<TransactionDetail>(`/v1/wallet/transactions/${id}`);

      if (result.success && result.data) {
        setTransaction(result.data);
      }
    } catch (error) {
      webLogger.error('Failed to load transaction', error);
    } finally {
      setIsLoading(false);
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

  const getTypeIcon = (type: string): string => {
    switch (type) {
      case 'credit': return '↓';
      case 'debit': return '↑';
      case 'refund': return '↩';
      default: return '•';
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading transaction...</p>
        </div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-foreground mb-2">Transaction not found</h2>
          <a href="/wallet/transactions" className="text-primary hover:underline">Back to Transactions</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <a href="/wallet/transactions" className="text-primary hover:underline mb-6 inline-block">
          ← Back to Transactions
        </a>

        <div className="mb-8 print:mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2 print:text-2xl">Transaction Receipt</h1>
              <p className="text-sm text-muted-foreground print:hidden">
                Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
              </p>
            </div>
            <button
              onClick={handlePrint}
              className="print:hidden px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              aria-label="Print this receipt"
            >
              <svg className="w-5 h-5 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print Receipt
            </button>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-6 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <span className="text-4xl">{getTypeIcon(transaction.type)}</span>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-foreground">{transaction.type.toUpperCase()}</h2>
              <p className={`font-semibold ${getStatusColor(transaction.status)}`}>
                {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
              </p>
            </div>
            <span className={`text-2xl font-bold ${transaction.type === 'debit' ? 'text-red-500' : 'text-green-500'}`}>
              {transaction.type === 'debit' ? '-' : '+'}{transaction.currency} {transaction.amount.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border overflow-hidden mb-6">
          <div className="p-6 border-b border-border">
            <h3 className="text-lg font-bold text-foreground">Transaction Info</h3>
          </div>
          <div className="divide-y divide-border">
            <div className="px-6 py-4 flex justify-between">
              <span className="text-muted-foreground">Reference</span>
              <span className="text-foreground font-mono">{transaction.reference}</span>
            </div>
            <div className="px-6 py-4 flex justify-between">
              <span className="text-muted-foreground">Description</span>
              <span className="text-foreground">{transaction.description}</span>
            </div>
            <div className="px-6 py-4 flex justify-between">
              <span className="text-muted-foreground">Date</span>
              <span className="text-foreground">{new Date(transaction.createdAt).toLocaleString()}</span>
            </div>
            <div className="px-6 py-4 flex justify-between">
              <span className="text-muted-foreground">Balance Before</span>
              <span className="text-foreground">{transaction.currency} {transaction.balanceBefore.toLocaleString()}</span>
            </div>
            <div className="px-6 py-4 flex justify-between">
              <span className="text-muted-foreground">Balance After</span>
              <span className="text-foreground">{transaction.currency} {transaction.balanceAfter.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {transaction.metadata && (
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="p-6 border-b border-border">
              <h3 className="text-lg font-bold text-foreground">Additional Details</h3>
            </div>
            <div className="divide-y divide-border">
              {transaction.metadata.source && (
                <div className="px-6 py-4 flex justify-between">
                  <span className="text-muted-foreground">Source</span>
                  <span className="text-foreground">{transaction.metadata.source}</span>
                </div>
              )}
              {transaction.metadata.method && (
                <div className="px-6 py-4 flex justify-between">
                  <span className="text-muted-foreground">Method</span>
                  <span className="text-foreground">{transaction.metadata.method}</span>
                </div>
              )}
              {transaction.metadata.fee !== undefined && (
                <div className="px-6 py-4 flex justify-between">
                  <span className="text-muted-foreground">Fee</span>
                  <span className="text-foreground">{transaction.currency} {transaction.metadata.fee}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
