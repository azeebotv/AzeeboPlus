"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var CacheService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheService = void 0;
const common_1 = require("@nestjs/common");
const redis_service_1 = require("../redis/redis.service");
let CacheService = CacheService_1 = class CacheService {
    redisService;
    logger = new common_1.Logger(CacheService_1.name);
    defaultTtl;
    stats = { hits: 0, misses: 0, sets: 0, deletes: 0, hitRate: 0 };
    constructor(redisService) {
        this.redisService = redisService;
        this.defaultTtl = parseInt(process.env.CACHE_DEFAULT_TTL || '300', 10);
    }
    /**
     * Retrieves a cached value by key.
     * Returns null if the key doesn't exist or has expired.
     *
     * @param key - The cache key
     * @returns The cached value as a parsed object, or null
     */
    async get(key) {
        try {
            const value = await this.redisService.get(key);
            if (!value) {
                this.stats.misses++;
                this.updateHitRate();
                return null;
            }
            this.stats.hits++;
            this.updateHitRate();
            return JSON.parse(value);
        }
        catch (error) {
            this.logger.error(`Cache GET error for key ${key}: ${error.message}`);
            return null;
        }
    }
    /**
     * Stores a value in cache with optional TTL.
     *
     * @param key - The cache key
     * @param value - The value to cache (will be JSON stringified)
     * @param ttl - Time to live in seconds (defaults to 300s / 5min)
     */
    async set(key, value, ttl) {
        try {
            const serialized = JSON.stringify(value);
            const ttlSeconds = ttl || this.defaultTtl;
            await this.redisService.set(key, serialized, ttlSeconds);
            this.stats.sets++;
            this.logger.debug(`Cache SET: ${key} (TTL: ${ttlSeconds}s)`);
        }
        catch (error) {
            this.logger.error(`Cache SET error for key ${key}: ${error.message}`);
        }
    }
    /**
     * Removes a cached value by key.
     *
     * @param key - The cache key to delete
     */
    async delete(key) {
        try {
            await this.redisService.del(key);
            this.stats.deletes++;
            this.logger.debug(`Cache DELETE: ${key}`);
        }
        catch (error) {
            this.logger.error(`Cache DELETE error for key ${key}: ${error.message}`);
        }
    }
    /**
     * Removes multiple cached values by key pattern.
     *
     * @param pattern - The key pattern to match (e.g., 'user:*')
     */
    async deleteByPattern(pattern) {
        try {
            const redis = await this.redisService.getClient();
            const keys = [];
            let cursor = '0';
            do {
                const [nextCursor, batch] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
                cursor = nextCursor;
                keys.push(...batch);
            } while (cursor !== '0');
            if (keys.length > 0) {
                await redis.del(...keys);
                this.stats.deletes += keys.length;
                this.logger.debug(`Cache DELETE BY PATTERN: ${pattern} (${keys.length} keys)`);
            }
        }
        catch (error) {
            this.logger.error(`Cache DELETE BY PATTERN error for ${pattern}: ${error.message}`);
        }
    }
    /**
     * Checks if a key exists in cache.
     *
     * @param key - The cache key
     * @returns True if the key exists, false otherwise
     */
    async has(key) {
        try {
            const ttl = await this.redisService.ttl(key);
            return ttl > 0;
        }
        catch (error) {
            this.logger.error(`Cache HAS error for key ${key}: ${error.message}`);
            return false;
        }
    }
    /**
     * Invalidates cache for a specific key pattern.
     * Useful for cache busting after data updates.
     *
     * @param pattern - The key pattern to invalidate
     */
    async invalidate(pattern) {
        await this.deleteByPattern(pattern);
    }
    /**
     * Cache-aside pattern: Get from cache or fetch from source.
     * If not in cache, fetches from source, caches the result, and returns it.
     *
     * @param key - The cache key
     * @param fetcher - Function to fetch data if not cached
     * @param ttl - Time to live in seconds
     * @returns The cached or freshly fetched value
     */
    async getOrSet(key, fetcher, ttl) {
        const cached = await this.get(key);
        if (cached !== null) {
            return cached;
        }
        try {
            const value = await fetcher();
            if (value !== null && value !== undefined) {
                await this.set(key, value, ttl);
            }
            return value;
        }
        catch (error) {
            this.logger.error(`Cache GET_OR_SET fetcher error for key ${key}: ${error.message}`);
            return null;
        }
    }
    /**
     * Warm cache with multiple entries.
     * Useful for pre-loading frequently accessed data on startup.
     *
     * @param warmers - Array of cache warmers with keys, fetchers, and TTLs
     */
    async warm(warmers) {
        const results = await Promise.allSettled(warmers.map(async (warmer) => {
            try {
                const value = await warmer.fetcher();
                if (value !== null && value !== undefined) {
                    await this.set(warmer.key, value, warmer.ttl);
                }
                return { key: warmer.key, success: true };
            }
            catch (error) {
                this.logger.error(`Cache WARM error for key ${warmer.key}: ${error.message}`);
                return { key: warmer.key, success: false };
            }
        }));
        const succeeded = results.filter((r) => r.status === 'fulfilled' && r.value.success).length;
        this.logger.log(`Cache WARM: ${succeeded}/${warmers.length} entries warmed`);
    }
    /**
     * Get cache statistics.
     *
     * @returns Current cache stats
     */
    getStats() {
        return { ...this.stats };
    }
    /**
     * Reset cache statistics.
     */
    resetStats() {
        this.stats = { hits: 0, misses: 0, sets: 0, deletes: 0, hitRate: 0 };
    }
    /**
     * Get cache health status.
     *
     * @returns Health check result
     */
    async healthCheck() {
        try {
            const redis = await this.redisService.getClient();
            await redis.ping();
            return { status: 'healthy', stats: this.getStats() };
        }
        catch (error) {
            return { status: 'unhealthy', stats: this.getStats() };
        }
    }
    updateHitRate() {
        const total = this.stats.hits + this.stats.misses;
        this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
    }
};
exports.CacheService = CacheService;
exports.CacheService = CacheService = CacheService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [redis_service_1.RedisService])
], CacheService);
