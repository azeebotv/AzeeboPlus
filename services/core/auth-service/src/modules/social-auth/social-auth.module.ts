import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SocialAuthController } from './social-auth.controller.js';
import { SocialAuthService } from './social-auth.service.js';
import { PrismaService } from '../database/prisma.service.js';
import { SecurityModule } from '@azeebo/security';
import { FeatureFlagModule } from '@azeebo/feature-flags';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET', 'default-secret'),
        signOptions: { expiresIn: configService.get('JWT_ACCESS_EXPIRY', '15m') },
      }),
      inject: [ConfigService],
    }),
    SecurityModule,
    FeatureFlagModule,
  ],
  controllers: [SocialAuthController],
  providers: [SocialAuthService, PrismaService],
  exports: [SocialAuthService],
})
export class SocialAuthModule {}
