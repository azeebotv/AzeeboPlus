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
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { RedisService } from '../../common/services/redis.service';

@Module({
  imports: [
    DatabaseModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '30m'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController, MfaController, OtpController, SocialAuthController],
  providers: [
    AuthService,
    AuthRepository,
    MfaService,
    OtpService,
    SocialAuthService,
    JwtStrategy,
    JwtRefreshStrategy,
    RedisService,
  ],
  exports: [AuthService, AuthRepository, DatabaseModule, MfaService, OtpService, SocialAuthService],
})
export class AuthModule {}
