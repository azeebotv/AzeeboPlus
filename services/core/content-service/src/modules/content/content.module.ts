import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import type { StringValue } from 'ms';

import { ContentController } from './content.controller.js';
import { ContentService } from './content.service.js';
import { ContentFeedService } from './content-feed.service.js';
import { ContentModerationService } from './content-moderation.service.js';
import { ContentRelationshipService } from './content-relationship.service.js';
import { ContentCategoryService } from './content-category.service.js';
import { ContentIngestionService } from './content-ingestion.service.js';
import { ContentRepository } from './content.repository.js';
import { AccessControlService } from './access-control.service.js';
import { DatabaseModule } from '../database/database.module.js';
import { MediaModule } from '../media/media.module.js';
import { CacheModule } from '../../cache/cache.module.js';

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
