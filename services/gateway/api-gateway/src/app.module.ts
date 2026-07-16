import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { ThrottlerModule } from '@nestjs/throttler';
import { JwtModule } from '@nestjs/jwt';
import { HealthModule } from './modules/health/health.module';
import { ProxyModule } from './modules/proxy/proxy.module';
import { GatewayAuthGuard } from './guards/gateway-auth.guard';
import { AuthThrottlerGuard } from './guards/auth-throttler.guard';
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
          ttl: (parseInt(process.env.RATE_LIMIT_TTL || '60', 10) || 60) * 1000,
          limit: parseInt(process.env.RATE_LIMIT_MAX || '1000', 10) || 1000,
        },
      ],
    }),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_ACCESS_SECRET,
    }),
    HealthModule,
    ProxyModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: GatewayAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: AuthThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // CSRF protection for state-changing requests (SEC-005)
    consumer
      .apply(CsrfMiddleware)
      .exclude(
        { path: 'api/v1/auth/*path', method: RequestMethod.ALL },
        { path: 'api/auth/*path', method: RequestMethod.ALL },
        { path: 'api/v1/users/*path', method: RequestMethod.GET },
        { path: 'api/v1/users/*path', method: RequestMethod.HEAD },
        { path: 'api/v1/users/*path', method: RequestMethod.OPTIONS },
        { path: 'api/users/*path', method: RequestMethod.GET },
        { path: 'api/users/*path', method: RequestMethod.HEAD },
        { path: 'api/users/*path', method: RequestMethod.OPTIONS },
        { path: 'api/health', method: RequestMethod.ALL },
        { path: 'api/routes', method: RequestMethod.ALL },
        { path: '*path', method: RequestMethod.GET }
      )
      .forRoutes('api');
  }
}
