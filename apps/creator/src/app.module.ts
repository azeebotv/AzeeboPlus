import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { AuthCookieController } from './modules/auth/auth-cookie.controller';
import { CreatorModule } from './creator/creator.module';
import { DatabaseModule } from './database/database.module';
import { ApiModule } from './api/api.module';
import { HealthModule } from './modules/health/health.module';
import { WebModule } from './web/web.module';
import { ServiceAuthGuard, RateLimiterModule } from '@azeebo/security';
import { ResponseWrapperInterceptor } from '@azeebo/logger';
import { FeatureFlagModule, creatorFlags } from '@azeebo/feature-flags';
import { CsrfMiddleware } from './common/csrf.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    RateLimiterModule.forRoot(),
    FeatureFlagModule.register({
      global: true,
      // Creator studio UI flags: the v2 surfaces (new analytics, upload v2,
      // payouts UI, onboarding wizard) start dark and roll out per flag.
      defaultFlags: {
        [creatorFlags.newAnalytics]: false,
        [creatorFlags.uploadV2]: false,
        [creatorFlags.payoutsUi]: false,
        [creatorFlags.onboardingWizard]: false,
      },
      publicFlagKeys: [
        creatorFlags.newAnalytics,
        creatorFlags.uploadV2,
        creatorFlags.payoutsUi,
        creatorFlags.onboardingWizard,
      ],
    }),
    DatabaseModule,
    AuthModule,
    ApiModule,
    CreatorModule,
    HealthModule,
    WebModule,
  ],
  controllers: [AuthCookieController],
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
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CsrfMiddleware)
      .exclude(
        { path: 'api/v1/auth/*path', method: RequestMethod.ALL },
        { path: 'api/auth/*path', method: RequestMethod.ALL },
        { path: 'api/health', method: RequestMethod.ALL },
        { path: '*path', method: RequestMethod.GET },
        { path: '*path', method: RequestMethod.HEAD },
        { path: '*path', method: RequestMethod.OPTIONS }
      )
      .forRoutes('api');
  }
}
