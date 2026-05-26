import { Module } from '@nestjs/common';
import { TitlesController } from './titles.controller';
import { TitlesService } from './titles.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [TitlesController],
  providers: [TitlesService],
  exports: [TitlesService],
})
export class TitlesModule {}
