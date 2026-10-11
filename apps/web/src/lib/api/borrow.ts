// Borrow domain methods — approved lending partners for the public Borrow page.

import type { ApiResponse, RequestClient, RetryOptions } from './base';

// Read-only catalogue: fail fast rather than holding the page open while
// wallet-service is down, so the UI can show its empty/retry state.
const BORROW_READ_RETRY: RetryOptions = { skipRetry: true };

/**
 * Decimal columns arrive as strings (Prisma serializes Decimal as a decimal
 * string), so amounts and rates are formatted from the string, never parsed
 * through float arithmetic in the display path.
 */
export interface PartnerBankOffer {
  id: string;
  slug: string;
  name: string;
  productName: string | null;
  logoUrl: string | null;
  licenceRef: string | null;
  registrationNumber: string | null;
  minAmount: string;
  maxAmount: string;
  minTenorMonths: number;
  maxTenorMonths: number;
  interestRateMin: string;
  interestRateMax: string;
  feeDisclosure: string | null;
  totalCostExample: string | null;
  eligibility: string | null;
  applyUrl: string;
  termsUrl: string | null;
  privacyUrl: string | null;
  displayOrder: number;
  isActive: boolean;
  /** Dev/placeholder row — the page must label these as sample data. */
  isSample: boolean;
}

export function createBorrowMethods(client: RequestClient) {
  return {
    getPartnerBanks: async (): Promise<ApiResponse<PartnerBankOffer[]>> => {
      return client.request<PartnerBankOffer[]>('/api/v1/borrow/banks', {}, BORROW_READ_RETRY);
    },

    getPartnerBank: async (slug: string): Promise<ApiResponse<PartnerBankOffer>> => {
      return client.request<PartnerBankOffer>(
        `/api/v1/borrow/banks/${encodeURIComponent(slug)}`,
        {},
        BORROW_READ_RETRY
      );
    },
  };
}
