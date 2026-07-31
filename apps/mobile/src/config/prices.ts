/**
 * Centralized price configuration for the Azeebo+ mobile app.
 *
 * All prices are fetched from the payment-service API.
 * NEVER hardcode prices — per CLAUDE.md rules.
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
    logger.warn('Failed to fetch movie pricing', e);
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
    logger.warn('Failed to fetch vote packages', e);
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
    logger.warn('Failed to fetch wallet pricing', e);
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
    logger.warn('Failed to fetch passes pricing', e);
  }
  throw new Error('Passes pricing unavailable. Please check your connection and try again.');
}

export function clearPricingCache(): void {
  cachedMoviePricing = null;
  cachedVotePackages = {};
  cachedWalletPricing = null;
  cachedPassesPricing = null;
}
