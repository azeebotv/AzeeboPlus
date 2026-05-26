import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ContentModule } from './modules/content/content.module';
import { DatabaseModule } from './modules/database/database.module';
import { HealthModule } from './modules/health/health.module';
import { ResponseWrapperInterceptor, ResponseSanitizationInterceptor } from '@azeebo/logger';
import { RateLimiterModule } from '@azeebo/security';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    RateLimiterModule,
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    DatabaseModule,
    ContentModule,
    HealthModule,
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
  ],
})
export class AppModule {}
