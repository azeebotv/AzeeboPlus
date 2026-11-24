'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Wallet } from 'lucide-react';
import { api } from '@/lib/api';
import { formatAmount } from '@/lib/borrow';
import { useAuth } from '../../../context/AuthContext';
import PageShell from '@/components/layout/PageShell';
import PageHero from '@/components/layout/PageHero';
import { Skeleton } from '@azeebo/ui/web';
import { BorrowOffers } from '@/components/borrow/BorrowOffers';
import { BorrowDisclosures } from '@/components/borrow/BorrowDisclosures';

function accountAgeMonths(createdAt?: string): string | null {
  if (!createdAt) return null;
  const months = Math.floor((Date.now() - new Date(createdAt).getTime()) / 2_592_000_000);
  if (!Number.isFinite(months) || months < 0) return null;
  return `${months} ${months === 1 ? 'month' : 'months'}`;
}

export default function BorrowAccountPage(): React.JSX.Element {
  const { user, isLoading: authIsLoading } = useAuth();

  // AuthContext derives isAuthenticated from the access token, which is httpOnly, so it is
  // false after a reload even though cookie auth still works. Gate on the restored user
  // record instead, otherwise this query stays disabled and the skeleton never resolves.
  const balanceQuery = useQuery({
    queryKey: ['wallet', 'balance:number'],
    queryFn: async () => {
      const res = await api.wallet.getBalance();
      if (res.success && res.data) return res.data.balance ?? 0;
      throw new Error(res.message || 'Failed to load wallet balance');
    },
    enabled: !authIsLoading && !!user,
    staleTime: 30000,
  });

  const tenure = accountAgeMonths(user?.createdAt);

  return (
    <PageShell activeNav="Borrow">
      <PageHero
        badge="Borrow • Account view"
        title="Offers for your Azeebo+ account"
        subtitle="The same published partner terms, next to the account signals partners typically ask about. Nothing here is a pre-approval."
        accentColor="var(--color-az-flame)"
        actions={
          <Link
            href="/borrow"
            className="inline-flex items-center gap-2 rounded-xl border border-az-ink/15 px-4 py-2.5 text-sm font-bold text-az-ink hover:bg-az-glass-card"
          >
            <ArrowLeft size={14} /> Public Borrow home
          </Link>
        }
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 space-y-10">
        <section
          aria-labelledby="borrow-account-standing"
          className="az-glass border border-az-glass-border p-6 sm:p-7"
        >
          <h2 id="borrow-account-standing" className="text-lg font-bold text-az-ink mb-5">
            Your account standing
          </h2>

          <dl className="grid gap-5 sm:grid-cols-2">
            <div>
              <dt className="flex items-center gap-2 text-[11px] uppercase tracking-widest font-bold text-az-ink/40">
                <Wallet size={13} /> Wallet balance
              </dt>
              <dd className="mt-2 text-base font-semibold text-az-ink">
                {balanceQuery.isSuccess ? (
                  formatAmount(balanceQuery.data)
                ) : balanceQuery.isError ? (
                  'Unavailable'
                ) : balanceQuery.fetchStatus === 'idle' ? (
                  'Not shared'
                ) : (
                  <Skeleton height="20px" width="90px" />
                )}
              </dd>
            </div>

            <div>
              <dt className="text-[11px] uppercase tracking-widest font-bold text-az-ink/40">
                Account age
              </dt>
              <dd className="mt-2 text-base font-semibold text-az-ink">{tenure ?? 'Not shared'}</dd>
            </div>
          </dl>

          <p className="mt-5 text-xs text-az-ink/45">
            Partners assess you on their own criteria — usually verified income and a credit check.
            These Azeebo+ figures are context only and do not influence or guarantee any decision.
          </p>
        </section>

        <BorrowOffers />
        <BorrowDisclosures />
      </div>
    </PageShell>
  );
}
