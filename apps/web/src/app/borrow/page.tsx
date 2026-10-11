'use client';

import Link from 'next/link';
import { HandCoins, ListChecks, ShieldCheck } from 'lucide-react';
import PageShell from '@/components/layout/PageShell';
import PageHero from '@/components/layout/PageHero';
import { BorrowOffers } from '@/components/borrow/BorrowOffers';
import { BorrowDisclosures } from '@/components/borrow/BorrowDisclosures';

const STEPS = [
  {
    icon: ListChecks,
    title: 'Compare the partners',
    body: 'Every approved lender is listed with its own amount range, tenor, rate range and fees — no hidden conditions behind an application form.',
  },
  {
    icon: HandCoins,
    title: 'Pick an amount and repayment period',
    body: 'The filter hides partners whose published range cannot cover your request, so you only see offers worth applying for.',
  },
  {
    icon: ShieldCheck,
    title: 'Apply on the partner’s site',
    body: '“Apply” opens the partner’s own application page in a new tab. Azeebo+ takes no application and never sees your credit details.',
  },
];

export default function BorrowPage(): React.JSX.Element {
  return (
    <PageShell activeNav="Borrow">
      <PageHero
        badge="Partner lending • Azeebo+ is not a lender"
        title="Borrow"
        subtitle="Compare loans from Azeebo+’s approved partner banks, with the rate range, fees and total-cost disclosure on every offer before you apply."
        accentColor="var(--color-az-flame)"
        actions={
          <Link
            href="/borrow/account"
            className="inline-flex items-center gap-2 rounded-xl border border-az-ink/15 px-4 py-2.5 text-sm font-bold text-az-ink hover:bg-az-glass-card"
          >
            See offers for my account
          </Link>
        }
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 space-y-10">
        <section aria-labelledby="borrow-how" className="grid gap-5 sm:grid-cols-3">
          <h2 id="borrow-how" className="sr-only">
            How borrowing works
          </h2>
          {STEPS.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="rounded-2xl border border-az-glass-border bg-az-ink/[0.03] p-5"
            >
              <Icon size={20} className="text-[var(--color-az-flame)]" />
              <h3 className="mt-3 text-sm font-bold text-az-ink">{title}</h3>
              <p className="mt-2 text-sm text-az-ink/55 leading-relaxed">{body}</p>
            </div>
          ))}
        </section>

        <BorrowOffers />
        <BorrowDisclosures />
      </div>
    </PageShell>
  );
}
