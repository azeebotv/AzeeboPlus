'use client';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import Link from 'next/link';
import { api, Transaction } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import PageShell from '@/components/layout/PageShell';
import PageHero from '@/components/layout/PageHero';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  Minus,
  History,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';

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
    <PageShell activeNav="Wallet">
      <PageHero
        badge="Azeebo Pay • Secure Digital Wallet"
        title="Wallet & Balance"
        subtitle="Manage deposits, fast withdrawals, subscription passes, and live reality voting balances."
        accentColor="var(--color-az-flame)"
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {/* Balance Showcase Card */}
        <div className="az-glass p-8 sm:p-10 border border-az-glass-border relative overflow-hidden mb-10">
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-az-flame/15 via-az-error-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />

          {isLoading ? (
            <Skeleton height="180px" borderRadius="1.25rem" />
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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
              <div>
                <div className="flex items-center gap-2 mb-2 text-az-ink/50 text-xs uppercase tracking-widest font-bold">
                  <Wallet size={14} className="text-az-flame" />
                  <span>Available Spending Balance</span>
                </div>
                <h2 className="az-headline text-4xl sm:text-6xl text-az-ink">
                  ₦{(balance ?? 0).toLocaleString()}
                </h2>
                <div className="flex items-center gap-2 mt-3 text-xs text-az-success-400 font-medium">
                  <ShieldCheck size={14} />
                  <span>NDPR & PCI-DSS 256-Bit Encrypted Vault</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/wallet/add-funds"
                  className="az-btn-primary inline-flex items-center gap-2 shadow-lg shadow-az-flame/25"
                >
                  <Plus size={16} />
                  <span>Deposit Funds</span>
                </Link>
                <Link
                  href="/wallet/withdraw"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full text-sm font-bold text-az-ink bg-az-glass-fill hover:bg-az-glass-card border border-az-glass-border transition-all active:scale-95"
                >
                  <Minus size={16} />
                  <span>Withdraw</span>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <div className="az-glass p-5 border border-az-glass-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-az-ink/40 uppercase tracking-wider font-bold">
                Deposit Methods
              </span>
              <ArrowDownLeft size={16} className="text-az-success-400" />
            </div>
            <p className="text-sm font-semibold text-az-ink">Cards, USSD, Bank Transfer</p>
            <p className="text-[11px] text-az-ink/40 mt-0.5">Instant settlement</p>
          </div>

          <div className="az-glass p-5 border border-az-glass-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-az-ink/40 uppercase tracking-wider font-bold">
                Payouts
              </span>
              <ArrowUpRight size={16} className="text-az-flame" />
            </div>
            <p className="text-sm font-semibold text-az-ink">Direct Nigerian Banks</p>
            <p className="text-[11px] text-az-ink/40 mt-0.5">Processed within 1-5 mins</p>
          </div>

          <div className="az-glass p-5 border border-az-glass-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-az-ink/40 uppercase tracking-wider font-bold">
                Universe Passes
              </span>
              <History size={16} className="text-az-category-violet-light" />
            </div>
            <p className="text-sm font-semibold text-az-ink">1-Click Fast Pass</p>
            <p className="text-[11px] text-az-ink/40 mt-0.5">Auto-rebill control enabled</p>
          </div>
        </div>

        {/* Recent Transaction History */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-az-ink tracking-tight">
                Recent Ledger Activity
              </h3>
              <p className="text-xs sm:text-sm text-az-ink/50">
                Your most recent deposits, voting debits, and withdrawals
              </p>
            </div>
            <Link
              href="/wallet/transactions"
              className="text-xs font-bold text-az-flame hover:text-az-flame inline-flex items-center gap-1 transition-colors"
            >
              <span>View Full Ledger</span>
              <ChevronRight size={14} />
            </Link>
          </div>

          <div className="az-glass overflow-hidden border border-az-glass-border">
            {isLoading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} height="56px" borderRadius="0.75rem" />
                ))}
              </div>
            ) : transactions.length > 0 ? (
              <div className="divide-y divide-az-ink/5">
                {transactions.slice(0, 6).map((transaction) => {
                  const isCredit = transaction.type === 'credit';
                  return (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-4 sm:p-5 hover:bg-az-ink/[0.02] transition-colors"
                    >
                      <div className="flex items-center gap-3.5">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${
                            isCredit
                              ? 'bg-az-success-500/10 text-az-success-400 border-az-success-500/20'
                              : 'bg-az-flame/10 text-az-flame border-az-flame/20'
                          }`}
                        >
                          {isCredit ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                        </div>
                        <div>
                          <p className="font-semibold text-az-ink text-sm">
                            {transaction.description || (isCredit ? 'Deposit' : 'Withdrawal')}
                          </p>
                          <p className="text-xs text-az-ink/40">
                            {new Date(transaction.createdAt).toLocaleDateString('en-NG', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p
                          className={`font-black text-base ${
                            isCredit ? 'text-az-success-400' : 'text-az-ink'
                          }`}
                        >
                          {isCredit ? '+' : '-'}₦{(transaction.amount ?? 0).toLocaleString()}
                        </p>
                        <span
                          className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            transaction.status === 'completed'
                              ? 'bg-az-success-500/15 text-az-success-400'
                              : transaction.status === 'pending'
                                ? 'bg-az-warning-500/15 text-az-warning-400'
                                : 'bg-az-error-500/15 text-az-error-400'
                          }`}
                        >
                          {transaction.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 px-4">
                <Wallet className="mx-auto text-az-ink/20 mb-3" size={36} />
                <p className="text-az-ink/60 font-semibold text-sm">No transactions on record</p>
                <p className="text-az-ink/30 text-xs mt-1">
                  Make your first deposit to start voting or unlocking universe passes.
                </p>
                <Link
                  href="/wallet/add-funds"
                  className="az-btn-primary inline-flex items-center gap-1.5 mt-4"
                >
                  <Plus size={14} />
                  <span>Add Funds Now</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
