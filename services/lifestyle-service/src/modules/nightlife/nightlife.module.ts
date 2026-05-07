import { Module } from '@nestjs/common';
import { NightlifeController } from './nightlife.controller';
import { NightlifeService } from './nightlife.service';

@Module({
  controllers: [NightlifeController],
  providers: [NightlifeService],
  exports: [NightlifeService],
})
export class NightlifeModule {}
