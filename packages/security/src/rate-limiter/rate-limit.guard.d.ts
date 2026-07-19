import { CanActivate, ExecutionContext, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RateLimitService } from './rate-limit.service';
export declare const RateLimit: (limit: number, windowMs: number) => ReturnType<typeof SetMetadata>;
export declare class RateLimitGuard implements CanActivate {
    private reflector;
    private rateLimitService;
    constructor(reflector: Reflector, rateLimitService: RateLimitService);
    canActivate(context: ExecutionContext): Promise<boolean>;
    private getClientIp;
    private generateKey;
    private setRateLimitHeaders;
}
