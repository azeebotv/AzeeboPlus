import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SubscriptionService } from './subscription.service.js';

@Injectable()
export class SubscriptionScheduler {
  private readonly logger = new Logger(SubscriptionScheduler.name);

  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleExpiredSubscriptions() {
    this.logger.log('Running expired subscription check');
    const count = await this.subscriptionService.checkExpiredSubscriptions();
    this.logger.log(`Expired subscription check completed: ${count} subscriptions expired`);
  }
}
