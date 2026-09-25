import { Module } from '@nestjs/common';
import { IntelligenceController } from './intelligence.controller.js';
import { IntelligenceService } from './intelligence.service.js';
import { DatabaseModule } from '../database/database.module.js';

@Module({
  controllers: [IntelligenceController],
  providers: [IntelligenceService],
  imports: [DatabaseModule],
  exports: [IntelligenceService],
})
export class IntelligenceModule {}
