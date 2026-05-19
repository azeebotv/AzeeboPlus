import { Module } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';
import { DatabaseModule } from '../database/database.module';
import { WebhookRetryService } from '../payments/webhook-retry.service';

@Module({
  imports: [DatabaseModule],
  controllers: [WebhookController],
  providers: [WebhookService, WebhookRetryService],
})
export class WebhookModule {}
