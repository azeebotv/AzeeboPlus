import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { ModerationController } from './moderation.controller';
import { ModerationService } from './moderation.service';
import { SafetyScanningService } from './safety-scanning.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [
    DatabaseModule,
    PassportModule,
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
  controllers: [ModerationController],
  providers: [ModerationService, SafetyScanningService],
  exports: [ModerationService, SafetyScanningService, DatabaseModule],
})
export class ModerationModule {}
