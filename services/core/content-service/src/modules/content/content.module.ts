import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import type { StringValue } from 'ms';

import { ContentController } from './content.controller';
import { ContentService } from './content.service';
import { ContentFeedService } from './content-feed.service';
import { ContentModerationService } from './content-moderation.service';
import { ContentRelationshipService } from './content-relationship.service';
import { ContentCategoryService } from './content-category.service';
import { ContentIngestionService } from './content-ingestion.service';
import { ContentRepository } from './content.repository';
import { AccessControlService } from './access-control.service';
import { DatabaseModule } from '../database/database.module';
import { MediaModule } from '../media/media.module';
import { CacheModule } from '../../cache/cache.module';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    MediaModule,
    CacheModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRES_IN', '30m') as StringValue,
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [ContentController],
  providers: [
    ContentService,
    ContentFeedService,
    ContentModerationService,
    ContentRelationshipService,
    ContentCategoryService,
    ContentIngestionService,
    ContentRepository,
    AccessControlService,
  ],
  exports: [
    ContentService,
    ContentFeedService,
    ContentModerationService,
    ContentRelationshipService,
    ContentCategoryService,
    ContentIngestionService,
    ContentRepository,
    AccessControlService,
    DatabaseModule,
  ],
})
export class ContentModule {}
