import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { RealityModule } from './modules/reality/reality.module';
import { DatabaseModule } from './modules/database/database.module';
import { HealthModule } from './modules/health/health.module';
import { RateLimiterModule } from '@azeebo/security';
import { ServiceAuthGuard } from '@azeebo/security';
import { ResponseWrapperInterceptor, ResponseSanitizationInterceptor } from '@azeebo/logger';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    RateLimiterModule.forRoot(),
    DatabaseModule,
    RealityModule,
    HealthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ServiceAuthGuard,
    },
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
