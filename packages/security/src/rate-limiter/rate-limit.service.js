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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var RateLimitService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimitService = void 0;
const common_1 = require("@nestjs/common");
const ioredis_1 = require("ioredis");
const ioredis_2 = require("@nestjs-modules/ioredis");
let RateLimitService = RateLimitService_1 = class RateLimitService {
    redis;
    logger = new common_1.Logger(RateLimitService_1.name);
    blockListPrefix = 'rate_limit:blocked:';
    violationPrefix = 'rate_limit:violations:';
    blockDuration = 3600;
    constructor(redis) {
        this.redis = redis;
    }
    async checkRateLimit(key, config) {
        const { limit, windowMs } = config;
        const windowSec = Math.ceil(windowMs / 1000);
        const now = Date.now();
        const resetAt = now + windowMs;
        try {
            const current = await this.redis.incr(key);
            if (current === 1) {
                await this.redis.expire(key, windowSec);
            }
            const remaining = Math.max(0, limit - current);
            const allowed = current <= limit;
            if (!allowed) {
                this.logger.warn(`Rate limit exceeded for key: ${key}`);
            }
            return {
                allowed,
                remaining,
                resetAt,
                limit,
            };
        }
        catch (error) {
            this.logger.error(`CRITICAL: Rate limit check failed for key ${key} — Redis unreachable. ` +
                `Failing closed to protect service. Error: ${error}`);
            return {
                allowed: false,
                remaining: 0,
                resetAt: now + windowMs,
                limit,
            };
        }
    }
    async resetRateLimit(key) {
        try {
            await this.redis.del(key);
        }
        catch (error) {
            this.logger.error(`Failed to reset rate limit for key ${key}: ${error}`);
        }
    }
    async getRateLimitStatus(key, config) {
        const { limit, windowMs } = config;
        const now = Date.now();
        try {
            const current = await this.redis.get(key);
            const ttl = await this.redis.ttl(key);
            const count = current ? parseInt(current, 10) : 0;
            const remaining = Math.max(0, limit - count);
            const resetAt = ttl > 0 ? now + ttl * 1000 : now + windowMs;
            return {
                allowed: count <= limit,
                remaining,
                resetAt,
                limit,
            };
        }
        catch (error) {
            this.logger.error(`CRITICAL: Rate limit status check failed for key ${key} — Redis unreachable. ` +
                `Failing closed. Error: ${error}`);
            return {
                allowed: false,
                remaining: 0,
                resetAt: now + windowMs,
                limit,
            };
        }
    }
    maskIp(ip) {
        return ip.replace(/\d+$/, 'xxx');
    }
    async isBlocked(ip) {
        try {
            const key = `${this.blockListPrefix}${ip}`;
            const exists = await this.redis.get(key);
            return !!exists;
        }
        catch (error) {
            this.logger.error(`Failed to check block status for IP ${this.maskIp(ip)}: ${error}`);
            return false;
        }
    }
    async block(ip, duration = this.blockDuration) {
        try {
            const key = `${this.blockListPrefix}${ip}`;
            await this.redis.set(key, 'blocked', 'EX', duration);
            this.logger.warn(`IP ${this.maskIp(ip)} has been blocked for ${duration} seconds`);
        }
        catch (error) {
            this.logger.error(`Failed to block IP ${this.maskIp(ip)}: ${error}`);
        }
    }
    async unblock(ip) {
        try {
            const key = `${this.blockListPrefix}${ip}`;
            await this.redis.del(key);
            this.logger.log(`IP ${this.maskIp(ip)} has been unblocked`);
        }
        catch (error) {
            this.logger.error(`Failed to unblock IP ${this.maskIp(ip)}: ${error}`);
        }
    }
    async recordViolation(ip, threshold = 10) {
        try {
            const key = `${this.violationPrefix}${ip}`;
            const count = await this.redis.incr(key);
            await this.redis.expire(key, 3600);
            if (count >= threshold) {
                await this.block(ip);
                this.logger.warn(`IP ${this.maskIp(ip)} blocked after ${count} violations`);
                return true;
            }
            return false;
        }
        catch (error) {
            this.logger.error(`Failed to record violation for IP ${this.maskIp(ip)}: ${error}`);
            return false;
        }
    }
    async getViolationCount(ip) {
        try {
            const key = `${this.violationPrefix}${ip}`;
            const count = await this.redis.get(key);
            return count ? parseInt(count, 10) : 0;
        }
        catch (error) {
            this.logger.error(`Failed to get violation count for IP ${this.maskIp(ip)}: ${error}`);
            return 0;
        }
    }
    async resetViolations(ip) {
        try {
            const key = `${this.violationPrefix}${ip}`;
            await this.redis.del(key);
        }
        catch (error) {
            this.logger.error(`Failed to reset violations for IP ${this.maskIp(ip)}: ${error}`);
        }
    }
};
exports.RateLimitService = RateLimitService;
exports.RateLimitService = RateLimitService = RateLimitService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, ioredis_2.InjectRedis)()),
    __metadata("design:paramtypes", [ioredis_1.Redis])
], RateLimitService);
//# sourceMappingURL=rate-limit.service.js.map