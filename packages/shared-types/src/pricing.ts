// Shared pricing types for Azeebo+
// All pricing values MUST be provided via environment variables or database.
// These types define the shape only — no hardcoded prices.

/**
 * Single source of truth for default price constants (the fallbacks used when
 * an env var is unset). Every service that prices something reads its default
 * from here — payment-service's PricingService uses this map for its
 * `getConfig(key)` fallbacks, so defaults live in one place instead of being
 * scattered across call sites.
 */
export const PRICE_CONFIG: Record<string, string> = {
  // Movies
  MOVIE_RENT_PRICE: '500',
  MOVIE_BUY_PRICE: '1500',
  MOVIE_PASS_PRICE: '4500',
  // Vote packages
  VOTE_STANDARD_10: '100',
  VOTE_STANDARD_50: '450',
  VOTE_STANDARD_100: '850',
  VOTE_STANDARD_500: '4000',
  VOTE_REALITY_100: '100',
  VOTE_REALITY_500: '450',
  VOTE_REALITY_1000: '850',
  VOTE_REALITY_5000: '4000',
  SUPER_VOTE_1: '500',
  SUPER_VOTE_5: '2000',
  SUPER_VOTE_10: '3500',
  SUPER_VOTE_25: '8000',
  // Subscriptions
  SUB_BASIC_PRICE: '0',
  SUB_PREMIUM_PRICE: '2000',
  SUB_VIP_PRICE: '5000',
  // Wallet limits
  WALLET_MIN_DEPOSIT: '100',
  WALLET_MAX_DEPOSIT: '1000000',
  WALLET_MIN_WITHDRAWAL: '500',
  // Passes
  PASS_DAILY_PRICE: '200',
  PASS_WEEKLY_PRICE: '1500',
  PASS_MONTHLY_PRICE: '5000',
};

export interface PricingPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: 'monthly' | 'yearly';
  features: string[];
}

export interface WalletPricing {
  fundMinimum: number;
  fundMaximum: number;
  withdrawMinimum: number;
  withdrawMaximum: number;
  transferMinimum: number;
  transferMaximum: number;
  currency: string;
}

export interface ContentPricing {
  payPerView: number;
  subscription: {
    basic: number;
    premium: number;
    vip: number;
  };
  currency: string;
}

export interface SuperVotePricing {
  price: number;
  currency: string;
  packages: Array<{ votes: number; price: number }>;
}

export interface PredictionPricing {
  minimumBet: number;
  maximumBet: number;
  currency: string;
}

function requireEnv(name: string, value: string | undefined, isProduction: boolean): number {
  const parsed = parseInt(value || '0', 10);
  if (isProduction && (value === undefined || value === '' || parsed === 0)) {
    throw new Error(`Missing or invalid required pricing env var: ${name}`);
  }
  return parsed;
}

