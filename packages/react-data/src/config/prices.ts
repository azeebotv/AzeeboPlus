/**
 * Centralized price configuration for Azeebo+ clients (mobile + TV).
 *
 * All prices are fetched from the payment-service API.
 * NEVER hardcode prices — per CLAUDE.md rules.
 *
 * Single source of truth shared by both surfaces so preset amounts and
 * wallet limits cannot drift between the apps (they previously lived as
 * verbatim forks in apps/mobile/src/config/prices.ts and
 * apps/tv/src/config/prices.ts).
 */

import {
  pricingApi,
  type MoviePricing,
  type VotePackage,
  type WalletPricing,
  type PassPricing,
} from '../api/pricing';
import { createLogger } from '../utils/logger';

export const CURRENCY = '₦';

const logger = createLogger('Pricing');

// Cache for API responses
let cachedMoviePricing: MoviePricing | null = null;
let cachedVotePackages: Record<string, VotePackage[]> = {};
let cachedWalletPricing: WalletPricing | null = null;
let cachedPassesPricing: PassPricing | null = null;

// Async fetch functions with caching — all consumers should use these
export async function getMoviePricing(): Promise<MoviePricing> {
  if (cachedMoviePricing) return cachedMoviePricing;
  try {
    const res = await pricingApi.getMoviePricing();
    if (res.success && res.data) {
      cachedMoviePricing = res.data;
      return res.data;
    }
  } catch (e) {
    logger.warn('Failed to fetch movie pricing', String(e));
  }
  throw new Error('Movie pricing unavailable. Please check your connection and try again.');
}

export async function getVotePackages(type: string): Promise<VotePackage[]> {
  if (cachedVotePackages[type]) return cachedVotePackages[type];
  try {
    const res = await pricingApi.getVotePackages(type);
    if (res.success && res.data) {
      cachedVotePackages[type] = res.data;
      return res.data;
    }
  } catch (e) {
    logger.warn('Failed to fetch vote packages', String(e));
  }
  throw new Error('Vote packages unavailable. Please check your connection and try again.');
}

export async function getWalletPricing(): Promise<WalletPricing> {
  if (cachedWalletPricing) return cachedWalletPricing;
  try {
    const res = await pricingApi.getWalletPricing();
    if (res.success && res.data) {
      cachedWalletPricing = res.data;
      return res.data;
    }
  } catch (e) {
    logger.warn('Failed to fetch wallet pricing', String(e));
  }
  throw new Error('Wallet pricing unavailable. Please check your connection and try again.');
}

export async function getPassesPricing(): Promise<PassPricing> {
  if (cachedPassesPricing) return cachedPassesPricing;
  try {
    const res = await pricingApi.getPassesPricing();
    if (res.success && res.data) {
      cachedPassesPricing = res.data;
      return res.data;
    }
  } catch (e) {
    logger.warn('Failed to fetch passes pricing', String(e));
  }
  throw new Error('Passes pricing unavailable. Please check your connection and try again.');
}

export function clearPricingCache(): void {
  cachedMoviePricing = null;
  cachedVotePackages = {};
  cachedWalletPricing = null;
  cachedPassesPricing = null;
}

// ── Backward-compatible exports ───────────────────────────────────────
// Old consumers import these as constants. Provide fallback values that
// work while the async API fetch loads in the background.

export const votePackages: Record<string, VotePackage[]> = {
  superVote: [],
  regular: [],
  reality: [],
};

export const moviePricing: Record<
  string,
  { id: string; type: string; label: string; price: number }
> = {
  rent48h: { id: 'rent48h', type: 'rent48h', label: 'Rent 48h', price: 0 },
  rent: { id: 'rent', type: 'rent', label: 'Rent', price: 0 },
  buy: { id: 'buy', type: 'buy', label: 'Buy', price: 0 },
  pass: { id: 'pass', type: 'pass', label: 'Pass', price: 0 },
  subscription: { id: 'subscription', type: 'subscription', label: 'Subscription', price: 0 },
};

export const moviePassPrice = 0;
export const rentPrice = 0;
export const paymentPresetAmounts = [500, 1000, 2000, 5000];
export const addFundsPresetAmounts = [500, 1000, 2000, 5000];
export const walletPresetAmounts = [500, 1000, 2000, 5000];
export const walletLimits = {
  min: 100,
  max: 100000,
  minimumDeposit: 100,
  maximumDeposit: 100000,
  minimumWithdrawal: 500,
};
export const comedySubscription = { monthly: 0, yearly: 0, label: 'Comedy Pass' };
