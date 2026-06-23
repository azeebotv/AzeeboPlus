import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { ThrottlerModule } from '@nestjs/throttler';
import { HealthModule } from './modules/health/health.module';
import { ProxyModule } from './modules/proxy/proxy.module';
import { GatewayAuthGuard } from './guards/gateway-auth.guard';
import { LegacyRedirectMiddleware } from './common/legacy-redirect.middleware';
import { CsrfMiddleware } from './common/csrf.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        `${__dirname}/../../.env`,
        `${__dirname}/../../../.env`,
        `${process.cwd()}/.env`,
        `.env.${process.env.NODE_ENV || 'development'}`,
        '.env',
      ],
      cache: true,
    }),
    CacheModule.register({
      isGlobal: true,
      ttl: 300000, // 5 minutes
      max: 100, // maximum number of items in cache
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        // Global rate limit: 100 requests per minute
        {
          ttl: 60000,
          limit: 100,
        },
        // Stricter limit for auth endpoints: 10 requests per minute
        {
          ttl: 60000,
          limit: 10,
          name: 'auth',
        },
      ],
    }),
    HealthModule,
    ProxyModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: GatewayAuthGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // CSRF protection for state-changing requests (SEC-005)
    consumer.apply(CsrfMiddleware).exclude(
      { path: 'api/auth/(.*)', method: RequestMethod.ALL },
      { path: 'api/health', method: RequestMethod.ALL },
      { path: 'api/routes', method: RequestMethod.ALL },
      { path: '(.*)', method: RequestMethod.GET },
    ).forRoutes('api');

    // T-H21/T-H22/T-H24: redirect legacy unversioned paths to versioned
    consumer.apply(LegacyRedirectMiddleware).forRoutes('api');
  }
}
