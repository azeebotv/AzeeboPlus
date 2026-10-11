'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, SearchX } from 'lucide-react';
import { api, type PartnerBankOffer } from '@/lib/api';
import { formatAmount, offersMatching } from '@/lib/borrow';
import { EmptyState, ErrorState, Skeleton } from '@azeebo/ui/web';
import { PartnerOfferCard } from './PartnerOfferCard';

const DEFAULT_AMOUNT = 100000;
const DEFAULT_TENOR_MONTHS = 6;

/**
 * The partner catalogue with its amount/tenor filter. Shared by the public
 * Borrow page and the signed-in view so the disclosures render identically in
 * both places.
 */
export function BorrowOffers(): React.JSX.Element {
  const [amount, setAmount] = useState(DEFAULT_AMOUNT);
  const [tenor, setTenor] = useState(DEFAULT_TENOR_MONTHS);
  const [showAll, setShowAll] = useState(false);

  const { data, isPending, error, refetch } = useQuery({
    queryKey: ['borrow', 'banks'],
    queryFn: async (): Promise<PartnerBankOffer[]> => {
      const res = await api.borrow.getPartnerBanks();
      if (res.success && Array.isArray(res.data)) return res.data;
      throw new Error(res.message || 'Failed to load partner offers');
    },
    staleTime: 60000,
  });

  const offers = data ?? [];
  const matching = useMemo(() => offersMatching(offers, amount, tenor), [offers, amount, tenor]);
  const visible = showAll ? offers : matching;

  return (
    <section className="space-y-6" aria-labelledby="borrow-offers">
      <h2 id="borrow-offers" className="sr-only">
        Partner offers
      </h2>

      <div className="az-glass border border-az-glass-border p-5 sm:p-6 flex flex-wrap items-end gap-5">
        <label className="flex flex-col gap-2 text-xs font-bold uppercase tracking-widest text-az-ink/45">
          Amount needed
          <input
            type="number"
            min={1000}
            step={1000}
            value={amount}
            onChange={(event) => {
              setAmount(Number(event.target.value) || 0);
              setShowAll(false);
            }}
            className="w-40 rounded-xl bg-az-glass-fill border border-az-glass-border px-3 py-2.5 text-sm font-semibold text-az-ink normal-case tracking-normal"
          />
        </label>

        <label className="flex flex-col gap-2 text-xs font-bold uppercase tracking-widest text-az-ink/45">
          Repay over
          <select
            value={tenor}
            onChange={(event) => {
              setTenor(Number(event.target.value));
              setShowAll(false);
            }}
            className="w-40 rounded-xl bg-az-glass-fill border border-az-glass-border px-3 py-2.5 text-sm font-semibold text-az-ink normal-case tracking-normal"
          >
            {[1, 3, 6, 12, 24].map((months) => (
              <option key={months} value={months} className="bg-az-surface-panel">
                {months} {months === 1 ? 'month' : 'months'}
              </option>
            ))}
          </select>
        </label>

        <p className="text-sm text-az-ink/50 flex-1 min-w-[180px]">
          {isPending
            ? 'Loading partners…'
            : `${visible.length} of ${offers.length} partner${offers.length === 1 ? '' : 's'} lend from ${formatAmount(amount)} over ${tenor} month${tenor === 1 ? '' : 's'}.`}
        </p>
      </div>

      {isPending ? (
        <div className="grid gap-5 md:grid-cols-2">
          <Skeleton height="320px" borderRadius="1rem" />
          <Skeleton height="320px" borderRadius="1rem" />
        </div>
      ) : error ? (
        <ErrorState
          title="Partner offers are unavailable"
          description={(error as Error).message}
          buttonText="Retry"
          onButtonPress={() => void refetch()}
        />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={<SearchX size={28} />}
          title={
            offers.length === 0 ? 'No partners approved yet' : 'No partner covers that request'
          }
          description={
            offers.length === 0
              ? 'Approved lending partners appear here as soon as they are published. Nothing on this page is a pre-approved offer.'
              : 'Try a smaller amount or a shorter repayment period, or see every partner on our list.'
          }
          action={
            offers.length > 0 && !showAll ? (
              <button
                type="button"
                onClick={() => setShowAll(true)}
                className="rounded-xl border border-az-ink/15 px-4 py-2 text-sm font-bold text-az-ink hover:bg-az-glass-card"
              >
                Show all partners
              </button>
            ) : undefined
          }
        />
      ) : (
        <>
          {offers.some((offer) => offer.isSample) ? (
            <p className="flex items-start gap-2 rounded-xl border border-az-warning-500/30 bg-az-warning-500/10 p-3 text-xs text-az-warning-400">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              <span>
                Listings marked “Sample data” are unpublished placeholders for development. They are
                not real credit products and must not be treated as approved partners.
              </span>
            </p>
          ) : null}
          <div className="grid gap-5 md:grid-cols-2">
            {visible.map((offer) => (
              <PartnerOfferCard key={offer.id} offer={offer} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
