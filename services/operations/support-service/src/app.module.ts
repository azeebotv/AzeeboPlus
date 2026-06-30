import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
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
import { SupportModule } from './modules/support/support.module';
import { AuthGuard } from './common/guards/auth.guard';
import { RateLimiterModule, AdminGuard } from '@azeebo/security';
import { ServiceAuthGuard } from '@azeebo/security';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    RateLimiterModule.forRoot(),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
        signOptions: { expiresIn: '1h' },
      }),
      inject: [ConfigService],
    }),
    DatabaseModule,
    HealthModule,
    SupportModule,
    TicketModule,
    RefundModule,
    ChargebackModule,
    AppealModule,
    TakedownModule,
    DisputeModule,
    SuspensionModule,
    DashboardModule,
    AnalyticsModule,
  ],
  providers: [
    AuthGuard,
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
  exports: [AuthGuard, JwtModule, AdminGuard],
})
export class AppModule {}

