import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';
import { WalletModule } from './modules/wallet/wallet.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { ResponseWrapperInterceptor, ResponseSanitizationInterceptor } from '@azeebo/logger';
import { MetricsModule } from './modules/metrics/metrics.module.js';
import { RateLimiterModule } from '@azeebo/security';
import { ServiceAuthGuard } from '@azeebo/security';
import { CacheModule } from './cache/index.js';
import { ObservabilityModule } from '@azeebo/observability';
import { JwtConfigModule } from '@azeebo/shared-services';
import { EventBusModule } from '@azeebo/event-bus';
import { FeatureFlagModule } from '@azeebo/feature-flags';
import { walletFlags } from '@azeebo/feature-flags';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    RateLimiterModule.forRoot(),
    CacheModule,
    TerminusModule,
    JwtConfigModule,
    WalletModule,
    HealthModule,
    MetricsModule,
    ObservabilityModule,
    EventBusModule.forRoot(
      {
        redisUrl: process.env.EVENT_BUS_REDIS_URL || 'redis://localhost:6379',
      },
      'wallet-service'
    ),
    // Kill-switch defaults: money-movement flags default ON so a toggle in the
    // admin UI can freeze withdrawals/redemptions instantly; marketing credit
    // features default OFF until enabled during a campaign.
    FeatureFlagModule.register({
      global: true,
      defaultFlags: {
        [walletFlags.withdrawalsEnabled]: true,
        [walletFlags.redeemRewards]: true,
        [walletFlags.transfersEnabled]: false,
        [walletFlags.bonusCredit]: false,
        [walletFlags.promoCredit]: false,
      },
    }),
  ],
  controllers: [],
  providers: [
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
  exports: [],
})
export class AppModule {}
