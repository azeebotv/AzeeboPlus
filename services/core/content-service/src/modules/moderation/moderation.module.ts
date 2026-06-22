import { Module } from '@nestjs/common';
import { ModerationService } from './moderation.service';
import { ModerationController } from './moderation.controller';
import { ModerationRepository } from './moderation.repository';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [ModerationController],
  providers: [ModerationService, ModerationRepository],
  exports: [ModerationService],
})
export class ModerationModule {}
