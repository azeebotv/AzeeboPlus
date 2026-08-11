import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtConfigModule } from '@azeebo/shared-services';
import { FeatureFlagModule, contentFlags } from '@azeebo/feature-flags';

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
    // Self-contained flag defaults so the module works standalone (tests,
    // contracts) as well as under the app's global registration.
    FeatureFlagModule.register({
      defaultFlags: {
        [contentFlags.moderationEnabled]: true,
        [contentFlags.transcodingNew]: false,
        [contentFlags.aiTags]: false,
        [contentFlags.clipIngestion]: false,
        [contentFlags.commentsV2]: false,
        [contentFlags.windowingEnabled]: true,
        [contentFlags.premiumGate]: false,
        [contentFlags.recommendedRail]: false,
      },
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
