import { describe, expect, it } from 'vitest';
import {
  formatAmount,
  formatAmountRange,
  formatRateRange,
  formatTenorRange,
  offersMatching,
} from '../borrow';
import type { PartnerBankOffer } from '../api/borrow';

// Decimal columns arrive as strings; the offer factory keeps that shape so the
// formatting path is exercised exactly as the API delivers it.
const offer = (overrides: Partial<PartnerBankOffer> = {}): PartnerBankOffer => ({
  id: 'pb-1',
  slug: 'partner-a',
  name: 'Partner A',
  productName: null,
  logoUrl: null,
  licenceRef: null,
  registrationNumber: null,
  minAmount: '10000.00',
  maxAmount: '500000.00',
  minTenorMonths: 1,
  maxTenorMonths: 6,
  interestRateMin: '12.000',
  interestRateMax: '24.000',
  feeDisclosure: null,
  totalCostExample: null,
  eligibility: null,
  applyUrl: 'https://apply.example.org/partner-a',
  termsUrl: null,
  privacyUrl: null,
  displayOrder: 1,
  isActive: true,
  isSample: true,
  ...overrides,
});

describe('formatAmount', () => {
  it('renders a decimal string as whole-naira currency', () => {
    expect(formatAmount('100000.00')).toBe('₦100,000');
  });

  it('never shows kobo on a disclosed range bound', () => {
    expect(formatAmount('15000.50')).toBe('₦15,001');
  });
});

describe('formatAmountRange', () => {
  it('shows both bounds when they differ', () => {
    expect(formatAmountRange(offer())).toBe('₦10,000 – ₦500,000');
  });

  it('collapses a single-value offer instead of printing "X – X"', () => {
    expect(formatAmountRange(offer({ minAmount: '50000.00', maxAmount: '50000.00' }))).toBe(
      '₦50,000'
    );
  });
});

describe('formatRateRange', () => {
  it('labels the period so a percentage cannot read as a flat fee', () => {
    expect(formatRateRange(offer())).toBe('12% – 24% p.a.');
  });

  it('keeps one rate when min equals max', () => {
    expect(formatRateRange(offer({ interestRateMin: '18.000', interestRateMax: '18.000' }))).toBe(
      '18% p.a.'
    );
  });
});

describe('formatTenorRange', () => {
  it('pluralises months', () => {
    expect(formatTenorRange(offer({ minTenorMonths: 3, maxTenorMonths: 24 }))).toBe(
      '3 months – 24 months'
    );
  });

  it('uses the singular for a one-month offer', () => {
    expect(formatTenorRange(offer({ minTenorMonths: 1, maxTenorMonths: 1 }))).toBe('1 month');
  });
});

describe('offersMatching', () => {
  const smallTicket = offer({
    id: 'pb-2',
    slug: 'partner-b',
    minAmount: '2000.00',
    maxAmount: '60000.00',
    minTenorMonths: 1,
    maxTenorMonths: 3,
  });
  const longTenor = offer({
    id: 'pb-3',
    slug: 'partner-c',
    minAmount: '50000.00',
    maxAmount: '2000000.00',
    minTenorMonths: 12,
    maxTenorMonths: 36,
  });

  it('keeps offers whose amount and tenor both cover the request', () => {
    const matches = offersMatching([offer(), smallTicket, longTenor], 10000, 3);
    expect(matches.map((m) => m.id)).toEqual(['pb-1', 'pb-2']);
  });

  it('treats range bounds as inclusive', () => {
    expect(offersMatching([offer()], 500000, 6).map((m) => m.id)).toEqual(['pb-1']);
    expect(offersMatching([offer()], 10000, 1).map((m) => m.id)).toEqual(['pb-1']);
  });

  it('drops an offer whose maximum is below the requested amount', () => {
    expect(offersMatching([smallTicket], 100000, 2)).toEqual([]);
  });

  it('drops an offer whose tenor range does not reach the request', () => {
    expect(offersMatching([smallTicket], 10000, 6)).toEqual([]);
  });

  it('returns nothing when no partner is configured', () => {
    expect(offersMatching([], 10000, 1)).toEqual([]);
  });
});
