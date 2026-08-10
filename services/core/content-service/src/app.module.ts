import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ContentModule } from './modules/content/content.module.js';
import { DatabaseModule } from './modules/database/database.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { PublicModule } from './modules/public/public.module.js';
import { ResponseWrapperInterceptor, ResponseSanitizationInterceptor } from '@azeebo/logger';
import { RateLimiterModule } from '@azeebo/security';
import { ServiceAuthGuard } from '@azeebo/security';
import { CacheModule } from './cache/cache.module.js';
import { JwtStrategy } from './modules/auth/jwt.strategy.js';
import { FeatureFlagModule, contentFlags } from '@azeebo/feature-flags';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    RateLimiterModule.forRoot(),
    DatabaseModule,
    CacheModule,
    ContentModule,
    HealthModule,
    PublicModule,
    FeatureFlagModule.register({
      global: true,
      defaultFlags: {
        // Content flags: moderation stays ON (kill-switch for safety scans);
        // new pipelines (AI tags, clip ingestion, transcoding v2, threaded
        // comments, premium gating, recommended rail) default OFF until ready.
        [contentFlags.moderationEnabled]: true,
        [contentFlags.transcodingNew]: false,
        [contentFlags.aiTags]: false,
        [contentFlags.clipIngestion]: false,
        [contentFlags.commentsV2]: false,
        [contentFlags.windowingEnabled]: true,
        [contentFlags.premiumGate]: false,
        [contentFlags.recommendedRail]: false,
      },
    }),
  ],
  providers: [
    JwtStrategy,
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseWrapperInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseSanitizationInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: ServiceAuthGuard,
    },
  ],
})
export class AppModule {}
