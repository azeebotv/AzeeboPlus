// Shared pricing constants for Azeebo+
// These values should be loaded from environment or database in production

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

// Default pricing - should be overridden by environment variables or database
export const DEFAULT_PRICING = {
  // Wallet limits
  wallet: {
    fundMinimum: 100,
    fundMaximum: 1000000,
    withdrawMinimum: 500,
    withdrawMaximum: 500000,
    transferMinimum: 100,
    transferMaximum: 100000,
    currency: 'NGN',
  } as WalletPricing,

  // Content pricing
  content: {
    payPerView: 500,
    subscription: {
      basic: 2000,
      premium: 5000,
      vip: 10000,
    },
    currency: 'NGN',
  } as ContentPricing,

  // Subscription plans
  subscriptionPlans: [
    {
      id: 'basic',
      name: 'Basic',
      price: 2000,
      currency: 'NGN',
      interval: 'monthly' as const,
      features: ['HD Streaming', 'Limited Content', '1 Device'],
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 5000,
      currency: 'NGN',
      interval: 'monthly' as const,
      features: ['4K Streaming', 'All Content', '3 Devices', 'Offline Download'],
    },
    {
      id: 'vip',
      name: 'VIP',
      price: 10000,
      currency: 'NGN',
      interval: 'monthly' as const,
      features: ['4K Streaming', 'All Content', '5 Devices', 'Offline Download', 'Early Access', 'Exclusive Content'],
    },
  ] as PricingPlan[],

  // Universe-specific pricing (verticals)
  universePricing: {
    comedy: { price: 300, currency: 'NGN' },
    reality: { price: 500, currency: 'NGN' },
    movie: { price: 1000, currency: 'NGN' },
    sports: { price: 200, currency: 'NGN' },
    games: { price: 150, currency: 'NGN' },
    lifestyle: { price: 400, currency: 'NGN' },
    music: { price: 250, currency: 'NGN' },
  } as Record<string, { price: number; currency: string }>,

  // Super vote pricing
  superVote: {
    price: 100,
    currency: 'NGN',
    packages: [
      { votes: 1, price: 100 },
      { votes: 5, price: 450 },
      { votes: 10, price: 800 },
      { votes: 50, price: 3500 },
    ],
  },

  // Prediction/betting pricing
  prediction: {
    minimumBet: 100,
    maximumBet: 100000,
    currency: 'NGN',
  },
} as const;

// Helper function to get pricing with environment variable override
export function getPricing(env?: Record<string, string | undefined>) {
  return {
    wallet: {
      ...DEFAULT_PRICING.wallet,
      fundMinimum: parseInt(env?.WALLET_FUND_MINIMUM || '') || DEFAULT_PRICING.wallet.fundMinimum,
      fundMaximum: parseInt(env?.WALLET_FUND_MAXIMUM || '') || DEFAULT_PRICING.wallet.fundMaximum,
      withdrawMinimum: parseInt(env?.WALLET_WITHDRAW_MINIMUM || '') || DEFAULT_PRICING.wallet.withdrawMinimum,
      withdrawMaximum: parseInt(env?.WALLET_WITHDRAW_MAXIMUM || '') || DEFAULT_PRICING.wallet.withdrawMaximum,
    },
    content: DEFAULT_PRICING.content,
    subscriptionPlans: DEFAULT_PRICING.subscriptionPlans,
    universePricing: DEFAULT_PRICING.universePricing,
    superVote: DEFAULT_PRICING.superVote,
    prediction: DEFAULT_PRICING.prediction,
  };
}
