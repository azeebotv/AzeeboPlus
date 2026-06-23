import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { ContentController } from './content.controller';
import { ContentService } from './content.service';
import { ContentRepository } from './content.repository';
import { AccessControlService } from './access-control.service';
import { DatabaseModule } from '../database/database.module';
import { MediaModule } from '../media/media.module';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    MediaModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRES_IN', '30m') as any,
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [ContentController],
  providers: [ContentService, ContentRepository, AccessControlService],
  exports: [ContentService, ContentRepository, AccessControlService, DatabaseModule],
})
export class ContentModule {}
