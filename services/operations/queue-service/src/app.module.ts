import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { RateLimiterModule, ServiceAuthGuard } from '@azeebo/security';
import { ResponseWrapperInterceptor } from '@azeebo/logger';
import { EmailModule, FirebaseModule, JwtConfigModule, SmsModule } from '@azeebo/shared-services';
import { DatabaseModule } from './modules/database/database.module';
import { HealthModule } from './modules/health/health.module';
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
    QueueModule,
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
