import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';

import { HealthModule } from './modules/health/health.module.js';
import { ReferralModule } from './modules/referral/referral.module.js';
import { DatabaseModule } from './modules/database/database.module.js';
import { ServiceAuthGuard, RateLimiterModule } from '@azeebo/security';
import { ResponseWrapperInterceptor } from '@azeebo/logger';
import { CacheModule } from '@azeebo/shared-services';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    RateLimiterModule.forRoot(),
    CacheModule,
    DatabaseModule,
    HealthModule,
    ReferralModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseWrapperInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: ServiceAuthGuard,
    },
  ],
})
export class AppModule {}
