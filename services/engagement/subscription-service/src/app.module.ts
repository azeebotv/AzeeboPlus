import { Module } from '@nestjs/common';
import { SubscriptionModule } from './modules/subscription/subscription.module';
import { DatabaseModule } from './modules/database/database.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [SubscriptionModule, DatabaseModule, HealthModule],
})
export class AppModule {}
