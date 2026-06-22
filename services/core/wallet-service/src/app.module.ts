import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';
import { ThrottlerModule } from '@nestjs/throttler';

import { WalletModule } from './modules/wallet/wallet.module';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { HealthModule } from './modules/health/health.module';
import { ResponseWrapperInterceptor, ResponseSanitizationInterceptor } from '@azeebo/logger';
import { MetricsModule } from './modules/metrics/metrics.module';
import { RateLimiterModule } from '@azeebo/security';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    RateLimiterModule,
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    TerminusModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_ACCESS_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '30m') as const,
        },
      }),
      inject: [ConfigService],
    }),
    WalletModule,
    HealthModule,
    MetricsModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseWrapperInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseSanitizationInterceptor,
    },
  ],
  exports: [],
})
export class AppModule {}
