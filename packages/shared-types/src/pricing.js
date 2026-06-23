"use strict";
// Shared pricing constants for Azeebo+
// These values should be loaded from environment or database in production
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_PRICING = void 0;
exports.getPricing = getPricing;
// Default pricing - should be overridden by environment variables or database
exports.DEFAULT_PRICING = {
    // Wallet limits
    wallet: {
        fundMinimum: 100,
        fundMaximum: 1000000,
        withdrawMinimum: 500,
        withdrawMaximum: 500000,
        transferMinimum: 100,
        transferMaximum: 100000,
        currency: 'NGN',
    },
    // Content pricing
    content: {
        payPerView: 500,
        subscription: {
            basic: 2000,
            premium: 5000,
            vip: 10000,
        },
        currency: 'NGN',
    },
    // Subscription plans
    subscriptionPlans: [
        {
            id: 'basic',
            name: 'Basic',
            price: 2000,
            currency: 'NGN',
            interval: 'monthly',
            features: ['HD Streaming', 'Limited Content', '1 Device'],
        },
        {
            id: 'premium',
            name: 'Premium',
            price: 5000,
            currency: 'NGN',
            interval: 'monthly',
            features: ['4K Streaming', 'All Content', '3 Devices', 'Offline Download'],
        },
        {
            id: 'vip',
            name: 'VIP',
            price: 10000,
            currency: 'NGN',
            interval: 'monthly',
            features: [
                '4K Streaming',
                'All Content',
                '5 Devices',
                'Offline Download',
                'Early Access',
                'Exclusive Content',
            ],
        },
    ],
    // Universe-specific pricing (verticals)
    universePricing: {
        comedy: { price: 300, currency: 'NGN' },
        reality: { price: 500, currency: 'NGN' },
        movie: { price: 1000, currency: 'NGN' },
        sports: { price: 200, currency: 'NGN' },
        games: { price: 150, currency: 'NGN' },
        lifestyle: { price: 400, currency: 'NGN' },
        music: { price: 250, currency: 'NGN' },
    },
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
};
// Helper function to get pricing with environment variable override
function getPricing(env) {
    return {
        wallet: {
            ...exports.DEFAULT_PRICING.wallet,
            fundMinimum: parseInt(env?.WALLET_FUND_MINIMUM || '') || exports.DEFAULT_PRICING.wallet.fundMinimum,
            fundMaximum: parseInt(env?.WALLET_FUND_MAXIMUM || '') || exports.DEFAULT_PRICING.wallet.fundMaximum,
            withdrawMinimum: parseInt(env?.WALLET_WITHDRAW_MINIMUM || '') || exports.DEFAULT_PRICING.wallet.withdrawMinimum,
            withdrawMaximum: parseInt(env?.WALLET_WITHDRAW_MAXIMUM || '') || exports.DEFAULT_PRICING.wallet.withdrawMaximum,
        },
        content: exports.DEFAULT_PRICING.content,
        subscriptionPlans: exports.DEFAULT_PRICING.subscriptionPlans,
        universePricing: exports.DEFAULT_PRICING.universePricing,
        superVote: exports.DEFAULT_PRICING.superVote,
        prediction: exports.DEFAULT_PRICING.prediction,
    };
}
