import { Module } from '@nestjs/common';
import { LoreController } from './lore.controller';
import { LoreService } from './lore.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [LoreController],
  providers: [LoreService],
  exports: [LoreService],
})
export class LoreModule {}
