import { Module } from '@nestjs/common';
import { NightlifeController } from './nightlife.controller';
import { NightlifeService } from './nightlife.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [NightlifeController],
  providers: [NightlifeService],
  exports: [NightlifeService],
})
export class NightlifeModule {}
