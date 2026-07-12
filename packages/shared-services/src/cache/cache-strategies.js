"use strict";
/**
 * Cache strategies for different service types.
 * Defines TTLs, invalidation patterns, and cache keys for each service.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CACHE_STRATEGIES = void 0;
exports.getCacheStrategy = getCacheStrategy;
exports.cacheKey = cacheKey;
exports.CACHE_STRATEGIES = {
    // Core services
    auth: {
        defaultTtl: 300, // 5 minutes
        keyPrefix: 'auth:',
        invalidationPatterns: ['auth:user:*', 'auth:session:*', 'auth:permissions:*'],
    },
    user: {
        defaultTtl: 600, // 10 minutes
        keyPrefix: 'user:',
        invalidationPatterns: ['user:profile:*', 'user:preferences:*', 'user:settings:*'],
    },
    wallet: {
        defaultTtl: 60, // 1 minute - financial data needs fresh reads
        keyPrefix: 'wallet:',
        invalidationPatterns: ['wallet:balance:*', 'wallet:transactions:*', 'wallet:summary:*'],
    },
    payment: {
        defaultTtl: 30, // 30 seconds - payment data needs very fresh reads
        keyPrefix: 'payment:',
        invalidationPatterns: ['payment:intent:*', 'payment:method:*'],
    },
    content: {
        defaultTtl: 300, // 5 minutes
        keyPrefix: 'content:',
        invalidationPatterns: [
            'content:list:*',
            'content:home:*',
            'content:featured:*',
            'content:trending:*',
        ],
    },
    search: {
        defaultTtl: 600, // 10 minutes - search results change less frequently
        keyPrefix: 'search:',
        invalidationPatterns: ['search:results:*', 'search:suggestions:*'],
    },
    media: {
        defaultTtl: 3600, // 1 hour - media metadata changes rarely
        keyPrefix: 'media:',
        invalidationPatterns: ['media:upload:*', 'media:transcode:*'],
    },
    // Universe services
    reality: {
        defaultTtl: 30, // 30 seconds - live data needs fresh reads
        keyPrefix: 'reality:',
        invalidationPatterns: [
            'reality:shows:*',
            'reality:episodes:*',
            'reality:contestants:*',
            'reality:votes:*',
        ],
    },
    lifestyle: {
        defaultTtl: 300, // 5 minutes
        keyPrefix: 'lifestyle:',
        invalidationPatterns: ['lifestyle:events:*', 'lifestyle:polls:*', 'lifestyle:quizzes:*'],
    },
    vertical: {
        defaultTtl: 600, // 10 minutes
        keyPrefix: 'vertical:',
        invalidationPatterns: ['vertical:storyworlds:*', 'vertical:characters:*', 'vertical:titles:*'],
    },
    movie: {
        defaultTtl: 300, // 5 minutes
        keyPrefix: 'movie:',
        invalidationPatterns: ['movie:list:*', 'movie:detail:*', 'movie:rental:*'],
    },
    games: {
        defaultTtl: 60, // 1 minute - game data changes frequently
        keyPrefix: 'games:',
        invalidationPatterns: ['games:list:*', 'games:session:*', 'games:tournament:*'],
    },
    comedy: {
        defaultTtl: 300, // 5 minutes
        keyPrefix: 'comedy:',
        invalidationPatterns: ['comedy:clips:*', 'comedy:series:*', 'comedy:trending:*'],
    },
    sports: {
        defaultTtl: 30, // 30 seconds - live sports data
        keyPrefix: 'sports:',
        invalidationPatterns: ['sports:fixtures:*', 'sports:predictions:*', 'sports:leaderboard:*'],
    },
    creator: {
        defaultTtl: 600, // 10 minutes
        keyPrefix: 'creator:',
        invalidationPatterns: ['creator:profile:*', 'creator:earnings:*', 'creator:content:*'],
    },
    // Engagement services
    notification: {
        defaultTtl: 60, // 1 minute
        keyPrefix: 'notification:',
        invalidationPatterns: ['notification:unread:*', 'notification:preferences:*'],
    },
    reward: {
        defaultTtl: 120, // 2 minutes
        keyPrefix: 'reward:',
        invalidationPatterns: ['reward:balance:*', 'reward:badges:*', 'reward:missions:*'],
    },
    referral: {
        defaultTtl: 300, // 5 minutes
        keyPrefix: 'referral:',
        invalidationPatterns: ['referral:code:*', 'referral:stats:*'],
    },
    messaging: {
        defaultTtl: 10, // 10 seconds - messaging needs very fresh data
        keyPrefix: 'messaging:',
        invalidationPatterns: ['messaging:conversations:*', 'messaging:messages:*'],
    },
    engagement: {
        defaultTtl: 60, // 1 minute
        keyPrefix: 'engagement:',
        invalidationPatterns: ['engagement:leaderboard:*', 'engagement:predictions:*'],
    },
    subscription: {
        defaultTtl: 300, // 5 minutes
        keyPrefix: 'subscription:',
        invalidationPatterns: ['subscription:plans:*', 'subscription:user:*'],
    },
    // Operations services
    moderation: {
        defaultTtl: 120, // 2 minutes
        keyPrefix: 'moderation:',
        invalidationPatterns: ['moderation:reports:*', 'moderation:cases:*'],
    },
    queue: {
        defaultTtl: 10, // 10 seconds - queue data changes very frequently
        keyPrefix: 'queue:',
        invalidationPatterns: ['queue:jobs:*', 'queue:schedules:*'],
    },
    support: {
        defaultTtl: 120, // 2 minutes
        keyPrefix: 'support:',
        invalidationPatterns: ['support:tickets:*', 'support:faq:*'],
    },
    // Intelligence services
    analytics: {
        defaultTtl: 300, // 5 minutes
        keyPrefix: 'analytics:',
        invalidationPatterns: ['analytics:metrics:*', 'analytics:reports:*'],
    },
    recommendation: {
        defaultTtl: 1800, // 30 minutes - recommendations change slowly
        keyPrefix: 'recommendation:',
        invalidationPatterns: ['recommendation:user:*', 'recommendation:popular:*'],
    },
    // Gateway
    gateway: {
        defaultTtl: 30, // 30 seconds - gateway needs fresh data
        keyPrefix: 'gateway:',
        invalidationPatterns: ['gateway:routes:*', 'gateway:health:*'],
    },
};
/**
 * Get cache strategy for a service.
 *
 * @param serviceName - The service name
 * @returns The cache strategy, or default if not found
 */
function getCacheStrategy(serviceName) {
    return (exports.CACHE_STRATEGIES[serviceName] || {
        defaultTtl: 300,
        keyPrefix: `${serviceName}:`,
        invalidationPatterns: [`${serviceName}:*`],
    });
}
/**
 * Generate a cache key with service prefix.
 *
 * @param serviceName - The service name
 * @param key - The cache key
 * @returns The prefixed cache key
 */
function cacheKey(serviceName, key) {
    const strategy = getCacheStrategy(serviceName);
    return `${strategy.keyPrefix}${key}`;
}
