import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtConfigModule } from '@azeebo/shared-services';
import { FeatureFlagModule } from '@azeebo/feature-flags';

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
    JwtConfigModule,
    FeatureFlagModule.register({}),
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
