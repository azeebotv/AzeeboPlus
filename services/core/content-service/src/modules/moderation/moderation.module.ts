import { Module } from '@nestjs/common';
import { ModerationService } from './moderation.service.js';
import { ModerationController } from './moderation.controller.js';
import { ModerationRepository } from './moderation.repository.js';
import { DatabaseModule } from '../database/database.module.js';

@Module({
  imports: [DatabaseModule],
  controllers: [ModerationController],
  providers: [ModerationService, ModerationRepository],
  exports: [ModerationService],
})
export class ModerationModule {}
