import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RateLimiterModule } from '@azeebo/security';
import { CacheModule } from '@azeebo/shared-services';

import { CreatorsController } from './creators.controller.js';
import { CreatorsService } from './creators.service.js';
import { DatabaseModule } from '../database/database.module.js';
import { JwtStrategy } from '../../common/strategies/jwt.strategy.js';

@Module({
  imports: [
    DatabaseModule,
    PassportModule,
    RateLimiterModule,
    CacheModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService): Promise<Record<string, unknown>> => ({
        secret: configService.get<string>('JWT_ACCESS_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRES_IN', '30m') as string | number,
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [CreatorsController],
  providers: [CreatorsService, JwtStrategy],
  exports: [CreatorsService, DatabaseModule],
})
export class CreatorsModule {}
