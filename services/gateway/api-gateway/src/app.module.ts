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
      ttl: 300_000, // 5 minutes — keep in sync with proxy controller CACHE_TTL_MS
      max: 100, // maximum number of items in cache
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        // Global rate limit
        {
          ttl: parseInt(process.env.RATE_LIMIT_TTL || '60', 10) * 1000,
          limit: parseInt(process.env.RATE_LIMIT_MAX || '1000', 10),
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
      { path: 'api/v1/auth/(.*)', method: RequestMethod.ALL },
      { path: 'api/auth/(.*)', method: RequestMethod.ALL },
      { path: 'api/v1/users/(.*)', method: RequestMethod.ALL },
      { path: 'api/users/(.*)', method: RequestMethod.ALL },
      { path: 'api/health', method: RequestMethod.ALL },
      { path: 'api/routes', method: RequestMethod.ALL },
      { path: '(.*)', method: RequestMethod.GET },
    ).forRoutes('api');

    // T-H21/T-H22/T-H24: redirect legacy unversioned paths to versioned
    consumer.apply(LegacyRedirectMiddleware).forRoutes('api');
  }
}
