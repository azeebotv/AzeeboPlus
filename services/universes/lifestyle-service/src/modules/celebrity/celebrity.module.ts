import { Module } from '@nestjs/common';
import { CelebrityController } from './celebrity.controller';
import { CelebrityService } from './celebrity.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [CelebrityController],
  providers: [CelebrityService],
  exports: [CelebrityService],
})
export class CelebrityModule {}