// Helper function to get pricing from environment variables
// Throws if required env vars are not set (fail-fast in production)
export function getPricing(env?: Record<string, string | undefined>): {
  wallet: WalletPricing;
  content: ContentPricing;
  subscriptionPlans: PricingPlan[];
  universePricing: Record<string, { price: number; currency: string }>;
  superVote: SuperVotePricing;
  prediction: PredictionPricing;
} {
  const e = env ?? process.env;
  const isProduction = (e?.NODE_ENV || process.env.NODE_ENV) === 'production';
  const currency = e?.PRICING_CURRENCY || 'NGN';
  const r = (name: string, value?: string) => requireEnv(name, value, isProduction);

  return {
    wallet: {
      fundMinimum: r('WALLET_FUND_MINIMUM', e?.WALLET_FUND_MINIMUM),
      fundMaximum: r('WALLET_FUND_MAXIMUM', e?.WALLET_FUND_MAXIMUM),
      withdrawMinimum: r('WALLET_WITHDRAW_MINIMUM', e?.WALLET_WITHDRAW_MINIMUM),
      withdrawMaximum: r('WALLET_WITHDRAW_MAXIMUM', e?.WALLET_WITHDRAW_MAXIMUM),
      transferMinimum: r('WALLET_TRANSFER_MINIMUM', e?.WALLET_TRANSFER_MINIMUM),
      transferMaximum: r('WALLET_TRANSFER_MAXIMUM', e?.WALLET_TRANSFER_MAXIMUM),
      currency,
    },
    content: {
      payPerView: r('CONTENT_PAY_PER_VIEW', e?.CONTENT_PAY_PER_VIEW),
      subscription: {
        basic: r('SUBSCRIPTION_BASIC_PRICE', e?.SUBSCRIPTION_BASIC_PRICE),
        premium: r('SUBSCRIPTION_PREMIUM_PRICE', e?.SUBSCRIPTION_PREMIUM_PRICE),
        vip: r('SUBSCRIPTION_VIP_PRICE', e?.SUBSCRIPTION_VIP_PRICE),
      },
      currency,
    },
    subscriptionPlans: [
      {
        id: 'basic',
        name: 'Basic',
        price: r('SUBSCRIPTION_BASIC_PRICE', e?.SUBSCRIPTION_BASIC_PRICE),
        currency,
        interval: 'monthly' as const,
        features: (e?.SUBSCRIPTION_BASIC_FEATURES || 'HD Streaming,Limited Content,1 Device').split(
          ','
        ),
      },
      {
        id: 'premium',
        name: 'Premium',
        price: r('SUBSCRIPTION_PREMIUM_PRICE', e?.SUBSCRIPTION_PREMIUM_PRICE),
        currency,
        interval: 'monthly' as const,
        features: (
          e?.SUBSCRIPTION_PREMIUM_FEATURES || '4K Streaming,All Content,3 Devices,Offline Download'
        ).split(','),
      },
      {
        id: 'vip',
        name: 'VIP',
        price: r('SUBSCRIPTION_VIP_PRICE', e?.SUBSCRIPTION_VIP_PRICE),
        currency,
        interval: 'monthly' as const,
        features: (
          e?.SUBSCRIPTION_VIP_FEATURES ||
          '4K Streaming,All Content,5 Devices,Offline Download,Early Access,Exclusive Content'
        ).split(','),
      },
    ],
    universePricing: {
      comedy: { price: r('UNIVERSE_COMEDY_PRICE', e?.UNIVERSE_COMEDY_PRICE), currency },
      reality: { price: r('UNIVERSE_REALITY_PRICE', e?.UNIVERSE_REALITY_PRICE), currency },
      movie: { price: r('UNIVERSE_MOVIE_PRICE', e?.UNIVERSE_MOVIE_PRICE), currency },
      sports: { price: r('UNIVERSE_SPORTS_PRICE', e?.UNIVERSE_SPORTS_PRICE), currency },
      games: { price: r('UNIVERSE_GAMES_PRICE', e?.UNIVERSE_GAMES_PRICE), currency },
      lifestyle: { price: r('UNIVERSE_LIFESTYLE_PRICE', e?.UNIVERSE_LIFESTYLE_PRICE), currency },
      music: { price: r('UNIVERSE_MUSIC_PRICE', e?.UNIVERSE_MUSIC_PRICE), currency },
    },
    superVote: {
      price: r('SUPER_VOTE_PRICE', e?.SUPER_VOTE_PRICE),
      currency,
      packages: [
        { votes: 1, price: r('SUPER_VOTE_1_PRICE', e?.SUPER_VOTE_1_PRICE) },
        { votes: 5, price: r('SUPER_VOTE_5_PRICE', e?.SUPER_VOTE_5_PRICE) },
        { votes: 10, price: r('SUPER_VOTE_10_PRICE', e?.SUPER_VOTE_10_PRICE) },
        { votes: 50, price: r('SUPER_VOTE_50_PRICE', e?.SUPER_VOTE_50_PRICE) },
      ],
    },
    prediction: {
      minimumBet: r('PREDICTION_MIN_BET', e?.PREDICTION_MIN_BET),
      maximumBet: r('PREDICTION_MAX_BET', e?.PREDICTION_MAX_BET),
      currency,
    },
  };
}
