import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { PaymentsController } from './modules/payments/payments.controller.js';
import { PaymentsService } from './modules/payments/payments.service.js';
import { PaymentProviderModule } from './modules/payments/providers/payment-provider.module.js';
import { DatabaseModule } from './modules/database/database.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { WebhookModule } from './modules/webhooks/webhook.module.js';
import { ScheduledTasksModule } from './modules/scheduled-tasks/scheduled-tasks.module.js';
import { PricingModule } from './modules/pricing/pricing.module.js';
import { ResponseWrapperInterceptor, ResponseSanitizationInterceptor } from '@azeebo/logger';
import { MetricsModule } from './modules/metrics/metrics.module.js';
import { RateLimiterModule } from '@azeebo/security';
import { ServiceAuthGuard } from '@azeebo/security';
import { RedisModule, CacheModule } from '@azeebo/shared-services';
import { ObservabilityModule } from '@azeebo/observability';
import { FeatureFlagModule } from '@azeebo/feature-flags';
import { paymentFlags } from '@azeebo/feature-flags';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    RedisModule,
    CacheModule,
    RateLimiterModule.forRoot(),
    PaymentProviderModule,
    DatabaseModule,
    HealthModule,
    WebhookModule,
    ScheduledTasksModule,
    PricingModule,
    MetricsModule,
    ObservabilityModule,
    // Provider routing + kill-switches: both gateways default ON so ops can
    // fail over (or freeze) a provider instantly; refund self-service defaults
    // OFF until enabled.
    FeatureFlagModule.register({
      global: true,
      defaultFlags: {
        [paymentFlags.providerPaystack]: true,
        [paymentFlags.providerFlutterwave]: true,
        [paymentFlags.webhooksEnabled]: true,
        [paymentFlags.scheduledTasks]: true,
        [paymentFlags.selfServiceRefund]: false,
        [paymentFlags.kycRequired]: false,
        [paymentFlags.newCheckoutFlow]: false,
        [paymentFlags.intentsApi]: false,
      },
    }),
  ],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
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
