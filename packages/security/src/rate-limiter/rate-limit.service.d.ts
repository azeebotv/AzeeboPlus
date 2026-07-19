import { Redis } from 'ioredis';
export interface RateLimitConfig {
    limit: number;
    windowMs: number;
}
export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetAt: number;
    limit: number;
}
export declare class RateLimitService {
    private readonly redis;
    private readonly logger;
    private readonly blockListPrefix;
    private readonly violationPrefix;
    private readonly blockDuration;
    constructor(redis: Redis);
    checkRateLimit(key: string, config: RateLimitConfig): Promise<RateLimitResult>;
    resetRateLimit(key: string): Promise<void>;
    getRateLimitStatus(key: string, config: RateLimitConfig): Promise<RateLimitResult>;
    private maskIp;
    isBlocked(ip: string): Promise<boolean>;
    block(ip: string, duration?: number): Promise<void>;
    unblock(ip: string): Promise<void>;
    recordViolation(ip: string, threshold?: number): Promise<boolean>;
    getViolationCount(ip: string): Promise<number>;
    resetViolations(ip: string): Promise<void>;
}
