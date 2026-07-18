import { Module, Global } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './modules/database/database.module.js';
import { ComedyModule } from './modules/comedy/comedy.module.js';
import { ComedyFeedModule } from './modules/comedy-feed/comedy-feed.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { ResponseWrapperInterceptor, ResponseSanitizationInterceptor } from '@azeebo/logger';
import { AdminModule } from './modules/admin/admin.module.js';
import { RateLimiterModule, ServiceAuthGuard } from '@azeebo/security';
import { CacheModule, RedisModule } from '@azeebo/shared-services';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    CacheModule,
    RedisModule,
    DatabaseModule,
    RateLimiterModule.forRoot(),
    ComedyModule,
    ComedyFeedModule,
    HealthModule,
    AdminModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseWrapperInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseSanitizationInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: ServiceAuthGuard,
    },
  ],
})
export class AppModule {}
