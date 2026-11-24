import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { KnowledgeModule } from './modules/knowledge/knowledge.module.js';
import { DatabaseModule } from './modules/database/database.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { ServiceAuthGuard } from '@azeebo/security';
import { FeatureFlagModule } from '@azeebo/feature-flags';
import { FlagMetricsModule, flagHooks } from '@azeebo/flag-metrics';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    DatabaseModule,
    KnowledgeModule,
    HealthModule,
    // Kill-switch engine + Prometheus flag metrics, matching every other
    // service (search-service pattern). No knowledge flags registered yet —
    // this wires the guard/service so routes CAN be gated (and metrics
    // observed) the moment one is added.
    FlagMetricsModule.register({ service: 'knowledge-service', path: 'flag-metrics' }),
    FeatureFlagModule.register({
      global: true,
      ...flagHooks('knowledge-service'),
    }),
  ],
  providers: [
    // SECURITY (AUD-01): deny-by-default auth on every route, matching the
    // other 28 services. Routes reach this service either from the gateway
    // (x-user-* + x-gateway-secret, timing-safe verified) or with a direct
    // Bearer JWT. Health endpoints are exempted via @Public().
    {
      provide: APP_GUARD,
      useClass: ServiceAuthGuard,
    },
  ],
})
export class AppModule {}
