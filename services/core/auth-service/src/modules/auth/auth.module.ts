import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';

import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { AuthCookieController } from './auth-cookie.controller.js';
import { AuthRepository } from './auth.repository.js';
import { DatabaseModule } from '../database/database.module.js';
import { ConfigModule } from '@nestjs/config';
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
import { CacheModule, RedisModule, JwtConfigModule } from '@azeebo/shared-services';
import { AuditModule } from '../audit/audit.module.js';

@Module({
  imports: [
    DatabaseModule,
    PassportModule,
    ConfigModule,
    CacheModule,
    RedisModule,
    JwtConfigModule,
    AuditModule,
  ],
  controllers: [
    AuthController,
    AuthCookieController,
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
    JwtConfigModule,
    MfaService,
    OtpService,
    SocialAuthService,
    DeviceService,
  ],
})
export class AuthModule {}
