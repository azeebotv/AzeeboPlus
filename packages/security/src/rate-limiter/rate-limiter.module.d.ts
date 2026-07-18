import { DynamicModule } from '@nestjs/common';
export interface RateLimiterModuleConfig {
    redisUrl?: string;
    defaultTTL?: number;
    defaultLimit?: number;
}
export declare class RateLimiterModule {
    static forRoot(config?: RateLimiterModuleConfig): DynamicModule;
    static register(): DynamicModule;
}
