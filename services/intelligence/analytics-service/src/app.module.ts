import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AnalyticsModule } from './modules/analytics/analytics.module.js';
import { AnalyticsInstrumentationModule } from './modules/analytics-instrumentation/analytics-instrumentation.module.js';
import { AdminModule } from './modules/admin/admin.module.js';
import { IntelligenceModule } from './modules/intelligence/intelligence.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { MetricsModule } from './modules/metrics/metrics.module.js';
import { ReportBuilderModule } from './modules/report-builder/report-builder.module.js';
import { AgentRegistryModule } from './modules/agent-registry/agent-registry.module.js';
import { ModelCostTrackerModule } from './modules/model-cost-tracker/model-cost-tracker.module.js';
import { RiskEngineModule } from './modules/risk-engine/risk-engine.module.js';
import { TaskRouterModule } from './modules/task-router/task-router.module.js';
import { CapacityLedgerModule } from './modules/capacity-ledger/capacity-ledger.module.js';
import { ServiceAuthGuard, RateLimiterModule } from '@azeebo/security';
import { ResponseWrapperInterceptor } from '@azeebo/logger';
import { CacheModule, JwtConfigModule } from '@azeebo/shared-services';
import { FeatureFlagModule, analyticsFlags } from '@azeebo/feature-flags';
import { FlagMetricsModule, flagHooks } from '@azeebo/flag-metrics';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    JwtConfigModule,
    RateLimiterModule.forRoot(),
    FlagMetricsModule.register({ service: 'analytics-service' }),
    FeatureFlagModule.register({
      global: true,
      ...flagHooks('analytics-service'),
      // Analytics pipeline flags: sampling + ingest mode are runtime-tunable
      // (numeric sampling rate via defaultValues); the rest are kill-switches.
      defaultFlags: {
        [analyticsFlags.batchIngest]: false,
        [analyticsFlags.reportBuilderV2]: false,
        [analyticsFlags.clientSampling]: false,
      },
      defaultValues: {
        [analyticsFlags.samplingRate]: 100,
      },
      publicFlagKeys: [
        analyticsFlags.samplingRate,
        analyticsFlags.batchIngest,
        analyticsFlags.reportBuilderV2,
        analyticsFlags.clientSampling,
      ],
    }),
    CacheModule,
    AnalyticsModule,
    AnalyticsInstrumentationModule,
    AdminModule,
    IntelligenceModule,
    HealthModule,
    MetricsModule,
    ReportBuilderModule,
    // AOS-MA-001 — Enterprise Agentic Operating System
    AgentRegistryModule,
    ModelCostTrackerModule,
    RiskEngineModule,
    TaskRouterModule,
    CapacityLedgerModule,
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
