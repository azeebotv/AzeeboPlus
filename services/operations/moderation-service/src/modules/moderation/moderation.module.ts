import { Module } from '@nestjs/common';
import { JwtConfigModule } from '@azeebo/shared-services';

import { ModerationController } from './moderation.controller.js';
import { ModerationService } from './moderation.service.js';
import { SafetyScanningService } from './safety-scanning.service.js';
import { DatabaseModule } from '../database/database.module.js';

@Module({
  imports: [DatabaseModule, JwtConfigModule],
  controllers: [ModerationController],
  providers: [ModerationService, SafetyScanningService],
  exports: [ModerationService, SafetyScanningService, DatabaseModule],
})
export class ModerationModule {}
