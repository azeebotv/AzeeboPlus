import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { ThrottlerModule } from '@nestjs/throttler';
import KeyvRedis from '@keyv/redis';
import { JwtModule } from '@nestjs/jwt';
import { HealthModule } from './modules/health/health.module';
import { ProxyModule } from './modules/proxy/proxy.module';
import { FlagMetricsModule, flagHooks } from '@azeebo/flag-metrics';
import { HttpMetricsModule } from './metrics/http-metrics.module';
import { GatewayAuthGuard } from './guards/gateway-auth.guard';
import { AuthThrottlerGuard } from './guards/auth-throttler.guard';
import { CsrfMiddleware } from './common/csrf.middleware';
import { CsrfTokenRegistry } from './common/csrf-token-registry.service';
import { CommonModule } from './common/common.module';
import { LegacyRedirectMiddleware } from './common/legacy-redirect.middleware';
import { ContentTypeValidationMiddleware } from './common/content-type-validation.middleware';
import { RawBodyCaptureMiddleware } from './common/raw-body-capture.middleware';
import { ResponseWrapperInterceptor } from '@azeebo/logger';
import { SecurityModule } from '@azeebo/security';
import {
  FeatureFlagModule,
  gatewayFlags,
  webFlags,
  mobileFlags,
  tvFlags,
  authFlags,
  universeEnabledKey,
} from '@azeebo/feature-flags';
import { UNIVERSE_SLUGS } from '@azeebo/shared-types';

/**
 * Per-universe nav sentinels: `universe.<slug>.enabled` default ON for every
 * canonical universe slug (including the reserved `music`). The admin app
 * publishes these exact keys (keyed by DB universe name) so web/mobile nav
 * gating follows admin toggles.
 */
const universeSentinelDefaults = Object.fromEntries(
  UNIVERSE_SLUGS.map((slug) => [universeEnabledKey(slug), true])
) as Record<string, boolean>;

/**
 * Shared proxy-response cache store. With REDIS_URL the 5-minute gateway
 * cache is Redis-backed so N gateway replicas agree (in-memory diverges per
 * pod and silently caps at 100 entries); without it the default per-process
 * memory store is used. KeyvRedis connects lazily and, with
 * throwOnConnectError/throwOnErrors off, degrades to cache misses instead of
 * failing requests when Redis is unreachable.
 */
