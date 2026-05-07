import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
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
import { AuthGuard } from './common/guards/auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'development-secret',
      signOptions: { expiresIn: '1h' },
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
  ],
  providers: [AuthGuard],
  exports: [AuthGuard, JwtModule],
})
export class AppModule {}
