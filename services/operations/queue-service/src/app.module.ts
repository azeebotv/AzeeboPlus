import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { RateLimiterModule, ServiceAuthGuard } from '@azeebo/security';
import { ResponseWrapperInterceptor } from '@azeebo/logger';
import { EmailModule, FirebaseModule, JwtConfigModule, SmsModule } from '@azeebo/shared-services';
import { FeatureFlagModule, queueFlags } from '@azeebo/feature-flags';
import { DatabaseModule } from './modules/database/database.module';
import { HealthModule } from './modules/health/health.module';
import { MetricsModule } from './modules/metrics/metrics.module';
import { QueueModule } from './modules/queue/queue.module';
import { NotificationProcessor } from './processors/notification.processor';
import { PaymentProcessor } from './processors/payment.processor';
import { EmailProcessor } from './processors/email.processor';

const QUEUE_CONFIG = {
  notifications: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
  },
  payments: {
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 10000,
    },
  },
  emails: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 60000,
    },
  },
  analytics: {
    attempts: 2,
    backoff: {
      type: 'fixed',
      delay: 30000,
    },
  },
  'content-processing': {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 15000,
    },
  },
};

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    RateLimiterModule.forRoot(),
    DatabaseModule,
    EmailModule,
    FirebaseModule,
    SmsModule,
    JwtConfigModule,
    HealthModule,
    MetricsModule,
    QueueModule,
    // Queue processor kill-switches: pausing a processor flag stops that
    // worker from draining its queue; jobs stay queued until re-enabled.
    FeatureFlagModule.register({
      global: true,
      defaultFlags: {
        [queueFlags.processNotifications]: true,
        [queueFlags.processPayments]: true,
        [queueFlags.processEmails]: true,
        [queueFlags.processAnalytics]: true,
        [queueFlags.processContent]: true,
        [queueFlags.dlqRetry]: true,
      },
      // Numeric tuning knobs: worker concurrency for the payments queue, and
      // the dead-letter retry policy (max passes + exponential base delay in
      // ms) so ops can tune retry behavior at runtime without a deploy.
      defaultValues: {
        [queueFlags.concurrencyPayments]: 5,
        [queueFlags.dlqRetryMaxPasses]: 3,
        [queueFlags.dlqRetryBaseDelayMs]: 30000,
      },
    }),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
      },
      defaultJobOptions: {
        removeOnComplete: {
          age: 86400,
          count: 1000,
        },
        removeOnFail: {
          age: 604800,
          count: 5000,
        },
      },
    }),
    BullModule.registerQueue(
      { name: 'notifications', ...QUEUE_CONFIG.notifications },
      { name: 'payments', ...QUEUE_CONFIG.payments },
      { name: 'emails', ...QUEUE_CONFIG.emails },
      { name: 'analytics', ...QUEUE_CONFIG.analytics },
      { name: 'content-processing', ...QUEUE_CONFIG['content-processing'] }
    ),
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseWrapperInterceptor,
    },
    { provide: APP_GUARD, useClass: ServiceAuthGuard },
    NotificationProcessor,
    PaymentProcessor,
    EmailProcessor,
  ],
})
export class AppModule {}
