import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';
import { WalletModule } from './modules/wallet/wallet.module.js';
import { AdminModule } from './modules/admin/admin.module.js';
import { BorrowModule } from './modules/borrow/borrow.module.js';
import { InternalWalletModule } from './modules/internal/internal-wallet.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { ResponseWrapperInterceptor, ResponseSanitizationInterceptor } from '@azeebo/logger';
import { MetricsModule } from './modules/metrics/metrics.module.js';
import { RateLimiterModule, ServiceAuthGuard, SecurityModule } from '@azeebo/security';
import { CacheModule } from './cache/index.js';
import { RedisModule } from '@azeebo/shared-services';
import { ObservabilityModule } from '@azeebo/observability';
import { JwtConfigModule } from '@azeebo/shared-services';
import { EventBusModule } from '@azeebo/event-bus';
import { FeatureFlagModule } from '@azeebo/feature-flags';
import { walletFlags } from '@azeebo/feature-flags';
import { FlagMetricsModule, flagHooks } from '@azeebo/flag-metrics';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    RateLimiterModule.forRoot(),
    SecurityModule,
    CacheModule,
    RedisModule,
    TerminusModule,
    JwtConfigModule,
    WalletModule,
    AdminModule,
    BorrowModule,
    InternalWalletModule,
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
    // - distributedLock (ON): Redis lock around debit/credit entry points.
    // - ledgerV2 (OFF): append-only wallet_ledger audit trail.
    // - fraudChecks (OFF): velocity/pattern limits on withdraw/transfer.
    FlagMetricsModule.register({ service: 'wallet-service' }),
    FeatureFlagModule.register({
      global: true,
      ...flagHooks('wallet-service'),
      defaultFlags: {
        [walletFlags.withdrawalsEnabled]: true,
        [walletFlags.redeemRewards]: true,
        [walletFlags.transfersEnabled]: false,
        [walletFlags.bonusCredit]: false,
        [walletFlags.promoCredit]: false,
        [walletFlags.distributedLock]: true,
        [walletFlags.ledgerV2]: false,
        [walletFlags.fraudChecks]: false,
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
