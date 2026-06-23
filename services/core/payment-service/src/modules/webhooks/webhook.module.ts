import { Module } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';
import { WebhookSecurityService } from './webhook-security.service';
import { DatabaseModule } from '../database/database.module';
import { WebhookRetryService } from '../payments/webhook-retry.service';
import { RedisModule } from '../../common/redis.module';

@Module({
  imports: [DatabaseModule, RedisModule],
  controllers: [WebhookController],
  providers: [WebhookService, WebhookSecurityService, WebhookRetryService],
  exports: [WebhookSecurityService, WebhookRetryService],
})
export class WebhookModule {}
