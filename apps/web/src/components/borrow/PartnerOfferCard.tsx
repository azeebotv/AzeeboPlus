'use client';

import { useState } from 'react';
import { BadgeCheck, ExternalLink, FileText } from 'lucide-react';
import type { PartnerBankOffer } from '@/lib/api';
import { formatAmountRange, formatRateRange, formatTenorRange } from '@/lib/borrow';

function Metric({ label, value }: { label: string; value: string }): React.JSX.Element {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-widest font-bold text-az-ink/40">{label}</div>
      <div className="text-sm sm:text-base font-semibold text-az-ink mt-1">{value}</div>
    </div>
  );
}

function PartnerMark({
  name,
  logoUrl,
}: {
  name: string;
  logoUrl: string | null;
}): React.JSX.Element {
  const [logoBroken, setLogoBroken] = useState(false);

  if (logoUrl && !logoBroken) {
    return (
      <img
        src={logoUrl}
        alt={`${name} logo`}
        width={40}
        height={40}
        onError={() => setLogoBroken(true)}
        className="h-10 w-10 shrink-0 rounded-xl bg-az-glass-card p-1.5 object-contain"
      />
    );
  }

  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('');

  return (
    <span
      aria-hidden="true"
      className="h-10 w-10 shrink-0 rounded-xl bg-az-glass-card grid place-items-center text-xs font-bold text-az-ink/60"
    >
      {initials}
    </span>
  );
}

/**
 * One partner offer with its disclosures inline. The rate, fee and total-cost
 * lines render straight from the partner record — nothing here is marketing
 * copy, so an admin edit is exactly what the borrower sees.
 */
export function PartnerOfferCard({ offer }: { offer: PartnerBankOffer }): React.JSX.Element {
  return (
    <article className="az-glass border border-az-glass-border p-6 sm:p-7 flex flex-col gap-5">
      <header className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <PartnerMark name={offer.name} logoUrl={offer.logoUrl} />
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-az-ink leading-tight">{offer.name}</h3>
            {offer.productName ? (
              <p className="text-sm text-az-ink/50 mt-1">{offer.productName}</p>
            ) : null}
          </div>
        </div>
        {offer.isSample ? (
          <span className="shrink-0 az-micro-label px-2 py-1 rounded-az-pill bg-az-warning-500/15 text-az-warning-400 border border-az-warning-500/30">
            Sample data
          </span>
        ) : null}
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Metric label="Amount" value={formatAmountRange(offer)} />
        <Metric label="Tenor" value={formatTenorRange(offer)} />
        <Metric label="Interest" value={formatRateRange(offer)} />
      </div>

      <dl className="space-y-3 text-sm">
        {offer.feeDisclosure ? (
          <div>
            <dt className="text-[11px] uppercase tracking-widest font-bold text-az-ink/40">Fees</dt>
            <dd className="text-az-ink/70 mt-1">{offer.feeDisclosure}</dd>
          </div>
        ) : null}
        {offer.totalCostExample ? (
          <div>
            <dt className="text-[11px] uppercase tracking-widest font-bold text-az-ink/40">
              Typical total repayment
            </dt>
            <dd className="text-az-ink/70 mt-1">{offer.totalCostExample}</dd>
          </div>
        ) : null}
        {offer.eligibility ? (
          <div>
            <dt className="text-[11px] uppercase tracking-widest font-bold text-az-ink/40">
              Who can apply
            </dt>
            <dd className="text-az-ink/70 mt-1">{offer.eligibility}</dd>
          </div>
        ) : null}
      </dl>

      {offer.licenceRef || offer.registrationNumber ? (
        <p className="flex items-start gap-2 text-xs text-az-ink/45">
          <BadgeCheck size={14} className="mt-0.5 shrink-0 text-az-success-400" />
          <span>{[offer.licenceRef, offer.registrationNumber].filter(Boolean).join(' · ')}</span>
        </p>
      ) : null}

      <footer className="mt-auto flex flex-wrap items-center gap-3 pt-1">
        <a
          href={offer.applyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="az-btn-primary az-btn-primary--inline az-btn-primary--sm inline-flex items-center gap-2"
        >
          Apply with {offer.name}
          <ExternalLink size={14} />
        </a>
        {offer.termsUrl ? (
          <a
            href={offer.termsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-az-ink/50 hover:text-az-ink/80"
          >
            <FileText size={13} /> Terms
          </a>
        ) : null}
        {offer.privacyUrl ? (
          <a
            href={offer.privacyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-az-ink/50 hover:text-az-ink/80"
          >
            <FileText size={13} /> Privacy
          </a>
        ) : null}
      </footer>
    </article>
  );
}
