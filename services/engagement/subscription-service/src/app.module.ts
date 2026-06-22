import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { SubscriptionModule } from './modules/subscription/subscription.module';
import { DatabaseModule } from './modules/database/database.module';
import { HealthModule } from './modules/health/health.module';
import { ServiceAuthGuard } from '@azeebo/security';

@Module({
  imports: [SubscriptionModule, DatabaseModule, HealthModule],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ServiceAuthGuard,
    },
  ],
})
export class AppModule {}

