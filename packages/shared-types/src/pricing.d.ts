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
    packages: Array<{
        votes: number;
        price: number;
    }>;
}
export interface PredictionPricing {
    minimumBet: number;
    maximumBet: number;
    currency: string;
}
export declare function getPricing(env?: Record<string, string | undefined>): {
    wallet: WalletPricing;
    content: ContentPricing;
    subscriptionPlans: PricingPlan[];
    universePricing: Record<string, {
        price: number;
        currency: string;
    }>;
    superVote: SuperVotePricing;
    prediction: PredictionPricing;
};
