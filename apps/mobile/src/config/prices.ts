/**
 * Centralized price configuration for the Azeebo+ mobile app.
 *
 * Fetches prices from the payment-service API with cached fallback values.
 * All consumers should use the async fetch functions for real-time prices.
 */

import { pricingApi, type MoviePricing, type VotePackage, type WalletPricing, type PassPricing } from '../api/pricing';

export const CURRENCY = '₦';

// Cache for API responses
let cachedMoviePricing: MoviePricing | null = null;
let cachedVotePackages: Record<string, VotePackage[]> = {};
let cachedWalletPricing: WalletPricing | null = null;
let cachedPassesPricing: PassPricing | null = null;

// Fallback values used when API is unavailable
const FALLBACK_MOVIE_PRICING = {
  rent48h: { id: 'rent-48h', type: 'Rent (48h)', price: 500, currency: 'NGN' },
  buy: { id: 'buy', type: 'Buy', price: 1500, currency: 'NGN' },
  pass: { id: 'pass', type: 'Pass', price: 4500, currency: 'NGN', period: 'monthly' },
};

const FALLBACK_VOTE_PACKAGES: Record<string, VotePackage[]> = {
  standard: [
    { id: 'std-1', votes: 10, price: 100, bonus: 0 },
    { id: 'std-2', votes: 50, price: 450, bonus: 5 },
    { id: 'std-3', votes: 100, price: 850, bonus: 15 },
    { id: 'std-4', votes: 500, price: 4000, bonus: 100 },
  ],
  reality: [
    { id: 'rty-1', votes: 100, price: 100, bonus: 0 },
    { id: 'rty-2', votes: 500, price: 450, bonus: 50 },
    { id: 'rty-3', votes: 1000, price: 850, bonus: 150 },
    { id: 'rty-4', votes: 5000, price: 4000, bonus: 1000 },
  ],
  superVote: [
    { id: 'sv-1', votes: 1, price: 100, multiplier: 10, name: 'Single Vote', description: '1 Super Vote (2x weight)' },
    { id: 'sv-2', votes: 5, price: 450, multiplier: 10, name: 'Power Pack', description: '5 Super Votes (2x weight each)', isPopular: true },
    { id: 'sv-3', votes: 10, price: 800, multiplier: 10, name: 'Ultimate Pack', description: '10 Super Votes (2x weight each)' },
    { id: 'sv-4', votes: 25, price: 1800, multiplier: 10, name: 'Mega Pack', description: '25 Super Votes (2x weight each)' },
  ],
};

const FALLBACK_WALLET_PRICING: WalletPricing = {
  presetAmounts: [500, 1000, 2500, 5000, 10000],
  limits: { minDeposit: 100, maxDeposit: 1000000, minWithdrawal: 500 },
  withdrawalQuickAmounts: [1000, 5000, 10000, 20000],
};

const FALLBACK_PASSES_PRICING: PassPricing = {
  daily: { id: 'pass-daily', name: 'Daily Pass', price: 200, currency: 'NGN', duration: '24 hours' },
  weekly: { id: 'pass-weekly', name: 'Weekly Pass', price: 1500, currency: 'NGN', duration: '7 days' },
  monthly: { id: 'pass-monthly', name: 'Monthly Pass', price: 5000, currency: 'NGN', duration: '30 days' },
};

// Async fetch functions with caching
export async function getMoviePricing(): Promise<MoviePricing> {
  if (cachedMoviePricing) return cachedMoviePricing;
  try {
    const res = await pricingApi.getMoviePricing();
    if (res.success && res.data) {
      cachedMoviePricing = res.data;
      return res.data;
    }
  } catch {}
  return FALLBACK_MOVIE_PRICING;
}

export async function getVotePackages(type: string): Promise<VotePackage[]> {
  if (cachedVotePackages[type]) return cachedVotePackages[type];
  try {
    const res = await pricingApi.getVotePackages(type);
    if (res.success && res.data) {
      cachedVotePackages[type] = res.data;
      return res.data;
    }
  } catch {}
  return FALLBACK_VOTE_PACKAGES[type] || FALLBACK_VOTE_PACKAGES.standard;
}

export async function getWalletPricing(): Promise<WalletPricing> {
  if (cachedWalletPricing) return cachedWalletPricing;
  try {
    const res = await pricingApi.getWalletPricing();
    if (res.success && res.data) {
      cachedWalletPricing = res.data;
      return res.data;
    }
  } catch {}
  return FALLBACK_WALLET_PRICING;
}

export async function getPassesPricing(): Promise<PassPricing> {
  if (cachedPassesPricing) return cachedPassesPricing;
  try {
    const res = await pricingApi.getPassesPricing();
    if (res.success && res.data) {
      cachedPassesPricing = res.data;
      return res.data;
    }
  } catch {}
  return FALLBACK_PASSES_PRICING;
}

export function clearPricingCache(): void {
  cachedMoviePricing = null;
  cachedVotePackages = {};
  cachedWalletPricing = null;
  cachedPassesPricing = null;
}

// Synchronous fallback accessors (for components that can't use async)
// These return cached values or defaults - prefer async functions above
export const moviePricing = {
  rent48h: { id: 'rent-48h', type: 'Rent (48h)', price: (cachedMoviePricing as MoviePricing | null)?.rent48h?.price ?? 500, label: '₦500' },
  buy: { id: 'buy', type: 'Buy', price: (cachedMoviePricing as MoviePricing | null)?.buy?.price ?? 1500, label: '₦1,500' },
  pass: { id: 'pass', type: 'Pass', price: (cachedMoviePricing as MoviePricing | null)?.pass?.price ?? 4500, label: '₦4,500/mo' },
} as const;

export const moviePassPrice = { monthly: 4500, label: '₦4,500/month' } as const;
export const rentPrice = 500;

export const votePackages = FALLBACK_VOTE_PACKAGES;

export const verticalSubscription = { monthly: 2000, label: '₦2,000/month' } as const;
export const comedySubscription = { monthly: 1500, label: '₦1,500/month' } as const;
export const cityGuidePricing = { premium: 5000, standard: 3000 } as const;

export const walletPresetAmounts = [500, 1000, 2500, 5000, 10000] as const;
export const paymentPresetAmounts = [500, 1000, 2500, 5000, 10000] as const;
export const addFundsPresetAmounts = [500, 1000, 2000, 5000, 10000, 20000] as const;

export const walletLimits = {
  minimumWithdrawal: 500,
  minimumDeposit: 100,
  maximumDeposit: 1000000,
} as const;
