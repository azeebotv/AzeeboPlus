import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import type { StringValue } from 'ms';

import { ModerationController } from './moderation.controller.js';
import { ModerationService } from './moderation.service.js';
import { SafetyScanningService } from './safety-scanning.service.js';
import { DatabaseModule } from '../database/database.module.js';

@Module({
  imports: [
    DatabaseModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '30m') as StringValue,
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [ModerationController],
  providers: [ModerationService, SafetyScanningService],
  exports: [ModerationService, SafetyScanningService, DatabaseModule],
})
export class ModerationModule {}
