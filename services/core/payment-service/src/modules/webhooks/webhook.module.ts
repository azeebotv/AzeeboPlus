import { Module } from '@nestjs/common';
import { WebhookController } from './webhook.controller.js';
import { WebhookService } from './webhook.service.js';
import { WebhookSecurityService } from './webhook-security.service.js';
import { DatabaseModule } from '../database/database.module.js';
import { WebhookRetryService } from '../payments/webhook-retry.service.js';
import { RedisModule } from '../../common/redis.module.js';

@Module({
  imports: [DatabaseModule, RedisModule],
  controllers: [WebhookController],
  providers: [WebhookService, WebhookSecurityService, WebhookRetryService],
  exports: [WebhookSecurityService, WebhookRetryService],
})
export class WebhookModule {}
