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
export declare const DEFAULT_PRICING: {
    readonly wallet: WalletPricing;
    readonly content: ContentPricing;
    readonly subscriptionPlans: PricingPlan[];
    readonly universePricing: Record<string, {
        price: number;
        currency: string;
    }>;
    readonly superVote: {
        readonly price: 100;
        readonly currency: "NGN";
        readonly packages: readonly [{
            readonly votes: 1;
            readonly price: 100;
        }, {
            readonly votes: 5;
            readonly price: 450;
        }, {
            readonly votes: 10;
            readonly price: 800;
        }, {
            readonly votes: 50;
            readonly price: 3500;
        }];
    };
    readonly prediction: {
        readonly minimumBet: 100;
        readonly maximumBet: 100000;
        readonly currency: "NGN";
    };
};
export declare function getPricing(env?: Record<string, string | undefined>): typeof DEFAULT_PRICING;