const gatewayCacheStore = process.env.REDIS_URL
  ? new KeyvRedis(process.env.REDIS_URL, {
      namespace: 'gateway-cache',
      throwOnConnectError: false,
      throwOnErrors: false,
    })
  : undefined;

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
      ...(gatewayCacheStore ? { stores: [gatewayCacheStore] } : { max: 100 }), // in-memory fallback only (single replica / dev)
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
    CommonModule,
    SecurityModule,
    FlagMetricsModule.register({ service: 'api-gateway' }),
    HttpMetricsModule,
    // Gateway kill-switches: maintenance mode and new routes default OFF;
    // circuit breaker / CSRF / legacy redirects / caching default ON so ops can
    // disable them instantly during incidents.
    FeatureFlagModule.register({
      global: true,
      // Universe visibility sentinels default ON: during a Redis outage the
      // plain fail-closed path would re-enable universes ops disabled, so the
      // gateway serves last-known state from the expired cache instead.
      staleOnRedisError: true,
      defaultFlags: {
        [gatewayFlags.maintenanceMode]: false,
        [gatewayFlags.newRoutes]: true,
        [gatewayFlags.circuitBreaker]: true,
        [gatewayFlags.responseCache]: true,
        [gatewayFlags.strictRateLimits]: false,
        [gatewayFlags.csrfEnforce]: true,
        [gatewayFlags.legacyRedirect]: true,
        [gatewayFlags.apiV2]: false,
        // Client-driven flags served via GET /feature-flags/bootstrap.
        [webFlags.maintenanceMode]: false,
        [webFlags.newHome]: false,
        [webFlags.darkMode]: true,
        [webFlags.autoplay]: true,
        [webFlags.lowDataDefault]: false,
        [webFlags.recommendationsRail]: false,
        [webFlags.announcementBanner]: false,
        [webFlags.premiumUpsell]: false,
        // Client-driven mobile flags served via GET /feature-flags/bootstrap.
        [mobileFlags.newHome]: false,
        [mobileFlags.darkMode]: true,
        [mobileFlags.autoplay]: true,
        [mobileFlags.lowDataDefault]: false,
        [mobileFlags.pushEnabled]: true,
        [mobileFlags.biometricAuth]: false,
        // Client-driven TV flags served via GET /feature-flags/bootstrap.
        [tvFlags.autoplay]: true,
        // Provider kill switches the web login page must reflect: the social
        // buttons appear only when their flag is on, so turning a provider off
        // is a UI change and not just a server 503 (prd-social-login.md FR-7).
        [authFlags.socialGoogle]: true,
        [authFlags.socialApple]: true,
        // Per-universe nav sentinels: universe.<name>.enabled keyed by the
        // canonical DB universe names (admin toggles these via the admin app;
        // web/mobile hide nav entries when disabled). Derived from the shared
        // slug map so the gateway serves exactly the keys clients consume.
        ...universeSentinelDefaults,
      },
      // Prometheus sinks for flag observability (flag_evaluation_total /
      // flag_toggled_total at GET /metrics, labeled by service) — the gateway
      // is the central evaluation point, so its hooks see every bootstrap +
      // kill-switch read. Same shared module every service mounts.
      ...flagHooks('api-gateway'),
      publicFlagKeys: [
        webFlags.maintenanceMode,
        webFlags.newHome,
        webFlags.darkMode,
        webFlags.autoplay,
        webFlags.lowDataDefault,
        webFlags.recommendationsRail,
        webFlags.announcementBanner,
        webFlags.premiumUpsell,
        mobileFlags.newHome,
        mobileFlags.darkMode,
        mobileFlags.autoplay,
        mobileFlags.lowDataDefault,
        mobileFlags.pushEnabled,
        mobileFlags.biometricAuth,
        tvFlags.autoplay,
        // Login provider switches — public because the button visibility is
        // the whole point of the flag. Exposing an enabled/disabled boolean
        // reveals nothing about the client secret behind it.
        authFlags.socialGoogle,
        authFlags.socialApple,
        ...UNIVERSE_SLUGS.map(universeEnabledKey),
      ],
    }),
  ],
  providers: [
    CsrfMiddleware,
    CsrfTokenRegistry,
    LegacyRedirectMiddleware,
    RawBodyCaptureMiddleware,
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseWrapperInterceptor,
    },
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
    // Legacy unversioned path redirects (T-H21, T-H22, T-H24)
    consumer.apply(LegacyRedirectMiddleware).forRoutes('*path');

    // Content-Type validation for body requests (SEC-006)
    consumer.apply(ContentTypeValidationMiddleware).forRoutes('api');

    // Capture raw multipart bodies (file uploads) before the proxy forwards
    // them upstream — no body parser owns multipart, so without this the
    // upstream receives an empty/mangled body and multer 400s.
    consumer.apply(RawBodyCaptureMiddleware).forRoutes('api');

    // CSRF protection for state-changing requests (SEC-005)
    consumer
      .apply(CsrfMiddleware)
      .exclude(
        { path: 'api/v1/auth/login', method: RequestMethod.ALL },
        { path: 'api/auth/login', method: RequestMethod.ALL },
        { path: 'api/v1/auth/register', method: RequestMethod.ALL },
        { path: 'api/auth/register', method: RequestMethod.ALL },
        { path: 'api/v1/auth/signup', method: RequestMethod.ALL },
        { path: 'api/auth/signup', method: RequestMethod.ALL },
        { path: 'api/v1/auth/refresh', method: RequestMethod.ALL },
        { path: 'api/auth/refresh', method: RequestMethod.ALL },
        { path: 'api/v1/auth/logout', method: RequestMethod.ALL },
        { path: 'api/auth/logout', method: RequestMethod.ALL },
        { path: 'api/v1/auth/verify-email', method: RequestMethod.ALL },
        { path: 'api/v1/auth/resend-verification', method: RequestMethod.ALL },
        { path: 'api/v1/auth/forgot-password', method: RequestMethod.ALL },
        { path: 'api/auth/forgot-password', method: RequestMethod.ALL },
        { path: 'api/v1/auth/reset-password', method: RequestMethod.ALL },
        { path: 'api/auth/reset-password', method: RequestMethod.ALL },
        // SPA cookie handoff: POST /auth/cookie runs immediately after login
        // (no CSRF cookie yet — it IS the bootstrap); DELETE /auth/cookie is
        // logout; GET /auth/csrf sets the CSRF cookie itself.
        { path: 'api/v1/auth/cookie', method: RequestMethod.ALL },
        { path: 'api/auth/cookie', method: RequestMethod.ALL },
        { path: 'api/v1/auth/csrf', method: RequestMethod.ALL },
        { path: 'api/auth/csrf', method: RequestMethod.ALL },
        { path: 'api/v1/users/*path', method: RequestMethod.GET },
        { path: 'api/v1/users/*path', method: RequestMethod.HEAD },
        { path: 'api/v1/users/*path', method: RequestMethod.OPTIONS },
        { path: 'api/users/*path', method: RequestMethod.GET },
        { path: 'api/users/*path', method: RequestMethod.HEAD },
        { path: 'api/users/*path', method: RequestMethod.OPTIONS },
        { path: 'api/v1/analytics/web-vitals', method: RequestMethod.POST },
        { path: 'api/analytics/web-vitals', method: RequestMethod.POST },
        { path: 'api/v1/analytics/events', method: RequestMethod.POST },
        { path: 'api/analytics/events', method: RequestMethod.POST },
        { path: 'api/v1/analytics/events/batch', method: RequestMethod.POST },
        { path: 'api/analytics/events/batch', method: RequestMethod.POST },
        { path: 'api/health', method: RequestMethod.ALL },
        { path: 'api/routes', method: RequestMethod.ALL }
      )
      .forRoutes('api');
  }
}
