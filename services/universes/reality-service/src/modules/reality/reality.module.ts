import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { RealityController } from './reality.controller.js';
import { RealityService } from './reality.service.js';
import { DatabaseModule } from '../database/database.module.js';
import { RedisModule } from '@azeebo/shared-services';

@Module({
  imports: [
    DatabaseModule,
    RedisModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRES_IN', '30m'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [RealityController],
  providers: [RealityService],
  exports: [RealityService, DatabaseModule],
})
export class RealityModule {}
