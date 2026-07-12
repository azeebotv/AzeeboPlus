import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import type { StringValue } from 'ms';

import { ReferralController } from './referral.controller.js';
import { ReferralService } from './referral.service.js';
import { JwtStrategy } from './jwt.strategy.js';
import { DatabaseModule } from '../database/database.module.js';

@Module({
  imports: [
    DatabaseModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_ACCESS_SECRET'),
        signOptions: {
          expiresIn: configService.get<string | undefined>('JWT_EXPIRES_IN', '30m') as
            | StringValue,
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [ReferralController],
  providers: [ReferralService, JwtStrategy],
  exports: [ReferralService, DatabaseModule],
})
export class ReferralModule {}
