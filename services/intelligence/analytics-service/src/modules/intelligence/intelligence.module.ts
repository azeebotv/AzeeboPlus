import { Module } from '@nestjs/common';
import { IntelligenceController } from './intelligence.controller';
import { IntelligenceService } from './intelligence.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  controllers: [IntelligenceController],
  providers: [IntelligenceService],
  imports: [DatabaseModule],
  exports: [IntelligenceService],
})
export class IntelligenceModule {}
