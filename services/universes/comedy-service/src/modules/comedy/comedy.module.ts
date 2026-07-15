import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { ComedyController } from './comedy.controller.js';
import { ComedyService } from './comedy.service.js';
import { DatabaseModule } from '../database/database.module.js';
import { RedisModule } from '@azeebo/shared-services';

@Module({
  imports: [
    DatabaseModule,
    RedisModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_ACCESS_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRES_IN', '30m'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [ComedyController],
  providers: [ComedyService],
  exports: [ComedyService, DatabaseModule],
})
export class ComedyModule {}
