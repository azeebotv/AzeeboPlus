import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { SubscriptionModule } from './modules/subscription/subscription.module.js';
import { BundleModule } from './modules/bundle/bundle.module.js';
import { AdminModule } from './modules/admin/admin.module.js';
import { DatabaseModule } from './modules/database/database.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { RateLimiterModule, ServiceAuthGuard } from '@azeebo/security';
import { ResponseWrapperInterceptor } from '@azeebo/logger';
import { CacheModule, JwtConfigModule } from '@azeebo/shared-services';
import { FeatureFlagModule } from '@azeebo/feature-flags';
import { subscriptionFlags } from '@azeebo/feature-flags';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env', '../../.env'] }),
    JwtConfigModule,
    RateLimiterModule.forRoot(),
    CacheModule,
    SubscriptionModule,
    BundleModule,
    AdminModule,
    DatabaseModule,
    HealthModule,
    // Bundles default OFF until launched; renew/recovery paths default ON.
    FeatureFlagModule.register({
      global: true,
      defaultFlags: {
        [subscriptionFlags.bundles]: false,
        [subscriptionFlags.freeTrial]: false,
        [subscriptionFlags.promoDiscounts]: false,
        [subscriptionFlags.dunning]: true,
        [subscriptionFlags.deviceLimits]: false,
      },
    }),
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseWrapperInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: ServiceAuthGuard,
    },
  ],
})
export class AppModule {}
