import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { HealthModule } from './modules/health/health.module';
import { RefundModule } from './modules/refund/refund.module';
import { ChargebackModule } from './modules/chargeback/chargeback.module';
import { AppealModule } from './modules/appeal/appeal.module';
import { TakedownModule } from './modules/takedown/takedown.module';
import { DisputeModule } from './modules/dispute/dispute.module';
import { SuspensionModule } from './modules/suspension/suspension.module';
import { TicketModule } from './modules/ticket/ticket.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { DatabaseModule } from './modules/database/database.module';
import { RateLimiterModule, AdminGuard } from '@azeebo/security';
import { ResponseWrapperInterceptor } from '@azeebo/logger';
import { ServiceAuthGuard } from '@azeebo/security';
import { CacheModule } from '@azeebo/shared-services';
import { FeatureFlagModule, supportFlags } from '@azeebo/feature-flags';
import { FlagMetricsModule, flagHooks } from '@azeebo/flag-metrics';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env', '../../.env'] }),
    CacheModule,
    RateLimiterModule.forRoot(),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_ACCESS_SECRET,
    }),
    DatabaseModule,
    HealthModule,
    TicketModule,
    RefundModule,
    ChargebackModule,
    AppealModule,
    TakedownModule,
    DisputeModule,
    SuspensionModule,
    DashboardModule,
    AnalyticsModule,
    // Support feature gates: AI chatbot, self-service refunds, AI escalation
    // and automated takedown processing all OFF until launched.
    FlagMetricsModule.register({ service: 'support-service' }),
    FeatureFlagModule.register({
      global: true,
      ...flagHooks('support-service'),
      defaultFlags: {
        [supportFlags.aiChatbot]: false,
        [supportFlags.selfServiceRefunds]: false,
        [supportFlags.escalationAi]: false,
        [supportFlags.takedownsAuto]: false,
      },
    }),
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseWrapperInterceptor,
    },
    {
      provide: AdminGuard,
      useFactory: (jwtService: JwtService) =>
        new AdminGuard(jwtService, { allowedRoles: ['ADMIN', 'SUPPORT_AGENT'] }),
      inject: [JwtService],
    },
    {
      provide: APP_GUARD,
      useClass: ServiceAuthGuard,
    },
  ],
  exports: [JwtModule, AdminGuard],
})
export class AppModule {}
