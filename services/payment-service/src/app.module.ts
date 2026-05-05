import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PaymentsController } from './modules/payments/payments.controller';
import { PaymentsService } from './modules/payments/payments.service';
import { PaymentProviderModule } from './modules/payments/providers/payment-provider.module';
import { DatabaseModule } from './modules/database/database.module';
import { HealthModule } from './modules/health/health.module';
import { WebhookModule } from './modules/webhooks/webhook.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    PaymentProviderModule,
    DatabaseModule,
    HealthModule,
    WebhookModule,
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
})
export class AppModule {}