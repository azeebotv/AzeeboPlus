import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';

import { HealthModule } from './modules/health/health.module.js';
import { ReferralModule } from './modules/referral/referral.module.js';
import { DatabaseModule } from './modules/database/database.module.js';
import { ServiceAuthGuard, RateLimiterModule } from '@azeebo/security';
import { CacheModule } from '@azeebo/shared-services';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    RateLimiterModule.forRoot(),
    CacheModule,
    DatabaseModule,
    HealthModule,
    ReferralModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ServiceAuthGuard,
    },
  ],
})
export class AppModule {}
