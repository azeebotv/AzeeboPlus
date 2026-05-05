import { NestFactory } from '@nestjs/core';
import { Module, ValidationPipe, Logger } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import helmet from 'helmet';
import { NotificationProcessor } from './processors/notification.processor';
import { PaymentProcessor } from './processors/payment.processor';
import { EmailProcessor } from './processors/email.processor';
import { DatabaseModule } from './modules/database/database.module';
import { EmailModule } from './modules/email/email.module';
import { FirebaseModule } from './modules/firebase/firebase.module';
import { SmsModule } from './modules/sms/sms.module';
import { PaymentProviderModule } from './modules/payments/providers/payment-provider.module';
import { HealthModule } from './modules/health/health.module';

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
    }),
    DatabaseModule,
    EmailModule,
    FirebaseModule,
    SmsModule,
    PaymentProviderModule,
    HealthModule,
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
      { name: 'content-processing', ...QUEUE_CONFIG['content-processing'] },
    ),
  ],
  providers: [
    NotificationProcessor,
    PaymentProcessor,
    EmailProcessor,
  ],
})
export class AppModule {}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        scriptSrc: ["'self'"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
    },
  }));

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }));

  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.enableShutdownHooks();

  const port = process.env.PORT || 3015;
  await app.listen(port);
  const logger = new Logger('Queue Service');
  logger.log(`Queue Service running on port ${port}`);
}

bootstrap();
