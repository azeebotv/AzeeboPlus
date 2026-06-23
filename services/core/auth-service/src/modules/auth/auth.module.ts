import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';
import { DatabaseModule } from '../database/database.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MfaController } from './mfa/mfa.controller';
import { MfaService } from './mfa/mfa.service';
import { OtpController } from './otp/otp.controller';
import { OtpService } from './otp/otp.service';
import { SocialAuthController } from './social/social.controller';
import { SocialAuthService } from './social/social.service';
import { DeviceController } from './device/device.controller';
import { DeviceService } from './device/device.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { RateLimiterModule } from '@azeebo/security';
import { RedisService } from '../../common/services/redis.service';

@Module({
  imports: [
    DatabaseModule,
    PassportModule,
    ConfigModule.forRoot(),
    RateLimiterModule.forRoot(),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '30m') as any,
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
    RedisService,
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
