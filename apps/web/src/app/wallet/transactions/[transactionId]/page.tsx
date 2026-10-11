'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { PageShell } from '@/components/layout/PageShell';

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

  const isCredit = transaction?.type === 'deposit' || transaction?.type === 'earning';

  return (
    <PageShell maxWidth="sm">
      <button
        type="button"
        onClick={() => router.back()}
        className="az-body mb-4 inline-flex items-center gap-2 text-az-ink-muted"
      >
        <ArrowLeft size={16} aria-hidden /> Back to Transactions
      </button>
      <h1 className="az-headline text-az-heading mb-8 text-az-ink">Transaction Details</h1>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div
            className="size-10 animate-spin rounded-full border-[3px] border-az-ink/20 border-t-az-flame"
            role="status"
            aria-label="Loading transaction"
          />
        </div>
      ) : !transaction ? (
        <div className="az-glass px-6 py-12 text-center">
          <h3 className="az-subtitle mb-3 text-az-ink">Transaction not found</h3>
          <a href="/wallet/transactions" className="az-body-strong text-az-flame no-underline">
            View all transactions
          </a>
        </div>
      ) : (
        <div className="az-glass p-7">
          <div className="mb-7 text-center">
            <p className={`az-heading ${isCredit ? 'text-az-success-400' : 'text-az-scarlet'}`}>
              {isCredit ? '+' : '-'}₦{(transaction.amount || 0).toLocaleString()}
            </p>
            <span
              className={`mt-2 inline-block rounded-az-pill px-3.5 py-1 az-caption ${
                transaction.status === 'completed'
                  ? 'bg-az-success-400/15 text-az-success-400'
                  : transaction.status === 'pending'
                    ? 'bg-az-warning-400/15 text-az-warning-400'
                    : 'bg-az-scarlet/15 text-az-flame'
              }`}
            >
              {transaction.status}
            </span>
          </div>

          <div className="flex flex-col gap-4">
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
                  className="flex items-center justify-between border-b border-az-glass-border pb-2.5 last:border-b-0"
                >
                  <span className="az-body text-az-ink-muted">{item!.label}</span>
                  <span className="az-body-strong text-az-ink capitalize">{item!.value}</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </PageShell>
  );
}
