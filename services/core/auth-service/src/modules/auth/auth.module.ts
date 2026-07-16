import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { AuthRepository } from './auth.repository.js';
import { DatabaseModule } from '../database/database.module.js';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MfaController } from './mfa/mfa.controller.js';
import { MfaService } from './mfa/mfa.service.js';
import { OtpController } from './otp/otp.controller.js';
import { OtpService } from './otp/otp.service.js';
import { SocialAuthController } from './social/social.controller.js';
import { SocialAuthService } from './social/social.service.js';
import { DeviceController } from './device/device.controller.js';
import { DeviceService } from './device/device.service.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy.js';
import { RateLimiterModule } from '@azeebo/security';
import { CacheModule, RedisModule } from '@azeebo/shared-services';

@Module({
  imports: [
    DatabaseModule,
    PassportModule,
    ConfigModule,
    CacheModule,
    RedisModule,
    RateLimiterModule.forRoot(),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '30m'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [
    AuthController,
    MfaController,
    OtpController,
    SocialAuthController,
    DeviceController,
  ],
  providers: [
    AuthService,
    AuthRepository,
    MfaService,
    OtpService,
    SocialAuthService,
    DeviceService,
    JwtStrategy,
    JwtRefreshStrategy,
  ],
  exports: [
    AuthService,
    AuthRepository,
    DatabaseModule,
    JwtModule,
    MfaService,
    OtpService,
    SocialAuthService,
    DeviceService,
  ],
})
export class AuthModule {}
