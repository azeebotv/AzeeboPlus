// Display formatting for Borrow offers. Amount and rate columns arrive as
// decimal strings from the API; they are only ever formatted here, never used
// for arithmetic, so a float parse cannot leak into a disclosed figure.

import type { PartnerBankOffer } from './api';

const ngn = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  maximumFractionDigits: 0,
});

export function formatAmount(value: string | number): string {
  return ngn.format(Number(value));
}

function collapse(
  value: string | number,
  other: string | number,
  format: (v: string | number) => string
): string {
  return String(value) === String(other) ? format(value) : `${format(value)} – ${format(other)}`;
}

export function formatAmountRange(
  offer: Pick<PartnerBankOffer, 'minAmount' | 'maxAmount'>
): string {
  return collapse(offer.minAmount, offer.maxAmount, formatAmount);
}

export function formatRateRange(
  offer: Pick<PartnerBankOffer, 'interestRateMin' | 'interestRateMax'>
): string {
  return `${collapse(offer.interestRateMin, offer.interestRateMax, (v) => `${Number(v)}%`)} p.a.`;
}

export function formatTenorRange(
  offer: Pick<PartnerBankOffer, 'minTenorMonths' | 'maxTenorMonths'>
): string {
  return collapse(
    offer.minTenorMonths,
    offer.maxTenorMonths,
    (v) => `${Number(v)} ${Number(v) === 1 ? 'month' : 'months'}`
  );
}

/** Offers whose range overlaps the requested amount and tenor. */
export function offersMatching(
  offers: PartnerBankOffer[],
  amount: number,
  tenorMonths: number
): PartnerBankOffer[] {
  return offers.filter(
    (offer) =>
      Number(offer.minAmount) <= amount &&
      amount <= Number(offer.maxAmount) &&
      offer.minTenorMonths <= tenorMonths &&
      tenorMonths <= offer.maxTenorMonths
  );
}
