'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { apiFetch, Transaction } from '@/lib/api';
import { webLogger } from '@/lib/logger';
import PageShell from '@/components/layout/PageShell';
import PageHero from '@/components/layout/PageHero';
import { ArrowLeft, ArrowDownLeft, ArrowUpRight, CheckCircle2, Clock, AlertCircle, Filter, Wallet } from 'lucide-react';

interface TransactionFilters {
  type: 'all' | 'credit' | 'debit';
  status: 'all' | 'completed' | 'pending' | 'failed';
  dateRange: 'all' | '7d' | '30d' | '90d';
}

export default function TransactionsPage(): React.JSX.Element {
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
    new Date(dateString).toLocaleDateString('en-NG', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <PageShell activeNav="Wallet">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6">
        <Link
          href="/wallet"
          className="inline-flex items-center gap-2 text-xs font-bold text-white/50 hover:text-white transition-colors mb-6 group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Wallet</span>
        </Link>
      </div>

      <PageHero
        badge="Audit Ledger"
        title="Transaction History"
        subtitle="Complete record of your Azeebo Pay deposits, withdrawals, voting passes, and subscriptions."
        accentColor="orange"
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-20">
        {/* Filter controls */}
        <div className="az-glass p-5 rounded-2xl border border-white/10 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Filter size={15} className="text-orange-400 flex-shrink-0" />
            <span className="text-xs font-bold text-white/60 uppercase tracking-wider">Type:</span>
            <div className="flex gap-1.5 overflow-x-auto scrollbar-none" role="listbox" aria-label="Transaction type">
              {(['all', 'credit', 'debit'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setFilters((prev) => ({ ...prev, type: t }))}
                  role="option"
                  aria-selected={filters.type === t}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border ${
                    filters.type === t
                      ? 'bg-orange-500 text-white border-orange-500 shadow-sm shadow-orange-500/20'
                      : 'bg-white/5 hover:bg-white/10 text-white/70 border-white/10'
                  }`}
                >
                  {t === 'all' ? 'All Types' : t === 'credit' ? 'Deposits' : 'Debits'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white/60 uppercase tracking-wider">Status:</span>
            <div className="flex gap-1.5 overflow-x-auto scrollbar-none" role="listbox" aria-label="Transaction status">
              {(['all', 'completed', 'pending', 'failed'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setFilters((prev) => ({ ...prev, status: s }))}
                  role="option"
                  aria-selected={filters.status === s}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                    filters.status === s
                      ? 'bg-orange-500 text-white border-orange-500 shadow-sm shadow-orange-500/20'
                      : 'bg-white/5 hover:bg-white/10 text-white/70 border-white/10'
                  }`}
                >
                  {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Transactions List */}
        <div className="az-glass rounded-3xl border border-white/10 overflow-hidden shadow-xl">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="w-10 h-10 rounded-full border-2 border-orange-500/20 border-t-orange-500 animate-spin mx-auto mb-3" />
              <p className="text-white/60 text-sm">Querying ledger records...</p>
            </div>
          ) : transactions.length > 0 ? (
            <div className="divide-y divide-white/5">
              {transactions.map((tx) => {
                const isCredit = tx.type === 'credit';
                return (
                  <div
                    key={tx.id}
                    className="p-4 sm:p-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 border ${
                          isCredit
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                        }`}
                      >
                        {isCredit ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-white text-sm truncate">
                          {tx.description || (isCredit ? 'Wallet Deposit' : 'Wallet Debit')}
                        </p>
                        <p className="text-xs text-white/40 mt-0.5">{formatDate(tx.createdAt)}</p>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0 ml-4">
                      <p
                        className={`font-black text-base sm:text-lg ${
                          isCredit ? 'text-emerald-400' : 'text-white'
                        }`}
                      >
                        {isCredit ? '+' : '-'}₦{(tx.amount ?? 0).toLocaleString()}
                      </p>
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mt-0.5 ${
                          tx.status === 'completed'
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : tx.status === 'pending'
                              ? 'bg-amber-500/15 text-amber-400'
                              : 'bg-red-500/15 text-red-400'
                        }`}
                      >
                        {tx.status === 'completed' && <CheckCircle2 size={11} />}
                        {tx.status === 'pending' && <Clock size={11} />}
                        {tx.status === 'failed' && <AlertCircle size={11} />}
                        <span>{tx.status}</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center">
              <Wallet size={40} className="mx-auto text-white/20 mb-3" />
              <h3 className="text-white font-bold text-base mb-1">No transactions found</h3>
              <p className="text-white/40 text-xs max-w-sm mx-auto mb-6">
                No ledger activity matches your filter criteria.
              </p>
              <Link
                href="/wallet/add-funds"
                className="az-btn-primary inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold"
              >
                <span>Deposit Funds</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}

